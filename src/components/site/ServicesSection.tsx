import Image from "next/image";
import Link from "next/link";

import { formatDuration, formatPrice } from "@/lib/datetime";
import { ArrowRightIcon, ClockIcon, ScissorsIcon } from "@/components/icons";

export type PublicService = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  imageUrl: string | null;
};

export function ServicesSection({ services }: { services: PublicService[] }) {
  return (
    <section id="prestations" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-kb">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow justify-center">
            <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            Nos prestations
            <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
          </p>
          <h2 className="section-title">Un savoir-faire, plusieurs services</h2>
          <p className="mt-5 text-neutral-400">
            Chaque prestation est realisee avec le meme soin, quel que soit le
            temps qu&apos;elle demande. Les tarifs sont fermes et affiches.
          </p>
        </div>

        {services.length === 0 ? (
          <p className="mt-14 text-center text-neutral-400">
            Les prestations seront bientot disponibles. Contactez-nous
            directement pour prendre rendez-vous.
          </p>
        ) : (
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.id}>
                <article className="card group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:border-gold-400/40 hover:shadow-card">
                  {/* --- Visuel --- */}
                  <div className="relative h-44 shrink-0 overflow-hidden bg-ink-800">
                    {service.imageUrl ? (
                      <Image
                        src={service.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      // Emplacement de repli quand aucune image n'est fournie.
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-800 to-ink-900">
                        <ScissorsIcon
                          className="h-12 w-12 text-gold-500/25"
                          strokeWidth={1.25}
                        />
                      </div>
                    )}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-ink-850 via-ink-850/20 to-transparent"
                      aria-hidden="true"
                    />
                  </div>

                  {/* --- Contenu --- */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-semibold leading-snug">
                        {service.name}
                      </h3>
                      <span className="shrink-0 whitespace-nowrap font-display text-xl font-bold text-gold-400">
                        {formatPrice(service.price)}
                      </span>
                    </div>

                    <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-400">
                      {service.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-ink-600 pt-4">
                      <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                        <ClockIcon className="h-4 w-4 text-gold-500/70" />
                        {formatDuration(service.duration)}
                      </span>

                      <Link
                        href={`/reservation?prestation=${service.id}`}
                        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-gold-400 transition-colors hover:bg-gold-400/10"
                      >
                        Reserver
                        <ArrowRightIcon className="h-4 w-4" />
                        <span className="sr-only">la prestation {service.name}</span>
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
