import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok, readJson, requireAdmin } from "@/lib/api";
import { businessHoursSchema, formatZodErrors } from "@/lib/validation";
import { getBusinessRules } from "@/lib/booking";
import { timeToMinutes } from "@/lib/datetime";
import { BOOKING } from "@/lib/config";

export const dynamic = "force-dynamic";

/** GET /api/admin/business-hours — horaires d'ouverture actuels. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const hours = await getBusinessRules();
    return ok({ hours, slotDuration: BOOKING.slotDurationMinutes });
  } catch (error) {
    return handleApiError(error, "admin:hours:get");
  }
}

/** PUT /api/admin/business-hours — enregistre les 7 jours d'un coup. */
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const parsed = businessHoursSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Certains horaires sont invalides.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    // Coherence : l'heure de fermeture doit suivre l'heure d'ouverture, et
    // laisser la place a au moins un creneau complet.
    for (const day of parsed.data.hours) {
      if (!day.active) continue;
      const span = timeToMinutes(day.closingTime) - timeToMinutes(day.openingTime);
      if (span < BOOKING.slotDurationMinutes) {
        return fail(
          `Horaires invalides : l'amplitude d'ouverture doit contenir au moins un creneau de ${BOOKING.slotDurationMinutes} minutes.`,
          422,
        );
      }
    }

    await prisma.$transaction(
      parsed.data.hours.map((day) =>
        prisma.businessHours.upsert({
          where: { dayOfWeek: day.dayOfWeek },
          update: {
            openingTime: day.openingTime,
            closingTime: day.closingTime,
            active: day.active,
          },
          create: {
            dayOfWeek: day.dayOfWeek,
            openingTime: day.openingTime,
            closingTime: day.closingTime,
            active: day.active,
          },
        }),
      ),
    );

    return ok({ hours: await getBusinessRules() });
  } catch (error) {
    return handleApiError(error, "admin:hours:update");
  }
}
