import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { SALON, getPhoneDisplay, getPhoneHref } from "@/lib/config";
import { publicServiceSelect } from "@/lib/services";
import { getCurrentCustomer } from "@/lib/customer-auth-server";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AccountBookingWizard } from "@/components/booking/AccountBookingWizard";
import { PhoneIcon, SpinnerIcon, UserIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Reserver un rendez-vous",
  description: `Reservez votre rendez-vous en ligne chez ${SALON.name}. Creez votre compte, choisissez votre prestation puis votre creneau.`,
  alternates: { canonical: "/reservation" },
};

export const dynamic = "force-dynamic";

export default async function ReservationPage() {
  // La reservation en ligne exige un compte client.
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/compte?suivant=/reservation");
  }

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: publicServiceSelect,
  });

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
              Choisissez votre prestation, votre date et votre horaire. Vous
              recevez la confirmation par e-mail immediatement apres validation.
            </p>
          </div>

          {/* Bandeau "connecte en tant que" */}
          <div className="mx-auto mb-10 flex max-w-3xl items-center justify-between gap-4 rounded-xl border border-gold-500/25 bg-gold-400/[0.05] px-5 py-3 text-sm">
            <span className="flex items-center gap-2 text-neutral-300">
              <UserIcon className="h-4 w-4 text-gold-400" />
              Connecte en tant que{" "}
              <span className="font-semibold text-white">
                {customer.firstName} {customer.lastName}
              </span>
            </span>
            <Link href="/compte/mes-rendez-vous" className="text-gold-400 hover:underline">
              Mes rendez-vous
            </Link>
          </div>

          <Suspense fallback={<WizardFallback />}>
            <AccountBookingWizard
              services={services}
              customer={{
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
              }}
            />
          </Suspense>

          <p className="mx-auto mt-12 max-w-2xl text-center text-xs text-ink-400">
            Certaines prestations (mèches, lissage, botox…) se reservent
            uniquement par telephone au{" "}
            <a href={getPhoneHref()} className="text-gold-400">
              {getPhoneDisplay()}
            </a>
            .
          </p>
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
      <PhoneIcon className="hidden" />
      Chargement du formulaire de reservation…
    </div>
  );
}
