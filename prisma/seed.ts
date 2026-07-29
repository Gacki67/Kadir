/**
 * Script d'initialisation de la base de donnees.
 *
 *   npm run db:seed            -> prestations + horaires d'ouverture
 *   npm run db:seed -- --demo  -> ajoute egalement quelques rendez-vous de demonstration
 *
 * Le script est idempotent : vous pouvez le relancer sans creer de doublons.
 */

import { PrismaClient } from "@prisma/client";

import { BOOKING } from "../src/lib/config";
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
/*  Prestations de demonstration — modifiables librement                        */
/* -------------------------------------------------------------------------- */

const SERVICES = [
  {
    name: "Coupe homme",
    description:
      "Coupe personnalisee aux ciseaux ou a la tondeuse, shampoing et coiffage inclus.",
    duration: 30,
    price: 2500, // en centimes -> 25,00 €
    sortOrder: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Coupe enfant",
    description:
      "Pour les moins de 12 ans. Une coupe soignee dans une ambiance detendue.",
    duration: 30,
    price: 1800,
    sortOrder: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Taille de barbe",
    description:
      "Mise en forme, degrade et finition au rasoir, avec serviette chaude et baume apaisant.",
    duration: 30,
    price: 1800,
    sortOrder: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Coupe et barbe",
    description:
      "La prestation complete : coupe sur mesure et barbe travaillee au rasoir. Notre grand classique.",
    duration: 60,
    price: 3900,
    sortOrder: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Contours",
    description:
      "Retouche des contours de la nuque, des tempes et de la barbe entre deux rendez-vous.",
    duration: 30,
    price: 1200,
    sortOrder: 5,
    imageUrl: null,
  },
  {
    name: "Soin du visage",
    description:
      "Gommage, masque purifiant et hydratation. Le soin ideal apres un rasage traditionnel.",
    duration: 30,
    price: 2800,
    sortOrder: 6,
    imageUrl: null,
  },
];

/* -------------------------------------------------------------------------- */

async function seedServices(): Promise<void> {
  console.log("→ Prestations…");
  for (const service of SERVICES) {
    const existing = await prisma.service.findFirst({
      where: { name: service.name },
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          description: service.description,
          duration: service.duration,
          price: service.price,
          sortOrder: service.sortOrder,
          imageUrl: service.imageUrl,
          active: true,
        },
      });
      console.log(`   ↻ mise a jour : ${service.name}`);
    } else {
      await prisma.service.create({ data: { ...service, active: true } });
      console.log(`   + creation    : ${service.name}`);
    }
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

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  if (services.length === 0) return;

  const days = nextOpenDays(2);
  const demo = [
    {
      firstName: "Lucas",
      lastName: "Martin",
      email: "lucas.martin@exemple.fr",
      phone: "+33612345678",
      date: days[0],
      time: "10:00",
      service: services[0],
      notes: "Degrade bas, merci.",
    },
    {
      firstName: "Yanis",
      lastName: "Benali",
      email: "yanis.benali@exemple.fr",
      phone: "+33622334455",
      date: days[0],
      time: "14:30",
      service: services[3] ?? services[0],
      notes: null,
    },
    {
      firstName: "Thomas",
      lastName: "Girard",
      email: "thomas.girard@exemple.fr",
      phone: "+33633445566",
      date: days[1] ?? days[0],
      time: "17:00",
      service: services[2] ?? services[0],
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
        serviceId: entry.service.id,
        appointmentDate: dateValue,
        startTime: entry.time,
        endTime: addMinutesToTime(entry.time, entry.service.duration),
        duration: entry.service.duration,
        price: entry.service.price,
        status: "CONFIRMED",
        notes: entry.notes,
        cancellationToken: token(),
        emailConfirmationSent: true,
        smsConfirmationSent: true,
        slotLocks: {
          create: occupiedSlots(entry.time, entry.service.duration).map(
            (time) => ({ date: dateValue, time }),
          ),
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
