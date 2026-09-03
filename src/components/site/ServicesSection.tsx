import Link from "next/link";

import type { PublicService } from "@/lib/services";
import { groupByCategory } from "@/lib/services";
import { formatPrice } from "@/lib/datetime";
import { ArrowRightIcon, RazorIcon, ScissorsIcon, SparkleIcon } from "@/components/icons";

/**
 * Apercu des prestations sur la page d'accueil : une carte par categorie, avec
 * un tarif d'appel et un lien vers le catalogue complet.
 */
const CATEGORY_ICON: Record<string, (props: { className?: string }) => React.ReactElement> = {
  HOMME: ScissorsIcon,
  FEMME: SparkleIcon,
  LISSAGE: RazorIcon,
  JUNIOR: ScissorsIcon,
};

export function ServicesSection({ services }: { services: PublicService[] }) {
  const groups = groupByCategory(services);

  return (
    <section id="prestations" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-kb">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow justify-center">
            <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            Prestations
            <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
          </p>
          <h2 className="section-title">Un savoir-faire complet</h2>
          <p className="mt-5 text-neutral-400">
            Homme, femme, junior, lissage et soins. Des prestations soignees, des
            tarifs clairs, et la reservation en ligne pour la plupart d&apos;entre
            elles.
          </p>
        </div>

        {groups.length > 0 ? (
          <ul className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2">
            {groups.map((group) => {
              const from = Math.min(...group.services.map((s) => s.price));
              const Icon = CATEGORY_ICON[group.key] ?? ScissorsIcon;
              return (
                <li key={group.key}>
                  <Link
                    href="/prestations"
                    className="card group flex h-full items-center gap-5 p-6 transition-all duration-300 hover:border-gold-400/40 hover:shadow-card"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold-500/25 bg-gold-400/5">
                      <Icon className="h-7 w-7 text-gold-400" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-display text-xl font-semibold text-white">
                          {group.label}
                        </span>
                        <span className="shrink-0 text-sm text-neutral-400">
                          dès{" "}
                          <span className="font-display text-lg font-bold text-gold-400">
                            {formatPrice(from)}
                          </span>
                        </span>
                      </span>
                      <span className="mt-1 block text-sm text-neutral-400">
                        {group.tagline}
                      </span>
                      <span className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-gold-400">
                        Voir les prestations
                        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-14 text-center text-neutral-400">
            Le catalogue des prestations sera bientot disponible.
          </p>
        )}

        <div className="mt-12 text-center">
          <Link href="/prestations" className="btn-primary group px-8">
            Voir toute la carte
            <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
