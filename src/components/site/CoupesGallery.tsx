"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { ScissorsIcon, XIcon } from "@/components/icons";

/**
 * Galerie "Les Coupes".
 *
 * Chaque photo pointe vers /public/coupes/<fichier>. Tant que Rayan n'a pas
 * depose ses fichiers, une vignette elegante "Photo a venir" s'affiche a la
 * place (grace au repli onError) : la page reste presentable en toutes
 * circonstances. Des que le fichier existe, la vraie photo apparait.
 */

export type Coupe = {
  src: string;
  title: string;
  caption: string;
};

export function CoupesGallery({ coupes }: { coupes: Coupe[] }) {
  const [lightbox, setLightbox] = useState<Coupe | null>(null);

  // Fermeture du lightbox au clavier + blocage du defilement de fond.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {coupes.map((coupe, index) => (
          <li key={coupe.src}>
            <button
              type="button"
              onClick={() => setLightbox(coupe)}
              className="group block w-full overflow-hidden rounded-2xl border border-ink-600 bg-ink-850 text-left transition-all duration-300 hover:border-gold-400/50 hover:shadow-card focus-visible:border-gold-400"
            >
              <span className="relative block aspect-[4/5] overflow-hidden bg-ink-800">
                <GalleryImage coupe={coupe} priority={index < 3} />
                <span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent"
                  aria-hidden="true"
                />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block font-display text-lg font-semibold text-white">
                    {coupe.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-neutral-300">
                    {coupe.caption}
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* --- Lightbox --- */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/90 p-4 backdrop-blur-sm animate-fade-in"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Fermer"
            className="btn-ghost absolute right-4 top-4 px-3"
          >
            <XIcon className="h-6 w-6" />
          </button>
          <figure
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-ink-600 bg-ink-850"
          >
            <div className="relative aspect-[4/5] max-h-[72vh] w-full bg-ink-800">
              <GalleryImage coupe={lightbox} priority contain />
            </div>
            <figcaption className="border-t border-ink-600 p-4">
              <p className="font-display text-lg font-semibold text-white">
                {lightbox.title}
              </p>
              <p className="mt-0.5 text-sm text-neutral-400">{lightbox.caption}</p>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

/** Image avec repli elegant si le fichier n'existe pas encore. */
function GalleryImage({
  coupe,
  priority,
  contain,
}: {
  coupe: Coupe;
  priority?: boolean;
  contain?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink-800 to-ink-900 text-center">
        <ScissorsIcon className="h-12 w-12 text-gold-500/30" strokeWidth={1.1} />
        <span className="px-6 text-xs uppercase tracking-[0.2em] text-ink-400">
          Photo a venir
        </span>
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={coupe.src}
      alt={`${coupe.title} — ${coupe.caption}`}
      loading={priority ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className={cn(
        "h-full w-full transition-transform duration-500 group-hover:scale-105",
        contain ? "object-contain" : "object-cover",
      )}
    />
  );
}
