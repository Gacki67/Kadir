/**
 * Conversion des enregistrements Prisma en objets JSON envoyes au navigateur.
 *
 * Deux niveaux :
 *   - `serializeForAdmin` : toutes les informations, reserve a l'espace admin ;
 *   - les routes publiques n'exposent jamais que le strict necessaire.
 */

import { dateToKey } from "./datetime";

export type AdminAppointmentRecord = {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
  notes: string | null;
  cancellationToken: string;
  emailConfirmationSent: boolean;
  smsConfirmationSent: boolean;
  emailReminderSent: boolean;
  smsReminderSent: boolean;
  createdAt: Date;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  service: { id: string; name: string; duration: number; price: number };
};

export type AdminAppointment = ReturnType<typeof serializeForAdmin>;

export function serializeForAdmin(appointment: AdminAppointmentRecord) {
  return {
    id: appointment.id,
    reference: appointment.reference,
    firstName: appointment.firstName,
    lastName: appointment.lastName,
    email: appointment.email,
    phone: appointment.phone,
    date: dateToKey(appointment.appointmentDate),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    duration: appointment.duration,
    price: appointment.price,
    status: appointment.status,
    notes: appointment.notes,
    token: appointment.cancellationToken,
    emailConfirmationSent: appointment.emailConfirmationSent,
    smsConfirmationSent: appointment.smsConfirmationSent,
    emailReminderSent: appointment.emailReminderSent,
    smsReminderSent: appointment.smsReminderSent,
    createdAt: appointment.createdAt.toISOString(),
    cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
    cancelledBy: appointment.cancelledBy,
    service: appointment.service,
  };
}

/** Champs a inclure dans les requetes Prisma cote admin. */
export const ADMIN_APPOINTMENT_INCLUDE = {
  service: { select: { id: true, name: true, duration: true, price: true } },
} as const;
