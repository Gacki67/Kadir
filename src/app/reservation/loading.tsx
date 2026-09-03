import { SpinnerIcon } from "@/components/icons";

/** Ecran de chargement de la page de reservation (premier acces a froid). */
export default function ReservationLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <SpinnerIcon className="h-8 w-8 text-gold-400" />
      <p className="text-sm text-neutral-400">
        Chargement de la reservation…
      </p>
    </div>
  );
}
