"use client";

import { useEffect, useState } from "react";

import { formatFrenchDate, formatFrenchTime } from "@/lib/datetime";
import { apiFetch, cn } from "@/lib/utils";
import { AlertIcon, SpinnerIcon } from "@/components/icons";

type Slot = { time: string; endTime: string; available: boolean };

type AvailabilityResponse = {
  date: string;
  dayOpen: boolean;
  reason: string | null;
  slots: Slot[];
};

/**
 * Grille des horaires disponibles pour une journee.
 * Les creneaux deja pris sont affiches barres et desactives, afin que le
 * client comprenne qu'ils existent mais ne sont plus libres.
 */
export function TimeSlots({
  serviceId,
  date,
  selectedTime,
  onSelect,
  /** Incremente depuis le parent pour forcer un rechargement */
  refreshKey = 0,
}: {
  serviceId: string;
  date: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  refreshKey?: number;
}) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<AvailabilityResponse>(
      `/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${date}`,
    )
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Impossible de charger les horaires.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, date, refreshKey]);

  /* --- Chargement --------------------------------------------------------- */
  if (loading) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center gap-3 text-neutral-400">
          <SpinnerIcon className="h-5 w-5 text-gold-400" />
          <span>Recherche des creneaux disponibles…</span>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="skeleton h-12" />
          ))}
        </div>
      </div>
    );
  }

  /* --- Erreur ------------------------------------------------------------- */
  if (error) {
    return (
      <div className="card p-8 text-center">
        <AlertIcon className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-3 text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const slots = data?.slots ?? [];
  const availableCount = slots.filter((slot) => slot.available).length;

  /* --- Aucun creneau ------------------------------------------------------ */
  if (!data?.dayOpen || availableCount === 0) {
    const message = !data?.dayOpen
      ? "Le salon est ferme ce jour-la."
      : "Tous les creneaux de cette journee sont deja reserves.";

    return (
      <div className="card p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/25 bg-gold-400/5">
          <AlertIcon className="h-7 w-7 text-gold-400" />
        </div>
        <h3 className="mt-5 text-lg font-semibold">Aucun creneau disponible</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-400">
          {message} Revenez a l&apos;etape precedente pour choisir une autre
          date.
        </p>
      </div>
    );
  }

  /* --- Grille des horaires ------------------------------------------------ */
  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium capitalize text-white">
          {formatFrenchDate(date)}
        </h3>
        <p className="text-sm text-gold-400" aria-live="polite">
          {availableCount} creneau{availableCount > 1 ? "x" : ""} disponible
          {availableCount > 1 ? "s" : ""}
        </p>
      </div>

      <div
        className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5"
        role="radiogroup"
        aria-label="Choix de l'horaire"
      >
        {slots.map((slot) => {
          const isSelected = slot.time === selectedTime;

          return (
            <button
              key={slot.time}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!slot.available}
              onClick={() => onSelect(slot.time)}
              aria-label={
                slot.available
                  ? `${formatFrenchTime(slot.time)}, disponible, fin a ${formatFrenchTime(slot.endTime)}`
                  : `${formatFrenchTime(slot.time)}, deja reserve`
              }
              className={cn(
                "flex min-h-[48px] items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-all duration-150",
                isSelected &&
                  "scale-105 border-gold-400 bg-gold-gradient text-ink-950 shadow-gold",
                !isSelected &&
                  slot.available &&
                  "border-ink-500 bg-ink-800 text-white hover:border-gold-400/60 hover:bg-ink-700",
                !slot.available &&
                  "cursor-not-allowed border-ink-700 bg-ink-900/50 text-ink-400/50 line-through",
              )}
            >
              {formatFrenchTime(slot.time)}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-ink-400">
        Les horaires barres sont deja reserves. Toutes les heures sont indiquees
        en heure francaise.
      </p>
    </div>
  );
}
