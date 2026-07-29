/**
 * Verifie le contenu des messages envoyes au client.
 *
 * Exigence du cahier des charges : TOUS les messages doivent mentionner
 * l'adresse du salon, ainsi que la prestation et le tarif.
 */

import { describe, expect, it } from "vitest";

import { MAIN_SERVICE, SALON } from "@/lib/config";
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
  serviceName: MAIN_SERVICE.name,
  date: "2026-08-14", // un vendredi
  time: "16:00",
  duration: 30,
  price: 1500,
  reference: "KB-4TP694",
  cancellationToken: "a".repeat(43),
};

const STREET = SALON.address.street; // 19 rue des Vosges
const CITY_LINE = `${SALON.address.postalCode} ${SALON.address.city}`; // 67620 Soufflenheim

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

describe("Adresse presente dans tous les messages", () => {
  it.each(ALL_EMAILS)("e-mail de %s : version texte", (_name, message) => {
    expect(message.text).toContain(SALON.name);
    expect(message.text).toContain(STREET);
    expect(message.text).toContain(CITY_LINE);
  });

  it.each(ALL_EMAILS)("e-mail de %s : version HTML", (_name, message) => {
    expect(message.html).toContain(STREET);
    expect(message.html).toContain(CITY_LINE);
  });

  it.each(ALL_SMS)("SMS de %s", (_name, message) => {
    expect(message).toContain(SALON.name);
    expect(message).toContain(STREET);
    expect(message).toContain(CITY_LINE);
  });

  it("les SMS restent d'une longueur raisonnable", () => {
    for (const [name, message] of ALL_SMS) {
      // Un SMS long est facture en plusieurs segments : on garde une marge.
      expect(message.length, `SMS de ${name} (${message.length} caracteres)`)
        .toBeLessThanOrEqual(320);
    }
  });
});

describe("E-mail de confirmation", () => {
  const message = confirmationEmail(DATA);

  it("porte l'objet demande", () => {
    expect(message.subject).toBe(
      "Confirmation de votre rendez-vous chez Kadir Barber",
    );
  });

  it("reprend les elements attendus", () => {
    expect(message.text).toContain("Bonjour Lucas,");
    expect(message.text).toContain(
      "Votre rendez-vous chez Kadir Barber est bien confirme.",
    );
    expect(message.text).toContain("Prestation : Coupe, moustache et barbe");
    expect(message.text).toContain("Tarif : 15 €");
    expect(message.text).toContain("Date : vendredi 14 aout 2026");
    expect(message.text).toContain("Heure : 16h00");
    expect(message.text).toContain("Duree : 30 minutes");
    expect(message.text).toContain("Adresse du rendez-vous :");
    expect(message.text).toContain(
      "Merci de vous presenter quelques minutes avant l'heure prevue.",
    );
    expect(message.text).toContain("A bientot,\nKadir Barber");
  });

  it("contient le lien de gestion du rendez-vous", () => {
    expect(message.text).toContain(`/rendez-vous/${DATA.cancellationToken}`);
  });
});

describe("SMS de confirmation", () => {
  const message = confirmationSms(DATA);

  it("respecte la formulation demandee", () => {
    expect(message).toBe(
      "Bonjour Lucas, votre rendez-vous chez Kadir Barber est confirme le " +
        "vendredi 14 aout 2026 a 16h00. Tarif : 15 €. " +
        "Adresse : 19 rue des Vosges, 67620 Soufflenheim.",
    );
  });
});

describe("E-mail de rappel", () => {
  const message = reminderEmail(DATA);

  it("porte l'objet demande", () => {
    expect(message.subject).toBe(
      "Votre rendez-vous de demain chez Kadir Barber",
    );
  });

  it("reprend les elements attendus", () => {
    expect(message.text).toContain("Bonjour Lucas,");
    expect(message.text).toContain(
      "Nous vous rappelons que vous avez rendez-vous demain chez Kadir Barber.",
    );
    expect(message.text).toContain("Prestation : Coupe, moustache et barbe");
    expect(message.text).toContain("Tarif : 15 €");
    expect(message.text).toContain("Heure : 16h00");
    expect(message.text).toContain("Adresse :");
    expect(message.text).toContain("A bientot,\nKadir Barber");
  });
});

describe("SMS de rappel", () => {
  const message = reminderSms(DATA);

  it("respecte la formulation demandee", () => {
    expect(message).toBe(
      "Bonjour Lucas, rappel : votre rendez-vous chez Kadir Barber est prevu " +
        "demain a 16h00, au 19 rue des Vosges, 67620 Soufflenheim.",
    );
  });
});

describe("Affichage du tarif", () => {
  it("omet les centimes inutiles", () => {
    expect(confirmationEmail({ ...DATA, price: 1500 }).text).toContain(
      "Tarif : 15 €",
    );
  });

  it("affiche les centimes lorsqu'ils existent", () => {
    // Si le salon ajuste un jour son tarif a 17,50 €.
    const text = confirmationEmail({ ...DATA, price: 1750 }).text;
    expect(text.replace(/\s/g, " ")).toContain("Tarif : 17,50 €");
  });
});
