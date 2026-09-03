import { handleApiError, ok, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { dateToKey } from "@/lib/datetime";

export const dynamic = "force-dynamic";

/** GET /api/account/appointments — rendez-vous du client connecte. */
export async function GET() {
  const auth = await requireCustomer();
  if ("response" in auth) return auth.response;

  try {
    const appointments = await prisma.appointment.findMany({
      where: { customerId: auth.session.customerId },
      orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
      include: { service: { select: { name: true } } },
    });

    return ok({
      appointments: appointments.map((a) => ({
        id: a.id,
        reference: a.reference,
        date: dateToKey(a.appointmentDate),
        startTime: a.startTime,
        endTime: a.endTime,
        duration: a.duration,
        price: a.price,
        status: a.status,
        notes: a.notes,
        serviceName: a.service.name,
        manageToken: a.cancellationToken,
      })),
    });
  } catch (error) {
    return handleApiError(error, "account:appointments");
  }
}
