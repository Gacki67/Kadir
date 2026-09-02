import Link from "next/link";

import { SALON } from "@/lib/config";
import {
  ArrowRightIcon,
  RazorIcon,
  ScissorsIcon,
  SparkleIcon,
} from "@/components/icons";

const HIGHLIGHTS = [
  {
    Icon: ScissorsIcon,
    title: "Coupes sur mesure",
    text: "On prend le temps d'ecouter, de conseiller, puis de tailler. Jamais l'inverse.",
  },
  {
    Icon: RazorIcon,
    title: "Rasage traditionnel",
    text: "Serviette chaude, rasoir a main levee et baume apaisant. Le geste classique, fait dans les regles.",
  },
  {
    Icon: SparkleIcon,
    title: "Produits selectionnes",
    text: "Des references professionnelles choisies pour tenir toute la journee sans alourdir.",
  },
];

export function AboutSection() {
  return (
    <section id="salon" className="scroll-mt-20 border-y border-ink-700 bg-ink-950/50 py-20 sm:py-28">
      <div className="container-kb">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* --- Texte --- */}
          <div>
            <p className="section-eyebrow">
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
              Le salon
            </p>
            <h2 className="section-title">
              Un lieu pense pour prendre son temps
            </h2>

            <div className="mt-6 space-y-4 leading-relaxed text-neutral-400">
              <p>{SALON.shortDescription}</p>
              <p>
                Chez {SALON.name}, on ne fait pas defiler les clients. Chaque
                rendez-vous a son creneau reserve, pour que vous ne patientiez
                pas et que le travail soit fait correctement, jusqu&apos;a la
                derniere finition.
              </p>
            </div>

            <ul className="mt-10 space-y-6">
              {HIGHLIGHTS.map(({ Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-500/25 bg-gold-400/5">
                    <Icon className="h-5 w-5 text-gold-400" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* --- Invitation vers la galerie "Les Coupes" --- */}
          <Link
            href="/coupes"
            className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl border border-ink-600 bg-gradient-to-br from-ink-800 to-ink-950 p-8 shadow-card transition-colors hover:border-gold-400/50"
          >
            {/* Vraie photo du salon en fond */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/coupes/coupe-2.jpg"
              alt="Réalisation de L'Espace de Rayan"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/20"
            />
            <ScissorsIcon
              className="absolute right-6 top-6 h-24 w-24 text-gold-500/20"
              strokeWidth={0.9}
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
                La galerie
              </p>
              <p className="mt-3 font-display text-3xl font-bold leading-tight text-white">
                Les Coupes du salon
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-300">
                Coupes, degrades, barbes et colorations : un apercu du
                savoir-faire de Rayan.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold-400">
                Voir les realisations
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
