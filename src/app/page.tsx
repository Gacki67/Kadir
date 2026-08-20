import { prisma } from "@/lib/prisma";
import { getBusinessRules } from "@/lib/booking";
import { BOOKING } from "@/lib/config";
import { publicServiceSelect } from "@/lib/services";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { AboutSection } from "@/components/site/AboutSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { HoursSection } from "@/components/site/HoursSection";
import { FinalCta } from "@/components/site/FinalCta";

/**
 * Page d'accueil.
 *
 * Rendue cote serveur et revalidee toutes les 5 minutes : les prestations et
 * les horaires modifies depuis l'espace administrateur apparaissent
 * rapidement, sans recharger la base a chaque visite.
 */
export const revalidate = 300;

async function getHomeData() {
  try {
    const [services, hours] = await Promise.all([
      prisma.service.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: publicServiceSelect,
      }),
      getBusinessRules(),
    ]);

    return { services, hours };
  } catch (error) {
    // La page d'accueil doit rester consultable meme si la base est
    // momentanement injoignable : on retombe sur les horaires par defaut.
    console.error("[accueil] Base de donnees injoignable :", error);
    return {
      services: [],
      hours: BOOKING.defaultBusinessHours.map((rule) => ({ ...rule })),
    };
  }
}

export default async function HomePage() {
  const { services, hours } = await getHomeData();

  return (
    <>
      <Header />
      <main id="contenu">
        <Hero />
        <AboutSection />
        <ServicesSection services={services} />
        <HoursSection hours={hours} />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
