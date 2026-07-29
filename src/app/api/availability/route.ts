import { prisma } from "@/lib/prisma";
import {
  fail,
  guardRateLimit,
  handleApiError,
  ok,
} from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";
import {
  getBusinessRules,
  getDayOccupancy,
  getRangeOccupancy,
} from "@/lib/booking";
import { computeDaySlots, getDayStatus } from "@/lib/availability";
import { addDays, daysInMonth, isValidDateKey, todayKey } from "@/lib/datetime";
import { BOOKING } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability
 *
 * Deux modes :
 *
 *  1. Creneaux d'une journee
 *     ?serviceId=xxx&date=2026-07-30
 *     -> { slots: [{ time, endTime, available, reason }], dayOpen, reason }
 *
 *  2. Etat des jours d'un mois (pour colorer le calendrier)
 *     ?serviceId=xxx&month=2026-07
 *     -> { days: { "2026-07-30": { open, hasAvailability } } }
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "availability", RATE_LIMITS.availability);
  if (limited) return limited;

  try {
    const url = new URL(request.url);
    const serviceId = url.searchParams.get("serviceId");
    const date = url.searchParams.get("date");
    const month = url.searchParams.get("month");

    if (!serviceId) {
      return fail("Le parametre serviceId est obligatoire.", 400);
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, duration: true, active: true },
    });

    if (!service || !service.active) {
      return fail("Prestation introuvable.", 404);
    }

    /* --- Mode 1 : une journee --------------------------------------------- */
    if (date) {
      if (!isValidDateKey(date)) return fail("Date invalide.", 400);

      const [rules, occupancy] = await Promise.all([
        getBusinessRules(),
        getDayOccupancy(date),
      ]);

      const result = computeDaySlots({
        dateKey: date,
        serviceDuration: service.duration,
        rules,
        bookedSlots: occupancy.booked,
        blockedSlots: occupancy.blocked,
      });

      return ok({
        date,
        dayOpen: result.dayOpen,
        reason: result.reason,
        // On n'expose que l'heure et la disponibilite : aucune donnee client.
        slots: result.slots.map((slot) => ({
          time: slot.time,
          endTime: slot.endTime,
          available: slot.available,
        })),
      });
    }

    /* --- Mode 2 : un mois entier ------------------------------------------ */
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return fail("Mois invalide. Format attendu : AAAA-MM.", 400);
      }

      const first = `${month}-01`;
      if (!isValidDateKey(first)) return fail("Mois invalide.", 400);

      const total = daysInMonth(first);
      const last = `${month}-${String(total).padStart(2, "0")}`;

      const [rules, occupancyMap] = await Promise.all([
        getBusinessRules(),
        getRangeOccupancy(first, last),
      ]);

      const days: Record<string, { open: boolean; hasAvailability: boolean }> = {};

      for (let index = 0; index < total; index += 1) {
        const dateKey = addDays(first, index);
        const status = getDayStatus(dateKey, rules);

        if (!status.open) {
          days[dateKey] = { open: false, hasAvailability: false };
          continue;
        }

        const occupancy = occupancyMap.get(dateKey) ?? {
          booked: new Set<string>(),
          blocked: new Set<string>(),
        };

        const result = computeDaySlots({
          dateKey,
          serviceDuration: service.duration,
          rules,
          bookedSlots: occupancy.booked,
          blockedSlots: occupancy.blocked,
        });

        days[dateKey] = {
          open: true,
          hasAvailability: result.slots.some((slot) => slot.available),
        };
      }

      return ok({
        month,
        days,
        today: todayKey(),
        maxDate: addDays(todayKey(), BOOKING.maxAdvanceDays),
      });
    }

    return fail(
      "Indiquez soit un parametre `date`, soit un parametre `month`.",
      400,
    );
  } catch (error) {
    return handleApiError(error, "availability");
  }
}
