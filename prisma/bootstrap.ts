/**
 * Amorcage minimal execute automatiquement a chaque deploiement (Vercel).
 *
 * Contrairement a `seed.ts`, ce script est NON DESTRUCTIF :
 *   - il cree les prestations et les horaires UNIQUEMENT s'ils n'existent pas ;
 *   - il ne modifie jamais une prestation ou un horaire deja enregistres.
 *
 * Ainsi, un redeploiement ne remet jamais a zero les tarifs, durees ou horaires
 * que Rayan aurait modifies depuis son espace.
 *
 * Il est appele par le script `build` (voir package.json), apres
 * `prisma migrate deploy` : les tables sont donc deja creees a ce moment.
 */

import { PrismaClient } from "@prisma/client";

import { BOOKING, SERVICES } from "../src/lib/config";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // 1. Horaires d'ouverture — un enregistrement par jour, cree si absent.
  for (const rule of BOOKING.defaultBusinessHours) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: rule.dayOfWeek },
      update: {}, // ne touche pas a un horaire deja enregistre
      create: {
        dayOfWeek: rule.dayOfWeek,
        openingTime: rule.openingTime,
        closingTime: rule.closingTime,
        active: rule.active,
      },
    });
  }

  // 2. Catalogue des prestations — chaque prestation est creee si son nom
  //    n'existe pas encore. Les prestations deja en base ne sont PAS modifiees.
  let created = 0;
  for (const [index, svc] of SERVICES.entries()) {
    const result = await prisma.service.upsert({
      where: { name: svc.name },
      update: {}, // non destructif : on respecte d'eventuelles modifications admin
      create: {
        name: svc.name,
        description: svc.description,
        category: svc.category,
        duration: svc.duration,
        price: svc.price,
        bookableOnline: svc.bookableOnline,
        sortOrder: index + 1,
        active: true,
      },
    });
    // Prisma ne dit pas si c'etait un create ou un update ; on recompte apres.
    void result;
  }

  const total = await prisma.service.count();
  created = total;
  console.log(`[bootstrap] ${created} prestation(s) en base, horaires prets.`);
}

main()
  .catch((error) => {
    console.error("[bootstrap] Echec :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
