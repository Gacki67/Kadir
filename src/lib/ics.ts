/**
 * Generation d'un fichier calendrier (.ics) conforme a la RFC 5545.
 * Permet au client d'ajouter son rendez-vous a Google Agenda, Apple Calendrier,
 * Outlook, etc. depuis la page de confirmation.
 */

import { SALON, getFullAddress } from "./config";
import { formatDuration, parisToUtc } from "./datetime";

export type IcsInput = {
  uid: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
  serviceName: string;
  duration: number;
  reference: string;
  manageUrl: string;
};

/** Formate un instant en UTC au format ICS : 20260729T143000Z */
function toIcsUtc(instant: Date): string {
  return `${instant.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/** Echappe les caracteres speciaux ICS. */
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Replie les lignes a 75 octets, comme l'exige la specification. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 74) {
    chunks.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }
  if (remaining.length > 0) chunks.push(` ${remaining}`);
  return chunks.join("\r\n");
}

export function buildIcs(input: IcsInput): string {
  const start = parisToUtc(input.date, input.startTime);
  // Une prestation peut se terminer a "24:00" : on retombe sur 00:00 du jour suivant.
  const end =
    input.endTime === "24:00"
      ? new Date(parisToUtc(input.date, "00:00").getTime() + 24 * 3600 * 1000)
      : parisToUtc(input.date, input.endTime);

  const description = [
    `Prestation : ${input.serviceName}`,
    `Duree : ${formatDuration(input.duration)}`,
    `Reference : ${input.reference}`,
    "",
    `Gerer mon rendez-vous : ${input.manageUrl}`,
    `Telephone du salon : ${SALON.phone}`,
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SALON.name}//Reservation//FR`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(`${input.serviceName} — ${SALON.name}`)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(getFullAddress())}`,
    `URL:${escapeIcs(input.manageUrl)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(`Rendez-vous chez ${SALON.name} dans 2 heures`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
