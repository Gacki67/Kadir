import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok, readJson, requireAdmin } from "@/lib/api";
import { blockedSlotSchema, formatZodErrors } from "@/lib/validation";
import { blockSlots } from "@/lib/booking";
import { addDays, dateToKey, keyToDate, todayKey } from "@/lib/datetime";

export const dynamic = "force-dynamic";

/** GET /api/admin/blocked-slots — blocages a venir. */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? addDays(todayKey(), -7);

    const blocks = await prisma.blockedSlot.findMany({
      where: { date: { gte: keyToDate(from) } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: { _count: { select: { slotLocks: true } } },
    });

    return ok({
      blocks: blocks.map((block) => ({
        id: block.id,
        date: dateToKey(block.date),
        startTime: block.startTime,
        endTime: block.endTime,
        reason: block.reason,
        wholeDay: block.wholeDay,
        slotCount: block._count.slotLocks,
        createdAt: block.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error, "admin:blocks:list");
  }
}

/** POST /api/admin/blocked-slots — bloque un creneau ou une journee entiere. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const parsed = blockedSlotSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Blocage invalide.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    const result = await blockSlots({
      date: parsed.data.date,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      reason: parsed.data.reason,
      wholeDay: parsed.data.wholeDay,
    });

    if (result.blockedCount === 0 && result.conflicts.length > 0) {
      return fail(
        "Tous les creneaux de cette plage sont deja reserves. Annulez d'abord les rendez-vous concernes.",
        409,
        { conflicts: result.conflicts },
      );
    }

    if (result.blockedCount === 0) {
      return fail("Aucun creneau a bloquer sur cette plage.", 409);
    }

    return ok(
      {
        blockedCount: result.blockedCount,
        conflicts: result.conflicts,
        message:
          result.conflicts.length > 0
            ? `${result.blockedCount} creneau(x) bloque(s). ${result.conflicts.length} creneau(x) deja reserve(s) ont ete laisses libres : ${result.conflicts.join(", ")}.`
            : `${result.blockedCount} creneau(x) bloque(s).`,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, "admin:blocks:create");
  }
}
