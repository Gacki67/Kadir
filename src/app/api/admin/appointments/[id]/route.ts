import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok, readJson, requireAdmin } from "@/lib/api";
import { cancelAppointment, rescheduleAppointment } from "@/lib/booking";
import { sendCancellation, sendReschedule } from "@/lib/notifications";
import {
  adminUpdateAppointmentSchema,
  formatZodErrors,
} from "@/lib/validation";
import {
  ADMIN_APPOINTMENT_INCLUDE,
  serializeForAdmin,
} from "@/lib/serializers";
import { dateToKey } from "@/lib/datetime";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/appointments/[id] — fiche complete d'un rendez-vous. */
export async function GET(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: ADMIN_APPOINTMENT_INCLUDE,
    });

    if (!appointment) return fail("Rendez-vous introuvable.", 404);
    return ok({ appointment: serializeForAdmin(appointment) });
  } catch (error) {
    return handleApiError(error, "admin:appointments:get");
  }
}

/**
 * PATCH /api/admin/appointments/[id] — modification.
 *
 * Si la date, l'heure ou la prestation change, on passe par
 * `rescheduleAppointment` afin de reposer correctement les verrous de creneaux
 * (et donc de liberer l'ancien creneau).
 */
export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: ADMIN_APPOINTMENT_INCLUDE,
    });
    if (!existing) return fail("Rendez-vous introuvable.", 404);

    const parsed = adminUpdateAppointmentSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Certains champs sont invalides.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    const data = parsed.data;

    /* --- Annulation demandee via le champ statut --------------------------- */
    if (data.status === "CANCELLED" && existing.status !== "CANCELLED") {
      const cancelled = await cancelAppointment(id, "ADMIN");
      await sendCancellation(cancelled);
      const refreshed = await prisma.appointment.findUniqueOrThrow({
        where: { id },
        include: ADMIN_APPOINTMENT_INCLUDE,
      });
      return ok({ appointment: serializeForAdmin(refreshed) });
    }

    /* --- Deplacement (date, heure ou prestation) --------------------------- */
    const currentDate = dateToKey(existing.appointmentDate);
    const movesSlot =
      (data.date && data.date !== currentDate) ||
      (data.time && data.time !== existing.startTime) ||
      (data.serviceId && data.serviceId !== existing.serviceId);

    if (movesSlot) {
      await rescheduleAppointment({
        appointmentId: id,
        date: data.date ?? currentDate,
        time: data.time ?? existing.startTime,
        serviceId: data.serviceId,
        ignoreLeadTime: true,
      });
    }

    /* --- Champs simples ---------------------------------------------------- */
    const scalarUpdates = {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.status !== undefined &&
        data.status !== "CANCELLED" && { status: data.status }),
    };

    if (Object.keys(scalarUpdates).length > 0) {
      await prisma.appointment.update({ where: { id }, data: scalarUpdates });
    }

    const updated = await prisma.appointment.findUniqueOrThrow({
      where: { id },
      include: ADMIN_APPOINTMENT_INCLUDE,
    });

    // On previent le client uniquement si le creneau a reellement bouge.
    if (movesSlot && updated.status !== "CANCELLED") {
      const withService = await prisma.appointment.findUniqueOrThrow({
        where: { id },
        include: { service: true },
      });
      await sendReschedule(withService);
    }

    return ok({ appointment: serializeForAdmin(updated) });
  } catch (error) {
    return handleApiError(error, "admin:appointments:update");
  }
}

/**
 * DELETE /api/admin/appointments/[id]
 *
 *   ?definitif=1  -> suppression definitive (droit a l'effacement, RGPD)
 *   sinon         -> annulation : le creneau est libere, l'historique conserve
 */
export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const url = new URL(request.url);
    const permanent = url.searchParams.get("definitif") === "1";
    const notify = url.searchParams.get("notifier") !== "0";

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return fail("Rendez-vous introuvable.", 404);

    if (permanent) {
      // Les verrous de creneaux sont supprimes en cascade.
      await prisma.appointment.delete({ where: { id } });
      return ok({ deleted: true });
    }

    const cancelled = await cancelAppointment(id, "ADMIN");
    if (notify) await sendCancellation(cancelled);

    return ok({ cancelled: true });
  } catch (error) {
    return handleApiError(error, "admin:appointments:delete");
  }
}
