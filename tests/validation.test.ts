import { describe, expect, it } from "vitest";

import {
  createAppointmentSchema,
  customerFormSchema,
  formatPhoneForDisplay,
  normalizePhone,
} from "@/lib/validation";

describe("normalizePhone", () => {
  it("accepte les formats francais courants", () => {
    const expected = "+33612345678";
    for (const input of [
      "0612345678",
      "06 12 34 56 78",
      "06.12.34.56.78",
      "06-12-34-56-78",
      "+33612345678",
      "+33 6 12 34 56 78",
      "0033612345678",
      "(+33) 6 12 34 56 78",
    ]) {
      expect(normalizePhone(input), `entree : ${input}`).toBe(expected);
    }
  });

  it("accepte un numero fixe", () => {
    expect(normalizePhone("01 42 00 00 00")).toBe("+33142000000");
  });

  it("accepte un numero international plausible", () => {
    expect(normalizePhone("+32470123456")).toBe("+32470123456");
  });

  it("rejette les numeros invalides", () => {
    for (const input of [
      "0612345",        // trop court
      "061234567890",   // trop long
      "abcdefghij",     // pas de chiffres
      "",
      "0012",
      "0012345678",     // ne commence pas par 0X avec X entre 1 et 9
    ]) {
      expect(normalizePhone(input), `entree : ${input}`).toBeNull();
    }
  });

  it("reaffiche un numero francais lisiblement", () => {
    expect(formatPhoneForDisplay("+33612345678")).toBe("06 12 34 56 78");
  });
});

describe("customerFormSchema", () => {
  const valid = {
    firstName: "Lucas",
    lastName: "Martin",
    email: "lucas.martin@exemple.fr",
    phone: "06 12 34 56 78",
    privacyAccepted: true as const,
  };

  it("accepte des coordonnees completes", () => {
    expect(customerFormSchema.safeParse(valid).success).toBe(true);
  });

  it("accepte les noms composes et accentues", () => {
    for (const name of ["Jean-Pierre", "Émile", "O'Brien", "Léa-Marie"]) {
      const result = customerFormSchema.safeParse({ ...valid, firstName: name });
      expect(result.success, `nom : ${name}`).toBe(true);
    }
  });

  it("exige le prenom et le nom", () => {
    expect(customerFormSchema.safeParse({ ...valid, firstName: "" }).success).toBe(false);
    expect(customerFormSchema.safeParse({ ...valid, lastName: "" }).success).toBe(false);
    // Un seul caractere ne suffit pas.
    expect(customerFormSchema.safeParse({ ...valid, firstName: "L" }).success).toBe(false);
  });

  it("refuse une adresse e-mail invalide", () => {
    for (const email of ["pas-un-email", "a@b", "@exemple.fr", "test@", ""]) {
      expect(
        customerFormSchema.safeParse({ ...valid, email }).success,
        `e-mail : ${email}`,
      ).toBe(false);
    }
  });

  it("refuse un numero de telephone invalide", () => {
    const result = customerFormSchema.safeParse({ ...valid, phone: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/telephone/i);
    }
  });

  it("exige l'acceptation de la politique de confidentialite", () => {
    const result = customerFormSchema.safeParse({
      ...valid,
      privacyAccepted: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/confidentialite/i);
    }
  });

  it("delivre des messages d'erreur en francais", () => {
    const result = customerFormSchema.safeParse({
      firstName: "",
      lastName: "",
      email: "invalide",
      phone: "",
      privacyAccepted: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      for (const issue of result.error.issues) {
        expect(issue.message.length).toBeGreaterThan(5);
        // Aucun message par defaut de Zod (qui serait en anglais).
        expect(issue.message).not.toMatch(/Required|Invalid|String must/);
      }
    }
  });
});

describe("createAppointmentSchema", () => {
  const valid = {
    firstName: "Lucas",
    lastName: "Martin",
    email: "Lucas.Martin@Exemple.FR",
    phone: "06 12 34 56 78",
    serviceId: "svc_123",
    date: "2026-07-29",
    time: "10:00",
    privacyAccepted: true as const,
  };

  it("normalise l'e-mail et le telephone", () => {
    const result = createAppointmentSchema.safeParse(valid);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("lucas.martin@exemple.fr");
      expect(result.data.phone).toBe("+33612345678");
    }
  });

  it("refuse une date ou une heure mal formee", () => {
    expect(createAppointmentSchema.safeParse({ ...valid, date: "29/07/2026" }).success).toBe(false);
    expect(createAppointmentSchema.safeParse({ ...valid, time: "10h00" }).success).toBe(false);
    expect(createAppointmentSchema.safeParse({ ...valid, date: "2026-02-30" }).success).toBe(false);
  });

  it("exige une prestation", () => {
    expect(createAppointmentSchema.safeParse({ ...valid, serviceId: "" }).success).toBe(false);
  });

  it("limite la longueur du commentaire", () => {
    expect(
      createAppointmentSchema.safeParse({ ...valid, notes: "a".repeat(501) }).success,
    ).toBe(false);
    expect(
      createAppointmentSchema.safeParse({ ...valid, notes: "a".repeat(500) }).success,
    ).toBe(true);
  });
});
