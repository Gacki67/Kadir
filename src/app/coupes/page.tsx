import type { Metadata } from "next";
import Link from "next/link";

import { SALON } from "@/lib/config";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CoupesGallery, type Coupe } from "@/components/site/CoupesGallery";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Les Coupes",
  description: `Decouvrez les realisations de ${SALON.name} : coupes, degrades, barbes et colorations. La galerie du salon.`,
  alternates: { canonical: "/coupes" },
};

/**
 * Galerie des coupes.
 *
 * Rayan depose ses photos dans /public/coupes (coupe-1.jpg, coupe-2.jpg, ...).
 * Modifiez simplement les titres/legendes ci-dessous. Tant qu'un fichier est
 * absent, une vignette "Photo a venir" s'affiche automatiquement.
 */
const COUPES: Coupe[] = [
  {
    src: "/coupes/coupe-1.jpg",
    title: "Coupe creative & coloration",
    caption: "Style artistique, coloration et motifs",
  },
  {
    src: "/coupes/coupe-2.jpg",
    title: "Crop texture & degrade",
    caption: "Coupe texturee, finitions nettes",
  },
  {
    src: "/coupes/coupe-3.jpg",
    title: "Buzz cut & degrade net",
    caption: "Degrade precis a la tondeuse",
  },
  {
    src: "/coupes/coupe-4.jpg",
    title: "Coupe homme sur-mesure",
    caption: "Realisation du salon",
  },
  {
    src: "/coupes/coupe-5.jpg",
    title: "Barbe travaillee au rasoir",
    caption: "Contours precis et soin",
  },
  {
    src: "/coupes/coupe-6.jpg",
    title: "Coiffage & style",
    caption: "Realisation du salon",
  },
];

export default function CoupesPage() {
  return (
    <>
      <Header />
      <main id="contenu" className="min-h-screen pb-24 pt-[110px]">
        <div className="container-kb">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="section-eyebrow justify-center">
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
              La galerie
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            </p>
            <h1 className="section-title">Les Coupes</h1>
            <p className="mt-5 text-neutral-400">
              Un apercu du savoir-faire du salon : coupes, degrades, barbes et
              colorations. Touchez une photo pour l&apos;agrandir.
            </p>
          </div>

          <CoupesGallery coupes={COUPES} />

          <div className="mt-14 text-center">
            <Link href="/reservation" className="btn-primary group px-8">
              Reserver ma coupe
              <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
