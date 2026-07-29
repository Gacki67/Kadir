import Link from "next/link";

import { DAY_NAMES, SALON, getFullAddress } from "@/lib/config";
import { formatFrenchTime, todayKey, getDayOfWeek } from "@/lib/datetime";
import type { BusinessHoursRule } from "@/lib/availability";
import { cn } from "@/lib/utils";
import {
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "@/components/icons";
import { SOCIAL_LINKS } from "./Footer";

/** Ordre francais : la semaine commence le lundi. */
const FRENCH_WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HoursSection({ hours }: { hours: BusinessHoursRule[] }) {
  const todayDow = getDayOfWeek(todayKey());

  return (
    <section id="horaires" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-kb">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow justify-center">
            <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            Informations pratiques
            <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
          </p>
          <h2 className="section-title">Horaires &amp; coordonnees</h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* --- Horaires --- */}
          <div className="card p-7 sm:p-8">
            <h3 className="flex items-center gap-3 text-lg font-semibold">
              <ClockIcon className="h-5 w-5 text-gold-400" />
              Horaires d&apos;ouverture
            </h3>

            <ul className="mt-6 divide-y divide-ink-700">
              {FRENCH_WEEK_ORDER.map((dayOfWeek) => {
                const rule = hours.find((item) => item.dayOfWeek === dayOfWeek);
                const isToday = dayOfWeek === todayDow;
                const open = rule?.active ?? false;

                return (
                  <li
                    key={dayOfWeek}
                    className={cn(
                      "flex items-center justify-between gap-4 py-3.5",
                      isToday && "-mx-3 rounded-lg bg-gold-400/[0.07] px-3",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        isToday ? "font-semibold text-white" : "text-neutral-300",
                      )}
                    >
                      {DAY_NAMES[dayOfWeek]}
                      {isToday && (
                        <span className="badge-gold text-[10px] uppercase tracking-wider">
                          Aujourd&apos;hui
                        </span>
                      )}
                    </span>

                    <span
                      className={cn(
                        "text-sm tabular-nums",
                        open ? "font-medium text-neutral-200" : "text-ink-400",
                      )}
                    >
                      {open && rule
                        ? `${formatFrenchTime(rule.openingTime)} – ${formatFrenchTime(rule.closingTime)}`
                        : "Ferme"}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 rounded-xl border border-gold-500/20 bg-gold-400/[0.06] p-4 text-sm leading-relaxed text-neutral-300">
              Les rendez-vous se prennent en ligne 24 h/24, par creneaux de
              30 minutes. Le dernier rendez-vous de la journee se termine a
              l&apos;heure de fermeture.
            </p>
          </div>

          {/* --- Coordonnees --- */}
          <div className="card flex flex-col p-7 sm:p-8">
            <h3 className="flex items-center gap-3 text-lg font-semibold">
              <MapPinIcon className="h-5 w-5 text-gold-400" />
              Nous contacter
            </h3>

            <ul className="mt-6 space-y-5">
              <li>
                <a
                  href={SALON.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-600 bg-ink-800 text-gold-400 transition-colors group-hover:border-gold-400/50">
                    <MapPinIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-ink-400">
                      Adresse
                    </span>
                    <span className="mt-0.5 block text-sm text-neutral-200 transition-colors group-hover:text-gold-400">
                      {getFullAddress()}
                    </span>
                  </span>
                </a>
              </li>

              <li>
                <a href={`tel:${SALON.phoneE164}`} className="group flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-600 bg-ink-800 text-gold-400 transition-colors group-hover:border-gold-400/50">
                    <PhoneIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-ink-400">
                      Telephone
                    </span>
                    <span className="mt-0.5 block text-sm text-neutral-200 transition-colors group-hover:text-gold-400">
                      {SALON.phone}
                    </span>
                  </span>
                </a>
              </li>

              <li>
                <a href={`mailto:${SALON.email}`} className="group flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-600 bg-ink-800 text-gold-400 transition-colors group-hover:border-gold-400/50">
                    <MailIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-wider text-ink-400">
                      E-mail
                    </span>
                    <span className="mt-0.5 block break-all text-sm text-neutral-200 transition-colors group-hover:text-gold-400">
                      {SALON.email}
                    </span>
                  </span>
                </a>
              </li>
            </ul>

            {SOCIAL_LINKS.length > 0 && (
              <div className="mt-7 border-t border-ink-700 pt-6">
                <p className="text-xs uppercase tracking-wider text-ink-400">
                  Suivez le salon
                </p>
                <div className="mt-3 flex gap-2.5">
                  {SOCIAL_LINKS.map(({ key, url, label, Icon }) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${SALON.name} sur ${label}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-600 text-neutral-400 transition-colors hover:border-gold-400/60 hover:text-gold-400"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Link href="/reservation" className="btn-primary mt-auto w-full pt-0 sm:mt-8">
              Prendre rendez-vous
            </Link>
          </div>
        </div>

        {/* --- Carte --- */}
        <div id="contact" className="mt-6 scroll-mt-20">
          <div className="card overflow-hidden">
            {SALON.googleMapsEmbedUrl ? (
              <iframe
                src={SALON.googleMapsEmbedUrl}
                title={`Carte — ${SALON.name}, ${getFullAddress()}`}
                width="100%"
                height="380"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full"
              />
            ) : (
              /* Emplacement reserve tant que l'URL Google Maps n'est pas
                 renseignee dans src/lib/config.ts */
              <div className="flex h-[380px] flex-col items-center justify-center gap-4 bg-[linear-gradient(135deg,#121215_25%,#17171b_25%,#17171b_50%,#121215_50%,#121215_75%,#17171b_75%)] bg-[length:28px_28px] p-8 text-center">
                <MapPinIcon className="h-10 w-10 text-gold-500/50" />
                <div>
                  <p className="font-semibold text-white">{getFullAddress()}</p>
                  <p className="mt-2 max-w-md text-sm text-neutral-400">
                    Emplacement reserve a la carte Google Maps. Pour l&apos;activer,
                    renseignez <code className="text-gold-400">googleMapsEmbedUrl</code>{" "}
                    dans <code className="text-gold-400">src/lib/config.ts</code>.
                  </p>
                </div>
                <a
                  href={SALON.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Ouvrir dans Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
