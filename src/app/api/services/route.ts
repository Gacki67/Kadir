import { prisma } from "@/lib/prisma";
import { handleApiError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/services — liste publique des prestations actives. */
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        imageUrl: true,
      },
    });

    return ok({ services });
  } catch (error) {
    return handleApiError(error, "services:list");
  }
}
