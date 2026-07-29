import {
  fail,
  guardRateLimit,
  handleApiError,
  ok,
  readJson,
} from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { createAppointment } from "@/lib/booking";
import { createAppointmentSchema, formatZodErrors } from "@/lib/validation";
import { sendConfirmation } from "@/lib/notifications";
import { dateToKey } from "@/lib/datetime";

export const dynamic = "force-dynamic";

/**
 * POST /api/appointments — creation d'un rendez-vous par un client.
 *
 * Deroulement :
 *   1. limitation de debit (anti-abus) ;
 *   2. validation stricte des donnees (Zod) ;
 *   3. creation atomique du RDV et verrouillage des creneaux ;
 *   4. envoi de la confirmation par e-mail et SMS.
 *
 * L'etape 4 ne peut jamais faire echouer la reservation : si l'envoi echoue,
 * le rendez-vous reste valide et l'administrateur le voit dans son tableau
 * de bord avec un indicateur "non envoye".
 */
export async function POST(request: Request) {
  const limited = guardRateLimit(request, "booking", RATE_LIMITS.booking);
  if (limited) return limited;

  try {
    const body = await readJson(request);
    const parsed = createAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Certains champs sont invalides.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    // Champ piege anti-robot : rempli uniquement par un automate.
    if (parsed.data.website) {
      return fail("Requete invalide.", 400);
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
    });

    // Notifications : on attend le resultat pour le renvoyer au client, mais
    // toute erreur est deja absorbee dans sendConfirmation.
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
