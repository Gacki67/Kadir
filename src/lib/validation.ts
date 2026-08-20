/**
 * Schemas de validation Zod, partages entre le formulaire (cote client) et
 * les routes API (cote serveur). Les messages sont en francais et penses pour
 * etre affiches tels quels a l'utilisateur.
 */

import { z } from "zod";
import { isValidDateKey, isValidTimeKey } from "./datetime";

/* -------------------------------------------------------------------------- */
/*  Telephone                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Normalise un numero francais vers le format international E.164.
 * Accepte : 0612345678, 06 12 34 56 78, 06-12-34-56-78, +33612345678,
 *           0033612345678, (+33) 6 12 34 56 78
 * Retourne null si le numero est invalide.
 */
export function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s.\-()/]/g, "");

  let digits = cleaned;
  if (digits.startsWith("+")) {
    digits = `+${digits.slice(1).replace(/\D/g, "")}`;
  } else {
    digits = digits.replace(/\D/g, "");
  }

  // 0033... -> +33...
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;

  // Numero national francais : 0X XX XX XX XX
  if (/^0[1-9]\d{8}$/.test(digits)) {
    return `+33${digits.slice(1)}`;
  }

  // Deja au format international francais
  if (/^\+33[1-9]\d{8}$/.test(digits)) {
    return digits;
  }

  // Autre pays : on accepte un format international plausible.
  // Minimum 9 chiffres (indicatif compris) : en dessous, il ne peut pas s'agir
  // d'un numero reel, et on eviterait de laisser passer une saisie tronquee.
  // Maximum 15 chiffres, conformement a la norme E.164.
  if (/^\+\d{9,15}$/.test(digits)) {
    return digits;
  }

  return null;
}

/** Affichage lisible d'un numero E.164 francais : +33612345678 -> 06 12 34 56 78 */
export function formatPhoneForDisplay(e164: string): string {
  if (/^\+33\d{9}$/.test(e164)) {
    const national = `0${e164.slice(3)}`;
    return national.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return e164;
}

const phoneSchema = z
  .string({ required_error: "Le numero de telephone est obligatoire." })
  .trim()
  .min(1, "Le numero de telephone est obligatoire.")
  .refine((value) => normalizePhone(value) !== null, {
    message:
      "Numero de telephone invalide. Exemple attendu : 06 12 34 56 78.",
  })
  .transform((value) => normalizePhone(value) as string);

/* -------------------------------------------------------------------------- */
/*  Champs communs                                                              */
/* -------------------------------------------------------------------------- */

const nameSchema = (label: string) =>
  z
    .string({ required_error: `Le ${label} est obligatoire.` })
    .trim()
    .min(2, `Le ${label} doit contenir au moins 2 caracteres.`)
    .max(60, `Le ${label} ne peut pas depasser 60 caracteres.`)
    .regex(
      /^[\p{L}\p{M}][\p{L}\p{M}\s'’-]*$/u,
      `Le ${label} contient des caracteres non autorises.`,
    );

const emailSchema = z
  .string({ required_error: "L'adresse e-mail est obligatoire." })
  .trim()
  .min(1, "L'adresse e-mail est obligatoire.")
  .max(180, "L'adresse e-mail est trop longue.")
  .email("Adresse e-mail invalide. Exemple attendu : prenom@exemple.fr.")
  .transform((value) => value.toLowerCase());

const dateKeySchema = z
  .string({ required_error: "La date est obligatoire." })
  .refine(isValidDateKey, "Date invalide.");

const timeKeySchema = z
  .string({ required_error: "L'heure est obligatoire." })
  .refine(isValidTimeKey, "Heure invalide.");

/* -------------------------------------------------------------------------- */
/*  Reservation client                                                          */
/* -------------------------------------------------------------------------- */

export const createAppointmentSchema = z.object({
  firstName: nameSchema("prenom"),
  lastName: nameSchema("nom"),
  email: emailSchema,
  phone: phoneSchema,
  serviceId: z
    .string({ required_error: "La prestation est obligatoire." })
    .min(1, "Merci de choisir une prestation."),
  date: dateKeySchema,
  time: timeKeySchema,
  notes: z
    .string()
    .trim()
    .max(500, "Le commentaire ne peut pas depasser 500 caracteres.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({
      message:
        "Vous devez accepter la politique de confidentialite pour reserver.",
    }),
  }),
  /** Champ piege anti-robot : doit rester vide. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

/**
 * Etape 4 du formulaire — validee en direct dans le navigateur.
 *
 * Volontairement SANS transformation : react-hook-form doit conserver
 * exactement ce que l'utilisateur a saisi (un numero reste affiche
 * "06 12 34 56 78" et non "+33612345678"). La normalisation est faite au
 * moment de l'envoi, puis refaite cote serveur.
 */
export const customerFormSchema = z.object({
  firstName: nameSchema("prenom"),
  lastName: nameSchema("nom"),
  email: z
    .string({ required_error: "L'adresse e-mail est obligatoire." })
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .max(180, "L'adresse e-mail est trop longue.")
    .email("Adresse e-mail invalide. Exemple attendu : prenom@exemple.fr."),
  phone: z
    .string({ required_error: "Le numero de telephone est obligatoire." })
    .trim()
    .min(1, "Le numero de telephone est obligatoire.")
    .refine((value) => normalizePhone(value) !== null, {
      message: "Numero de telephone invalide. Exemple attendu : 06 12 34 56 78.",
    }),
  notes: z
    .string()
    .trim()
    .max(500, "Le commentaire ne peut pas depasser 500 caracteres.")
    .optional(),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({
      message:
        "Vous devez accepter la politique de confidentialite pour reserver.",
    }),
  }),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

/* -------------------------------------------------------------------------- */
/*  Comptes client — inscription et connexion                                   */
/* -------------------------------------------------------------------------- */

const passwordSchema = z
  .string({ required_error: "Le mot de passe est obligatoire." })
  .min(8, "Le mot de passe doit contenir au moins 8 caracteres.")
  .max(100, "Le mot de passe est trop long.");

/** Inscription — cote serveur (normalise le telephone et l'e-mail). */
export const registerSchema = z.object({
  firstName: nameSchema("prenom"),
  lastName: nameSchema("nom"),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Inscription — cote navigateur (conserve la saisie brute, sans transformation). */
export const registerFormSchema = z.object({
  firstName: nameSchema("prenom"),
  lastName: nameSchema("nom"),
  email: z
    .string({ required_error: "L'adresse e-mail est obligatoire." })
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .max(180, "L'adresse e-mail est trop longue.")
    .email("Adresse e-mail invalide. Exemple attendu : prenom@exemple.fr."),
  phone: z
    .string({ required_error: "Le numero de telephone est obligatoire." })
    .trim()
    .min(1, "Le numero de telephone est obligatoire.")
    .refine((value) => normalizePhone(value) !== null, {
      message: "Numero de telephone invalide. Exemple attendu : 06 12 34 56 78.",
    }),
  password: passwordSchema,
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

/** Connexion client. */
export const customerLoginSchema = z.object({
  email: z
    .string({ required_error: "L'adresse e-mail est obligatoire." })
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .email("Adresse e-mail invalide.")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

export type CustomerLoginValues = z.infer<typeof customerLoginSchema>;

/**
 * Reservation par un client CONNECTE : ses coordonnees viennent du compte,
 * seuls la prestation, la date, l'heure et un commentaire sont a fournir.
 */
export const bookAsCustomerSchema = z.object({
  serviceId: z
    .string({ required_error: "La prestation est obligatoire." })
    .min(1, "Merci de choisir une prestation."),
  date: dateKeySchema,
  time: timeKeySchema,
  notes: z
    .string()
    .trim()
    .max(500, "Le commentaire ne peut pas depasser 500 caracteres.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

/* -------------------------------------------------------------------------- */
/*  Gestion par le client (via jeton securise)                                  */
/* -------------------------------------------------------------------------- */

export const rescheduleSchema = z.object({
  date: dateKeySchema,
  time: timeKeySchema,
});

/* -------------------------------------------------------------------------- */
/*  Administration                                                              */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

/** Connexion a l'espace de Rayan par code d'acces unique. */
export const adminCodeSchema = z.object({
  code: z.string().min(1, "Le code d'acces est obligatoire."),
});

export const adminCreateAppointmentSchema = z.object({
  firstName: nameSchema("prenom"),
  lastName: nameSchema("nom"),
  email: emailSchema,
  phone: phoneSchema,
  serviceId: z.string().min(1, "Merci de choisir une prestation."),
  date: dateKeySchema,
  time: timeKeySchema,
  notes: z.string().trim().max(500).optional(),
  /** Permet de creer un RDV sans declencher e-mail et SMS */
  sendNotifications: z.boolean().default(true),
});

export const adminUpdateAppointmentSchema = z.object({
  firstName: nameSchema("prenom").optional(),
  lastName: nameSchema("nom").optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  serviceId: z.string().min(1).optional(),
  date: dateKeySchema.optional(),
  time: timeKeySchema.optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
    .optional(),
});

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom de la prestation est obligatoire.")
    .max(80, "Le nom ne peut pas depasser 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(400, "La description ne peut pas depasser 400 caracteres.")
    .default(""),
  duration: z
    .number({ invalid_type_error: "La duree doit etre un nombre." })
    .int("La duree doit etre un nombre entier de minutes.")
    .min(5, "La duree minimum est de 5 minutes.")
    .max(480, "La duree maximum est de 8 heures."),
  /** Prix saisi en euros dans l'interface, converti en centimes cote serveur */
  price: z
    .number({ invalid_type_error: "Le prix doit etre un nombre." })
    .int("Le prix doit etre exprime en centimes.")
    .min(0, "Le prix ne peut pas etre negatif.")
    .max(1_000_000, "Le prix semble incorrect."),
  imageUrl: z
    .string()
    .trim()
    .url("L'URL de l'image est invalide.")
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  sortOrder: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
});

export const businessHoursSchema = z.object({
  hours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        openingTime: timeKeySchema,
        closingTime: timeKeySchema,
        active: z.boolean(),
      }),
    )
    .length(7, "Les 7 jours de la semaine doivent etre fournis."),
});

export const blockedSlotSchema = z
  .object({
    date: dateKeySchema,
    startTime: timeKeySchema.optional(),
    endTime: timeKeySchema.optional(),
    reason: z.string().trim().max(200).optional(),
    wholeDay: z.boolean().default(false),
  })
  .refine(
    (value) => value.wholeDay || (value.startTime && value.endTime),
    {
      message:
        "Indiquez une heure de debut et une heure de fin, ou bloquez la journee entiere.",
      path: ["startTime"],
    },
  )
  .refine(
    (value) =>
      value.wholeDay ||
      !value.startTime ||
      !value.endTime ||
      value.startTime < value.endTime,
    {
      message: "L'heure de fin doit etre posterieure a l'heure de debut.",
      path: ["endTime"],
    },
  );

/* -------------------------------------------------------------------------- */
/*  Utilitaire de formatage des erreurs Zod pour les reponses API              */
/* -------------------------------------------------------------------------- */

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
