"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";

/** Identifiants d'etape — independants de leur position dans le parcours. */
export type StepKey = "service" | "date" | "time" | "details" | "summary";

export type BookingStep = {
  key: StepKey;
  label: string;
  shortLabel: string;
};

const STEP_DEFINITIONS: Record<StepKey, BookingStep> = {
  service: { key: "service", label: "Prestation", shortLabel: "Prestation" },
  date: { key: "date", label: "Date", shortLabel: "Date" },
  time: { key: "time", label: "Heure", shortLabel: "Heure" },
  details: { key: "details", label: "Vos coordonnees", shortLabel: "Infos" },
  summary: { key: "summary", label: "Recapitulatif", shortLabel: "Resume" },
};

/**
 * Construit le parcours.
 *
 * Le salon ne proposant qu'une seule prestation, l'etape de choix est retiree :
 * le client commence directement par la date. Si plusieurs prestations etaient
 * activees un jour depuis l'espace administrateur, l'etape reapparaitrait
 * automatiquement.
 */
export function buildSteps(includeServiceStep: boolean): BookingStep[] {
  const keys: StepKey[] = includeServiceStep
    ? ["service", "date", "time", "details", "summary"]
    : ["date", "time", "details", "summary"];
  return keys.map((key) => STEP_DEFINITIONS[key]);
}

/**
 * Barre de progression du parcours de reservation.
 * Les etapes deja franchies sont cliquables pour revenir en arriere.
 */
export function ProgressBar({
  steps,
  current,
  maxReached,
  onStepClick,
}: {
  steps: BookingStep[];
  /** Cle de l'etape affichee */
  current: StepKey;
  /** Cle de l'etape la plus avancee atteinte */
  maxReached: StepKey;
  onStepClick: (key: StepKey) => void;
}) {
  const currentIndex = steps.findIndex((step) => step.key === current);
  const maxIndex = steps.findIndex((step) => step.key === maxReached);
  const percent =
    steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 100;

  return (
    <nav aria-label="Progression de la reservation" className="w-full">
      {/* Annonce vocale de l'etape en cours */}
      <p className="sr-only" aria-live="polite">
        Etape {currentIndex + 1} sur {steps.length} : {steps[currentIndex]?.label}
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

        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isReachable = index <= maxIndex && !isCurrent;

          return (
            <li
              key={step.key}
              className="relative z-10 flex flex-1 flex-col items-center gap-2"
            >
              <button
                type="button"
                onClick={() => isReachable && onStepClick(step.key)}
                disabled={!isReachable}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Etape ${index + 1} : ${step.label}${
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
                {isDone ? (
                  <CheckIcon className="h-4 w-4" strokeWidth={3} />
                ) : (
                  index + 1
                )}
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
