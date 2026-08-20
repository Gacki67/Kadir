/**
 * Verifie le contenu des messages envoyes au client.
 *
 * Chaque message doit mentionner le salon, la prestation, le tarif et un moyen
 * de contact (le telephone du salon).
 */

import { describe, expect, it } from "vitest";

import { SALON, getPhoneDisplay } from "@/lib/config";
import {
  cancellationEmail,
  cancellationSms,
  confirmationEmail,
  confirmationSms,
  reminderEmail,
  reminderSms,
  rescheduleEmail,
  rescheduleSms,
  type AppointmentMessageData,
} from "@/lib/notifications/templates";

const DATA: AppointmentMessageData = {
  firstName: "Lucas",
  lastName: "Martin",
  serviceName: "Coupe + barbe (rasoir)",
  date: "2026-08-14", // un vendredi
  time: "16:00",
  duration: 45,
  price: 3500,
  reference: "ER-4TP694",
  cancellationToken: "a".repeat(43),
};

const PHONE = getPhoneDisplay();
// Dans le HTML, l'apostrophe de "L'Espace" est echappee (&#39;) : on verifie
// donc un fragment stable du nom, present avant comme apres echappement.
const BRAND_FRAGMENT = "Espace de Rayan";

/** Tous les messages e-mail, sous forme de paires (nom, contenu). */
const ALL_EMAILS = [
  ["confirmation", confirmationEmail(DATA)],
  ["rappel", reminderEmail(DATA)],
  ["annulation", cancellationEmail(DATA)],
  ["modification", rescheduleEmail(DATA)],
] as const;

const ALL_SMS = [
  ["confirmation", confirmationSms(DATA)],
  ["rappel", reminderSms(DATA)],
  ["annulation", cancellationSms(DATA)],
  ["modification", rescheduleSms(DATA)],
] as const;

describe("Salon et contact presents dans les messages", () => {
  it.each(ALL_EMAILS)("e-mail de %s : nom du salon (texte + HTML)", (_name, message) => {
    expect(message.text).toContain(SALON.name);
    expect(message.html).toContain(BRAND_FRAGMENT);
  });

  it.each(ALL_SMS)("SMS de %s : nom du salon", (_name, message) => {
    expect(message).toContain(SALON.name);
  });

  it("le telephone du salon apparait dans la confirmation", () => {
    expect(confirmationEmail(DATA).text).toContain(PHONE);
    expect(confirmationSms(DATA)).toContain(PHONE);
  });

  it("les SMS restent d'une longueur raisonnable", () => {
    for (const [name, message] of ALL_SMS) {
      expect(message.length, `SMS de ${name} (${message.length} caracteres)`)
        .toBeLessThanOrEqual(320);
    }
  });
});

describe("E-mail de confirmation", () => {
  const message = confirmationEmail(DATA);

  it("porte l'objet demande", () => {
    expect(message.subject).toBe(
      `Confirmation de votre rendez-vous chez ${SALON.name}`,
    );
  });

  it("reprend les elements attendus", () => {
    expect(message.text).toContain("Bonjour Lucas,");
    expect(message.text).toContain(
      `Votre rendez-vous chez ${SALON.name} est bien confirme.`,
    );
    expect(message.text).toContain("Prestation : Coupe + barbe (rasoir)");
    expect(message.text).toContain("Tarif : 35 €");
    expect(message.text).toContain("Date : vendredi 14 aout 2026");
    expect(message.text).toContain("Heure : 16h00");
    expect(message.text).toContain("Duree : 45 minutes");
    expect(message.text).toContain(`A bientot,\n${SALON.name}`);
  });

  it("contient le lien de gestion du rendez-vous", () => {
    expect(message.text).toContain(`/rendez-vous/${DATA.cancellationToken}`);
  });
});

describe("SMS de confirmation", () => {
  const message = confirmationSms(DATA);

  it("mentionne le salon, la date, l'heure et le tarif", () => {
    expect(message).toContain(SALON.name);
    expect(message).toContain("vendredi 14 aout 2026 a 16h00");
    expect(message).toContain("Tarif : 35 €");
  });
});

describe("Affichage du tarif", () => {
  it("omet les centimes inutiles", () => {
    expect(confirmationEmail({ ...DATA, price: 1500 }).text).toContain(
      "Tarif : 15 €",
    );
  });

  it("affiche les centimes lorsqu'ils existent", () => {
    const text = confirmationEmail({ ...DATA, price: 1750 }).text;
    expect(text.replace(/\s/g, " ")).toContain("Tarif : 17,50 €");
  });
});
