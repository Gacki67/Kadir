"use client";

import { useEffect, useMemo, useState } from "react";

import { BOOKING, DAY_NAMES_SHORT, MONTH_NAMES } from "@/lib/config";
import {
  addDays,
  daysBetween,
  daysInMonth,
  getDayOfWeek,
  todayKey,
} from "@/lib/datetime";
import { apiFetch } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SpinnerIcon,
} from "@/components/icons";

type MonthResponse = {
  month: string;
  days: Record<string, { open: boolean; hasAvailability: boolean }>;
};

type DayState = {
  dateKey: string;
  dayNumber: number;
  /** Le salon travaille-t-il ce jour-la ? */
  open: boolean;
  /** Reste-t-il au moins un creneau libre ? */
  available: boolean;
  isToday: boolean;
  isPast: boolean;
  isTooFar: boolean;
};

/**
 * Calendrier mensuel de reservation.
 *
 * - semaine a la francaise (lundi en premier) ;
 * - samedis, dimanches, jours passes et jours complets desactives ;
 * - un point dore signale les jours ou il reste de la place ;
 * - entierement navigable au clavier (fleches, Origine, Fin).
 */
export function Calendar({
  serviceId,
  selectedDate,
  onSelect,
}: {
  serviceId: string;
  selectedDate: string | null;
  onSelect: (dateKey: string) => void;
}) {
  const today = useMemo(() => todayKey(), []);
  const maxDate = useMemo(
    () => addDays(today, BOOKING.maxAdvanceDays),
    [today],
  );

  const [viewMonth, setViewMonth] = useState(
    () => (selectedDate ?? today).slice(0, 7),
  );
  const [availability, setAvailability] = useState<MonthResponse["days"]>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* --- Chargement des disponibilites du mois affiche -------------------- */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<MonthResponse>(
      `/api/availability?serviceId=${encodeURIComponent(serviceId)}&month=${viewMonth}`,
    )
      .then((data) => {
        if (!cancelled) setAvailability(data.days);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Impossible de charger le calendrier. Verifiez votre connexion et reessayez.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, viewMonth]);

  /* --- Construction de la grille ---------------------------------------- */
  const days = useMemo<DayState[]>(() => {
    const first = `${viewMonth}-01`;
    const total = daysInMonth(first);

    return Array.from({ length: total }, (_, index) => {
      const dateKey = addDays(first, index);
      const info = availability[dateKey];
      const delta = daysBetween(today, dateKey);

      return {
        dateKey,
        dayNumber: index + 1,
        open: info?.open ?? false,
        available: info?.hasAvailability ?? false,
        isToday: dateKey === today,
        isPast: delta < 0,
        isTooFar: delta > BOOKING.maxAdvanceDays,
      };
    });
  }, [viewMonth, availability, today]);

  /** Cases vides avant le 1er du mois (semaine commencant le lundi). */
  const leadingBlanks = useMemo(() => {
    const dow = getDayOfWeek(`${viewMonth}-01`);
    return dow === 0 ? 6 : dow - 1;
  }, [viewMonth]);

  const [year, month] = viewMonth.split("-").map(Number);
  const canGoPrevious = `${viewMonth}-01` > today.slice(0, 7) + "-01";
  const canGoNext = `${viewMonth}-01` < maxDate.slice(0, 7) + "-01";

  const shiftMonth = (delta: number) => {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setViewMonth(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  };

  const isSelectable = (day: DayState) =>
    day.open && day.available && !day.isPast && !day.isTooFar;

  /** Navigation au clavier a l'interieur de la grille. */
  const handleKeyDown = (event: React.KeyboardEvent, dateKey: string) => {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 7,
      ArrowUp: -7,
    };
    const delta = moves[event.key];
    if (delta === undefined) return;

    event.preventDefault();
    const target = addDays(dateKey, delta);

    // Changement de mois automatique si l'on sort de la grille.
    if (target.slice(0, 7) !== viewMonth) {
      if (target < today || target > maxDate) return;
      setViewMonth(target.slice(0, 7));
    }

    // Le focus est repris apres le rendu.
    requestAnimationFrame(() => {
      document.getElementById(`jour-${target}`)?.focus();
    });
  };

  return (
    <div className="card overflow-hidden">
      {/* --- En-tete : navigation entre les mois --- */}
      <div className="flex items-center justify-between border-b border-ink-600 p-3 sm:p-4">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoPrevious}
          className="btn-ghost h-11 w-11 min-h-0 px-0"
          aria-label="Mois precedent"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <h3
          className="font-display text-lg font-semibold capitalize text-white sm:text-xl"
          aria-live="polite"
        >
          {MONTH_NAMES[month - 1]} {year}
        </h3>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={!canGoNext}
          className="btn-ghost h-11 w-11 min-h-0 px-0"
          aria-label="Mois suivant"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="relative p-3 sm:p-4">
        {/* --- Voile de chargement --- */}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink-850/70 backdrop-blur-[2px]">
            <SpinnerIcon className="h-7 w-7 text-gold-400" />
            <span className="sr-only">Chargement du calendrier…</span>
          </div>
        )}

        {error ? (
          <div className="py-10 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => setViewMonth((value) => value)}
              className="btn-secondary mt-4"
            >
              Reessayer
            </button>
          </div>
        ) : (
          <>
            {/* --- En-tetes des jours --- */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
                <div
                  key={dow}
                  className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-ink-400"
                  aria-hidden="true"
                >
                  {DAY_NAMES_SHORT[dow]}
                </div>
              ))}
            </div>

            {/* --- Grille des jours --- */}
            <div
              className="grid grid-cols-7 gap-1"
              role="grid"
              aria-label={`Calendrier de ${MONTH_NAMES[month - 1]} ${year}`}
            >
              {Array.from({ length: leadingBlanks }, (_, index) => (
                <div key={`vide-${index}`} role="presentation" />
              ))}

              {days.map((day) => {
                const selectable = isSelectable(day);
                const isSelected = day.dateKey === selectedDate;

                return (
                  <button
                    key={day.dateKey}
                    id={`jour-${day.dateKey}`}
                    type="button"
                    role="gridcell"
                    disabled={!selectable}
                    onClick={() => selectable && onSelect(day.dateKey)}
                    onKeyDown={(event) => handleKeyDown(event, day.dateKey)}
                    aria-selected={isSelected}
                    aria-label={
                      `${day.dayNumber} ${MONTH_NAMES[month - 1]} ${year}` +
                      (selectable
                        ? ", disponible"
                        : day.isPast
                          ? ", date passee"
                          : !day.open
                            ? ", salon ferme"
                            : ", complet")
                    }
                    className={cn(
                      "relative flex aspect-square min-h-[44px] flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-150",
                      isSelected &&
                        "scale-105 bg-gold-gradient font-bold text-ink-950 shadow-gold",
                      !isSelected &&
                        selectable &&
                        "bg-ink-800 text-white hover:scale-105 hover:bg-ink-700 hover:ring-1 hover:ring-gold-400/50",
                      !selectable &&
                        "cursor-not-allowed text-ink-400/60 line-through decoration-ink-500/60",
                      day.isToday &&
                        !isSelected &&
                        "ring-1 ring-inset ring-gold-500/50",
                    )}
                  >
                    {day.dayNumber}

                    {/* Point indiquant qu'il reste de la place */}
                    {selectable && !isSelected && (
                      <span
                        className="absolute bottom-1.5 h-1 w-1 rounded-full bg-gold-400"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* --- Legende --- */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-ink-700 pt-4 text-xs text-ink-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gold-400" aria-hidden="true" />
                Disponible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gold-gradient" aria-hidden="true" />
                Selectionne
              </span>
              <span className="flex items-center gap-1.5 line-through decoration-ink-500">
                Ferme ou complet
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
