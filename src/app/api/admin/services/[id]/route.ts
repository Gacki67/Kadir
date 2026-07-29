import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok, readJson, requireAdmin } from "@/lib/api";
import { formatZodErrors, serviceSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/services/[id] — modification d'une prestation. */
export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return fail("Prestation introuvable.", 404);

    const parsed = serviceSchema.partial().safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Certains champs sont invalides.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    const service = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });

    return ok({
      service: {
        ...service,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "admin:services:update");
  }
}

/**
 * DELETE /api/admin/services/[id]
 *
 * Une prestation deja utilisee par des rendez-vous ne peut pas etre supprimee
 * (cela romprait l'historique) : elle est alors simplement desactivee, ce qui
 * la retire du site sans rien perdre.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return fail("Prestation introuvable.", 404);

    const usage = await prisma.appointment.count({ where: { serviceId: id } });

    if (usage > 0) {
      await prisma.service.update({ where: { id }, data: { active: false } });
      return ok({
        deactivated: true,
        message: `Cette prestation est liee a ${usage} rendez-vous : elle a ete desactivee plutot que supprimee, afin de conserver l'historique.`,
      });
    }

    await prisma.service.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error, "admin:services:delete");
  }
}
