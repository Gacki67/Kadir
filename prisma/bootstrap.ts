/**
 * Amorcage execute automatiquement a chaque deploiement (Vercel), apres
 * `prisma migrate deploy` (les tables existent donc deja).
 *
 * Il aligne la base sur la configuration du salon (src/lib/config.ts) :
 *   - horaires d'ouverture (jours + heures) mis a jour ;
 *   - catalogue des prestations cree / complete ;
 *   - toute prestation active hors catalogue est DESACTIVEE (elle disparait
 *     du site) sans etre supprimee, afin de conserver l'historique des
 *     rendez-vous qui y sont rattaches.
 *
 * Ryan peut ensuite ajuster horaires et prestations depuis son espace ; ces
 * valeurs restent la reference appliquee a chaque nouveau deploiement.
 */

import { PrismaClient } from "@prisma/client";

import { BOOKING, SERVICES } from "../src/lib/config";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // 1. Horaires d'ouverture — un enregistrement par jour, aligne sur la config.
  for (const rule of BOOKING.defaultBusinessHours) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: rule.dayOfWeek },
      update: {
        openingTime: rule.openingTime,
        closingTime: rule.closingTime,
        active: rule.active,
      },
      create: {
        dayOfWeek: rule.dayOfWeek,
        openingTime: rule.openingTime,
        closingTime: rule.closingTime,
        active: rule.active,
      },
    });
  }

  // 2. Catalogue des prestations — cree si absent, complete si present.
  const keepNames = new Set(SERVICES.map((s) => s.name));
  for (const [index, svc] of SERVICES.entries()) {
    await prisma.service.upsert({
      where: { name: svc.name },
      update: { bookableOnline: svc.bookableOnline, category: svc.category },
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
  }

  // 3. Desactive toute prestation active absente du catalogue (ex. anciennes
  //    prestations du site precedent), sans supprimer l'historique.
  const strays = await prisma.service.findMany({
    where: { active: true, name: { notIn: [...keepNames] } },
    select: { id: true, name: true },
  });
  if (strays.length > 0) {
    await prisma.service.updateMany({
      where: { id: { in: strays.map((s) => s.id) } },
      data: { active: false },
    });
    console.log(
      `[bootstrap] ${strays.length} prestation(s) hors catalogue desactivee(s) : ` +
        strays.map((s) => s.name).join(", "),
    );
  }

  const total = await prisma.service.count({ where: { active: true } });
  console.log(`[bootstrap] ${total} prestation(s) active(s), horaires alignes.`);
}

main()
  .catch((error) => {
    console.error("[bootstrap] Echec :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
