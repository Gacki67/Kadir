import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { BOOKING } from "@/lib/config";
import { addDays, dateToKey, keyToDate, parisToUtc, todayKey } from "@/lib/datetime";
import { sendReminder } from "@/lib/notifications";

export const dynamic = "force-dynamic";
// Les envois peuvent prendre du temps : on repousse la limite (plan Vercel Pro).
export const maxDuration = 60;

/**
 * Rappels automatiques ~24 h avant le rendez-vous.
 *
 * A appeler regulierement (toutes les heures par exemple) :
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://votre-site.fr/api/cron/reminders
 *
 * Sur Vercel, le fichier vercel.json declare deja la tache planifiee : Vercel
 * envoie automatiquement l'en-tete Authorization avec la valeur de CRON_SECRET.
 *
 * Protection contre les doublons : les indicateurs emailReminderSent et
 * smsReminderSent sont poses en base des le premier envoi. Meme si la tache est
 * declenchee plusieurs fois dans la fenetre, chaque client n'est prevenu qu'une
 * seule fois.
 */
async function handle(request: Request) {
  /* --- Authentification de la tache planifiee ---------------------------- */
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      {
        error:
          "CRON_SECRET n'est pas configure : la route de rappel est desactivee.",
      },
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization");
  const url = new URL(request.url);
  const provided =
    header?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret") ?? "";

  if (provided !== secret) {
    return Response.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const now = new Date();
    const { min, max } = BOOKING.reminderWindowHours;

    // On ne charge que les jours pouvant contenir la fenetre de rappel.
    const today = todayKey(now);
    const candidates = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        appointmentDate: {
          gte: keyToDate(today),
          lte: keyToDate(addDays(today, 3)),
        },
        OR: [{ emailReminderSent: false }, { smsReminderSent: false }],
      },
      include: { service: true },
      orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
    });

    const results = {
      checked: candidates.length,
      sent: 0,
      skipped: 0,
      emailsSent: 0,
      smsSent: 0,
      details: [] as Array<{
        reference: string;
        date: string;
        time: string;
        email: boolean;
        sms: boolean;
      }>,
    };

    for (const appointment of candidates) {
      const startsAt = parisToUtc(
        dateToKey(appointment.appointmentDate),
        appointment.startTime,
      );
      const hoursUntil = (startsAt.getTime() - now.getTime()) / 3_600_000;

      // Fenetre d'envoi : entre 23 h et 25 h avant le rendez-vous.
      if (hoursUntil < min || hoursUntil > max) {
        results.skipped += 1;
        continue;
      }

      const outcome = await sendReminder(appointment);
      results.sent += 1;
      if (outcome.email) results.emailsSent += 1;
      if (outcome.sms) results.smsSent += 1;

      results.details.push({
        reference: appointment.reference,
        date: dateToKey(appointment.appointmentDate),
        time: appointment.startTime,
        email: outcome.email,
        sms: outcome.sms,
      });
    }

    console.info(
      `[cron:rappels] ${results.checked} rendez-vous examines, ${results.sent} rappels envoyes.`,
    );

    return ok({ ok: true, ranAt: now.toISOString(), ...results });
  } catch (error) {
    return handleApiError(error, "cron:reminders");
  }
}

// Vercel Cron appelle la route en GET ; on accepte aussi POST pour les autres
// ordonnanceurs (cron-job.org, GitHub Actions, crontab...).
export const GET = handle;
export const POST = handle;
