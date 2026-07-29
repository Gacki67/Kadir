import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok, requireAdmin } from "@/lib/api";
import { getAvailability } from "@/lib/booking";
import { isValidDateKey } from "@/lib/datetime";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/availability?date=2026-07-30&serviceId=xxx[&exclure=<id RDV>]
 *
 * Variante administrateur du calcul de disponibilites :
 *   - le delai minimum de reservation ne s'applique pas ;
 *   - `exclure` permet, lors d'un deplacement, de ne pas considerer le
 *     rendez-vous en cours de modification comme occupant son propre creneau.
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const serviceId = url.searchParams.get("serviceId");
    const exclude = url.searchParams.get("exclure") ?? undefined;

    if (!date || !isValidDateKey(date)) return fail("Date invalide.", 400);
    if (!serviceId) return fail("Le parametre serviceId est obligatoire.", 400);

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, duration: true },
    });
    if (!service) return fail("Prestation introuvable.", 404);

    const result = await getAvailability(date, service, {
      ignoreLeadTime: true,
      excludeAppointmentId: exclude,
    });

    return ok({
      date,
      dayOpen: result.dayOpen,
      reason: result.reason,
      slots: result.slots,
    });
  } catch (error) {
    return handleApiError(error, "admin:availability");
  }
}
