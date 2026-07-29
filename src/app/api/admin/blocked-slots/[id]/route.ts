import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok, requireAdmin } from "@/lib/api";
import { unblockSlots } from "@/lib/booking";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/blocked-slots/[id]
 * Leve un blocage : les creneaux redeviennent immediatement reservables
 * (les verrous sont supprimes en cascade).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const existing = await prisma.blockedSlot.findUnique({ where: { id } });
    if (!existing) return fail("Blocage introuvable.", 404);

    await unblockSlots(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error, "admin:blocks:delete");
  }
}
