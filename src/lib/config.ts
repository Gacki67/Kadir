/**
 * ============================================================================
 *  CONFIGURATION CENTRALE — L'ESPACE DE RAYAN
 * ============================================================================
 *
 *  Ce fichier est le SEUL endroit a modifier pour personnaliser :
 *   - les coordonnees du salon (adresse, telephone)
 *   - le logo et les photos
 *   - les jours et horaires d'ouverture par defaut
 *   - le catalogue des prestations (amorce en base au deploiement)
 *   - la duree des creneaux et les regles de reservation
 *
 *  Les horaires et les prestations peuvent aussi etre modifies en direct depuis
 *  l'espace de Rayan (ils sont alors lus depuis la base de donnees, ce fichier
 *  servant de valeur initiale lors de l'amorcage).
 * ============================================================================
 */

export const SALON = {
  name: "L'Espace de Rayan",
  /** Version tout en capitales, pour les grands titres. */
  displayName: "L'ESPACE DE RAYAN",
  tagline: "L'art du barbier, l'exigence du sur-mesure.",
  shortDescription:
    "Barbier et coiffeur — coupe, barbe, coiffage, lissage et soins. Un salon haut de gamme ou chaque prestation est un moment reserve pour vous.",

  /** Le salon ouvre prochainement : bandeau et mentions "ouverture imminente". */
  openingSoon: true,

  // --- Coordonnees -----------------------------------------------------------
  address: {
    street: "2 Rue de Drusenheim",
    postalCode: "67620",
    city: "Soufflenheim",
    country: "France",
    // Lignes complementaires (nom du lieu, centre commercial...).
    complement: [
      "Le Salon 48 — Coiffeur Createur",
      "Centre Commercial E.Leclerc Soufflenheim",
    ] as string[],
  },

  /** Telephone unique du salon — reservations par appel et contact. */
  phoneDisplay: "06 66 66 66 66",
  phoneE164: "+33666666666",

  /**
   * Adresse e-mail PUBLIQUE, affichee aux clients. Laissez vide si le salon
   * n'en communique pas : elle disparait alors partout.
   */
  email: "",

  // --- Reseaux sociaux -------------------------------------------------------
  // Mettez une chaine vide pour masquer un reseau.
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
    snapchat: "",
  },

  // --- Identite visuelle -----------------------------------------------------
  // Deposez votre logo dans /public et indiquez son chemin ici.
  // Si le fichier n'existe pas, un logo typographique est affiche a la place.
  logoUrl: "",

  // --- Photos du salon (galerie de la page d'accueil) ------------------------
  // Ces fichiers sont a deposer par Rayan dans /public/coupes (voir la page
  // "Les Coupes"). En attendant, un fond degrade elegant s'affiche.
  gallery: [] as { url: string; alt: string }[],
} as const;

/**
 * Informations legales de l'entreprise, affichees dans les mentions legales.
 * A completer par Rayan avant l'ouverture.
 */
export const LEGAL = {
  siren: "",
  siret: "",
  legalForm: "",
  publicationDirector: "Rayan",
  vatNumber: "",
} as const;

/* -------------------------------------------------------------------------- */
/*  Contact — telephone                                                        */
/* -------------------------------------------------------------------------- */

/** Lien cliquable "tel:" pour appeler le salon. */
export function getPhoneHref(): string {
  return `tel:${SALON.phoneE164}`;
}

/** Numero affiche : "06 66 66 66 66". */
export function getPhoneDisplay(): string {
  return SALON.phoneDisplay;
}

/**
 * ============================================================================
 *  CATALOGUE DES PRESTATIONS
 * ============================================================================
 *
 *  Amorce la base au deploiement (voir prisma/bootstrap.ts). Ensuite, l'espace
 *  de Rayan fait foi : nom, prix, duree et disponibilite en ligne se modifient
 *  depuis /admin/prestations.
 *
 *  - price     : EN CENTIMES (evite toute erreur d'arrondi).
 *  - duration  : en minutes.
 *  - bookableOnline : false => la prestation ne se reserve pas en ligne, le
 *                     client doit appeler le salon (mèches, lissage, botox...).
 *  - category  : "HOMME" | "FEMME" | "LISSAGE" | "JUNIOR".
 * ============================================================================
 */
export type ServiceCategory = "HOMME" | "FEMME" | "LISSAGE" | "JUNIOR";

export type CatalogService = {
  name: string;
  description: string;
  category: ServiceCategory;
  duration: number;
  price: number;
  bookableOnline: boolean;
};

/** Libelle et ordre d'affichage des categories (onglets de la page Prestations). */
export const SERVICE_CATEGORIES: {
  key: ServiceCategory;
  label: string;
  tagline: string;
}[] = [
  { key: "HOMME", label: "Homme", tagline: "Coupe, barbe et coiffage" },
  { key: "FEMME", label: "Femme", tagline: "Chignons, brushings et soins" },
  { key: "LISSAGE", label: "Lissage & Soins", tagline: "Kératine, botox et soins profonds" },
  { key: "JUNIOR", label: "Junior", tagline: "Enfants et adolescents" },
];

export const SERVICES: CatalogService[] = [
  // ---------------------------------------------------------------- HOMME ----
  {
    name: "Shampooing, coupe & coiffage — cheveux courts",
    description: "Shampooing, coupe personnalisee et coiffage soigne pour cheveux courts.",
    category: "HOMME",
    duration: 30,
    price: 2600,
    bookableOnline: true,
  },
  {
    name: "Forfait mèches / permanente + coupe",
    description: "Mèches ou permanente accompagnees d'une coupe. Prestation sur rendez-vous telephonique.",
    category: "HOMME",
    duration: 105,
    price: 5600,
    bookableOnline: false,
  },
  {
    name: "Shampooing, coupe tondeuse (couronne)",
    description: "Coupe a la tondeuse tout en degrade, couronne comprise, finitions nettes.",
    category: "HOMME",
    duration: 30,
    price: 2100,
    bookableOnline: true,
  },
  {
    name: "Barbe — rasage ou taille",
    description: "Barbe travaillee au rasoir ou taillee a la tondeuse, contours precis, soin apaisant.",
    category: "HOMME",
    duration: 30,
    price: 2100,
    bookableOnline: true,
  },
  {
    name: "Coupe + barbe (rafraîchissement)",
    description: "Coupe complete suivie d'un rafraîchissement de la barbe pour un rendu net.",
    category: "HOMME",
    duration: 45,
    price: 3100,
    bookableOnline: true,
  },
  {
    name: "Coupe + barbe (rasoir)",
    description: "Coupe complete et barbe finie au rasoir, serviette chaude et soin.",
    category: "HOMME",
    duration: 45,
    price: 3500,
    bookableOnline: true,
  },

  // ---------------------------------------------------------------- FEMME ----
  {
    name: "Chignon — cheveux mi-longs",
    description: "Chignon travaille et tenue longue duree pour cheveux mi-longs.",
    category: "FEMME",
    duration: 45,
    price: 5700,
    bookableOnline: true,
  },
  {
    name: "Chignon — cheveux longs",
    description: "Chignon elabore, mise en beaute pour occasion, sur cheveux longs.",
    category: "FEMME",
    duration: 60,
    price: 6700,
    bookableOnline: true,
  },
  {
    name: "Attache rapide — cheveux courts",
    description: "Attache soignee et rapide pour cheveux courts.",
    category: "FEMME",
    duration: 25,
    price: 3000,
    bookableOnline: true,
  },
  {
    name: "Attache rapide — cheveux mi-longs",
    description: "Attache soignee et rapide pour cheveux mi-longs.",
    category: "FEMME",
    duration: 30,
    price: 4000,
    bookableOnline: true,
  },
  {
    name: "Massage relaxant (6 min)",
    description: "Court massage relaxant du cuir chevelu, un vrai moment de detente.",
    category: "FEMME",
    duration: 6,
    price: 600,
    bookableOnline: true,
  },
  {
    name: "Shampooing brushing — cheveux courts",
    description: "Shampooing et brushing sur mesure pour cheveux courts.",
    category: "FEMME",
    duration: 30,
    price: 2600,
    bookableOnline: true,
  },
  {
    name: "Shampooing brushing — cheveux mi-longs",
    description: "Shampooing et brushing volumineux pour cheveux mi-longs.",
    category: "FEMME",
    duration: 30,
    price: 3600,
    bookableOnline: true,
  },
  {
    name: "Shampooing brushing — cheveux longs",
    description: "Shampooing et brushing lumineux pour cheveux longs.",
    category: "FEMME",
    duration: 45,
    price: 4600,
    bookableOnline: true,
  },
  {
    name: "Soin",
    description: "Soin express nourrissant pour des cheveux souples et brillants.",
    category: "FEMME",
    duration: 7,
    price: 700,
    bookableOnline: true,
  },
  {
    name: "Soin profond",
    description: "Soin profond reparateur, ideal pour les cheveux fragilises.",
    category: "FEMME",
    duration: 15,
    price: 2000,
    bookableOnline: true,
  },

  // -------------------------------------------------------------- LISSAGE ----
  {
    name: "Botox premium",
    description: "Traitement botox premium qui repare et discipline. Sur rendez-vous telephonique.",
    category: "LISSAGE",
    duration: 120,
    price: 9000,
    bookableOnline: false,
  },
  {
    name: "Soin botox",
    description: "Soin botox capillaire pour une fibre lissee et renforcee. Sur rendez-vous telephonique.",
    category: "LISSAGE",
    duration: 60,
    price: 5000,
    bookableOnline: false,
  },
  {
    name: "Soin lissant kératine",
    description: "Lissage a la kératine longue duree, cheveux disciplines et brillants. Sur rendez-vous telephonique.",
    category: "LISSAGE",
    duration: 135,
    price: 15000,
    bookableOnline: false,
  },
  {
    name: "Soie hydrolysée",
    description: "Soin a la soie hydrolysée qui gaine et sublime la fibre. Sur rendez-vous telephonique.",
    category: "LISSAGE",
    duration: 45,
    price: 2000,
    bookableOnline: false,
  },

  // --------------------------------------------------------------- JUNIOR ----
  {
    name: "Coupe -16 ans — cheveux courts",
    description: "Coupe adaptee aux moins de 16 ans, cheveux courts.",
    category: "JUNIOR",
    duration: 30,
    price: 2300,
    bookableOnline: true,
  },
  {
    name: "-16 ans — Shampooing coupe coiffage cheveux courts",
    description: "Shampooing, coupe et coiffage pour les moins de 16 ans, cheveux courts.",
    category: "JUNIOR",
    duration: 30,
    price: 2300,
    bookableOnline: true,
  },
  {
    name: "-16 ans — Shampooing coupe coiffage cheveux mi-longs",
    description: "Shampooing, coupe et coiffage pour les moins de 16 ans, cheveux mi-longs.",
    category: "JUNIOR",
    duration: 30,
    price: 3000,
    bookableOnline: true,
  },
  {
    name: "-16 ans — Shampooing coupe coiffage cheveux longs",
    description: "Shampooing, coupe et coiffage pour les moins de 16 ans, cheveux longs.",
    category: "JUNIOR",
    duration: 30,
    price: 3300,
    bookableOnline: true,
  },
  {
    name: "Coupe bébé -6 ans",
    description: "Premiere coupe en douceur pour les tout-petits de moins de 6 ans.",
    category: "JUNIOR",
    duration: 20,
    price: 1100,
    bookableOnline: true,
  },
  {
    name: "Coupe -16 ans tendance",
    description: "Coupe tendance pour les moins de 16 ans, dégradés et motifs.",
    category: "JUNIOR",
    duration: 30,
    price: 2600,
    bookableOnline: true,
  },
];

/**
 * Regles de reservation.
 */
export const BOOKING = {
  /** Fuseau horaire de reference — toutes les dates affichees sont en heure francaise */
  timezone: "Europe/Paris",

  /** Duree d'un creneau elementaire, en minutes (rendez-vous toutes les 15 min) */
  slotDurationMinutes: 15,

  /**
   * Horaires d'ouverture par defaut (0 = dimanche ... 6 = samedi).
   * Rayan travaille du mardi au samedi, 9 h – 17 h. Dimanche et lundi fermes.
   * Ces valeurs alimentent la base a chaque amorcage (voir prisma/bootstrap.ts).
   */
  defaultBusinessHours: [
    { dayOfWeek: 0, openingTime: "09:00", closingTime: "17:00", active: false }, // Dimanche — ferme
    { dayOfWeek: 1, openingTime: "09:00", closingTime: "17:00", active: false }, // Lundi — ferme
    { dayOfWeek: 2, openingTime: "09:00", closingTime: "17:00", active: true },  // Mardi
    { dayOfWeek: 3, openingTime: "09:00", closingTime: "17:00", active: true },  // Mercredi
    { dayOfWeek: 4, openingTime: "09:00", closingTime: "17:00", active: true },  // Jeudi
    { dayOfWeek: 5, openingTime: "09:00", closingTime: "17:00", active: true },  // Vendredi
    { dayOfWeek: 6, openingTime: "09:00", closingTime: "17:00", active: true },  // Samedi
  ],

  /** Nombre de jours dans le futur ouverts a la reservation */
  maxAdvanceDays: 60,

  /**
   * Delai minimum entre maintenant et le debut du rendez-vous, en minutes.
   * Empeche de reserver "dans 2 minutes". Mettre 0 pour desactiver.
   */
  minLeadTimeMinutes: 60,

  /**
   * Delai minimum avant le rendez-vous pour qu'un client puisse encore
   * annuler ou deplacer lui-meme, en heures. Passe ce delai, il doit appeler.
   */
  cancellationCutoffHours: 2,

  /** Fenetre d'envoi des rappels : entre 23h et 25h avant le RDV */
  reminderWindowHours: { min: 23, max: 25 },
} as const;

/**
 * Duree de conservation des donnees personnelles (RGPD).
 * Utilise par le script de purge et affiche dans la politique de confidentialite.
 */
export const DATA_RETENTION_MONTHS = 24;

/** URL publique du site, utilisee dans les e-mails et le sitemap. */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/** Adresse postale formatee sur une ligne, ou chaine vide si non renseignee. */
export function getFullAddress(): string {
  const { street, postalCode, city, complement } = SALON.address;
  if (!street && !city) return "";
  return [...(complement ?? []), street, [postalCode, city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}

/** Vrai si une adresse postale a ete renseignee dans la configuration. */
export function hasAddress(): boolean {
  return Boolean(SALON.address.street || SALON.address.city);
}

/**
 * Adresse presentee sur plusieurs lignes, nom du salon inclus. Si l'adresse
 * n'est pas encore renseignee, seul le nom du salon est renvoye.
 */
export function getAddressLines(): string[] {
  const { street, postalCode, city, complement } = SALON.address;
  const lines: string[] = [SALON.name];
  if (complement) lines.push(...complement);
  if (street) lines.push(street);
  const cityLine = [postalCode, city].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  return lines;
}

/** Partie geolocalisable de l'adresse : "2 Rue de Drusenheim, 67620 Soufflenheim". */
export function getMapsQuery(): string {
  const { street, postalCode, city } = SALON.address;
  return [street, [postalCode, city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}

/** Carte Google Maps integrable (iframe), sans cle API. */
export function getGoogleMapsEmbedUrl(): string {
  const q = encodeURIComponent(getMapsQuery());
  return `https://www.google.com/maps?q=${q}&hl=fr&z=16&output=embed`;
}

/** Lien vers la fiche Google Maps du salon. */
export function getGoogleMapsLink(): string {
  const q = encodeURIComponent(getMapsQuery());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Lien lancant directement le calcul d'itineraire. */
export function getGoogleMapsDirectionsUrl(): string {
  const q = encodeURIComponent(getMapsQuery());
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

/** Meme adresse, en une seule chaine avec retours a la ligne (SMS, texte brut). */
export function getAddressBlock(): string {
  return getAddressLines().join("\n");
}

/** Libelles francais des jours de la semaine (index = dayOfWeek). */
export const DAY_NAMES = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const;

export const DAY_NAMES_SHORT = [
  "Dim",
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
] as const;

export const MONTH_NAMES = [
  "janvier",
  "fevrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "septembre",
  "octobre",
  "novembre",
  "decembre",
] as const;
