import { describe, expect, it } from "vitest";

import {
  addDays,
  addMinutesToTime,
  dateToKey,
  daysBetween,
  daysInMonth,
  formatDuration,
  formatFrenchDate,
  formatFrenchTime,
  formatPrice,
  getDayOfWeek,
  isValidDateKey,
  isValidTimeKey,
  keyToDate,
  minutesToTime,
  nowTimeKey,
  parisToUtc,
  startOfWeek,
  timeToMinutes,
  todayKey,
} from "@/lib/datetime";

describe("conversions horaires", () => {
  it("convertit une heure en minutes et inversement", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("rejette une heure invalide", () => {
    expect(() => timeToMinutes("25:00")).toThrow();
    expect(() => timeToMinutes("bonjour")).toThrow();
  });

  it("ajoute des minutes correctement", () => {
    expect(addMinutesToTime("09:30", 30)).toBe("10:00");
    expect(addMinutesToTime("20:30", 30)).toBe("21:00");
    expect(addMinutesToTime("09:00", 45)).toBe("09:45");
    // Cas limite : une prestation qui se termine a minuit.
    expect(addMinutesToTime("23:30", 30)).toBe("24:00");
  });
});

describe("validation des formats", () => {
  it("valide les dates au format AAAA-MM-JJ", () => {
    expect(isValidDateKey("2026-07-29")).toBe(true);
    expect(isValidDateKey("2026-02-29")).toBe(false); // 2026 n'est pas bissextile
    expect(isValidDateKey("2024-02-29")).toBe(true);
    expect(isValidDateKey("2026-13-01")).toBe(false);
    expect(isValidDateKey("29/07/2026")).toBe(false);
    expect(isValidDateKey("")).toBe(false);
  });

  it("valide les heures au format HH:mm", () => {
    expect(isValidTimeKey("09:30")).toBe(true);
    expect(isValidTimeKey("23:59")).toBe(true);
    expect(isValidTimeKey("24:00")).toBe(false);
    expect(isValidTimeKey("9:30")).toBe(false);
  });
});

describe("arithmetique de calendrier", () => {
  it("identifie le bon jour de la semaine", () => {
    expect(getDayOfWeek("2026-07-06")).toBe(1); // lundi
    expect(getDayOfWeek("2026-07-11")).toBe(6); // samedi
    expect(getDayOfWeek("2026-07-12")).toBe(0); // dimanche
  });

  it("ajoute des jours en franchissant les mois", () => {
    expect(addDays("2026-07-30", 3)).toBe("2026-08-02");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("calcule l'ecart entre deux dates", () => {
    expect(daysBetween("2026-07-01", "2026-07-08")).toBe(7);
    expect(daysBetween("2026-07-08", "2026-07-01")).toBe(-7);
    expect(daysBetween("2026-07-01", "2026-07-01")).toBe(0);
  });

  it("connait le nombre de jours de chaque mois", () => {
    expect(daysInMonth("2026-02-01")).toBe(28);
    expect(daysInMonth("2024-02-01")).toBe(29);
    expect(daysInMonth("2026-07-01")).toBe(31);
    expect(daysInMonth("2026-04-01")).toBe(30);
  });

  it("fait commencer la semaine le lundi", () => {
    expect(startOfWeek("2026-07-08")).toBe("2026-07-06"); // mercredi -> lundi
    expect(startOfWeek("2026-07-12")).toBe("2026-07-06"); // dimanche -> lundi
    expect(startOfWeek("2026-07-06")).toBe("2026-07-06");
  });
});

describe("aller-retour avec la base de donnees", () => {
  it("convertit une dateKey en Date et inversement sans decalage", () => {
    const key = "2026-07-29";
    expect(dateToKey(keyToDate(key))).toBe(key);
  });

  it("reste stable sur toute une annee", () => {
    let cursor = "2026-01-01";
    for (let index = 0; index < 365; index += 1) {
      expect(dateToKey(keyToDate(cursor))).toBe(cursor);
      cursor = addDays(cursor, 1);
    }
  });
});

describe("fuseau horaire Europe/Paris", () => {
  it("applique l'heure d'ete (UTC+2)", () => {
    // 29 juillet 2026, 14 h 00 a Paris = 12 h 00 UTC
    expect(parisToUtc("2026-07-29", "14:00").toISOString()).toBe(
      "2026-07-29T12:00:00.000Z",
    );
  });

  it("applique l'heure d'hiver (UTC+1)", () => {
    // 15 janvier 2026, 14 h 00 a Paris = 13 h 00 UTC
    expect(parisToUtc("2026-01-15", "14:00").toISOString()).toBe(
      "2026-01-15T13:00:00.000Z",
    );
  });

  it("gere le passage a l'heure d'ete (dernier dimanche de mars)", () => {
    // 29 mars 2026 : bascule a 2 h du matin. 12 h 00 est deja en UTC+2.
    expect(parisToUtc("2026-03-29", "12:00").toISOString()).toBe(
      "2026-03-29T10:00:00.000Z",
    );
  });

  it("gere le passage a l'heure d'hiver (dernier dimanche d'octobre)", () => {
    // 25 octobre 2026 : retour a UTC+1. 12 h 00 est deja en UTC+1.
    expect(parisToUtc("2026-10-25", "12:00").toISOString()).toBe(
      "2026-10-25T11:00:00.000Z",
    );
  });

  it("determine le jour parisien, meme tard le soir en UTC", () => {
    // 23 h 30 UTC le 28 juillet = 01 h 30 le 29 juillet a Paris.
    expect(todayKey(new Date("2026-07-28T23:30:00.000Z"))).toBe("2026-07-29");
    expect(nowTimeKey(new Date("2026-07-28T23:30:00.000Z"))).toBe("01:30");
  });
});

describe("formatage francais", () => {
  it("formate une date en toutes lettres", () => {
    expect(formatFrenchDate("2026-07-29")).toBe("mercredi 29 juillet 2026");
    expect(formatFrenchDate("2026-01-01")).toBe("jeudi 1 janvier 2026");
  });

  it("formate une heure a la francaise", () => {
    expect(formatFrenchTime("09:30")).toBe("09h30");
    expect(formatFrenchTime("21:00")).toBe("21h00");
  });

  it("formate une duree", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30");
  });

  it("formate un prix en euros", () => {
    // L'espace utilise par Intl est une espace insecable etroite.
    expect(formatPrice(2500).replace(/\s/g, " ")).toBe("25,00 €");
    expect(formatPrice(1850).replace(/\s/g, " ")).toBe("18,50 €");
  });
});
