import { SpinnerIcon } from "@/components/icons";

/**
 * Ecran de chargement de l'espace de Ryan.
 *
 * Affiche pendant que le tableau de bord se prepare — utile lors du premier
 * acces apres une periode d'inactivite (la base de donnees gratuite se
 * "reveille" en quelques secondes). Evite l'impression que la page est figee.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <SpinnerIcon className="h-8 w-8 text-gold-400" />
      <div>
        <p className="font-display text-lg font-semibold text-white">
          Chargement de votre espace…
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          Quelques secondes au premier acces, puis c&apos;est instantane.
        </p>
      </div>
    </div>
  );
}
