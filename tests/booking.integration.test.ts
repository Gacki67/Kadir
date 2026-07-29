/**
 * Tests d'integration — ils ecrivent reellement dans PostgreSQL.
 *
 * Prerequis :
 *   - une base accessible via DATABASE_URL ;
 *   - les migrations appliquees (npm run db:migrate) ;
 *   - les prestations en place (npm run db:seed).
 *
 * Les donnees creees sont systematiquement nettoyees a la fin.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

import {
  BookingError,
  blockSlots,
  cancelAppointment,
  createAppointment,
  getAvailability,
  getDayOccupancy,
  rescheduleAppointment,
} from "@/lib/booking";
import { addDays, getDayOfWeek, keyToDate, todayKey } from "@/lib/datetime";

const prisma = new PrismaClient();

/** Marqueur permettant d'identifier — et de nettoyer — les donnees de test. */
const TEST_EMAIL_DOMAIN = "@test-integration-kadir.local";

let serviceId: string;
let longServiceId: string;
/** Un lundi situe suffisamment loin pour ne genre aucun rendez-vous reel. */
let testDate: string;
let secondDate: string;

/** Trouve le prochain lundi a au moins `minOffset` jours. */
function findMonday(minOffset: number): string {
  let cursor = addDays(todayKey(), minOffset);
  for (let index = 0; index < 14; index += 1) {
    if (getDayOfWeek(cursor) === 1) return cursor;
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

async function cleanup(): Promise<void> {
  await prisma.appointment.deleteMany({
    where: { email: { contains: TEST_EMAIL_DOMAIN } },
  });
  await prisma.blockedSlot.deleteMany({
    where: {
      date: { in: [keyToDate(testDate), keyToDate(secondDate)] },
      reason: { startsWith: "[TEST]" },
    },
  });
}

const customer = (suffix: string) => ({
  firstName: "Test",
  lastName: "Client",
  email: `client-${suffix}${TEST_EMAIL_DOMAIN}`,
  phone: "+33612345678",
});

beforeAll(async () => {
  testDate = findMonday(21);
  secondDate = addDays(testDate, 1); // mardi

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { duration: "asc" },
  });

  if (services.length === 0) {
    throw new Error(
      "Aucune prestation en base. Executez `npm run db:seed` avant les tests.",
    );
  }

  serviceId = services.find((item) => item.duration === 30)?.id ?? services[0].id;
  longServiceId =
    services.find((item) => item.duration >= 60)?.id ?? services.at(-1)!.id;

  await cleanup();
});

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

/* ========================================================================== */

describe("Reservation d'un creneau disponible", () => {
  it("enregistre le rendez-vous en base et pose les verrous de creneau", async () => {
    const appointment = await createAppointment({
      ...customer("a"),
      serviceId,
      date: testDate,
      time: "10:00",
    });

    expect(appointment.id).toBeTruthy();
    expect(appointment.reference).toMatch(/^KB-[A-Z2-9]{6}$/);
    expect(appointment.status).toBe("CONFIRMED");
    expect(appointment.startTime).toBe("10:00");
    expect(appointment.endTime).toBe("10:30");
    // Jeton d'acces client : 32 octets en base64url.
    expect(appointment.cancellationToken.length).toBeGreaterThanOrEqual(40);

    // Le rendez-vous existe reellement en base.
    const stored = await prisma.appointment.findUnique({
      where: { id: appointment.id },
    });
    expect(stored).not.toBeNull();

    // Le creneau est verrouille.
    const locks = await prisma.slotLock.findMany({
      where: { appointmentId: appointment.id },
    });
    expect(locks).toHaveLength(1);
    expect(locks[0].time).toBe("10:00");
  });

  it("verrouille deux creneaux pour une prestation d'une heure", async () => {
    const appointment = await createAppointment({
      ...customer("b"),
      serviceId: longServiceId,
      date: testDate,
      time: "14:00",
    });

    const locks = await prisma.slotLock.findMany({
      where: { appointmentId: appointment.id },
      orderBy: { time: "asc" },
    });

    expect(locks.map((lock) => lock.time)).toEqual(["14:00", "14:30"]);
  });
});

describe("Le creneau reserve disparait des disponibilites", () => {
  it("n'est plus propose apres reservation", async () => {
    const before = await getAvailability(testDate, { duration: 30 });
    expect(before.slots.find((slot) => slot.time === "11:00")?.available).toBe(true);

    await createAppointment({
      ...customer("c"),
      serviceId,
      date: testDate,
      time: "11:00",
    });

    const after = await getAvailability(testDate, { duration: 30 });
    expect(after.slots.find((slot) => slot.time === "11:00")?.available).toBe(false);
    // Les creneaux voisins restent disponibles.
    expect(after.slots.find((slot) => slot.time === "11:30")?.available).toBe(true);
  });
});

describe("Protection contre la double reservation", () => {
  it("refuse un second client sur le meme creneau", async () => {
    await createAppointment({
      ...customer("d1"),
      serviceId,
      date: testDate,
      time: "15:00",
    });

    await expect(
      createAppointment({
        ...customer("d2"),
        serviceId,
        date: testDate,
        time: "15:00",
      }),
    ).rejects.toThrow(BookingError);

    // Un seul rendez-vous a ete enregistre.
    const count = await prisma.appointment.count({
      where: { appointmentDate: keyToDate(testDate), startTime: "15:00" },
    });
    expect(count).toBe(1);
  });

  it("n'accepte qu'une seule reservation lors de tentatives simultanees", async () => {
    // Cas critique : 5 clients confirment exactement au meme instant.
    const attempts = Array.from({ length: 5 }, (_, index) =>
      createAppointment({
        ...customer(`concurrent-${index}`),
        serviceId,
        date: testDate,
        time: "16:00",
      }),
    );

    const results = await Promise.allSettled(attempts);

    const accepted = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(4);

    // Chaque refus porte un message comprehensible pour le client.
    //
    // Selon l'instant exact ou le gagnant valide sa transaction, un perdant est
    // arrete soit par la verification applicative, soit par la contrainte
    // unique de la base. Les deux chemins doivent produire le meme code et
    // inviter le client a choisir un autre horaire.
    for (const result of rejected) {
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(BookingError);
        expect((result.reason as BookingError).code).toBe("SLOT_TAKEN");
        expect((result.reason as BookingError).message).toMatch(/autre horaire/i);
      }
    }

    // La base ne contient qu'un seul rendez-vous sur ce creneau.
    const stored = await prisma.appointment.count({
      where: { appointmentDate: keyToDate(testDate), startTime: "16:00" },
    });
    expect(stored).toBe(1);
  });

  it("empeche le chevauchement d'une prestation longue sur un creneau occupe", async () => {
    // 09:30 occupe -> une prestation d'1 h ne peut pas demarrer a 09:00.
    await createAppointment({
      ...customer("e1"),
      serviceId,
      date: testDate,
      time: "09:30",
    });

    await expect(
      createAppointment({
        ...customer("e2"),
        serviceId: longServiceId,
        date: testDate,
        time: "09:00",
      }),
    ).rejects.toThrow(BookingError);
  });
});

describe("Jours et horaires interdits", () => {
  it("refuse le samedi", async () => {
    // testDate est un lundi : +5 jours donne le samedi.
    const saturday = addDays(testDate, 5);
    expect(getDayOfWeek(saturday)).toBe(6);

    await expect(
      createAppointment({
        ...customer("sam"),
        serviceId,
        date: saturday,
        time: "10:00",
      }),
    ).rejects.toThrow(/ferme/i);
  });

  it("refuse le dimanche", async () => {
    const sunday = addDays(testDate, 6);
    expect(getDayOfWeek(sunday)).toBe(0);

    await expect(
      createAppointment({
        ...customer("dim"),
        serviceId,
        date: sunday,
        time: "10:00",
      }),
    ).rejects.toThrow(/ferme/i);
  });

  it("refuse une date passee", async () => {
    await expect(
      createAppointment({
        ...customer("passe"),
        serviceId,
        date: addDays(todayKey(), -3),
        time: "10:00",
      }),
    ).rejects.toThrow(/pass/i);
  });

  it("refuse un horaire avant l'ouverture", async () => {
    await expect(
      createAppointment({
        ...customer("tot"),
        serviceId,
        date: testDate,
        time: "08:00",
      }),
    ).rejects.toThrow(BookingError);
  });

  it("refuse un horaire qui deborderait apres la fermeture", async () => {
    // Une prestation d'1 h ne peut pas commencer a 20:30 (fin a 21:30).
    await expect(
      createAppointment({
        ...customer("tard"),
        serviceId: longServiceId,
        date: testDate,
        time: "20:30",
      }),
    ).rejects.toThrow(BookingError);
  });

  it("accepte le dernier creneau de la journee", async () => {
    const appointment = await createAppointment({
      ...customer("dernier"),
      serviceId,
      date: testDate,
      time: "20:30",
    });

    expect(appointment.endTime).toBe("21:00");
  });
});

describe("Annulation", () => {
  it("libere le creneau et conserve l'historique", async () => {
    const appointment = await createAppointment({
      ...customer("f"),
      serviceId,
      date: testDate,
      time: "17:00",
    });

    let occupancy = await getDayOccupancy(testDate);
    expect(occupancy.booked.has("17:00")).toBe(true);

    const cancelled = await cancelAppointment(appointment.id, "CLIENT");
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.cancelledBy).toBe("CLIENT");

    // Le creneau est de nouveau libre.
    occupancy = await getDayOccupancy(testDate);
    expect(occupancy.booked.has("17:00")).toBe(false);

    const availability = await getAvailability(testDate, { duration: 30 });
    expect(
      availability.slots.find((slot) => slot.time === "17:00")?.available,
    ).toBe(true);

    // Le rendez-vous reste en base, pour l'historique.
    const stored = await prisma.appointment.findUnique({
      where: { id: appointment.id },
    });
    expect(stored?.status).toBe("CANCELLED");

    // Le creneau libere est de nouveau reservable.
    const replacement = await createAppointment({
      ...customer("f2"),
      serviceId,
      date: testDate,
      time: "17:00",
    });
    expect(replacement.id).toBeTruthy();
  });

  it("refuse une double annulation", async () => {
    const appointment = await createAppointment({
      ...customer("g"),
      serviceId,
      date: testDate,
      time: "18:00",
    });

    await cancelAppointment(appointment.id, "CLIENT");
    await expect(cancelAppointment(appointment.id, "CLIENT")).rejects.toThrow(
      /deja ete annule/i,
    );
  });
});

describe("Deplacement d'un rendez-vous", () => {
  it("libere l'ancien creneau et occupe le nouveau", async () => {
    const appointment = await createAppointment({
      ...customer("h"),
      serviceId,
      date: testDate,
      time: "12:00",
    });

    const moved = await rescheduleAppointment({
      appointmentId: appointment.id,
      date: secondDate,
      time: "13:00",
    });

    expect(moved.startTime).toBe("13:00");
    // Les rappels repartent a zero puisque la date a change.
    expect(moved.emailReminderSent).toBe(false);

    const oldDay = await getDayOccupancy(testDate);
    const newDay = await getDayOccupancy(secondDate);

    expect(oldDay.booked.has("12:00")).toBe(false);
    expect(newDay.booked.has("13:00")).toBe(true);
  });

  it("refuse un deplacement vers un creneau deja pris", async () => {
    const first = await createAppointment({
      ...customer("i1"),
      serviceId,
      date: testDate,
      time: "09:00",
    });
    await createAppointment({
      ...customer("i2"),
      serviceId,
      date: testDate,
      time: "09:30",
    });

    await expect(
      rescheduleAppointment({
        appointmentId: first.id,
        date: testDate,
        time: "09:30",
      }),
    ).rejects.toThrow(BookingError);

    // Le rendez-vous d'origine n'a pas bouge.
    const unchanged = await prisma.appointment.findUnique({
      where: { id: first.id },
    });
    expect(unchanged?.startTime).toBe("09:00");
  });

  it("permet de deplacer un rendez-vous sur son propre creneau voisin", async () => {
    const appointment = await createAppointment({
      ...customer("j"),
      serviceId,
      date: testDate,
      time: "10:00",
    });

    const moved = await rescheduleAppointment({
      appointmentId: appointment.id,
      date: testDate,
      time: "10:30",
    });

    expect(moved.startTime).toBe("10:30");
  });
});

describe("Blocages administrateur", () => {
  it("rend un creneau bloque non reservable", async () => {
    const result = await blockSlots({
      date: testDate,
      startTime: "12:00",
      endTime: "14:00",
      reason: "[TEST] Pause dejeuner",
      wholeDay: false,
    });

    expect(result.blockedCount).toBe(4); // 12:00, 12:30, 13:00, 13:30

    const availability = await getAvailability(testDate, { duration: 30 });
    for (const time of ["12:00", "12:30", "13:00", "13:30"]) {
      const slot = availability.slots.find((item) => item.time === time);
      expect(slot?.available, `creneau ${time}`).toBe(false);
    }
    // 14:00 n'est pas inclus dans la plage bloquee.
    expect(
      availability.slots.find((item) => item.time === "14:00")?.available,
    ).toBe(true);

    await expect(
      createAppointment({
        ...customer("bloc"),
        serviceId,
        date: testDate,
        time: "12:00",
      }),
    ).rejects.toThrow(BookingError);
  });

  it("bloque une journee entiere", async () => {
    await blockSlots({
      date: secondDate,
      reason: "[TEST] Conge",
      wholeDay: true,
    });

    const availability = await getAvailability(secondDate, { duration: 30 });
    expect(availability.slots.every((slot) => !slot.available)).toBe(true);
  });

  it("ne bloque pas un creneau deja reserve et le signale", async () => {
    await createAppointment({
      ...customer("k"),
      serviceId,
      date: testDate,
      time: "12:30",
    });

    const result = await blockSlots({
      date: testDate,
      startTime: "12:00",
      endTime: "13:30",
      reason: "[TEST] Avec conflit",
      wholeDay: false,
    });

    expect(result.conflicts).toContain("12:30");
    expect(result.blockedCount).toBe(2); // 12:00 et 13:00

    // Le rendez-vous existant est intact.
    const stored = await prisma.appointment.count({
      where: { appointmentDate: keyToDate(testDate), startTime: "12:30" },
    });
    expect(stored).toBe(1);
  });
});

describe("Indicateurs de notification", () => {
  it("initialise les indicateurs a false", async () => {
    const appointment = await createAppointment({
      ...customer("l"),
      serviceId,
      date: testDate,
      time: "19:00",
    });

    expect(appointment.emailConfirmationSent).toBe(false);
    expect(appointment.smsConfirmationSent).toBe(false);
    expect(appointment.emailReminderSent).toBe(false);
    expect(appointment.smsReminderSent).toBe(false);
    // Le consentement RGPD est horodate.
    expect(appointment.privacyAcceptedAt).toBeInstanceOf(Date);
  });
});
