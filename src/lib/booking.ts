/**
 * Couche metier de la reservation.
 *
 * C'est ici que se trouve la garantie anti double reservation :
 *   - une verification applicative (rapide, avec un message clair) ;
 *   - PUIS une ecriture atomique des verrous SlotLock, proteges par un index
 *     unique (date, time) en base.
 *
 * Si deux clients confirment le meme creneau exactement au meme instant, la
 * base rejette la seconde ecriture (erreur Prisma P2002) : une seule
 * reservation est acceptee, l'autre recoit un message l'invitant a choisir un
 * autre horaire. Aucune fenetre de concurrence n'est possible.
 */

import { randomBytes } from "node:crypto";
import { Prisma, type Service } from "@prisma/client";

import { BOOKING } from "./config";
import { prisma } from "./prisma";
import {
  addMinutesToTime,
  dateToKey,
  keyToDate,
  parisToUtc,
  timeToMinutes,
} from "./datetime";
import {
  type BusinessHoursRule,
  computeDaySlots,
  occupiedSlots,
  validateRequestedSlot,
} from "./availability";

/* -------------------------------------------------------------------------- */
/*  Erreurs metier                                                              */
/* -------------------------------------------------------------------------- */

export type BookingErrorCode =
  | "SLOT_TAKEN"
  | "SLOT_INVALID"
  | "SERVICE_NOT_FOUND"
  | "APPOINTMENT_NOT_FOUND"
  | "ALREADY_CANCELLED"
  | "TOO_LATE"
  | "PAST_APPOINTMENT";

export class BookingError extends Error {
  constructor(
    public code: BookingErrorCode,
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Identifiants                                                                */
/* -------------------------------------------------------------------------- */

/** Reference lisible communiquee au client, ex. "ER-7F3A2C". */
export function generateReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I, O, 0, 1
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `ER-${code}`;
}

/** Jeton d'acces client : 256 bits d'entropie, impossible a deviner. */
export function generateCancellationToken(): string {
  return randomBytes(32).toString("base64url");
}

/* -------------------------------------------------------------------------- */
/*  Lecture des regles et de l'occupation                                       */
/* -------------------------------------------------------------------------- */

/** Horaires d'ouverture depuis la base, avec repli sur la configuration. */
export async function getBusinessRules(): Promise<BusinessHoursRule[]> {
  const rows = await prisma.businessHours.findMany({
    orderBy: { dayOfWeek: "asc" },
  });

  if (rows.length === 0) {
    return BOOKING.defaultBusinessHours.map((rule) => ({ ...rule }));
  }

  return rows.map((row) => ({
    dayOfWeek: row.dayOfWeek,
    openingTime: row.openingTime,
    closingTime: row.closingTime,
    active: row.active,
  }));
}

export type DayOccupancy = {
  booked: Set<string>;
  blocked: Set<string>;
};

/** Creneaux elementaires occupes un jour donne. */
export async function getDayOccupancy(dateKey: string): Promise<DayOccupancy> {
  const locks = await prisma.slotLock.findMany({
    where: { date: keyToDate(dateKey) },
    select: { time: true, appointmentId: true, blockedSlotId: true },
  });

  const booked = new Set<string>();
  const blocked = new Set<string>();

  for (const lock of locks) {
    if (lock.blockedSlotId) blocked.add(lock.time);
    else if (lock.appointmentId) booked.add(lock.time);
  }

  return { booked, blocked };
}

/** Occupation sur une plage de jours — utilise par le calendrier mensuel. */
export async function getRangeOccupancy(
  fromKey: string,
  toKey: string,
): Promise<Map<string, DayOccupancy>> {
  const locks = await prisma.slotLock.findMany({
    where: {
      date: { gte: keyToDate(fromKey), lte: keyToDate(toKey) },
    },
    select: {
      date: true,
      time: true,
      appointmentId: true,
      blockedSlotId: true,
    },
  });

  const result = new Map<string, DayOccupancy>();
  for (const lock of locks) {
    const key = dateToKey(lock.date);
    let entry = result.get(key);
    if (!entry) {
      entry = { booked: new Set(), blocked: new Set() };
      result.set(key, entry);
    }
    if (lock.blockedSlotId) entry.blocked.add(lock.time);
    else if (lock.appointmentId) entry.booked.add(lock.time);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/*  Disponibilites                                                              */
/* -------------------------------------------------------------------------- */

/** Creneaux d'une journee pour une prestation donnee. */
export async function getAvailability(
  dateKey: string,
  service: Pick<Service, "duration">,
  options: { ignoreLeadTime?: boolean; excludeAppointmentId?: string } = {},
) {
  const [rules, occupancy] = await Promise.all([
    getBusinessRules(),
    getDayOccupancy(dateKey),
  ]);

  // Lors d'un deplacement de RDV, ses propres creneaux ne doivent pas
  // apparaitre comme occupes.
  if (options.excludeAppointmentId) {
    const ownLocks = await prisma.slotLock.findMany({
      where: {
        date: keyToDate(dateKey),
        appointmentId: options.excludeAppointmentId,
      },
      select: { time: true },
    });
    for (const lock of ownLocks) occupancy.booked.delete(lock.time);
  }

  return computeDaySlots({
    dateKey,
    serviceDuration: service.duration,
    rules,
    bookedSlots: occupancy.booked,
    blockedSlots: occupancy.blocked,
    ignoreLeadTime: options.ignoreLeadTime,
  });
}

/* -------------------------------------------------------------------------- */
/*  Creation d'un rendez-vous                                                   */
/* -------------------------------------------------------------------------- */

export type CreateAppointmentParams = {
  firstName: string;
  lastName: string;
  email: string;
  /** Format E.164 */
  phone: string;
  serviceId: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" */
  time: string;
  notes?: string;
  /** Compte client rattache, si la reservation vient d'un client connecte */
  customerId?: string;
  /** Cote admin : autorise a passer outre le delai minimum de reservation */
  ignoreLeadTime?: boolean;
};

/**
 * Cree un rendez-vous et verrouille les creneaux correspondants, de facon
 * atomique. Leve une BookingError si le creneau n'est pas (ou plus) libre.
 */
export async function createAppointment(params: CreateAppointmentParams) {
  const service = await prisma.service.findUnique({
    where: { id: params.serviceId },
  });

  if (!service || !service.active) {
    throw new BookingError(
      "SERVICE_NOT_FOUND",
      "La prestation choisie n'est plus disponible.",
      404,
    );
  }

  if (!service.bookableOnline) {
    throw new BookingError(
      "SERVICE_NOT_FOUND",
      "Cette prestation ne peut pas etre reservee en ligne. Merci d'appeler le salon.",
      409,
    );
  }

  // 1. Verification applicative (message clair pour l'utilisateur).
  const [rules, occupancy] = await Promise.all([
    getBusinessRules(),
    getDayOccupancy(params.date),
  ]);

  const check = validateRequestedSlot({
    dateKey: params.date,
    time: params.time,
    serviceDuration: service.duration,
    rules,
    bookedSlots: occupancy.booked,
    blockedSlots: occupancy.blocked,
    ignoreLeadTime: params.ignoreLeadTime,
  });

  if (!check.ok) {
    throw new BookingError(
      check.reason === "BOOKED" || check.reason === "BLOCKED"
        ? "SLOT_TAKEN"
        : "SLOT_INVALID",
      check.message ?? "Ce creneau n'est pas disponible.",
      409,
    );
  }

  const endTime = addMinutesToTime(params.time, service.duration);
  const slots = occupiedSlots(params.time, service.duration);
  const dateValue = keyToDate(params.date);

  // 2. Ecriture atomique : l'appointment et TOUS ses verrous, ou rien.
  try {
    return await prisma.appointment.create({
      data: {
        reference: generateReference(),
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        phone: params.phone,
        customerId: params.customerId,
        serviceId: service.id,
        appointmentDate: dateValue,
        startTime: params.time,
        endTime,
        duration: service.duration,
        price: service.price,
        notes: params.notes,
        status: "CONFIRMED",
        cancellationToken: generateCancellationToken(),
        privacyAcceptedAt: new Date(),
        slotLocks: {
          create: slots.map((time) => ({ date: dateValue, time })),
        },
      },
      include: { service: true },
    });
  } catch (error) {
    // P2002 = violation de contrainte unique : quelqu'un a reserve entre notre
    // verification et notre ecriture. C'est exactement le cas que l'on protege.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BookingError(
        "SLOT_TAKEN",
        "Ce creneau vient d'etre reserve par un autre client. Merci de choisir un autre horaire.",
        409,
      );
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*  Annulation                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Annule un rendez-vous et libere ses creneaux.
 * Le rendez-vous est conserve en base avec le statut CANCELLED (historique),
 * mais ses verrous sont supprimes : le creneau redevient reservable.
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelledBy: "CLIENT" | "ADMIN",
) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true },
    });

    if (!appointment) {
      throw new BookingError(
        "APPOINTMENT_NOT_FOUND",
        "Ce rendez-vous est introuvable.",
        404,
      );
    }

    if (appointment.status === "CANCELLED") {
      throw new BookingError(
        "ALREADY_CANCELLED",
        "Ce rendez-vous a deja ete annule.",
        409,
      );
    }

    // Liberation des creneaux.
    await tx.slotLock.deleteMany({ where: { appointmentId } });

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy,
      },
      include: { service: true },
    });
  });
}

/**
 * Verifie qu'un client a encore le droit d'annuler lui-meme.
 * Le delai est configurable dans `BOOKING.cancellationCutoffHours`.
 */
export function assertClientCanModify(appointment: {
  appointmentDate: Date;
  startTime: string;
  status: string;
}): void {
  if (appointment.status === "CANCELLED") {
    throw new BookingError(
      "ALREADY_CANCELLED",
      "Ce rendez-vous a deja ete annule.",
      409,
    );
  }

  const startsAt = parisToUtc(
    dateToKey(appointment.appointmentDate),
    appointment.startTime,
  );
  const hoursUntil = (startsAt.getTime() - Date.now()) / 3_600_000;

  if (hoursUntil < 0) {
    throw new BookingError(
      "PAST_APPOINTMENT",
      "Ce rendez-vous est deja passe.",
      409,
    );
  }

  if (hoursUntil < BOOKING.cancellationCutoffHours) {
    throw new BookingError(
      "TOO_LATE",
      `Les modifications en ligne ne sont plus possibles moins de ${BOOKING.cancellationCutoffHours} h avant le rendez-vous. Merci de contacter directement le salon.`,
      409,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Deplacement d'un rendez-vous                                                */
/* -------------------------------------------------------------------------- */

export type RescheduleParams = {
  appointmentId: string;
  date: string;
  time: string;
  /** Permet de changer aussi de prestation (cote admin) */
  serviceId?: string;
  ignoreLeadTime?: boolean;
};

/**
 * Deplace un rendez-vous vers un nouveau creneau, de facon atomique :
 * les anciens verrous sont liberes et les nouveaux poses dans la meme
 * transaction. En cas de conflit, rien n'est modifie.
 */
export async function rescheduleAppointment(params: RescheduleParams) {
  const existing = await prisma.appointment.findUnique({
    where: { id: params.appointmentId },
    include: { service: true },
  });

  if (!existing) {
    throw new BookingError(
      "APPOINTMENT_NOT_FOUND",
      "Ce rendez-vous est introuvable.",
      404,
    );
  }
  if (existing.status === "CANCELLED") {
    throw new BookingError(
      "ALREADY_CANCELLED",
      "Ce rendez-vous a ete annule : il ne peut plus etre deplace.",
      409,
    );
  }

  const service = params.serviceId
    ? await prisma.service.findUnique({ where: { id: params.serviceId } })
    : existing.service;

  if (!service) {
    throw new BookingError(
      "SERVICE_NOT_FOUND",
      "La prestation choisie est introuvable.",
      404,
    );
  }

  // Verification applicative en ignorant les creneaux du RDV lui-meme.
  const [rules, occupancy] = await Promise.all([
    getBusinessRules(),
    getDayOccupancy(params.date),
  ]);

  const ownLocks = await prisma.slotLock.findMany({
    where: {
      date: keyToDate(params.date),
      appointmentId: params.appointmentId,
    },
    select: { time: true },
  });
  for (const lock of ownLocks) occupancy.booked.delete(lock.time);

  const check = validateRequestedSlot({
    dateKey: params.date,
    time: params.time,
    serviceDuration: service.duration,
    rules,
    bookedSlots: occupancy.booked,
    blockedSlots: occupancy.blocked,
    ignoreLeadTime: params.ignoreLeadTime,
  });

  if (!check.ok) {
    throw new BookingError(
      check.reason === "BOOKED" || check.reason === "BLOCKED"
        ? "SLOT_TAKEN"
        : "SLOT_INVALID",
      check.message ?? "Ce creneau n'est pas disponible.",
      409,
    );
  }

  const endTime = addMinutesToTime(params.time, service.duration);
  const slots = occupiedSlots(params.time, service.duration);
  const dateValue = keyToDate(params.date);

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.slotLock.deleteMany({
        where: { appointmentId: params.appointmentId },
      });

      await tx.slotLock.createMany({
        data: slots.map((time) => ({
          date: dateValue,
          time,
          appointmentId: params.appointmentId,
        })),
      });

      return tx.appointment.update({
        where: { id: params.appointmentId },
        data: {
          appointmentDate: dateValue,
          startTime: params.time,
          endTime,
          serviceId: service.id,
          duration: service.duration,
          price: service.price,
          // Le rendez-vous ayant change, les rappels doivent repartir a zero.
          emailReminderSent: false,
          smsReminderSent: false,
          reminderSentAt: null,
        },
        include: { service: true },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BookingError(
        "SLOT_TAKEN",
        "Ce creneau vient d'etre reserve. Merci de choisir un autre horaire.",
        409,
      );
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*  Blocages administrateur                                                     */
/* -------------------------------------------------------------------------- */

export type BlockSlotsParams = {
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  wholeDay: boolean;
};

/**
 * Bloque des creneaux. Les creneaux deja occupes par un rendez-vous ne sont pas
 * bloques : ils sont signales dans `conflicts` pour que l'administrateur puisse
 * decider de les annuler d'abord.
 */
export async function blockSlots(params: BlockSlotsParams): Promise<{
  blockedCount: number;
  conflicts: string[];
}> {
  const rules = await getBusinessRules();
  const rule = rules.find(
    (item) =>
      item.dayOfWeek ===
      new Date(`${params.date}T00:00:00.000Z`).getUTCDay(),
  );

  // Pour une journee entiere, on couvre l'amplitude d'ouverture. Si le jour est
  // ferme, on utilise une amplitude large par securite.
  const start = params.wholeDay
    ? (rule?.openingTime ?? "00:00")
    : (params.startTime as string);
  const end = params.wholeDay
    ? (rule?.closingTime ?? "23:30")
    : (params.endTime as string);

  const slotDuration = BOOKING.slotDurationMinutes;
  const startMinute = timeToMinutes(start);
  const endMinute = timeToMinutes(end);

  const times: string[] = [];
  for (let minute = startMinute; minute < endMinute; minute += slotDuration) {
    times.push(
      `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
    );
  }

  const dateValue = keyToDate(params.date);
  const occupancy = await getDayOccupancy(params.date);

  const conflicts = times.filter((time) => occupancy.booked.has(time));
  const free = times.filter(
    (time) => !occupancy.booked.has(time) && !occupancy.blocked.has(time),
  );

  if (free.length === 0) {
    return { blockedCount: 0, conflicts };
  }

  await prisma.blockedSlot.create({
    data: {
      date: dateValue,
      startTime: start,
      endTime: end,
      reason: params.reason,
      wholeDay: params.wholeDay,
      slotLocks: {
        create: free.map((time) => ({ date: dateValue, time })),
      },
    },
  });

  return { blockedCount: free.length, conflicts };
}

/** Supprime un blocage : les verrous associes disparaissent en cascade. */
export async function unblockSlots(blockedSlotId: string): Promise<void> {
  await prisma.blockedSlot.delete({ where: { id: blockedSlotId } });
}
