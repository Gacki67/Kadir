import Link from "next/link";

import { LockIcon } from "@/components/icons";

/**
 * Bouton discret « Code » en bas a droite de toutes les pages publiques.
 * Reserve a Rayan : il l'ouvre pour saisir son code d'acces et rejoindre son
 * espace. Une fois connecte, le lien mene directement au tableau de bord
 * (la session est memorisee tres longtemps).
 */
export function CodeButton() {
  return (
    <Link
      href="/admin"
      aria-label="Espace de Rayan — code d'acces"
      className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-ink-600/80 bg-ink-900/85 px-4 py-2.5 text-sm font-semibold text-neutral-300 shadow-card backdrop-blur transition-colors hover:border-gold-400/70 hover:text-gold-300 active:scale-95"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <LockIcon className="h-4 w-4 text-gold-400" />
      Code
    </Link>
  );
}
