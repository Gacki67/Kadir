"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";

export const BOOKING_STEPS = [
  { id: 1, label: "Prestation", shortLabel: "Prestation" },
  { id: 2, label: "Date", shortLabel: "Date" },
  { id: 3, label: "Heure", shortLabel: "Heure" },
  { id: 4, label: "Vos coordonnees", shortLabel: "Infos" },
  { id: 5, label: "Recapitulatif", shortLabel: "Resume" },
] as const;

/**
 * Barre de progression du parcours de reservation.
 * Les etapes deja franchies sont cliquables pour revenir en arriere.
 */
export function ProgressBar({
  current,
  maxReached,
  onStepClick,
}: {
  current: number;
  maxReached: number;
  onStepClick: (step: number) => void;
}) {
  const percent = ((current - 1) / (BOOKING_STEPS.length - 1)) * 100;

  return (
    <nav aria-label="Progression de la reservation" className="w-full">
      {/* Annonce vocale de l'etape en cours */}
      <p className="sr-only" aria-live="polite">
        Etape {current} sur {BOOKING_STEPS.length} :{" "}
        {BOOKING_STEPS[current - 1]?.label}
      </p>

      <ol className="relative flex items-start justify-between">
        {/* Rail de fond */}
        <div
          className="absolute left-0 right-0 top-[18px] h-0.5 bg-ink-600"
          aria-hidden="true"
        />
        {/* Rail rempli */}
        <div
          className="absolute left-0 top-[18px] h-0.5 bg-gold-gradient transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        />

        {BOOKING_STEPS.map((step) => {
          const isDone = step.id < current;
          const isCurrent = step.id === current;
          const isReachable = step.id <= maxReached && step.id !== current;

          return (
            <li
              key={step.id}
              className="relative z-10 flex flex-1 flex-col items-center gap-2"
            >
              <button
                type="button"
                onClick={() => isReachable && onStepClick(step.id)}
                disabled={!isReachable}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Etape ${step.id} : ${step.label}${
                  isDone ? " (terminee)" : ""
                }`}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                  isDone &&
                    "border-gold-400 bg-gold-gradient text-ink-950 hover:scale-110",
                  isCurrent &&
                    "scale-110 border-gold-400 bg-ink-900 text-gold-400 shadow-gold",
                  !isDone &&
                    !isCurrent &&
                    "border-ink-500 bg-ink-850 text-ink-400",
                  isReachable ? "cursor-pointer" : "cursor-default",
                )}
              >
                {isDone ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : step.id}
              </button>

              <span
                className={cn(
                  "px-1 text-center text-[11px] font-medium leading-tight sm:text-xs",
                  isCurrent ? "text-gold-400" : "text-ink-400",
                )}
              >
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
