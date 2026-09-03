import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { SALON, getPhoneDisplay, getPhoneHref } from "@/lib/config";
import { publicServiceSelect } from "@/lib/services";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ServicesCatalog } from "@/components/site/ServicesCatalog";
import { PhoneIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Prestations & tarifs",
  description: `Toutes les prestations de ${SALON.name} : coupe, barbe, coiffage, chignons, brushings, lissage et soins. Tarifs clairs et reservation en ligne.`,
  alternates: { canonical: "/prestations" },
};

export const dynamic = "force-dynamic";

export default async function PrestationsPage() {
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
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="section-eyebrow justify-center">
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
              Prestations &amp; tarifs
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            </p>
            <h1 className="section-title">La carte du salon</h1>
            <p className="mt-5 text-neutral-400">
              Homme, femme, junior, lissage et soins : choisissez votre
              prestation puis votre creneau. Certaines prestations se reservent
              uniquement par telephone.
            </p>
          </div>

          <ServicesCatalog services={services} />

          <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-gold-500/25 bg-gold-400/[0.05] p-6 text-center">
            <p className="text-sm text-neutral-300">
              Une question sur une prestation ou besoin d&apos;un conseil ?
            </p>
            <a
              href={getPhoneHref()}
              className="btn-secondary mt-4 inline-flex px-6"
            >
              <PhoneIcon className="h-4 w-4" />
              Appeler le {getPhoneDisplay()}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
