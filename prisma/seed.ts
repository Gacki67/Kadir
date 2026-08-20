/**
 * Script d'initialisation de la base de donnees.
 *
 *   npm run db:seed            -> prestations + horaires d'ouverture
 *   npm run db:seed -- --demo  -> ajoute un compte + des rendez-vous de demo
 *
 * Le script est idempotent : vous pouvez le relancer sans creer de doublons.
 * Contrairement a bootstrap.ts, il MET A JOUR les prestations du catalogue pour
 * refleter exactement src/lib/config.ts.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { BOOKING, SERVICES } from "../src/lib/config";
import {
  addDays,
  addMinutesToTime,
  getDayOfWeek,
  keyToDate,
  todayKey,
} from "../src/lib/datetime";
import { occupiedSlots } from "../src/lib/availability";

// Charge le fichier .env (Node 20.12+ / 22+). Sans effet si le fichier est absent.
try {
  process.loadEnvFile?.(".env");
} catch {
  // .env introuvable : on se repose sur les variables deja presentes.
}

const prisma = new PrismaClient();

/* -------------------------------------------------------------------------- */

async function seedServices(): Promise<void> {
  console.log("→ Catalogue des prestations…");

  const keepNames = new Set(SERVICES.map((s) => s.name));

  for (const [index, svc] of SERVICES.entries()) {
    await prisma.service.upsert({
      where: { name: svc.name },
      update: {
        description: svc.description,
        category: svc.category,
        duration: svc.duration,
        price: svc.price,
        bookableOnline: svc.bookableOnline,
        sortOrder: index + 1,
        active: true,
      },
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

  // Desactive (sans supprimer) toute prestation active absente du catalogue,
  // afin de conserver l'historique des rendez-vous qui y sont rattaches.
  const strays = await prisma.service.findMany({
    where: { active: true, name: { notIn: [...keepNames] } },
    select: { id: true },
  });
  if (strays.length > 0) {
    await prisma.service.updateMany({
      where: { id: { in: strays.map((s) => s.id) } },
      data: { active: false },
    });
    console.log(`   ✖ ${strays.length} prestation(s) hors catalogue desactivee(s).`);
  }

  console.log(`   ✔ ${SERVICES.length} prestations a jour.`);
}

async function seedBusinessHours(): Promise<void> {
  console.log("→ Horaires d'ouverture…");
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
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
    console.log(
      `   ${rule.active ? "✔" : "✖"} ${days[rule.dayOfWeek].padEnd(9)} ${
        rule.active ? `${rule.openingTime} – ${rule.closingTime}` : "ferme"
      }`,
    );
  }
}

/** Trouve les N prochains jours ouvres a partir de demain. */
function nextOpenDays(count: number): string[] {
  const openDays = new Set<number>(
    BOOKING.defaultBusinessHours
      .filter((rule) => rule.active)
      .map((rule) => rule.dayOfWeek),
  );

  const result: string[] = [];
  let cursor = addDays(todayKey(), 1);
  let guard = 0;

  while (result.length < count && guard < 60) {
    if (openDays.has(getDayOfWeek(cursor))) result.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return result;
}

async function seedDemo(): Promise<void> {
  console.log("→ Compte et rendez-vous de demonstration…");

  const service = await prisma.service.findFirst({
    where: { active: true, bookableOnline: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!service) return;

  // Compte client de demonstration (mot de passe : demodemo).
  const demoCustomer = await prisma.customer.upsert({
    where: { email: "client.demo@exemple.fr" },
    update: {},
    create: {
      email: "client.demo@exemple.fr",
      passwordHash: await bcrypt.hash("demodemo", 12),
      firstName: "Lucas",
      lastName: "Martin",
      phone: "+33612345678",
    },
  });

  const days = nextOpenDays(2);
  const demo = [
    { time: "10:00", customer: demoCustomer, notes: "Degrade bas, merci." },
    { time: "14:30", customer: demoCustomer, notes: null },
  ];

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const reference = () =>
    `ER-${Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")}`;
  const token = () =>
    Array.from({ length: 43 }, () =>
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"[
        Math.floor(Math.random() * 64)
      ],
    ).join("");

  for (const [i, entry] of demo.entries()) {
    const dateValue = keyToDate(days[i] ?? days[0]);

    const clash = await prisma.slotLock.findFirst({
      where: { date: dateValue, time: entry.time },
    });
    if (clash) {
      console.log(`   ~ deja occupe : ${days[i]} ${entry.time}`);
      continue;
    }

    const appointment = await prisma.appointment.create({
      data: {
        reference: reference(),
        firstName: entry.customer.firstName,
        lastName: entry.customer.lastName,
        email: entry.customer.email,
        phone: entry.customer.phone,
        customerId: entry.customer.id,
        serviceId: service.id,
        appointmentDate: dateValue,
        startTime: entry.time,
        endTime: addMinutesToTime(entry.time, service.duration),
        duration: service.duration,
        price: service.price,
        status: "CONFIRMED",
        notes: entry.notes,
        cancellationToken: token(),
        emailConfirmationSent: true,
        smsConfirmationSent: true,
        slotLocks: {
          create: occupiedSlots(entry.time, service.duration).map((time) => ({
            date: dateValue,
            time,
          })),
        },
      },
    });

    console.log(`   + ${appointment.reference} — ${days[i]} ${entry.time}`);
  }
}

async function main(): Promise<void> {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   Initialisation — L'Espace de Rayan          ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  await seedServices();
  await seedBusinessHours();

  if (process.argv.includes("--demo")) {
    await seedDemo();
  }

  console.log("\n✔ Base de donnees initialisee.\n");
}

main()
  .catch((error) => {
    console.error("\n✖ Echec de l'initialisation :\n", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
