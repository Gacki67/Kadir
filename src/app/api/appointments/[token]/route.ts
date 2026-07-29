import { prisma } from "@/lib/prisma";
import {
  fail,
  guardRateLimit,
  handleApiError,
  ok,
  readJson,
} from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";
import {
  assertClientCanModify,
  cancelAppointment,
  rescheduleAppointment,
} from "@/lib/booking";
import { sendCancellation, sendReschedule } from "@/lib/notifications";
import { rescheduleSchema, formatZodErrors } from "@/lib/validation";
import { dateToKey } from "@/lib/datetime";
import { BOOKING } from "@/lib/config";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/** Serialisation commune, sans donnee interne. */
function serialize(appointment: {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
  notes: string | null;
  cancellationToken: string;
  service: { id: string; name: string; description: string };
}) {
  return {
    reference: appointment.reference,
    firstName: appointment.firstName,
    lastName: appointment.lastName,
    email: appointment.email,
    phone: appointment.phone,
    date: dateToKey(appointment.appointmentDate),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    duration: appointment.duration,
    price: appointment.price,
    status: appointment.status,
    notes: appointment.notes,
    token: appointment.cancellationToken,
    service: appointment.service,
  };
}

async function findByToken(token: string) {
  if (!token || token.length < 20) return null;
  return prisma.appointment.findUnique({
    where: { cancellationToken: token },
    include: { service: true },
  });
}

/** GET /api/appointments/[token] — consultation par le client. */
export async function GET(request: Request, { params }: Params) {
  const limited = guardRateLimit(request, "manage", RATE_LIMITS.manage);
  if (limited) return limited;

  try {
    const { token } = await params;
    const appointment = await findByToken(token);

    if (!appointment) {
      return fail("Ce rendez-vous est introuvable ou le lien a expire.", 404);
    }

    return ok({
      appointment: serialize(appointment),
      canModify: canStillModify(appointment),
      cancellationCutoffHours: BOOKING.cancellationCutoffHours,
    });
  } catch (error) {
    return handleApiError(error, "appointments:get");
  }
}

/** PATCH /api/appointments/[token] — deplacement du rendez-vous. */
export async function PATCH(request: Request, { params }: Params) {
  const limited = guardRateLimit(request, "manage", RATE_LIMITS.manage);
  if (limited) return limited;

  try {
    const { token } = await params;
    const appointment = await findByToken(token);

    if (!appointment) {
      return fail("Ce rendez-vous est introuvable ou le lien a expire.", 404);
    }

    // Leve une BookingError explicite si le delai est depasse.
    assertClientCanModify(appointment);

    const parsed = rescheduleSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Date ou heure invalide.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    const updated = await rescheduleAppointment({
      appointmentId: appointment.id,
      date: parsed.data.date,
      time: parsed.data.time,
    });

    await sendReschedule(updated);

    return ok({ appointment: serialize(updated) });
  } catch (error) {
    return handleApiError(error, "appointments:reschedule");
  }
}

/** DELETE /api/appointments/[token] — annulation par le client. */
export async function DELETE(request: Request, { params }: Params) {
  const limited = guardRateLimit(request, "manage", RATE_LIMITS.manage);
  if (limited) return limited;

  try {
    const { token } = await params;
    const appointment = await findByToken(token);

    if (!appointment) {
      return fail("Ce rendez-vous est introuvable ou le lien a expire.", 404);
    }

    assertClientCanModify(appointment);

    const cancelled = await cancelAppointment(appointment.id, "CLIENT");
    await sendCancellation(cancelled);

    return ok({ appointment: serialize(cancelled) });
  } catch (error) {
    return handleApiError(error, "appointments:cancel");
  }
}

/** Le client peut-il encore agir lui-meme ? (sans lever d'exception) */
function canStillModify(appointment: {
  appointmentDate: Date;
  startTime: string;
  status: string;
}): boolean {
  try {
    assertClientCanModify(appointment);
    return true;
  } catch {
    return false;
  }
}
