import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";
import { addDays, dateToKey, keyToDate, todayKey } from "@/lib/datetime";
import { sendReminder } from "@/lib/notifications";

export const dynamic = "force-dynamic";
// Les envois peuvent prendre du temps : on repousse la limite.
export const maxDuration = 60;

/**
 * Rappels automatiques : le rappel de TOUS les rendez-vous du LENDEMAIN.
 *
 * Cette tache est concue pour un declenchement UNE FOIS PAR JOUR (contrainte
 * du plan gratuit Vercel : les Cron Jobs Hobby ne s'executent qu'une fois par
 * jour). A chaque execution, elle previent tous les clients ayant rendez-vous
 * le lendemain — c'est le classique « rappel la veille ».
 *
 * Sur Vercel, le fichier vercel.json declare la tache (voir la planification) :
 * Vercel envoie automatiquement l'en-tete Authorization avec la valeur de
 * CRON_SECRET.
 *
 * Declenchement manuel possible :
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://votre-site.fr/api/cron/reminders
 *
 * Protection contre les doublons : les indicateurs emailReminderSent et
 * smsReminderSent sont poses en base des le premier envoi. Meme declenchee
 * plusieurs fois, la tache ne previent chaque client qu'une seule fois.
 *
 * Astuce : pour un rappel plus fin (a heure fixe), un ordonnanceur externe
 * gratuit comme cron-job.org peut appeler cette route plusieurs fois par jour
 * sans changer de plan — les doublons restent impossibles grace aux indicateurs.
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
    // Jour cible : demain (jour civil francais).
    const tomorrow = addDays(todayKey(now), 1);

    const candidates = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        appointmentDate: keyToDate(tomorrow),
        OR: [{ emailReminderSent: false }, { smsReminderSent: false }],
      },
      include: { service: true },
      orderBy: [{ startTime: "asc" }],
    });

    const results = {
      target: tomorrow,
      checked: candidates.length,
      sent: 0,
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
      `[cron:rappels] Jour cible ${tomorrow} : ${results.checked} rendez-vous, ${results.sent} rappels envoyes.`,
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
