/**
 * Moteur de disponibilites.
 *
 * Cette partie est volontairement composee de fonctions pures (aucun acces
 * base de donnees) afin de pouvoir etre testee unitairement et reutilisee
 * cote client comme cote serveur.
 */

import { BOOKING } from "./config";
import {
  addMinutesToTime,
  daysBetween,
  getDayOfWeek,
  minutesToTime,
  nowTimeKey,
  timeToMinutes,
  todayKey,
} from "./datetime";

export type BusinessHoursRule = {
  dayOfWeek: number;
  openingTime: string;
  closingTime: string;
  active: boolean;
};

export type SlotAvailability = {
  /** Heure de debut "HH:mm" */
  time: string;
  /** Heure de fin de la prestation si elle demarre a ce creneau */
  endTime: string;
  available: boolean;
  /** Raison de l'indisponibilite, utile pour l'affichage et le debogage */
  reason?: "BOOKED" | "BLOCKED" | "PAST" | "CLOSING" | "LEAD_TIME";
};

/** Motif possible d'indisponibilite d'une journee entiere. */
export type DayUnavailableReason =
  | "CLOSED"
  | "PAST"
  | "TOO_FAR"
  | "FULL"
  | null;

/**
 * Genere la grille complete des creneaux d'une journee, sans tenir compte
 * des reservations : uniquement les horaires d'ouverture et le pas de temps.
 *
 * Exemple : ouverture 09:00, fermeture 21:00, pas de 30 min
 *        -> ["09:00", "09:30", ..., "20:30"]
 *
 * Le dernier creneau de 30 minutes se termine donc exactement a la fermeture.
 */
export function generateSlotGrid(
  openingTime: string,
  closingTime: string,
  slotDuration: number = BOOKING.slotDurationMinutes,
): string[] {
  const start = timeToMinutes(openingTime);
  const end = timeToMinutes(closingTime);
  const slots: string[] = [];

  if (slotDuration <= 0) return slots;

  for (let minute = start; minute + slotDuration <= end; minute += slotDuration) {
    slots.push(minutesToTime(minute));
  }
  return slots;
}

/**
 * Nombre de creneaux elementaires necessaires pour une prestation.
 * Une prestation de 45 min sur une grille de 30 min occupe 2 creneaux :
 * on arrondit toujours au creneau superieur pour ne pas chevaucher le suivant.
 */
export function slotsNeeded(
  durationMinutes: number,
  slotDuration: number = BOOKING.slotDurationMinutes,
): number {
  return Math.max(1, Math.ceil(durationMinutes / slotDuration));
}

/**
 * Liste des creneaux elementaires occupes par une prestation demarrant a
 * `startTime`. C'est exactement l'ensemble des verrous (SlotLock) a poser.
 */
export function occupiedSlots(
  startTime: string,
  durationMinutes: number,
  slotDuration: number = BOOKING.slotDurationMinutes,
): string[] {
  const count = slotsNeeded(durationMinutes, slotDuration);
  const startMinute = timeToMinutes(startTime);
  return Array.from({ length: count }, (_, index) =>
    minutesToTime(startMinute + index * slotDuration),
  );
}

/**
 * Determine si une journee est ouverte a la reservation, et pourquoi non.
 */
export function getDayStatus(
  dateKey: string,
  rules: BusinessHoursRule[],
  now: Date = new Date(),
): { open: boolean; reason: DayUnavailableReason; rule?: BusinessHoursRule } {
  const today = todayKey(now);
  const delta = daysBetween(today, dateKey);

  if (delta < 0) return { open: false, reason: "PAST" };
  if (delta > BOOKING.maxAdvanceDays) return { open: false, reason: "TOO_FAR" };

  const rule = rules.find((item) => item.dayOfWeek === getDayOfWeek(dateKey));
  if (!rule || !rule.active) return { open: false, reason: "CLOSED" };

  return { open: true, reason: null, rule };
}

export type ComputeSlotsInput = {
  dateKey: string;
  /** Duree de la prestation choisie, en minutes */
  serviceDuration: number;
  /** Regles d'ouverture (issues de la base) */
  rules: BusinessHoursRule[];
  /** Creneaux elementaires deja pris par un rendez-vous confirme */
  bookedSlots: Set<string>;
  /** Creneaux elementaires bloques manuellement par l'administrateur */
  blockedSlots: Set<string>;
  /** Permet de figer le temps dans les tests */
  now?: Date;
  /** Cote admin, on autorise la reservation dans le passe proche et sans delai */
  ignoreLeadTime?: boolean;
};

/**
 * Calcule la disponibilite de chaque creneau d'une journee pour une prestation.
 *
 * Un creneau de depart est disponible si :
 *   1. la journee est ouverte ;
 *   2. TOUS les creneaux elementaires couverts par la prestation sont libres ;
 *   3. la prestation se termine avant (ou a) l'heure de fermeture ;
 *   4. le creneau n'est pas deja passe, et respecte le delai minimum.
 */
export function computeDaySlots(input: ComputeSlotsInput): {
  slots: SlotAvailability[];
  dayOpen: boolean;
  reason: DayUnavailableReason;
} {
  const {
    dateKey,
    serviceDuration,
    rules,
    bookedSlots,
    blockedSlots,
    now = new Date(),
    ignoreLeadTime = false,
  } = input;

  const dayStatus = getDayStatus(dateKey, rules, now);
  if (!dayStatus.open || !dayStatus.rule) {
    return { slots: [], dayOpen: false, reason: dayStatus.reason };
  }

  const { openingTime, closingTime } = dayStatus.rule;
  const slotDuration = BOOKING.slotDurationMinutes;
  const grid = generateSlotGrid(openingTime, closingTime, slotDuration);
  const closingMinute = timeToMinutes(closingTime);

  const isToday = dateKey === todayKey(now);
  const currentMinute = timeToMinutes(nowTimeKey(now));
  const leadTime = ignoreLeadTime ? 0 : BOOKING.minLeadTimeMinutes;

  const slots: SlotAvailability[] = grid.map((time) => {
    const startMinute = timeToMinutes(time);
    const endMinute = startMinute + serviceDuration;
    const endTime = addMinutesToTime(time, serviceDuration);

    // 3. La prestation doit tenir avant la fermeture.
    if (endMinute > closingMinute) {
      return { time, endTime, available: false, reason: "CLOSING" };
    }

    // 4. Ni dans le passe, ni trop proche.
    if (isToday && !ignoreLeadTime) {
      if (startMinute <= currentMinute) {
        return { time, endTime, available: false, reason: "PAST" };
      }
      if (startMinute < currentMinute + leadTime) {
        return { time, endTime, available: false, reason: "LEAD_TIME" };
      }
    }

    // 2. Tous les creneaux couverts doivent etre libres.
    const covered = occupiedSlots(time, serviceDuration, slotDuration);
    for (const slot of covered) {
      if (blockedSlots.has(slot)) {
        return { time, endTime, available: false, reason: "BLOCKED" };
      }
      if (bookedSlots.has(slot)) {
        return { time, endTime, available: false, reason: "BOOKED" };
      }
    }

    return { time, endTime, available: true };
  });

  const hasAvailable = slots.some((slot) => slot.available);
  return {
    slots,
    dayOpen: true,
    reason: hasAvailable ? null : "FULL",
  };
}

/**
 * Verifie qu'un creneau demande est bien reservable.
 * Utilise cote serveur AVANT d'ecrire en base (defense en profondeur : la
 * contrainte unique de SlotLock reste le garde-fou final).
 */
export function validateRequestedSlot(input: ComputeSlotsInput & { time: string }): {
  ok: boolean;
  reason?: SlotAvailability["reason"] | DayUnavailableReason;
  message?: string;
} {
  const { time, ...rest } = input;
  const { slots, dayOpen, reason } = computeDaySlots(rest);

  if (!dayOpen) {
    const messages: Record<string, string> = {
      CLOSED: "Le salon est ferme ce jour-la. Merci de choisir un autre jour.",
      PAST: "Cette date est deja passee. Merci de choisir une date future.",
      TOO_FAR: `Les reservations sont ouvertes jusqu'a ${BOOKING.maxAdvanceDays} jours a l'avance.`,
    };
    return {
      ok: false,
      reason,
      message: messages[reason ?? "CLOSED"] ?? "Ce jour n'est pas reservable.",
    };
  }

  const slot = slots.find((item) => item.time === time);
  if (!slot) {
    return {
      ok: false,
      reason: "CLOSING",
      message: "Cet horaire ne fait pas partie des creneaux du salon.",
    };
  }

  if (!slot.available) {
    const messages: Record<string, string> = {
      // Ce message doit rester coherent avec celui renvoye lorsque la
      // contrainte unique de la base rejette une reservation concurrente
      // (voir `createAppointment` dans booking.ts) : selon le moment exact ou
      // l'autre client valide, c'est l'un ou l'autre chemin qui repond.
      BOOKED: "Ce creneau vient d'etre reserve. Merci de choisir un autre horaire.",
      BLOCKED: "Ce creneau n'est pas disponible. Merci de choisir un autre horaire.",
      PAST: "Cet horaire est deja passe. Merci d'en choisir un autre.",
      LEAD_TIME: `Les reservations doivent etre faites au moins ${BOOKING.minLeadTimeMinutes} minutes a l'avance.`,
      CLOSING: "La prestation choisie ne peut pas se terminer avant la fermeture.",
    };
    return {
      ok: false,
      reason: slot.reason,
      message:
        messages[slot.reason ?? "BOOKED"] ?? "Ce creneau n'est plus disponible.",
    };
  }

  return { ok: true };
}
