"use client";

import Link from "next/link";
import { useState } from "react";

import type { PublicService } from "@/lib/services";
import { groupByCategory } from "@/lib/services";
import { getPhoneDisplay, getPhoneHref } from "@/lib/config";
import { formatDuration, formatPrice } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, ClockIcon, PhoneIcon } from "@/components/icons";

/**
 * Catalogue complet des prestations, organise en onglets par categorie.
 * - Prestation reservable en ligne  -> bouton "Choisir".
 * - Prestation non reservable        -> invite a appeler le salon.
 */
export function ServicesCatalog({ services }: { services: PublicService[] }) {
  const groups = groupByCategory(services);
  const [active, setActive] = useState(groups[0]?.key ?? "HOMME");

  if (groups.length === 0) {
    return (
      <p className="mt-10 text-center text-neutral-400">
        Le catalogue des prestations sera bientot disponible.
      </p>
    );
  }

  const current = groups.find((g) => g.key === active) ?? groups[0];

  return (
    <div className="mx-auto max-w-4xl">
      {/* --- Onglets categories --- */}
      <div
        role="tablist"
        aria-label="Categories de prestations"
        className="mb-8 flex flex-wrap items-center justify-center gap-2"
      >
        {groups.map((group) => (
          <button
            key={group.key}
            role="tab"
            aria-selected={group.key === current.key}
            onClick={() => setActive(group.key)}
            className={cn(
              "rounded-full border px-5 py-2.5 text-sm font-semibold transition-all",
              group.key === current.key
                ? "border-gold-400 bg-gold-gradient text-ink-950 shadow-gold"
                : "border-ink-600 bg-ink-850/70 text-neutral-300 hover:border-gold-400/50 hover:text-white",
            )}
          >
            {group.label}
          </button>
        ))}
      </div>

      <p className="mb-6 text-center text-sm text-neutral-400">
        {current.tagline}
      </p>

      {/* --- Liste des prestations de la categorie active --- */}
      <ul className="space-y-3">
        {current.services.map((service) => (
          <li key={service.id}>
            <article className="card flex flex-col gap-4 p-5 transition-colors hover:border-gold-400/40 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold leading-snug text-white">
                  {service.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                  {service.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                  <span className="font-display text-xl font-bold text-gold-400">
                    {formatPrice(service.price)}
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <ClockIcon className="h-4 w-4 text-gold-500/70" />
                    {formatDuration(service.duration)}
                  </span>
                </div>
              </div>

              <div className="shrink-0 sm:text-right">
                {service.bookableOnline ? (
                  <Link
                    href={`/reservation?prestation=${service.id}`}
                    className="btn-primary w-full px-6 sm:w-auto"
                  >
                    Choisir
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                ) : (
                  <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
                    <a href={getPhoneHref()} className="btn-secondary w-full px-6 sm:w-auto">
                      <PhoneIcon className="h-4 w-4" />
                      Reserver par telephone
                    </a>
                    <span className="text-xs text-ink-400">
                      Appelez le {getPhoneDisplay()}
                    </span>
                  </div>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
