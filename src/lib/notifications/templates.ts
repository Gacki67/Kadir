/**
 * Modeles de messages (e-mail et SMS).
 * Les textes sont conformes a ceux demandes au cahier des charges et peuvent
 * etre modifies librement ici.
 */

import { SALON, getFullAddress, getSiteUrl } from "../config";
import {
  formatDuration,
  formatFrenchDate,
  formatFrenchTime,
} from "../datetime";

export type AppointmentMessageData = {
  firstName: string;
  lastName: string;
  serviceName: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" */
  time: string;
  /** en minutes */
  duration: number;
  reference: string;
  cancellationToken: string;
};

export function getManageUrl(token: string): string {
  return `${getSiteUrl()}/rendez-vous/${token}`;
}

/* -------------------------------------------------------------------------- */
/*  Mise en page HTML commune                                                   */
/* -------------------------------------------------------------------------- */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#17171b;border-radius:16px;overflow:hidden;border:1px solid #2a2a31;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #2a2a31;">
              <div style="font-size:24px;font-weight:700;letter-spacing:2px;color:#d4af4f;text-transform:uppercase;">${escapeHtml(SALON.name)}</div>
              <div style="font-size:12px;color:#5c5c68;letter-spacing:3px;text-transform:uppercase;margin-top:6px;">Barbier &amp; Coiffeur</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#e8e8ea;font-size:15px;line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;border-top:1px solid #2a2a31;color:#5c5c68;font-size:12px;line-height:1.6;text-align:center;">
              <div style="color:#8a8a96;">${escapeHtml(SALON.name)}</div>
              <div>${escapeHtml(getFullAddress())}</div>
              <div>${escapeHtml(SALON.phone)} &middot; ${escapeHtml(SALON.email)}</div>
              <div style="margin-top:14px;color:#4a4a55;">
                Vos coordonnees sont utilisees uniquement pour gerer et vous rappeler ce rendez-vous.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailsTable(data: AppointmentMessageData): string {
  const rows: Array<[string, string]> = [
    ["Prestation", data.serviceName],
    ["Date", formatFrenchDate(data.date)],
    ["Heure", formatFrenchTime(data.time)],
    ["Duree", formatDuration(data.duration)],
    ["Reference", data.reference],
  ];

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#0d0d0f;border:1px solid #2a2a31;border-radius:12px;">
    ${rows
      .map(
        ([label, value], index) => `<tr>
      <td style="padding:12px 18px;color:#8a8a96;font-size:13px;${index > 0 ? "border-top:1px solid #212127;" : ""}">${escapeHtml(label)}</td>
      <td style="padding:12px 18px;color:#ffffff;font-size:14px;font-weight:600;text-align:right;${index > 0 ? "border-top:1px solid #212127;" : ""}">${escapeHtml(value)}</td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 0;">
    <tr><td style="border-radius:999px;background:linear-gradient(135deg,#e0c274 0%,#d4af4f 45%,#a87c27 100%);">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 30px;font-size:14px;font-weight:700;color:#0d0d0f;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

/* -------------------------------------------------------------------------- */
/*  Confirmation                                                                */
/* -------------------------------------------------------------------------- */

export function confirmationEmail(data: AppointmentMessageData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Confirmation de votre rendez-vous chez ${SALON.name}`;
  const manageUrl = getManageUrl(data.cancellationToken);

  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 16px;">Bonjour ${escapeHtml(data.firstName)},</p>
     <p style="margin:0 0 8px;">Votre rendez-vous chez ${escapeHtml(SALON.name)} est bien confirme.</p>
     ${detailsTable(data)}
     <p style="margin:0 0 16px;">Merci de vous presenter quelques minutes avant l'heure prevue.</p>
     <p style="margin:0 0 20px;">Pour toute modification ou annulation, veuillez utiliser le lien ci-dessous ou contacter directement le salon au ${escapeHtml(SALON.phone)}.</p>
     ${button("Gerer mon rendez-vous", manageUrl)}
     <p style="margin:24px 0 0;color:#8a8a96;font-size:13px;">A bientot,<br>${escapeHtml(SALON.name)}</p>`,
  );

  const text = `Bonjour ${data.firstName},

Votre rendez-vous chez ${SALON.name} est bien confirme.

Prestation : ${data.serviceName}
Date : ${formatFrenchDate(data.date)}
Heure : ${formatFrenchTime(data.time)}
Duree : ${formatDuration(data.duration)}
Reference : ${data.reference}

Merci de vous presenter quelques minutes avant l'heure prevue.

Pour toute modification ou annulation, veuillez utiliser le lien ci-dessous ou contacter directement le salon.
${manageUrl}

Adresse : ${getFullAddress()}
Telephone : ${SALON.phone}

A bientot,
${SALON.name}`;

  return { subject, html, text };
}

export function confirmationSms(data: AppointmentMessageData): string {
  return `Bonjour ${data.firstName}, votre rendez-vous chez ${SALON.name} est confirme le ${formatFrenchDate(data.date)} a ${formatFrenchTime(data.time)}. A bientot.`;
}

/* -------------------------------------------------------------------------- */
/*  Rappel 24 h avant                                                           */
/* -------------------------------------------------------------------------- */

export function reminderEmail(data: AppointmentMessageData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Rappel de votre rendez-vous chez ${SALON.name}`;
  const manageUrl = getManageUrl(data.cancellationToken);

  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 16px;">Bonjour ${escapeHtml(data.firstName)},</p>
     <p style="margin:0 0 8px;">Nous vous rappelons que vous avez rendez-vous demain chez ${escapeHtml(SALON.name)}.</p>
     ${detailsTable(data)}
     ${button("Voir mon rendez-vous", manageUrl)}
     <p style="margin:24px 0 0;color:#8a8a96;font-size:13px;">A bientot,<br>${escapeHtml(SALON.name)}</p>`,
  );

  const text = `Bonjour ${data.firstName},

Nous vous rappelons que vous avez rendez-vous demain chez ${SALON.name}.

Prestation : ${data.serviceName}
Date : ${formatFrenchDate(data.date)}
Heure : ${formatFrenchTime(data.time)}

Gerer mon rendez-vous : ${manageUrl}

A bientot,
${SALON.name}`;

  return { subject, html, text };
}

export function reminderSms(data: AppointmentMessageData): string {
  return `Bonjour ${data.firstName}, rappel : vous avez rendez-vous demain a ${formatFrenchTime(data.time)} chez ${SALON.name}. A bientot.`;
}

/* -------------------------------------------------------------------------- */
/*  Annulation                                                                  */
/* -------------------------------------------------------------------------- */

export function cancellationEmail(data: AppointmentMessageData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Annulation de votre rendez-vous chez ${SALON.name}`;

  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 16px;">Bonjour ${escapeHtml(data.firstName)},</p>
     <p style="margin:0 0 8px;">Votre rendez-vous chez ${escapeHtml(SALON.name)} a bien ete annule.</p>
     ${detailsTable(data)}
     <p style="margin:0 0 20px;">Vous pouvez reserver un nouveau creneau a tout moment sur notre site.</p>
     ${button("Reserver un nouveau rendez-vous", `${getSiteUrl()}/reservation`)}
     <p style="margin:24px 0 0;color:#8a8a96;font-size:13px;">A bientot,<br>${escapeHtml(SALON.name)}</p>`,
  );

  const text = `Bonjour ${data.firstName},

Votre rendez-vous chez ${SALON.name} du ${formatFrenchDate(data.date)} a ${formatFrenchTime(data.time)} a bien ete annule.

Vous pouvez reserver un nouveau creneau a tout moment : ${getSiteUrl()}/reservation

A bientot,
${SALON.name}`;

  return { subject, html, text };
}

export function cancellationSms(data: AppointmentMessageData): string {
  return `Bonjour ${data.firstName}, votre rendez-vous du ${formatFrenchDate(data.date)} a ${formatFrenchTime(data.time)} chez ${SALON.name} a bien ete annule.`;
}

/* -------------------------------------------------------------------------- */
/*  Modification (nouveau creneau)                                              */
/* -------------------------------------------------------------------------- */

export function rescheduleEmail(data: AppointmentMessageData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Votre rendez-vous chez ${SALON.name} a ete modifie`;
  const manageUrl = getManageUrl(data.cancellationToken);

  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 16px;">Bonjour ${escapeHtml(data.firstName)},</p>
     <p style="margin:0 0 8px;">Votre rendez-vous chez ${escapeHtml(SALON.name)} a bien ete deplace. Voici les nouvelles informations :</p>
     ${detailsTable(data)}
     ${button("Gerer mon rendez-vous", manageUrl)}
     <p style="margin:24px 0 0;color:#8a8a96;font-size:13px;">A bientot,<br>${escapeHtml(SALON.name)}</p>`,
  );

  const text = `Bonjour ${data.firstName},

Votre rendez-vous chez ${SALON.name} a bien ete deplace.

Prestation : ${data.serviceName}
Date : ${formatFrenchDate(data.date)}
Heure : ${formatFrenchTime(data.time)}
Duree : ${formatDuration(data.duration)}

Gerer mon rendez-vous : ${manageUrl}

A bientot,
${SALON.name}`;

  return { subject, html, text };
}

export function rescheduleSms(data: AppointmentMessageData): string {
  return `Bonjour ${data.firstName}, votre rendez-vous chez ${SALON.name} est deplace au ${formatFrenchDate(data.date)} a ${formatFrenchTime(data.time)}. A bientot.`;
}
