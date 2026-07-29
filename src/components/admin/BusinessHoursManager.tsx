"use client";

import { useState } from "react";

import type { BusinessHoursRule } from "@/lib/availability";
import { DAY_NAMES } from "@/lib/config";
import { generateSlotGrid } from "@/lib/availability";
import { ApiError, apiFetch, cn } from "@/lib/utils";
import { AlertIcon, CheckIcon, ClockIcon, SpinnerIcon } from "@/components/icons";

/** Ordre francais : la semaine commence le lundi. */
const FRENCH_WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function BusinessHoursManager({
  initialHours,
  slotDuration,
}: {
  initialHours: BusinessHoursRule[];
  slotDuration: number;
}) {
  const [hours, setHours] = useState<BusinessHoursRule[]>(() =>
    // On garantit la presence des 7 jours, meme si la base est incomplete.
    Array.from({ length: 7 }, (_, dayOfWeek) => {
      const found = initialHours.find((rule) => rule.dayOfWeek === dayOfWeek);
      return (
        found ?? {
          dayOfWeek,
          openingTime: "09:00",
          closingTime: "21:00",
          active: false,
        }
      );
    }),
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const update = (
    dayOfWeek: number,
    patch: Partial<BusinessHoursRule>,
  ) => {
    setSaved(false);
    setHours((previous) =>
      previous.map((rule) =>
        rule.dayOfWeek === dayOfWeek ? { ...rule, ...patch } : rule,
      ),
    );
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      await apiFetch("/api/admin/business-hours", {
        method: "PUT",
        body: JSON.stringify({ hours }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 6000);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "L'enregistrement a echoue.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          Horaires d&apos;ouverture
        </h1>
        <p className="mt-1.5 text-sm text-neutral-400">
          Ces horaires determinent les creneaux proposes aux clients. Un jour
          desactive n&apos;apparait pas dans le calendrier de reservation.
        </p>
      </div>

      {saved && (
        <p
          role="status"
          className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
          Horaires enregistres. Les nouveaux creneaux sont deja pris en compte.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
          {error}
        </p>
      )}

      <div className="card mt-7 divide-y divide-ink-700">
        {FRENCH_WEEK_ORDER.map((dayOfWeek) => {
          const rule = hours.find((item) => item.dayOfWeek === dayOfWeek);
          if (!rule) return null;

          const slotCount = rule.active
            ? generateSlotGrid(rule.openingTime, rule.closingTime, slotDuration)
                .length
            : 0;

          return (
            <div
              key={dayOfWeek}
              className={cn(
                "flex flex-wrap items-center gap-4 p-4 sm:p-5",
                !rule.active && "opacity-60",
              )}
            >
              {/* Activation */}
              <label
                htmlFor={`jour-${dayOfWeek}`}
                className="flex min-w-[10rem] cursor-pointer items-center gap-3"
              >
                <input
                  id={`jour-${dayOfWeek}`}
                  type="checkbox"
                  checked={rule.active}
                  onChange={(event) =>
                    update(dayOfWeek, { active: event.target.checked })
                  }
                  className="h-5 w-5 shrink-0 cursor-pointer rounded accent-gold-500"
                />
                <span className="font-medium text-white">
                  {DAY_NAMES[dayOfWeek]}
                </span>
              </label>

              {/* Horaires */}
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`ouverture-${dayOfWeek}`}
                    className="text-sm text-ink-400"
                  >
                    De
                  </label>
                  <input
                    id={`ouverture-${dayOfWeek}`}
                    type="time"
                    step={slotDuration * 60}
                    value={rule.openingTime}
                    disabled={!rule.active}
                    onChange={(event) =>
                      update(dayOfWeek, { openingTime: event.target.value })
                    }
                    className="field-input w-auto py-2"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`fermeture-${dayOfWeek}`}
                    className="text-sm text-ink-400"
                  >
                    a
                  </label>
                  <input
                    id={`fermeture-${dayOfWeek}`}
                    type="time"
                    step={slotDuration * 60}
                    value={rule.closingTime}
                    disabled={!rule.active}
                    onChange={(event) =>
                      update(dayOfWeek, { closingTime: event.target.value })
                    }
                    className="field-input w-auto py-2"
                  />
                </div>
              </div>

              {/* Nombre de creneaux */}
              <p className="flex min-w-[9rem] items-center gap-1.5 text-sm text-ink-400">
                <ClockIcon className="h-4 w-4" />
                {rule.active ? (
                  <>
                    {slotCount} creneau{slotCount > 1 ? "x" : ""} de{" "}
                    {slotDuration} min
                  </>
                ) : (
                  "Ferme"
                )}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-xs leading-relaxed text-ink-400">
          Le dernier rendez-vous se termine exactement a l&apos;heure de
          fermeture : avec une fermeture a 21 h 00 et des creneaux de{" "}
          {slotDuration} minutes, le dernier depart est a 20 h 30. La duree des
          creneaux se modifie dans{" "}
          <code className="text-gold-400">src/lib/config.ts</code>.
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          aria-busy={busy}
          className="btn-primary"
        >
          {busy ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              Enregistrement…
            </>
          ) : (
            <>
              <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
              Enregistrer les horaires
            </>
          )}
        </button>
      </div>
    </div>
  );
}
