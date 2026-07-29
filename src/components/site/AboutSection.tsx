import Image from "next/image";

import { SALON } from "@/lib/config";
import { RazorIcon, ScissorsIcon, SparkleIcon } from "@/components/icons";

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

          {/* --- Galerie photos --- */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {SALON.gallery.slice(0, 4).map((photo, index) => (
              <div
                key={photo.url}
                className={[
                  "relative overflow-hidden rounded-2xl border border-ink-600 bg-ink-800",
                  // Premiere et derniere image plus hautes : composition en quinconce
                  index === 0 || index === 3 ? "aspect-[3/4]" : "aspect-square",
                  index === 1 ? "mt-8" : "",
                  index === 3 ? "-mt-8" : "",
                ].join(" ")}
              >
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
