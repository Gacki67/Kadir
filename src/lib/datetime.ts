/**
 * Utilitaires de date et d'heure — tout le site raisonne en heure francaise.
 *
 * Principe : on ne manipule JAMAIS d'objet Date pour representer un jour ou un
 * horaire de rendez-vous. On utilise deux formats textuels sans ambiguite :
 *   - une "dateKey"  : "YYYY-MM-DD"  (jour civil francais)
 *   - une "timeKey"  : "HH:mm"       (heure locale francaise)
 *
 * La conversion vers un instant absolu (UTC) n'est faite qu'aux frontieres :
 * calcul des rappels, generation du fichier calendrier (.ics). On evite ainsi
 * la totalite des bugs classiques de decalage horaire, y compris lors des
 * changements d'heure d'ete / d'hiver.
 */

import { BOOKING, DAY_NAMES, MONTH_NAMES } from "./config";

const TZ = BOOKING.timezone;

/* -------------------------------------------------------------------------- */
/*  Conversions de base                                                        */
/* -------------------------------------------------------------------------- */

/** "09:30" -> 570 (minutes depuis minuit) */
export function timeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Heure invalide : "${time}"`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Heure invalide : "${time}"`);
  return hours * 60 + minutes;
}

/** 570 -> "09:30" */
export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** Ajoute des minutes a une heure "HH:mm". Peut depasser 24h (retourne "24:00"). */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const total = timeToMinutes(time) + minutesToAdd;
  if (total === 1440) return "24:00";
  return minutesToTime(total);
}

export const isValidTimeKey = (value: string): boolean =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

export const isValidDateKey = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  // Verifie que la date existe reellement (rejette le 31 fevrier).
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
};

/* -------------------------------------------------------------------------- */
/*  Fuseau horaire Europe/Paris                                                */
/* -------------------------------------------------------------------------- */

type Parts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Decompose un instant absolu en composantes d'horloge parisienne. */
function getParisParts(instant: Date): Parts {
  const parts = formatter.formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((part) => part.type === type);
    return found ? Number(found.value) : 0;
  };
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    // Certaines versions de Node renvoient "24" pour minuit avec hour12:false.
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
  };
}

/** Decalage du fuseau parisien (en ms) applicable a cet instant. */
function getParisOffsetMs(instant: Date): number {
  const parts = getParisParts(instant);
  const asIfUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  // On arrondit a la seconde pour ignorer les millisecondes de l'instant source.
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * Convertit un couple (jour francais, heure francaise) en instant absolu UTC.
 * Deux passes pour gerer correctement les bascules heure d'ete / heure d'hiver.
 */
export function parisToUtc(dateKey: string, timeKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = timeKey.split(":").map(Number);
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);

  let timestamp = naive - getParisOffsetMs(new Date(naive));
  timestamp = naive - getParisOffsetMs(new Date(timestamp));
  return new Date(timestamp);
}

/** Jour civil francais courant, au format "YYYY-MM-DD". */
export function todayKey(now: Date = new Date()): string {
  const { year, month, day } = getParisParts(now);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Heure francaise courante, au format "HH:mm". */
export function nowTimeKey(now: Date = new Date()): string {
  const { hour, minute } = getParisParts(now);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*  Manipulation de dateKey (arithmetique de calendrier pure)                   */
/* -------------------------------------------------------------------------- */

/** Jour de la semaine d'une dateKey : 0 = dimanche ... 6 = samedi. */
export function getDayOfWeek(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Ajoute (ou retire) des jours a une dateKey. */
export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return dateToKey(shifted);
}

/** Nombre de jours entre deux dateKey (b - a). */
export function daysBetween(a: string, b: string): number {
  const toTs = (key: string) => {
    const [year, month, day] = key.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toTs(b) - toTs(a)) / 86_400_000);
}

/**
 * Convertit une valeur DATE issue de Prisma en dateKey.
 * Prisma renvoie les colonnes `@db.Date` a minuit UTC : on lit donc en UTC.
 */
export function dateToKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Convertit une dateKey en valeur stockable dans une colonne `@db.Date`. */
export function keyToDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

/** Premier jour du mois d'une dateKey. */
export function startOfMonth(dateKey: string): string {
  return `${dateKey.slice(0, 7)}-01`;
}

/** Nombre de jours du mois d'une dateKey. */
export function daysInMonth(dateKey: string): number {
  const [year, month] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Lundi de la semaine contenant la dateKey. */
export function startOfWeek(dateKey: string): string {
  const dow = getDayOfWeek(dateKey);
  const delta = dow === 0 ? -6 : 1 - dow; // semaine francaise : lundi -> dimanche
  return addDays(dateKey, delta);
}

/* -------------------------------------------------------------------------- */
/*  Formatage francais                                                          */
/* -------------------------------------------------------------------------- */

/** "2026-07-29" -> "mercredi 29 juillet 2026" */
export function formatFrenchDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const dayName = DAY_NAMES[getDayOfWeek(dateKey)].toLowerCase();
  return `${dayName} ${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/** "2026-07-29" -> "29/07/2026" */
export function formatShortFrenchDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/** "2026-07-29" -> "mer. 29 juil." */
export function formatCompactFrenchDate(dateKey: string): string {
  const [, month, day] = dateKey.split("-").map(Number);
  const dayName = DAY_NAMES[getDayOfWeek(dateKey)].slice(0, 3).toLowerCase();
  const monthName = MONTH_NAMES[month - 1].slice(0, 4);
  return `${dayName}. ${day} ${monthName}.`;
}

/** "09:30" -> "09h30" (usage francais) */
export function formatFrenchTime(timeKey: string): string {
  return timeKey.replace(":", "h");
}

/** 90 -> "1 h 30", 45 -> "45 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${String(rest).padStart(2, "0")}`;
}

/** 2500 (centimes) -> "25,00 €" */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Formate un instant absolu en date + heure francaises lisibles. */
export function formatInstantFr(instant: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    dateStyle: "short",
    timeStyle: "short",
  }).format(instant);
}
