import type { Metadata } from "next";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { SALON, getAddressLines } from "@/lib/config";
import { formatPrice } from "@/lib/datetime";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookingWizard } from "@/components/booking/BookingWizard";
import {
  ClockIcon,
  MapPinIcon,
  ScissorsIcon,
  SpinnerIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Reserver un rendez-vous",
  description: `Reservez votre rendez-vous en ligne chez ${SALON.name}, ${SALON.address.street}, ${SALON.address.postalCode} ${SALON.address.city}. Coupe, moustache et barbe en 30 minutes pour 15 €.`,
  alternates: { canonical: "/reservation" },
  openGraph: {
    title: `Reserver un rendez-vous | ${SALON.name}`,
    description: `Coupe, moustache et barbe — 30 minutes, 15 €. Reservation en ligne 24 h/24 a ${SALON.address.city}.`,
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

  // Le salon ne propose qu'une seule prestation : on la met en avant en haut
  // de page, puisque le client n'a aucun choix a faire.
  const mainService = services.length === 1 ? services[0] : null;

  return (
    <>
      <Header />

      <main id="contenu" className="min-h-screen pb-24 pt-[110px]">
        <div className="container-kb">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="section-eyebrow justify-center">
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
              Reservation en ligne
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            </p>
            <h1 className="section-title">Prenez rendez-vous</h1>
            <p className="mt-5 text-neutral-400">
              {mainService
                ? "Choisissez simplement votre date et votre horaire. Vous recevez la confirmation par e-mail et par SMS immediatement apres validation."
                : "Quelques etapes, moins d'une minute. Vous recevez la confirmation par e-mail et par SMS immediatement apres validation."}
            </p>
          </div>

          {/* --- La prestation, le tarif et l'adresse, bien visibles --- */}
          {mainService && (
            <div className="mx-auto mb-10 max-w-3xl">
              <div className="card overflow-hidden border-gold-500/30">
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-400/[0.08]">
                      <ScissorsIcon className="h-6 w-6 text-gold-400" />
                    </span>
                    <div>
                      <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                        {mainService.name}
                      </h2>
                      <p className="mt-1.5 flex items-center gap-2 text-sm text-neutral-400">
                        <ClockIcon className="h-4 w-4 text-gold-500/70" />
                        Duree : 30 minutes
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-ink-600 pt-4 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0 sm:text-right">
                    <p className="text-xs uppercase tracking-wider text-ink-400">
                      Tarif
                    </p>
                    <p className="mt-1 font-display text-3xl font-bold text-gold-400">
                      {formatPrice(mainService.price)}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      a regler sur place
                    </p>
                  </div>
                </div>

                {/* Adresse du rendez-vous */}
                <div className="flex flex-col gap-3 border-t border-ink-600 bg-ink-900/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-500/70" />
                    <div className="text-sm">
                      <p className="text-xs uppercase tracking-wider text-ink-400">
                        Adresse du rendez-vous
                      </p>
                      {getAddressLines().map((line, index) => (
                        <p
                          key={line}
                          className={
                            index === 0
                              ? "mt-1 font-semibold text-white"
                              : "text-neutral-300"
                          }
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  <a
                    href={SALON.googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary shrink-0 px-5 text-sm"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    Itineraire
                  </a>
                </div>
              </div>
            </div>
          )}

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
