import Link from "next/link";

import { SALON, getFullAddress, getPhoneDisplay, getPhoneHref } from "@/lib/config";
import { ArrowRightIcon, PhoneIcon } from "@/components/icons";

export function FinalCta() {
  const address = getFullAddress();

  return (
    <section className="relative overflow-hidden border-t border-ink-700 py-20 sm:py-28">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,146,79,0.14),transparent_65%)]" />
      </div>

      <div className="container-kb text-center">
        <h2 className="mx-auto max-w-3xl text-[clamp(2rem,6vw,3.25rem)] font-bold leading-tight">
          Votre prochaine coupe commence{" "}
          <span className="text-gold-gradient">ici</span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
          Creez votre compte, choisissez votre prestation et votre creneau, et
          c&apos;est reserve. Vous recevez la confirmation par e-mail dans la
          foulee.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/reservation"
            className="btn-primary group w-full px-9 text-base sm:w-auto"
          >
            Reserver un rendez-vous
            <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          <a href={getPhoneHref()} className="btn-secondary w-full px-9 text-base sm:w-auto">
            <PhoneIcon className="h-5 w-5" />
            {getPhoneDisplay()}
          </a>
        </div>

        {address && <p className="mt-8 text-sm text-neutral-400">{address}</p>}
        <p className="mt-2 text-sm text-ink-400">
          {SALON.openingSoon
            ? "Ouverture prochaine · Reservation en ligne disponible 24 h/24"
            : "Reservation en ligne disponible 24 h/24 · Rappel automatique avant le rendez-vous"}
        </p>
      </div>
    </section>
  );
}
