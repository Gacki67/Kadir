import { prisma } from "@/lib/prisma";
import { fail, handleApiError } from "@/lib/api";
import { buildIcs } from "@/lib/ics";
import { dateToKey } from "@/lib/datetime";
import { getManageUrl } from "@/lib/notifications/templates";

export const dynamic = "force-dynamic";

/**
 * GET /api/appointments/[token]/ics
 * Telechargement du rendez-vous au format calendrier (.ics).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token || token.length < 20) {
      return fail("Lien invalide.", 400);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { cancellationToken: token },
      include: { service: true },
    });

    if (!appointment) {
      return fail("Ce rendez-vous est introuvable.", 404);
    }
    if (appointment.status === "CANCELLED") {
      return fail("Ce rendez-vous a ete annule.", 409);
    }

    const ics = buildIcs({
      uid: `${appointment.id}@kadir-barber`,
      date: dateToKey(appointment.appointmentDate),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      serviceName: appointment.service.name,
      duration: appointment.duration,
      price: appointment.price,
      reference: appointment.reference,
      manageUrl: getManageUrl(appointment.cancellationToken),
    });

    return new Response(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="kadir-barber-${appointment.reference}.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, "appointments:ics");
  }
}
