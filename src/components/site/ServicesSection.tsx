import Image from "next/image";
import Link from "next/link";

import { formatDuration, formatPrice } from "@/lib/datetime";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  ScissorsIcon,
} from "@/components/icons";

export type PublicService = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  imageUrl: string | null;
};

/** Ce qui est compris dans la prestation — purement informatif. */
const INCLUDED = [
  "Coupe personnalisee, aux ciseaux ou a la tondeuse",
  "Moustache mise en forme",
  "Barbe travaillee et finie au rasoir",
  "Contours nets, serviette chaude et soin apaisant",
];

export function ServicesSection({ services }: { services: PublicService[] }) {
  const single = services.length === 1 ? services[0] : null;

  return (
    <section id="prestations" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-kb">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow justify-center">
            <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            La prestation
            <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
          </p>
          <h2 className="section-title">Une seule formule, tout comprise</h2>
          <p className="mt-5 text-neutral-400">
            Pas de catalogue a eplucher, pas d&apos;options a cocher. Une
            prestation complete, un tarif clair, un creneau de 30 minutes
            reserve pour vous.
          </p>
        </div>

        {/* ---------- Prestation unique ---------- */}
        {single ? (
          <div className="mx-auto mt-14 max-w-4xl">
            <article className="card overflow-hidden shadow-card">
              <div className="grid md:grid-cols-5">
                {/* Visuel */}
                <div className="relative h-48 bg-ink-800 md:col-span-2 md:h-full md:min-h-[22rem]">
                  {single.imageUrl ? (
                    <Image
                      src={single.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-800 to-ink-900">
                      <ScissorsIcon
                        className="h-16 w-16 text-gold-500/25"
                        strokeWidth={1.15}
                      />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-ink-850/90 via-ink-850/20 to-transparent md:bg-gradient-to-r"
                    aria-hidden="true"
                  />
                </div>

                {/* Contenu */}
                <div className="flex flex-col p-7 sm:p-9 md:col-span-3">
                  <h3 className="font-display text-2xl font-bold leading-snug sm:text-3xl">
                    {single.name}
                  </h3>

                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <span className="flex items-center gap-2 text-sm text-neutral-300">
                      <ClockIcon className="h-4 w-4 text-gold-500/80" />
                      Duree : {formatDuration(single.duration)}
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm text-neutral-400">Tarif :</span>
                      <span className="font-display text-3xl font-bold text-gold-400">
                        {formatPrice(single.price)}
                      </span>
                    </span>
                  </div>

                  <p className="mt-5 leading-relaxed text-neutral-400">
                    {single.description}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex gap-3 text-sm">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                        <span className="text-neutral-300">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/reservation"
                    className="btn-primary group mt-8 w-full sm:w-auto sm:self-start sm:px-8"
                  >
                    Reserver ce creneau
                    <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <p className="mt-4 text-xs text-ink-400">
                    Reglement sur place · Du lundi au vendredi, 9 h – 21 h
                  </p>
                </div>
              </div>
            </article>
          </div>
        ) : services.length === 0 ? (
          <p className="mt-14 text-center text-neutral-400">
            La prestation sera bientot disponible a la reservation.
            Contactez-nous directement pour prendre rendez-vous.
          </p>
        ) : (
          /* ---------- Repli : plusieurs prestations activees depuis l'admin ---------- */
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.id}>
                <article className="card group flex h-full flex-col overflow-hidden transition-all duration-300 hover:border-gold-400/40 hover:shadow-card">
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
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-800 to-ink-900">
                        <ScissorsIcon
                          className="h-12 w-12 text-gold-500/25"
                          strokeWidth={1.25}
                        />
                      </div>
                    )}
                  </div>

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
                        <span className="sr-only">
                          la prestation {service.name}
                        </span>
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
