import Image from "next/image";
import Link from "next/link";

import { SALON } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Logo du salon.
 *
 * Si `SALON.logoUrl` est renseigne dans src/lib/config.ts, l'image est
 * affichee. Sinon, on retombe sur un logo typographique — le site reste donc
 * presentable meme sans fichier logo.
 */
export function Logo({
  className,
  size = "md",
  asLink = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
}) {
  const sizes = {
    sm: { image: 32, title: "text-base", sub: "text-[9px]" },
    md: { image: 40, title: "text-lg sm:text-xl", sub: "text-[10px]" },
    lg: { image: 56, title: "text-2xl sm:text-3xl", sub: "text-[11px]" },
  }[size];

  const content = (
    <span className={cn("flex items-center gap-3", className)}>
      {SALON.logoUrl ? (
        <Image
          src={SALON.logoUrl}
          alt={`Logo ${SALON.name}`}
          width={sizes.image}
          height={sizes.image}
          className="h-auto w-auto object-contain"
          style={{ maxHeight: sizes.image }}
          priority
        />
      ) : (
        // Monogramme de repli : les initiales dans un cadre dore.
        <span
          className="flex shrink-0 items-center justify-center rounded-lg border border-gold-500/50 bg-ink-800 font-display font-bold text-gold-400"
          style={{
            width: sizes.image,
            height: sizes.image,
            fontSize: sizes.image * 0.42,
          }}
          aria-hidden="true"
        >
          ER
        </span>
      )}

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-bold uppercase tracking-wider text-white",
            sizes.title,
          )}
        >
          {SALON.name}
        </span>
        <span
          className={cn(
            "mt-1 uppercase tracking-[0.3em] text-gold-500/80",
            sizes.sub,
          )}
        >
          Barbier · Coiffeur
        </span>
      </span>
    </span>
  );

  if (!asLink) return content;

  return (
    <Link
      href="/"
      className="rounded-lg transition-opacity hover:opacity-85"
      aria-label={`${SALON.name} — retour a l'accueil`}
    >
      {content}
    </Link>
  );
}
