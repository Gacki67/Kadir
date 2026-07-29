/**
 * Orchestration des notifications.
 *
 * Chaque fonction envoie l'e-mail et le SMS, puis met a jour les indicateurs
 * correspondants en base (emailConfirmationSent, smsReminderSent, ...).
 * Aucune de ces fonctions ne leve d'exception : un incident d'envoi ne doit
 * jamais faire echouer ni annuler un rendez-vous.
 */

import type { Appointment, Service } from "@prisma/client";

import { prisma } from "../prisma";
import { dateToKey } from "../datetime";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import {
  type AppointmentMessageData,
  cancellationEmail,
  cancellationSms,
  confirmationEmail,
  confirmationSms,
  reminderEmail,
  reminderSms,
  rescheduleEmail,
  rescheduleSms,
} from "./templates";

export type AppointmentWithService = Appointment & { service: Service };

export function toMessageData(
  appointment: AppointmentWithService,
): AppointmentMessageData {
  return {
    firstName: appointment.firstName,
    lastName: appointment.lastName,
    serviceName: appointment.service.name,
    date: dateToKey(appointment.appointmentDate),
    time: appointment.startTime,
    duration: appointment.duration,
    reference: appointment.reference,
    cancellationToken: appointment.cancellationToken,
  };
}

export type NotificationOutcome = {
  email: boolean;
  sms: boolean;
};

/**
 * Confirmation de reservation (e-mail + SMS).
 * Met a jour emailConfirmationSent / smsConfirmationSent.
 */
export async function sendConfirmation(
  appointment: AppointmentWithService,
): Promise<NotificationOutcome> {
  const data = toMessageData(appointment);

  const [emailResult, smsResult] = await Promise.all([
    sendEmail({ to: appointment.email, ...confirmationEmail(data) }),
    sendSms({ to: appointment.phone, message: confirmationSms(data) }),
  ]);

  try {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        emailConfirmationSent: emailResult.sent,
        smsConfirmationSent: smsResult.sent,
      },
    });
  } catch (error) {
    console.error(
      "[notifications] Impossible d'enregistrer l'etat de confirmation :",
      error,
    );
  }

  return { email: emailResult.sent, sms: smsResult.sent };
}

/**
 * Rappel 24 h avant.
 * Les indicateurs sont mis a jour de facon a ne jamais envoyer deux fois.
 */
export async function sendReminder(
  appointment: AppointmentWithService,
): Promise<NotificationOutcome> {
  const data = toMessageData(appointment);

  const [emailResult, smsResult] = await Promise.all([
    appointment.emailReminderSent
      ? Promise.resolve({ sent: true, provider: "skipped" })
      : sendEmail({ to: appointment.email, ...reminderEmail(data) }),
    appointment.smsReminderSent
      ? Promise.resolve({ sent: true, provider: "skipped" })
      : sendSms({ to: appointment.phone, message: reminderSms(data) }),
  ]);

  try {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        emailReminderSent: appointment.emailReminderSent || emailResult.sent,
        smsReminderSent: appointment.smsReminderSent || smsResult.sent,
        reminderSentAt: new Date(),
      },
    });
  } catch (error) {
    console.error(
      "[notifications] Impossible d'enregistrer l'etat du rappel :",
      error,
    );
  }

  return { email: emailResult.sent, sms: smsResult.sent };
}

/** Notification d'annulation. */
export async function sendCancellation(
  appointment: AppointmentWithService,
): Promise<NotificationOutcome> {
  const data = toMessageData(appointment);

  const [emailResult, smsResult] = await Promise.all([
    sendEmail({ to: appointment.email, ...cancellationEmail(data) }),
    sendSms({ to: appointment.phone, message: cancellationSms(data) }),
  ]);

  return { email: emailResult.sent, sms: smsResult.sent };
}

/** Notification de deplacement du rendez-vous. */
export async function sendReschedule(
  appointment: AppointmentWithService,
): Promise<NotificationOutcome> {
  const data = toMessageData(appointment);

  const [emailResult, smsResult] = await Promise.all([
    sendEmail({ to: appointment.email, ...rescheduleEmail(data) }),
    sendSms({ to: appointment.phone, message: rescheduleSms(data) }),
  ]);

  return { email: emailResult.sent, sms: smsResult.sent };
}

export { getEmailProvider } from "./email";
export { getSmsProvider } from "./sms";
