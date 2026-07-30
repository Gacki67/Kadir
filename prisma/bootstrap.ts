/**
 * Amorcage minimal execute automatiquement a chaque deploiement (Vercel).
 *
 * Contrairement a `seed.ts`, ce script est STRICTEMENT NON DESTRUCTIF :
 *   - il cree la prestation et les horaires UNIQUEMENT s'ils n'existent pas ;
 *   - il ne modifie jamais une donnee existante.
 *
 * Ainsi, un redeploiement ne remet jamais a zero le tarif ou les horaires
 * que vous auriez modifies depuis l'espace administrateur.
 *
 * Il est appele par le script `build` (voir package.json), apres
 * `prisma migrate deploy` : les tables sont donc deja creees a ce moment.
 */

import { PrismaClient } from "@prisma/client";

import { BOOKING, MAIN_SERVICE } from "../src/lib/config";

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

  // 2. Prestation — creee seulement si aucune prestation n'existe encore.
  const existingCount = await prisma.service.count();
  if (existingCount === 0) {
    await prisma.service.create({
      data: {
        name: MAIN_SERVICE.name,
        description: MAIN_SERVICE.description,
        duration: MAIN_SERVICE.duration,
        price: MAIN_SERVICE.price,
        sortOrder: 1,
        active: true,
      },
    });
    console.log(`[bootstrap] Prestation creee : ${MAIN_SERVICE.name}`);
  } else {
    console.log(
      `[bootstrap] ${existingCount} prestation(s) deja en base — aucune modification.`,
    );
  }

  console.log("[bootstrap] Base prete.");
}

main()
  .catch((error) => {
    console.error("[bootstrap] Echec :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
