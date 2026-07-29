import { describe, expect, it } from "vitest";

import {
  computeDaySlots,
  generateSlotGrid,
  getDayStatus,
  occupiedSlots,
  slotsNeeded,
  validateRequestedSlot,
  type BusinessHoursRule,
} from "@/lib/availability";

/**
 * Regles utilisees par la plupart des tests : ouvert du lundi au vendredi,
 * de 9 h a 21 h. Ferme le samedi et le dimanche.
 */
const RULES: BusinessHoursRule[] = [
  { dayOfWeek: 0, openingTime: "09:00", closingTime: "21:00", active: false },
  { dayOfWeek: 1, openingTime: "09:00", closingTime: "21:00", active: true },
  { dayOfWeek: 2, openingTime: "09:00", closingTime: "21:00", active: true },
  { dayOfWeek: 3, openingTime: "09:00", closingTime: "21:00", active: true },
  { dayOfWeek: 4, openingTime: "09:00", closingTime: "21:00", active: true },
  { dayOfWeek: 5, openingTime: "09:00", closingTime: "21:00", active: true },
  { dayOfWeek: 6, openingTime: "09:00", closingTime: "21:00", active: false },
];

// Reperes fixes : 2026-07-06 est un lundi, 2026-07-11 un samedi,
// 2026-07-12 un dimanche.
const MONDAY = "2026-07-06";
const SATURDAY = "2026-07-11";
const SUNDAY = "2026-07-12";
/** Instant fige : lundi 6 juillet 2026, 8 h 00 heure de Paris. */
const NOW = new Date("2026-07-06T06:00:00.000Z");

const baseInput = {
  rules: RULES,
  bookedSlots: new Set<string>(),
  blockedSlots: new Set<string>(),
  now: NOW,
};

describe("generateSlotGrid", () => {
  it("produit des creneaux de 30 min de 09:00 a 20:30 pour une journee 9 h – 21 h", () => {
    const grid = generateSlotGrid("09:00", "21:00", 30);

    expect(grid[0]).toBe("09:00");
    expect(grid[1]).toBe("09:30");
    expect(grid.at(-1)).toBe("20:30");
    expect(grid).toHaveLength(24);
  });

  it("ne propose aucun creneau qui depasserait l'heure de fermeture", () => {
    // 09:00 -> 10:00 avec des creneaux de 45 min : seul 09:00 tient.
    expect(generateSlotGrid("09:00", "10:00", 45)).toEqual(["09:00"]);
  });

  it("retourne une liste vide si l'amplitude est trop courte", () => {
    expect(generateSlotGrid("09:00", "09:20", 30)).toEqual([]);
  });
});

describe("slotsNeeded / occupiedSlots", () => {
  it("compte un creneau pour une prestation de 30 minutes", () => {
    expect(slotsNeeded(30, 30)).toBe(1);
    expect(occupiedSlots("10:00", 30, 30)).toEqual(["10:00"]);
  });

  it("arrondit au creneau superieur pour une prestation de 45 minutes", () => {
    expect(slotsNeeded(45, 30)).toBe(2);
    expect(occupiedSlots("10:00", 45, 30)).toEqual(["10:00", "10:30"]);
  });

  it("occupe deux creneaux pour une prestation d'une heure", () => {
    expect(occupiedSlots("14:00", 60, 30)).toEqual(["14:00", "14:30"]);
  });
});

describe("getDayStatus", () => {
  it("refuse le samedi", () => {
    const status = getDayStatus(SATURDAY, RULES, NOW);
    expect(status.open).toBe(false);
    expect(status.reason).toBe("CLOSED");
  });

  it("refuse le dimanche", () => {
    const status = getDayStatus(SUNDAY, RULES, NOW);
    expect(status.open).toBe(false);
    expect(status.reason).toBe("CLOSED");
  });

  it("refuse une date passee", () => {
    const status = getDayStatus("2026-07-03", RULES, NOW);
    expect(status.open).toBe(false);
    expect(status.reason).toBe("PAST");
  });

  it("refuse une date trop lointaine", () => {
    const status = getDayStatus("2027-12-31", RULES, NOW);
    expect(status.open).toBe(false);
    expect(status.reason).toBe("TOO_FAR");
  });

  it("accepte un jour ouvre a venir", () => {
    const status = getDayStatus("2026-07-07", RULES, NOW);
    expect(status.open).toBe(true);
    expect(status.rule?.openingTime).toBe("09:00");
  });
});

describe("computeDaySlots", () => {
  it("propose tous les creneaux d'un jour ouvre vide", () => {
    const result = computeDaySlots({
      ...baseInput,
      dateKey: "2026-07-07",
      serviceDuration: 30,
    });

    expect(result.dayOpen).toBe(true);
    expect(result.slots.filter((slot) => slot.available)).toHaveLength(24);
  });

  it("ne propose aucun creneau le week-end", () => {
    const saturday = computeDaySlots({
      ...baseInput,
      dateKey: SATURDAY,
      serviceDuration: 30,
    });
    const sunday = computeDaySlots({
      ...baseInput,
      dateKey: SUNDAY,
      serviceDuration: 30,
    });

    expect(saturday.dayOpen).toBe(false);
    expect(saturday.slots).toHaveLength(0);
    expect(sunday.dayOpen).toBe(false);
    expect(sunday.slots).toHaveLength(0);
  });

  it("marque comme indisponible un creneau deja reserve", () => {
    const result = computeDaySlots({
      ...baseInput,
      dateKey: "2026-07-07",
      serviceDuration: 30,
      bookedSlots: new Set(["10:00"]),
    });

    const slot = result.slots.find((item) => item.time === "10:00");
    expect(slot?.available).toBe(false);
    expect(slot?.reason).toBe("BOOKED");

    // Les creneaux voisins restent libres.
    expect(result.slots.find((item) => item.time === "09:30")?.available).toBe(true);
    expect(result.slots.find((item) => item.time === "10:30")?.available).toBe(true);
  });

  it("marque comme indisponible un creneau bloque par l'administrateur", () => {
    const result = computeDaySlots({
      ...baseInput,
      dateKey: "2026-07-07",
      serviceDuration: 30,
      blockedSlots: new Set(["12:00", "12:30"]),
    });

    expect(result.slots.find((item) => item.time === "12:00")?.reason).toBe("BLOCKED");
    expect(result.slots.find((item) => item.time === "12:30")?.reason).toBe("BLOCKED");
  });

  it("empeche une prestation longue de chevaucher un creneau occupe", () => {
    // 10:30 est pris. Une prestation d'1 h occupe deux creneaux consecutifs :
    // seuls les departs a 10:00 (10:00 + 10:30) et 10:30 sont donc impossibles.
    const result = computeDaySlots({
      ...baseInput,
      dateKey: "2026-07-07",
      serviceDuration: 60,
      bookedSlots: new Set(["10:30"]),
    });

    const at = (time: string) =>
      result.slots.find((item) => item.time === time);

    expect(at("10:00")?.available).toBe(false);
    expect(at("10:30")?.available).toBe(false);
    // 09:30 couvre 09:30 et 10:00 : il reste reservable.
    expect(at("09:30")?.available).toBe(true);
    expect(at("11:00")?.available).toBe(true);
  });

  it("interdit un depart trop tardif pour une prestation d'une heure", () => {
    const result = computeDaySlots({
      ...baseInput,
      dateKey: "2026-07-07",
      serviceDuration: 60,
    });

    // Le dernier depart possible est 20:00 (fin a 21:00).
    expect(result.slots.find((item) => item.time === "20:00")?.available).toBe(true);
    const late = result.slots.find((item) => item.time === "20:30");
    expect(late?.available).toBe(false);
    expect(late?.reason).toBe("CLOSING");
  });

  it("ecarte les horaires deja passes dans la journee en cours", () => {
    // Il est 14 h 30 (heure de Paris) le lundi.
    const now = new Date("2026-07-06T12:30:00.000Z");
    const result = computeDaySlots({
      ...baseInput,
      now,
      dateKey: MONDAY,
      serviceDuration: 30,
    });

    expect(result.slots.find((item) => item.time === "09:00")?.reason).toBe("PAST");
    expect(result.slots.find((item) => item.time === "14:00")?.reason).toBe("PAST");
    // 15:30 respecte le delai minimum d'une heure.
    expect(result.slots.find((item) => item.time === "15:30")?.available).toBe(true);
  });

  it("signale une journee complete", () => {
    const allSlots = generateSlotGrid("09:00", "21:00", 30);
    const result = computeDaySlots({
      ...baseInput,
      dateKey: "2026-07-07",
      serviceDuration: 30,
      bookedSlots: new Set(allSlots),
    });

    expect(result.dayOpen).toBe(true);
    expect(result.reason).toBe("FULL");
    expect(result.slots.every((slot) => !slot.available)).toBe(true);
  });
});

describe("validateRequestedSlot", () => {
  const request = (overrides: Record<string, unknown>) =>
    validateRequestedSlot({
      ...baseInput,
      dateKey: "2026-07-07",
      serviceDuration: 30,
      time: "10:00",
      ...overrides,
    });

  it("accepte un creneau libre", () => {
    expect(request({}).ok).toBe(true);
  });

  it("refuse un creneau deja reserve avec un message clair", () => {
    const result = request({ bookedSlots: new Set(["10:00"]) });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("BOOKED");
    expect(result.message).toMatch(/creneau/i);
  });

  it("refuse un creneau bloque", () => {
    const result = request({ blockedSlots: new Set(["10:00"]) });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("BLOCKED");
  });

  it("refuse le samedi", () => {
    const result = request({ dateKey: SATURDAY });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/ferme/i);
  });

  it("refuse une date passee", () => {
    const result = request({ dateKey: "2026-06-30" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/pass/i);
  });

  it("refuse un horaire hors grille", () => {
    const result = request({ time: "10:15" });
    expect(result.ok).toBe(false);
  });

  it("refuse un horaire avant l'ouverture", () => {
    expect(request({ time: "08:00" }).ok).toBe(false);
  });

  it("refuse un horaire apres la fermeture", () => {
    expect(request({ time: "21:00" }).ok).toBe(false);
    expect(request({ time: "22:30" }).ok).toBe(false);
  });
});
