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
 * Ryan depose ses photos dans /public/coupes (coupe-1.jpg, coupe-2.jpg, ...).
 * Modifiez simplement les titres/legendes ci-dessous. Tant qu'un fichier est
 * absent, une vignette "Photo a venir" s'affiche automatiquement.
 */
const COUPES: Coupe[] = [
  {
    src: "/coupes/coupe-1.jpg",
    title: "Crop texture & nuque travaillee",
    caption: "Coupe texturee, finitions nettes",
  },
  {
    src: "/coupes/coupe-2.jpg",
    title: "Blond travaille & fondu bas",
    caption: "Volume travaille, degrade en fondu",
  },
  {
    src: "/coupes/coupe-3.jpg",
    title: "Crop degrade & contours nets",
    caption: "Degrade a la tondeuse, contours precis",
  },
  {
    src: "/coupes/coupe-4.jpg",
    title: "Coupe courte & degrade net",
    caption: "Coupe courte, finition impeccable",
  },
  {
    src: "/coupes/coupe-5.jpg",
    title: "Coupe creative & coloration",
    caption: "Style artistique, coloration et motifs",
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
