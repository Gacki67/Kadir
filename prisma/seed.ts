/**
 * Script d'initialisation de la base de donnees.
 *
 *   npm run db:seed            -> prestations + horaires d'ouverture
 *   npm run db:seed -- --demo  -> ajoute egalement quelques rendez-vous de demonstration
 *
 * Le script est idempotent : vous pouvez le relancer sans creer de doublons.
 */

import { PrismaClient } from "@prisma/client";

import { BOOKING, MAIN_SERVICE } from "../src/lib/config";
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
  console.log("→ Prestation unique…");

  const existing = await prisma.service.findFirst({
    where: { name: MAIN_SERVICE.name },
  });

  const data = {
    name: MAIN_SERVICE.name,
    description: MAIN_SERVICE.description,
    duration: MAIN_SERVICE.duration,
    price: MAIN_SERVICE.price,
    sortOrder: 1,
    active: true,
    imageUrl: null,
  };

  const service = existing
    ? await prisma.service.update({ where: { id: existing.id }, data })
    : await prisma.service.create({ data });

  console.log(
    `   ${existing ? "↻ mise a jour" : "+ creation    "} : ${service.name} — ${service.duration} min · ${(service.price / 100).toFixed(2)} €`,
  );

  // Le salon ne propose qu'une seule prestation : toute autre prestation encore
  // active est desactivee (et non supprimee, pour conserver l'historique des
  // rendez-vous qui y sont rattaches).
  const deactivated = await prisma.service.updateMany({
    where: { id: { not: service.id }, active: true },
    data: { active: false },
  });

  if (deactivated.count > 0) {
    console.log(
      `   ✖ ${deactivated.count} autre(s) prestation(s) desactivee(s) — le salon n'en propose qu'une.`,
    );
  }
}

async function seedBusinessHours(): Promise<void> {
  console.log("→ Horaires d'ouverture…");
  for (const rule of BOOKING.defaultBusinessHours) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: rule.dayOfWeek },
      update: {},
      create: {
        dayOfWeek: rule.dayOfWeek,
        openingTime: rule.openingTime,
        closingTime: rule.closingTime,
        active: rule.active,
      },
    });
  }
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  for (const rule of BOOKING.defaultBusinessHours) {
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

async function seedDemoAppointments(): Promise<void> {
  console.log("→ Rendez-vous de demonstration…");

  const service = await prisma.service.findFirst({ where: { active: true } });
  if (!service) return;

  const days = nextOpenDays(2);
  const demo = [
    {
      firstName: "Lucas",
      lastName: "Martin",
      email: "lucas.martin@exemple.fr",
      phone: "+33612345678",
      date: days[0],
      time: "10:00",
      notes: "Degrade bas, merci.",
    },
    {
      firstName: "Yanis",
      lastName: "Benali",
      email: "yanis.benali@exemple.fr",
      phone: "+33622334455",
      date: days[0],
      time: "14:30",
      notes: null,
    },
    {
      firstName: "Thomas",
      lastName: "Girard",
      email: "thomas.girard@exemple.fr",
      phone: "+33633445566",
      date: days[1] ?? days[0],
      time: "17:00",
      notes: null,
    },
  ];

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const reference = () =>
    `KB-${Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")}`;
  const token = () =>
    Array.from({ length: 43 }, () =>
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"[
        Math.floor(Math.random() * 64)
      ],
    ).join("");

  for (const entry of demo) {
    const dateValue = keyToDate(entry.date);

    const clash = await prisma.slotLock.findFirst({
      where: { date: dateValue, time: entry.time },
    });
    if (clash) {
      console.log(`   ~ deja occupe : ${entry.date} ${entry.time}`);
      continue;
    }

    const appointment = await prisma.appointment.create({
      data: {
        reference: reference(),
        firstName: entry.firstName,
        lastName: entry.lastName,
        email: entry.email,
        phone: entry.phone,
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

    console.log(
      `   + ${appointment.reference} — ${entry.firstName} ${entry.lastName} — ${entry.date} ${entry.time}`,
    );
  }
}

async function main(): Promise<void> {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   Initialisation — Kadir Barber              ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  await seedServices();
  await seedBusinessHours();

  if (process.argv.includes("--demo")) {
    await seedDemoAppointments();
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
