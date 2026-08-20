import {
  fail,
  guardRateLimit,
  handleApiError,
  ok,
  readJson,
  requireCustomer,
} from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { createAppointment } from "@/lib/booking";
import { bookAsCustomerSchema, formatZodErrors } from "@/lib/validation";
import { sendConfirmation } from "@/lib/notifications";
import { dateToKey } from "@/lib/datetime";

export const dynamic = "force-dynamic";

/**
 * POST /api/appointments — creation d'un rendez-vous par un CLIENT CONNECTE.
 *
 * Deroulement :
 *   1. le client doit etre connecte a son compte (sinon 401) ;
 *   2. limitation de debit (anti-abus) ;
 *   3. validation stricte des donnees (Zod) — seuls prestation, date, heure
 *      et commentaire sont fournis : l'identite vient du compte ;
 *   4. creation atomique du RDV et verrouillage des creneaux ;
 *   5. envoi de la confirmation par e-mail et SMS.
 *
 * L'etape 5 ne peut jamais faire echouer la reservation.
 */
export async function POST(request: Request) {
  const auth = await requireCustomer();
  if ("response" in auth) return auth.response;

  const limited = guardRateLimit(request, "booking", RATE_LIMITS.booking);
  if (limited) return limited;

  try {
    const parsed = bookAsCustomerSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Certains champs sont invalides.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: auth.session.customerId },
    });
    if (!customer) {
      return fail("Votre compte est introuvable. Reconnectez-vous.", 401);
    }

    const appointment = await createAppointment({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      customerId: customer.id,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      time: parsed.data.time,
      notes: parsed.data.notes,
    });

    const notifications = await sendConfirmation(appointment);

    return ok(
      {
        appointment: {
          id: appointment.id,
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
          notes: appointment.notes,
          service: {
            id: appointment.service.id,
            name: appointment.service.name,
          },
          manageToken: appointment.cancellationToken,
        },
        notifications,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, "appointments:create");
  }
}
