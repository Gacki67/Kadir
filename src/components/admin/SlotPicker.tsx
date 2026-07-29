"use client";

import { useEffect, useState } from "react";

import { BOOKING } from "@/lib/config";
import { addDays, formatFrenchTime, todayKey } from "@/lib/datetime";
import { apiFetch, cn } from "@/lib/utils";
import { SpinnerIcon } from "@/components/icons";

type Slot = { time: string; endTime: string; available: boolean };

/**
 * Selecteur date + heure pour l'espace administrateur.
 *
 * Utilise /api/admin/availability : le delai minimum de reservation ne
 * s'applique pas, et le rendez-vous en cours de modification (`excludeId`)
 * n'est pas compte comme occupant son propre creneau.
 */
export function SlotPicker({
  serviceId,
  date,
  time,
  onDateChange,
  onTimeChange,
  excludeId,
}: {
  serviceId: string;
  date: string;
  time: string | null;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string | null) => void;
  excludeId?: string;
}) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dayOpen, setDayOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId || !date) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ serviceId, date });
    if (excludeId) params.set("exclure", excludeId);

    apiFetch<{ slots: Slot[]; dayOpen: boolean }>(
      `/api/admin/availability?${params}`,
    )
      .then((response) => {
        if (cancelled) return;
        setSlots(response.slots);
        setDayOpen(response.dayOpen);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les creneaux.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, date, excludeId]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="picker-date" className="field-label">
          Date
        </label>
        <input
          id="picker-date"
          type="date"
          value={date}
          min={addDays(todayKey(), -365)}
          max={addDays(todayKey(), BOOKING.maxAdvanceDays)}
          onChange={(event) => {
            onDateChange(event.target.value);
            onTimeChange(null);
          }}
          className="field-input"
        />
      </div>

      <div>
        <span className="field-label">Heure</span>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-neutral-400">
            <SpinnerIcon className="h-4 w-4 text-gold-400" />
            Chargement des creneaux…
          </div>
        ) : error ? (
          <p className="py-3 text-sm text-red-400">{error}</p>
        ) : !dayOpen ? (
          <p className="rounded-xl border border-ink-600 bg-ink-900/60 p-4 text-sm text-neutral-400">
            Le salon est ferme ce jour-la. Vous pouvez tout de meme choisir un
            autre jour, ou modifier les horaires d&apos;ouverture.
          </p>
        ) : slots.length === 0 ? (
          <p className="rounded-xl border border-ink-600 bg-ink-900/60 p-4 text-sm text-neutral-400">
            Aucun creneau sur cette journee.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => onTimeChange(slot.time)}
                aria-pressed={time === slot.time}
                className={cn(
                  "min-h-[44px] rounded-lg border text-sm font-medium tabular-nums transition-colors",
                  time === slot.time
                    ? "border-gold-400 bg-gold-gradient text-ink-950"
                    : slot.available
                      ? "border-ink-600 bg-ink-800 text-white hover:border-gold-400/50"
                      : "cursor-not-allowed border-ink-700 bg-ink-900/50 text-ink-500 line-through",
                )}
              >
                {formatFrenchTime(slot.time)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
