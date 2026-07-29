"use client";

import { useCallback, useEffect, useState } from "react";

import { BOOKING } from "@/lib/config";
import {
  addDays,
  formatFrenchDate,
  formatFrenchTime,
  todayKey,
} from "@/lib/datetime";
import { ApiError, apiFetch, cn } from "@/lib/utils";
import {
  AlertIcon,
  BanIcon,
  CheckIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/icons";

import { Modal } from "./Modal";

type Block = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  wholeDay: boolean;
  slotCount: number;
  createdAt: string;
};

export function BlockedSlotsManager() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ blocks: Block[] }>(
        "/api/admin/blocked-slots",
      );
      setBlocks(response.blocks);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les blocages.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const notify = (message: string) => {
    setFlash(message);
    void load();
    setTimeout(() => setFlash(null), 8000);
  };

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await apiFetch(`/api/admin/blocked-slots/${id}`, { method: "DELETE" });
      notify("Blocage leve. Les creneaux sont de nouveau reservables.");
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "La suppression a echoue.",
      );
    } finally {
      setRemoving(null);
    }
  };

  const today = todayKey();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Blocages de creneaux
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-neutral-400">
            Rendez indisponible une plage horaire ou une journee entiere : pause
            dejeuner, conge, formation, fermeture exceptionnelle. Les creneaux
            deja reserves ne sont jamais ecrases.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          Bloquer un creneau
        </button>
      </div>

      {flash && (
        <p
          role="status"
          className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
          {flash}
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

      <div className="mt-7">
        {loading ? (
          <div className="card flex items-center justify-center gap-3 py-20 text-neutral-400">
            <SpinnerIcon className="h-6 w-6 text-gold-400" />
            Chargement…
          </div>
        ) : blocks.length === 0 ? (
          <div className="card py-20 text-center">
            <BanIcon className="mx-auto h-10 w-10 text-ink-400" />
            <p className="mt-4 font-medium text-white">Aucun blocage</p>
            <p className="mt-1.5 text-sm text-neutral-400">
              Tous les creneaux d&apos;ouverture sont proposes a la reservation.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {blocks.map((block) => {
              const past = block.date < today;

              return (
                <li
                  key={block.id}
                  className={cn(
                    "card flex flex-wrap items-center gap-4 p-4 sm:p-5",
                    past && "opacity-55",
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                    <BanIcon className="h-5 w-5 text-red-400" />
                  </span>

                  <div className="min-w-[12rem] flex-1">
                    <p className="font-medium capitalize text-white">
                      {formatFrenchDate(block.date)}
                      {past && (
                        <span className="ml-2 text-xs font-normal text-ink-400">
                          (passe)
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      {block.wholeDay ? (
                        <span className="text-gold-400">Journee entiere</span>
                      ) : (
                        <>
                          {formatFrenchTime(block.startTime)} –{" "}
                          {formatFrenchTime(block.endTime)}
                        </>
                      )}{" "}
                      · {block.slotCount} creneau
                      {block.slotCount > 1 ? "x" : ""}
                    </p>
                    {block.reason && (
                      <p className="mt-1 text-sm italic text-ink-400">
                        {block.reason}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(block.id)}
                    disabled={removing === block.id}
                    className="btn-secondary min-h-0 px-3 py-2 text-sm"
                    aria-label={`Lever le blocage du ${formatFrenchDate(block.date)}`}
                  >
                    {removing === block.id ? (
                      <SpinnerIcon className="h-4 w-4" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Lever</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {creating && (
        <BlockDialog
          onClose={() => setCreating(false)}
          onCreated={(message) => {
            setCreating(false);
            notify(message);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function BlockDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (message: string) => void;
}) {
  const [date, setDate] = useState(todayKey());
  const [wholeDay, setWholeDay] = useState(false);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("14:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await apiFetch<{ message: string }>(
        "/api/admin/blocked-slots",
        {
          method: "POST",
          body: JSON.stringify({
            date,
            wholeDay,
            startTime: wholeDay ? undefined : startTime,
            endTime: wholeDay ? undefined : endTime,
            reason: reason || undefined,
          }),
        },
      );
      onCreated(response.message);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Le blocage a echoue.",
      );
      setBusy(false);
    }
  };

  return (
    <Modal title="Bloquer des creneaux" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="block-date" className="field-label">
            Date
          </label>
          <input
            id="block-date"
            type="date"
            value={date}
            min={todayKey()}
            max={addDays(todayKey(), BOOKING.maxAdvanceDays)}
            onChange={(event) => setDate(event.target.value)}
            className="field-input"
            required
          />
        </div>

        <label
          htmlFor="block-whole-day"
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-600 bg-ink-900/60 p-4"
        >
          <input
            id="block-whole-day"
            type="checkbox"
            checked={wholeDay}
            onChange={(event) => setWholeDay(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-gold-500"
          />
          <span className="text-sm leading-relaxed text-neutral-300">
            Bloquer la journee entiere
            <span className="mt-0.5 block text-xs text-ink-400">
              Toute l&apos;amplitude d&apos;ouverture de ce jour sera rendue
              indisponible.
            </span>
          </span>
        </label>

        {!wholeDay && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="block-start" className="field-label">
                De
              </label>
              <input
                id="block-start"
                type="time"
                step={BOOKING.slotDurationMinutes * 60}
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="field-input"
                required
              />
            </div>
            <div>
              <label htmlFor="block-end" className="field-label">
                a
              </label>
              <input
                id="block-end"
                type="time"
                step={BOOKING.slotDurationMinutes * 60}
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="field-input"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="block-reason" className="field-label">
            Motif <span className="font-normal text-ink-400">(facultatif)</span>
          </label>
          <input
            id="block-reason"
            value={reason}
            maxLength={200}
            onChange={(event) => setReason(event.target.value)}
            className="field-input"
            placeholder="Pause dejeuner, formation, conge…"
          />
          <p className="field-hint">
            Ce motif reste interne : il n&apos;est jamais affiche aux clients.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={busy} aria-busy={busy} className="btn-primary">
            {busy ? (
              <>
                <SpinnerIcon className="h-5 w-5" />
                Blocage…
              </>
            ) : (
              <>
                <BanIcon className="h-5 w-5" />
                Bloquer
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
