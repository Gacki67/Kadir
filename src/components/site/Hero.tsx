import Link from "next/link";

import { SALON } from "@/lib/config";
import { ArrowRightIcon, ClockIcon, MapPinIcon, PhoneIcon } from "@/components/icons";

export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-[72px]">
      {/* --- Decor --- */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/* Halo dore */}
        <div className="absolute left-1/2 top-0 h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgba(212,175,79,0.14),transparent_65%)]" />
        {/* Grille fine */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse 60% 50% at 50% 40%, black, transparent 75%)",
          }}
        />
        {/* Fondu vers la section suivante */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-900" />
      </div>

      <div className="container-kb py-20 text-center">
        <p className="animate-fade-in text-xs font-semibold uppercase tracking-[0.4em] text-gold-400 sm:text-sm">
          Barbier · Coiffeur homme
        </p>

        <h1 className="mt-6 animate-fade-up text-[clamp(2.75rem,11vw,7rem)] font-bold uppercase leading-[0.92] tracking-tight">
          <span className="block text-white">Kadir</span>
          <span className="block text-gold-gradient">Barber</span>
        </h1>

        <div
          className="mx-auto mt-8 h-px w-24 bg-gold-gradient"
          aria-hidden="true"
        />

        <p
          className="mx-auto mt-8 max-w-2xl animate-fade-up text-lg leading-relaxed text-neutral-300 sm:text-xl"
          style={{ animationDelay: "80ms" }}
        >
          {SALON.tagline}
        </p>

        <p
          className="mx-auto mt-4 max-w-xl animate-fade-up text-sm leading-relaxed text-neutral-400"
          style={{ animationDelay: "140ms" }}
        >
          Prenez rendez-vous en ligne en moins d&apos;une minute, 24 h/24, depuis
          votre telephone.
        </p>

        <div
          className="mt-11 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          style={{ animationDelay: "200ms" }}
        >
          <Link
            href="/reservation"
            className="btn-primary group w-full px-8 text-base sm:w-auto"
          >
            Reserver un rendez-vous
            <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          <a
            href={`tel:${SALON.phoneE164}`}
            className="btn-secondary w-full px-8 text-base sm:w-auto"
          >
            <PhoneIcon className="h-5 w-5" />
            Appeler le salon
          </a>
        </div>

        {/* --- Informations cles --- */}
        <dl
          className="mx-auto mt-14 flex max-w-2xl animate-fade-up flex-col items-center justify-center gap-4 text-sm text-neutral-400 sm:flex-row sm:gap-8"
          style={{ animationDelay: "260ms" }}
        >
          <div className="flex items-center gap-2.5">
            <ClockIcon className="h-4 w-4 text-gold-500/80" />
            <dt className="sr-only">Horaires</dt>
            <dd>Du lundi au vendredi, 9 h – 21 h</dd>
          </div>
          <div className="hidden h-4 w-px bg-ink-600 sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            <MapPinIcon className="h-4 w-4 text-gold-500/80" />
            <dt className="sr-only">Adresse</dt>
            <dd>
              {SALON.address.street}, {SALON.address.city}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
