import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import "./globals.css";
import {
  LEGAL,
  MAIN_SERVICE,
  SALON,
  getFullAddress,
  getSiteUrl,
} from "@/lib/config";

/**
 * Polices.
 * `next/font` telecharge et heberge les fichiers avec le site : aucune requete
 * vers Google n'est faite depuis le navigateur du visiteur (bon pour la
 * performance comme pour le RGPD).
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const siteUrl = getSiteUrl();
const city = SALON.address.city;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SALON.name} — Barbier & Coiffeur homme a ${city}`,
    template: `%s | ${SALON.name}`,
  },
  description: `${SALON.name}, barbier et coiffeur homme au ${SALON.address.street}, ${SALON.address.postalCode} ${city}. Coupe, moustache et barbe en 30 minutes pour 15 €. Reservez en ligne du lundi au vendredi, de 9 h a 21 h.`,
  keywords: [
    "barbier",
    `barbier ${city}`,
    "coiffeur homme",
    `coiffeur homme ${city}`,
    "barber shop",
    `barber shop ${city}`,
    "coupe moustache barbe",
    "taille de barbe",
    "rasage traditionnel",
    "coupe homme",
    `coiffeur ${SALON.address.postalCode}`,
    "barbier Alsace",
    "reservation en ligne",
    SALON.name,
  ],
  authors: [{ name: SALON.name }],
  creator: SALON.name,
  applicationName: SALON.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: SALON.name,
    title: `${SALON.name} — Barbier & Coiffeur homme a ${city}`,
    description: `Coupe, moustache et barbe — 30 minutes, 15 €. ${getFullAddress()}. Reservez votre rendez-vous en ligne chez ${SALON.name}.`,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SALON.name} — barbier a ${city}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SALON.name} — Barbier & Coiffeur homme a ${city}`,
    description: `Coupe, moustache et barbe — 30 minutes, 15 €. Reservez en ligne chez ${SALON.name}, ${getFullAddress()}.`,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // on n'empeche jamais le zoom (accessibilite)
};

/**
 * Donnees structurees Schema.org (type HairSalon).
 * Permet a Google d'afficher les horaires, l'adresse et le bouton de
 * reservation directement dans les resultats de recherche.
 */
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${siteUrl}/#salon`,
    name: SALON.name,
    description: SALON.shortDescription,
    url: siteUrl,
    // Identifiant legal de l'etablissement (SIRET).
    identifier: {
      "@type": "PropertyValue",
      propertyID: "SIRET",
      value: LEGAL.siret,
    },
    // Le salon ne publie pas de numero de telephone : le contact se fait
    // par Snapchat (voir sameAs) et par e-mail.
    // `email` n'est expose que si le salon en publie une.
    ...(SALON.email ? { email: SALON.email } : {}),
    // Tarif unique du salon : on l'expose tel quel plutot qu'une fourchette.
    priceRange: `${MAIN_SERVICE.price / 100} €`,
    currenciesAccepted: "EUR",
    paymentAccepted: "Especes, carte bancaire",
    address: {
      "@type": "PostalAddress",
      streetAddress: SALON.address.street,
      postalCode: SALON.address.postalCode,
      addressLocality: SALON.address.city,
      addressRegion: "Grand Est",
      addressCountry: "FR",
    },
    areaServed: {
      "@type": "City",
      name: SALON.address.city,
    },
    hasMap: SALON.googleMapsLink,
    // La prestation unique proposee par le salon.
    makesOffer: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (MAIN_SERVICE.price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      itemOffered: {
        "@type": "Service",
        name: MAIN_SERVICE.name,
        description: MAIN_SERVICE.description,
        serviceType: "Coiffure et soin de la barbe",
        provider: { "@id": `${siteUrl}/#salon` },
      },
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "09:00",
        closes: "21:00",
      },
    ],
    sameAs: Object.values(SALON.social).filter(Boolean),
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/reservation`,
        inLanguage: "fr-FR",
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      result: { "@type": "Reservation", name: "Rendez-vous" },
    },
  };

  return (
    <script
      type="application/ld+json"
      // Contenu genere par nous-memes a partir de la configuration : sans risque.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <StructuredData />
        <meta name="geo.placename" content={city} />
        <meta name="geo.region" content="FR-GES" />
        {/* Note : la balise ICBM attend des coordonnees GPS (latitude,
            longitude). Elle est volontairement omise faute de coordonnees
            relevees — l'adresse postale est deja fournie dans le JSON-LD. */}
      </head>
      <body>
        {/* Lien d'evitement : premier element atteignable au clavier */}
        <a
          href="#contenu"
          className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-ink-950"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
