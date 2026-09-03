import Link from "next/link";

import {
  SALON,
  getPhoneDisplay,
  getPhoneHref,
  hasAddress,
} from "@/lib/config";
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TikTokIcon,
} from "@/components/icons";
import { Logo } from "./Logo";
import { CodeButton } from "./CodeButton";

/**
 * Reseaux sociaux « a suivre » (les entrees vides sont ignorees).
 * Renseignez Instagram, Facebook ou TikTok dans `src/lib/config.ts`.
 */
export const SOCIAL_LINKS = [
  { key: "instagram", url: SALON.social.instagram, label: "Instagram", Icon: InstagramIcon },
  { key: "facebook", url: SALON.social.facebook, label: "Facebook", Icon: FacebookIcon },
  { key: "tiktok", url: SALON.social.tiktok, label: "TikTok", Icon: TikTokIcon },
].filter((item) => Boolean(item.url));

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
    <CodeButton />
    <footer className="border-t border-ink-700 bg-ink-950">
      <div className="container-kb py-14">
        <div className="grid gap-10 md:grid-cols-3">
          {/* --- Identite --- */}
          <div>
            <Logo size="md" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-neutral-400">
              {SALON.shortDescription}
            </p>

            {SOCIAL_LINKS.length > 0 && (
              <div className="mt-6 flex gap-2.5">
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
            )}
          </div>

          {/* --- Coordonnees --- */}
          <div>
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
              Nous contacter
            </h2>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-500/70" />
                <a
                  href={getPhoneHref()}
                  className="text-neutral-300 transition-colors hover:text-gold-400"
                >
                  <span className="block text-xs uppercase tracking-wider text-ink-400">
                    Telephone
                  </span>
                  {getPhoneDisplay()}
                </a>
              </li>

              {hasAddress() && (
                <li className="flex gap-3">
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-500/70" />
                  <address className="not-italic">
                    <span className="block font-medium text-white">
                      {SALON.name}
                    </span>
                    <span className="block text-neutral-300">
                      {SALON.address.street}
                    </span>
                    <span className="block text-neutral-300">
                      {SALON.address.postalCode} {SALON.address.city}
                    </span>
                  </address>
                </li>
              )}

              {SALON.email && (
                <li className="flex gap-3">
                  <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-500/70" />
                  <a
                    href={`mailto:${SALON.email}`}
                    className="break-all text-neutral-300 transition-colors hover:text-gold-400"
                  >
                    {SALON.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* --- Liens --- */}
          <div>
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
              Informations
            </h2>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/reservation", label: "Prendre rendez-vous" },
                { href: "/prestations", label: "Prestations & tarifs" },
                { href: "/coupes", label: "Les Coupes" },
                { href: "/#horaires", label: "Horaires d'ouverture" },
                { href: "/mentions-legales", label: "Mentions legales" },
                { href: "/confidentialite", label: "Politique de confidentialite" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-300 transition-colors hover:text-gold-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link href="/reservation" className="btn-primary mt-7 w-full sm:w-auto">
              Reserver en ligne
            </Link>
          </div>
        </div>

        <div className="gold-rule my-10" />

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-ink-400 sm:flex-row">
          <p>
            © {year} {SALON.name}. Tous droits reserves.
          </p>
          <p>
            Vos coordonnees servent uniquement a gerer et rappeler votre
            rendez-vous.
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}
