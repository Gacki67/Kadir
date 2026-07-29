import { prisma } from "@/lib/prisma";
import { fail, handleApiError, ok, requireAdmin } from "@/lib/api";
import { dateToKey } from "@/lib/datetime";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/customers?q=...
 * Regroupe les rendez-vous par client (identifie par son e-mail).
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim();

    const appointments = await prisma.appointment.findMany({
      where: query
        ? {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query.replace(/[\s.\-()]/g, "") } },
            ],
          }
        : undefined,
      orderBy: { appointmentDate: "desc" },
      take: 500,
      include: { service: { select: { name: true } } },
    });

    const customers = new Map<
      string,
      {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        appointmentCount: number;
        lastVisit: string | null;
        totalSpent: number;
      }
    >();

    for (const appointment of appointments) {
      const existing = customers.get(appointment.email);
      const dateKey = dateToKey(appointment.appointmentDate);

      if (existing) {
        existing.appointmentCount += 1;
        if (appointment.status !== "CANCELLED") {
          existing.totalSpent += appointment.price;
          if (!existing.lastVisit || dateKey > existing.lastVisit) {
            existing.lastVisit = dateKey;
          }
        }
      } else {
        customers.set(appointment.email, {
          email: appointment.email,
          firstName: appointment.firstName,
          lastName: appointment.lastName,
          phone: appointment.phone,
          appointmentCount: 1,
          lastVisit: appointment.status !== "CANCELLED" ? dateKey : null,
          totalSpent:
            appointment.status !== "CANCELLED" ? appointment.price : 0,
        });
      }
    }

    return ok({ customers: Array.from(customers.values()) });
  } catch (error) {
    return handleApiError(error, "admin:customers:list");
  }
}

/**
 * DELETE /api/admin/customers?email=...
 *
 * Droit a l'effacement (RGPD, article 17).
 * Supprime definitivement toutes les donnees personnelles d'un client.
 * Les rendez-vous a venir sont d'abord annules afin de liberer les creneaux.
 */
export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();

    if (!email) {
      return fail("Le parametre email est obligatoire.", 400);
    }

    const appointments = await prisma.appointment.findMany({
      where: { email },
      select: { id: true },
    });

    if (appointments.length === 0) {
      return fail("Aucune donnee trouvee pour cette adresse e-mail.", 404);
    }

    // La suppression des rendez-vous entraine en cascade celle des verrous de
    // creneaux : les horaires concernes redeviennent disponibles.
    const result = await prisma.appointment.deleteMany({ where: { email } });

    console.info(
      `[rgpd] Suppression des donnees de ${email} : ${result.count} rendez-vous supprimes.`,
    );

    return ok({
      deleted: result.count,
      message: `${result.count} rendez-vous supprime(s) definitivement. Les creneaux correspondants sont de nouveau disponibles.`,
    });
  } catch (error) {
    return handleApiError(error, "admin:customers:delete");
  }
}
