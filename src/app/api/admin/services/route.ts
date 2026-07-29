import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok, readJson, requireAdmin } from "@/lib/api";
import { formatZodErrors, serviceSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/admin/services — toutes les prestations, actives ou non. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const services = await prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    // Nombre de rendez-vous a venir par prestation : evite de desactiver
    // une prestation encore utilisee sans le savoir.
    const counts = await prisma.appointment.groupBy({
      by: ["serviceId"],
      where: { status: "CONFIRMED" },
      _count: { _all: true },
    });
    const countMap = new Map(
      counts.map((row) => [row.serviceId, row._count._all]),
    );

    return ok({
      services: services.map((service) => ({
        ...service,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
        appointmentCount: countMap.get(service.id) ?? 0,
      })),
    });
  } catch (error) {
    return handleApiError(error, "admin:services:list");
  }
}

/** POST /api/admin/services — creation d'une prestation. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const parsed = serviceSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Certains champs sont invalides.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    const service = await prisma.service.create({ data: parsed.data });

    return ok(
      {
        service: {
          ...service,
          createdAt: service.createdAt.toISOString(),
          updatedAt: service.updatedAt.toISOString(),
          appointmentCount: 0,
        },
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, "admin:services:create");
  }
}
