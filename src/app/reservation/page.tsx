import type { Metadata } from "next";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { SALON } from "@/lib/config";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { SpinnerIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Reserver un rendez-vous",
  description: `Reservez votre rendez-vous en ligne chez ${SALON.name} a ${SALON.address.city} : coupe, barbe, contours et soins. Choisissez votre creneau en quelques secondes.`,
  alternates: { canonical: "/reservation" },
  openGraph: {
    title: `Reserver un rendez-vous | ${SALON.name}`,
    description: `Reservation en ligne 24 h/24 chez ${SALON.name}.`,
  },
};

// Les prestations doivent toujours refleter l'etat reel de la base.
export const dynamic = "force-dynamic";

export default async function ReservationPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      imageUrl: true,
    },
  });

  return (
    <>
      <Header />

      <main id="contenu" className="min-h-screen pb-24 pt-[110px]">
        <div className="container-kb">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="section-eyebrow justify-center">
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
              Reservation en ligne
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            </p>
            <h1 className="section-title">Prenez rendez-vous</h1>
            <p className="mt-5 text-neutral-400">
              Cinq etapes, moins d&apos;une minute. Vous recevez la confirmation
              par e-mail et par SMS immediatement apres validation.
            </p>
          </div>

          <Suspense fallback={<WizardFallback />}>
            <BookingWizard services={services} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}

function WizardFallback() {
  return (
    <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 py-20 text-neutral-400">
      <SpinnerIcon className="h-6 w-6 text-gold-400" />
      Chargement du formulaire de reservation…
    </div>
  );
}
