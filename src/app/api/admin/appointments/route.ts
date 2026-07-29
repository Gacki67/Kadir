import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok, readJson, requireAdmin } from "@/lib/api";
import { createAppointment } from "@/lib/booking";
import { sendConfirmation } from "@/lib/notifications";
import {
  adminCreateAppointmentSchema,
  formatZodErrors,
} from "@/lib/validation";
import {
  ADMIN_APPOINTMENT_INCLUDE,
  serializeForAdmin,
} from "@/lib/serializers";
import {
  addDays,
  daysInMonth,
  isValidDateKey,
  keyToDate,
  startOfWeek,
  todayKey,
} from "@/lib/datetime";

export const dynamic = "force-dynamic";



/**
 * GET /api/admin/appointments
 *
 * Filtres disponibles (parametres de requete) :
 *   periode = today | week | month | upcoming | all | custom
 *   from, to      -> dates si periode=custom
 *   statut        = CONFIRMED | CANCELLED | COMPLETED | NO_SHOW | all
 *   rappel        = sent | pending | all
 *   q             -> recherche par nom, prenom, e-mail, telephone ou reference
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("periode") ?? "today";
    const status = url.searchParams.get("statut") ?? "all";
    const reminder = url.searchParams.get("rappel") ?? "all";
    const query = (url.searchParams.get("q") ?? "").trim();
    const take = Math.min(Number(url.searchParams.get("limit") ?? 200), 500);

    const today = todayKey();
    const where: Prisma.AppointmentWhereInput = {};

    /* --- Periode ---------------------------------------------------------- */
    switch (period) {
      case "today":
        where.appointmentDate = keyToDate(today);
        break;
      case "week": {
        const start = startOfWeek(today);
        where.appointmentDate = {
          gte: keyToDate(start),
          lte: keyToDate(addDays(start, 6)),
        };
        break;
      }
      case "month": {
        const first = `${today.slice(0, 7)}-01`;
        const last = `${today.slice(0, 7)}-${String(daysInMonth(first)).padStart(2, "0")}`;
        where.appointmentDate = { gte: keyToDate(first), lte: keyToDate(last) };
        break;
      }
      case "upcoming":
        where.appointmentDate = { gte: keyToDate(today) };
        break;
      case "custom": {
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        if (from && !isValidDateKey(from)) return fail("Date de debut invalide.", 400);
        if (to && !isValidDateKey(to)) return fail("Date de fin invalide.", 400);
        const range: Prisma.DateTimeFilter = {};
        if (from) range.gte = keyToDate(from);
        if (to) range.lte = keyToDate(to);
        if (from || to) where.appointmentDate = range;
        break;
      }
      case "all":
      default:
        break;
    }

    /* --- Statut ----------------------------------------------------------- */
    if (status !== "all") {
      where.status = status as Prisma.EnumAppointmentStatusFilter["equals"];
    }

    /* --- Rappel ----------------------------------------------------------- */
    if (reminder === "sent") {
      where.AND = [{ emailReminderSent: true }];
    } else if (reminder === "pending") {
      where.AND = [{ emailReminderSent: false }];
    }

    /* --- Recherche libre --------------------------------------------------- */
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query.replace(/[\s.\-()]/g, "") } },
        { reference: { contains: query.toUpperCase() } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: ADMIN_APPOINTMENT_INCLUDE,
      orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
      take,
    });

    // Compteurs affiches en haut du tableau de bord.
    const [todayCount, upcomingCount, cancelledCount] = await Promise.all([
      prisma.appointment.count({
        where: { appointmentDate: keyToDate(today), status: "CONFIRMED" },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: keyToDate(today) },
          status: "CONFIRMED",
        },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: keyToDate(today) },
          status: "CANCELLED",
        },
      }),
    ]);

    return ok({
      appointments: appointments.map(serializeForAdmin),
      stats: {
        today: todayCount,
        upcoming: upcomingCount,
        cancelled: cancelledCount,
        revenue: appointments
          .filter((item) => item.status !== "CANCELLED")
          .reduce((sum, item) => sum + item.price, 0),
      },
    });
  } catch (error) {
    return handleApiError(error, "admin:appointments:list");
  }
}

/** POST /api/admin/appointments — creation manuelle d'un rendez-vous. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const parsed = adminCreateAppointmentSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Certains champs sont invalides.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    const appointment = await createAppointment({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      time: parsed.data.time,
      notes: parsed.data.notes,
      // L'administrateur n'est pas soumis au delai minimum de reservation.
      ignoreLeadTime: true,
    });

    if (parsed.data.sendNotifications) {
      await sendConfirmation(appointment);
    }

    const full = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
      include: ADMIN_APPOINTMENT_INCLUDE,
    });

    return ok({ appointment: serializeForAdmin(full) }, 201);
  } catch (error) {
    return handleApiError(error, "admin:appointments:create");
  }
}
