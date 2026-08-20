import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import "./globals.css";
import { SALON, getSiteUrl, hasAddress } from "@/lib/config";

/**
 * Polices.
 * `next/font` telecharge et heberge les fichiers avec le site : aucune requete
 * vers Google n'est faite depuis le navigateur du visiteur.
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SALON.name} — Barbier & Coiffeur`,
    template: `%s | ${SALON.name}`,
  },
  description: `${SALON.name} — salon de barbier et coiffure haut de gamme. Coupe, barbe, coiffage, lissage et soins. Creez votre compte et reservez en ligne, du lundi au vendredi de 9 h a 19 h.`,
  keywords: [
    "barbier",
    "coiffeur",
    "coiffeur homme",
    "coiffeur femme",
    "barber shop",
    "coupe homme",
    "taille de barbe",
    "rasage traditionnel",
    "chignon",
    "brushing",
    "lissage keratine",
    "reservation en ligne",
    SALON.name,
    "L'Espace de Rayan",
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
    title: `${SALON.name} — Barbier & Coiffeur`,
    description: `${SALON.tagline} Coupe, barbe, coiffage, lissage et soins. Reservez votre rendez-vous en ligne chez ${SALON.name}.`,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SALON.name} — barbier & coiffeur`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SALON.name} — Barbier & Coiffeur`,
    description: `${SALON.tagline} Reservez en ligne chez ${SALON.name}.`,
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
  themeColor: "#140d07",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Donnees structurees Schema.org (type HairSalon).
 */
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${siteUrl}/#salon`,
    name: SALON.name,
    description: SALON.shortDescription,
    url: siteUrl,
    telephone: SALON.phoneE164,
    ...(SALON.email ? { email: SALON.email } : {}),
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: "Especes, carte bancaire",
    ...(hasAddress()
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: SALON.address.street,
            postalCode: SALON.address.postalCode,
            addressLocality: SALON.address.city,
            addressCountry: "FR",
          },
        }
      : {}),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "19:00",
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
        <meta name="geo.region" content="FR" />
      </head>
      <body>
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
