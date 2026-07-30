/**
 * ============================================================================
 *  CONFIGURATION CENTRALE — KADIR BARBER
 * ============================================================================
 *
 *  Ce fichier est le SEUL endroit a modifier pour personnaliser :
 *   - les coordonnees du salon (adresse, telephone, e-mail)
 *   - les reseaux sociaux
 *   - le logo et les photos
 *   - les jours et horaires d'ouverture par defaut
 *   - la duree des creneaux
 *   - les regles d'annulation
 *
 *  Les horaires peuvent egalement etre modifies en direct depuis l'espace
 *  administrateur (ils sont alors lus depuis la base de donnees, ce fichier
 *  servant de valeur initiale lors du `db:seed`).
 * ============================================================================
 */

export const SALON = {
  name: "Kadir Barber",
  tagline: "Coupe, moustache et barbe. Un seul rendez-vous, tout est fait.",
  shortDescription:
    "Barbier traditionnel et coiffeur homme a Soufflenheim. Coupe, moustache et barbe en 30 minutes, pour 15 € — sans surprise et sans attente.",

  // --- Coordonnees -----------------------------------------------------------
  address: {
    street: "19 rue des Vosges",
    postalCode: "67620",
    city: "Soufflenheim",
    country: "France",
  },
  /**
   * Le salon ne communique pas de numero de telephone.
   * Le contact se fait par Snapchat (ci-dessous) et par e-mail.
   *
   * Pour publier un numero plus tard, ajoutez ici :
   *   phone: "+33 6 12 34 56 78",
   *   phoneE164: "+33612345678",
   * puis reaffichez-le la ou vous le souhaitez.
   */

  /** Identifiant Snapchat — moyen de contact principal du salon. */
  snapchatHandle: "kadir_bs67",
  email: "contact@kadirbarber.fr",

  // --- Google Maps -----------------------------------------------------------
  // Ces trois URLs sont construites a partir de l'adresse ci-dessus et
  // fonctionnent sans cle API Google.
  //   - embedUrl      : carte affichee dans la page (iframe)
  //   - link          : ouvre la fiche du salon dans Google Maps
  //   - directionsUrl : lance directement le calcul d'itineraire
  googleMapsEmbedUrl:
    "https://www.google.com/maps?q=19+rue+des+Vosges,+67620+Soufflenheim&hl=fr&z=16&output=embed",
  googleMapsLink:
    "https://www.google.com/maps/search/?api=1&query=19+rue+des+Vosges%2C+67620+Soufflenheim",
  googleMapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=19+rue+des+Vosges%2C+67620+Soufflenheim",

  // --- Reseaux sociaux -------------------------------------------------------
  // Mettez une chaine vide pour masquer un reseau.
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
    snapchat: "https://www.snapchat.com/add/kadir_bs67",
  },

  // --- Identite visuelle -----------------------------------------------------
  // Deposez votre logo dans /public et indiquez son chemin ici.
  // Si le fichier n'existe pas, un logo typographique est affiche a la place.
  logoUrl: "",

  // --- Photos du salon (galerie de la page d'accueil) ------------------------
  // Remplacez ces URLs par vos propres photos (ex. "/photos/salon-1.jpg").
  gallery: [
    {
      url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
      alt: "Fauteuil de barbier dans le salon Kadir Barber",
    },
    {
      url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
      alt: "Barbier realisant une coupe homme",
    },
    {
      url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
      alt: "Taille de barbe au rasoir",
    },
    {
      url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80",
      alt: "Outils de coiffure professionnels",
    },
  ],
} as const;

/**
 * Informations legales de l'entreprise, affichees dans les mentions legales.
 */
export const LEGAL = {
  siren: "102187168",
  siret: "10218716800011",
  /** A completer : forme juridique exacte (entreprise individuelle, SARL, SAS...) */
  legalForm: "",
  /** A completer : nom du directeur de la publication */
  publicationDirector: "",
  /** A completer : numero de TVA intracommunautaire, si l'entreprise y est assujettie */
  vatNumber: "",
} as const;

/** Lien vers le compte Snapchat du salon. */
export function getSnapchatUrl(): string {
  return `https://www.snapchat.com/add/${SALON.snapchatHandle}`;
}

/** Identifiant Snapchat prefixe, pour l'affichage : "@kadir_bs67". */
export function getSnapchatDisplay(): string {
  return `@${SALON.snapchatHandle}`;
}

/**
 * ============================================================================
 *  LA PRESTATION UNIQUE DU SALON
 * ============================================================================
 *
 *  Le salon ne propose qu'une seule prestation : le client n'a donc aucun choix
 *  a faire, elle est selectionnee automatiquement dans le formulaire.
 *
 *  Ces valeurs alimentent la base au `db:seed`. Pour modifier le nom, la duree
 *  ou le tarif ensuite, passez par l'espace administrateur (/admin/prestations)
 *  ou relancez `npm run db:seed`.
 *
 *  Le prix est exprime EN CENTIMES afin d'eviter toute erreur d'arrondi.
 * ============================================================================
 */
export const MAIN_SERVICE = {
  name: "Coupe, moustache et barbe",
  description:
    "La prestation complete : coupe personnalisee, moustache mise en forme et barbe travaillee au rasoir. Tout est compris, en 30 minutes.",
  /** en minutes */
  duration: 30,
  /** en centimes -> 15,00 € */
  price: 1500,
} as const;

/**
 * Regles de reservation.
 */
export const BOOKING = {
  /** Fuseau horaire de reference — toutes les dates affichees sont en heure francaise */
  timezone: "Europe/Paris",

  /** Duree d'un creneau elementaire, en minutes */
  slotDurationMinutes: 30,

  /**
   * Horaires d'ouverture par defaut (0 = dimanche ... 6 = samedi).
   * Ces valeurs alimentent la base au premier `db:seed`.
   * Ensuite, l'espace admin fait foi.
   */
  defaultBusinessHours: [
    { dayOfWeek: 0, openingTime: "09:00", closingTime: "21:00", active: false }, // Dimanche — ferme
    { dayOfWeek: 1, openingTime: "09:00", closingTime: "21:00", active: true },  // Lundi
    { dayOfWeek: 2, openingTime: "09:00", closingTime: "21:00", active: true },  // Mardi
    { dayOfWeek: 3, openingTime: "09:00", closingTime: "21:00", active: true },  // Mercredi
    { dayOfWeek: 4, openingTime: "09:00", closingTime: "21:00", active: true },  // Jeudi
    { dayOfWeek: 5, openingTime: "09:00", closingTime: "21:00", active: true },  // Vendredi
    { dayOfWeek: 6, openingTime: "09:00", closingTime: "21:00", active: false }, // Samedi — ferme
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

/** Adresse postale formatee sur une ligne : "19 rue des Vosges, 67620 Soufflenheim". */
export function getFullAddress(): string {
  const { street, postalCode, city } = SALON.address;
  return `${street}, ${postalCode} ${city}`;
}

/**
 * Adresse presentee sur plusieurs lignes, nom du salon inclus :
 *   Kadir Barber
 *   19 rue des Vosges
 *   67620 Soufflenheim
 *
 * Utilisee dans les e-mails, sur la page de confirmation et dans le
 * recapitulatif du rendez-vous, afin que le libelle soit identique partout.
 */
export function getAddressLines(): string[] {
  const { street, postalCode, city } = SALON.address;
  return [SALON.name, street, `${postalCode} ${city}`];
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
