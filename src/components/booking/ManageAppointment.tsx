"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SALON, getAddressLines } from "@/lib/config";
import {
  formatDuration,
  formatFrenchDate,
  formatFrenchTime,
  formatPrice,
} from "@/lib/datetime";
import { ApiError, apiFetch } from "@/lib/utils";
import {
  AlertIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  MapPinIcon,
  PhoneIcon,
  ScissorsIcon,
  SpinnerIcon,
  TagIcon,
  TrashIcon,
} from "@/components/icons";

import { Calendar } from "./Calendar";
import { TimeSlots } from "./TimeSlots";

export type ManageAppointmentData = {
  reference: string;
  firstName: string;
  lastName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
  notes: string | null;
  serviceId: string;
  serviceName: string;
};

type Mode = "view" | "reschedule" | "confirmCancel";

/**
 * Espace client accessible via le jeton securise recu par e-mail.
 * Aucun compte n'est necessaire : le jeton (256 bits) fait office d'acces.
 */
export function ManageAppointment({
  appointment: initial,
  token,
  canModify,
  cutoffHours,
}: {
  appointment: ManageAppointmentData;
  token: string;
  canModify: boolean;
  cutoffHours: number;
}) {
  const router = useRouter();

  const [appointment, setAppointment] = useState(initial);
  const [mode, setMode] = useState<Mode>("view");
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newTime, setNewTime] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [slotsRefresh, setSlotsRefresh] = useState(0);

  const cancelled = appointment.status === "CANCELLED";

  /* --- Annulation --------------------------------------------------------- */
  const handleCancel = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      await apiFetch(`/api/appointments/${token}`, { method: "DELETE" });
      setAppointment((value) => ({ ...value, status: "CANCELLED" }));
      setSuccess(
        "Votre rendez-vous a bien ete annule. Le creneau est de nouveau disponible pour d'autres clients.",
      );
      setMode("view");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "L'annulation a echoue. Merci de reessayer.",
      );
    } finally {
      setBusy(false);
    }
  };

  /* --- Deplacement -------------------------------------------------------- */
  const handleReschedule = async () => {
    if (busy || !newDate || !newTime) return;
    setBusy(true);
    setError(null);

    try {
      const response = await apiFetch<{
        appointment: {
          date: string;
          startTime: string;
          endTime: string;
        };
      }>(`/api/appointments/${token}`, {
        method: "PATCH",
        body: JSON.stringify({ date: newDate, time: newTime }),
      });

      setAppointment((value) => ({
        ...value,
        date: response.appointment.date,
        startTime: response.appointment.startTime,
        endTime: response.appointment.endTime,
      }));
      setSuccess(
        "Votre rendez-vous a bien ete deplace. Une confirmation vient de vous etre envoyee.",
      );
      setMode("view");
      setNewDate(null);
      setNewTime(null);
      router.refresh();
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message);
        if (cause.code === "SLOT_TAKEN" || cause.status === 409) {
          setNewTime(null);
          setSlotsRefresh((value) => value + 1);
        }
      } else {
        setError("Le deplacement a echoue. Merci de reessayer.");
      }
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto max-w-2xl">
      {/* --- Messages --- */}
      {success && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4"
        >
          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <p className="text-sm leading-relaxed text-emerald-200">{success}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4"
        >
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm leading-relaxed text-red-200">{error}</p>
        </div>
      )}

      {/* --- Fiche du rendez-vous --- */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-600 bg-ink-900/50 px-6 py-4">
          <h2 className="font-semibold text-white">Votre rendez-vous</h2>
          <span className={cancelled ? "badge-danger" : "badge-success"}>
            {cancelled ? "Annule" : "Confirme"}
          </span>
        </div>

        <dl className="divide-y divide-ink-700">
          <Row Icon={ScissorsIcon} label="Prestation" value={appointment.serviceName} />
          <Row
            Icon={TagIcon}
            label="Tarif"
            value={formatPrice(appointment.price)}
            extra="A regler sur place"
          />
          <Row
            Icon={CalendarIcon}
            label="Date"
            value={<span className="capitalize">{formatFrenchDate(appointment.date)}</span>}
          />
          <Row
            Icon={ClockIcon}
            label="Heure"
            value={`${formatFrenchTime(appointment.startTime)} – ${formatFrenchTime(appointment.endTime)}`}
            extra={`Duree : ${formatDuration(appointment.duration)}`}
          />
          {/* Adresse du rendez-vous — rappelee ici comme dans les e-mails. */}
          <Row
            Icon={MapPinIcon}
            label="Adresse du rendez-vous"
            value={
              <span className="block">
                {getAddressLines().map((line, index) => (
                  <span
                    key={line}
                    className={index === 0 ? "block" : "block font-normal text-neutral-300"}
                  >
                    {line}
                  </span>
                ))}
              </span>
            }
          />
        </dl>

        <div className="border-t border-ink-700 px-6 py-4">
          <a
            href={SALON.googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full text-sm"
          >
            <MapPinIcon className="h-4 w-4" />
            Obtenir l&apos;itineraire
          </a>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-ink-600 bg-ink-900/50 px-6 py-4">
          <span className="font-mono text-sm tracking-wider text-neutral-400">
            {appointment.reference}
          </span>
          <span className="font-display text-xl font-bold text-gold-400">
            {formatPrice(appointment.price)}
          </span>
        </div>
      </div>

      {/* ================= ACTIONS ================= */}
      {cancelled ? (
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-400">
            Ce rendez-vous est annule. Le creneau a ete libere.
          </p>
          <Link href="/reservation" className="btn-primary mt-5 px-8">
            Reserver un nouveau rendez-vous
          </Link>
        </div>
      ) : !canModify ? (
        /* --- Delai depasse : plus de modification en ligne --- */
        <div className="mt-6 rounded-xl border border-gold-500/25 bg-gold-400/[0.06] p-5">
          <p className="text-sm leading-relaxed text-neutral-300">
            Les modifications en ligne ne sont plus possibles moins de{" "}
            <strong className="text-white">{cutoffHours} h</strong> avant le
            rendez-vous. Pour toute demande, contactez directement le salon.
          </p>
          <a
            href={`tel:${SALON.phoneE164}`}
            className="btn-secondary mt-4 w-full sm:w-auto"
          >
            <PhoneIcon className="h-4 w-4" />
            {SALON.phone}
          </a>
        </div>
      ) : mode === "view" ? (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={`/api/appointments/${token}/ics`}
              download
              className="btn-secondary flex-1"
            >
              <DownloadIcon className="h-5 w-5" />
              Ajouter au calendrier
            </a>
            <button
              type="button"
              onClick={() => {
                setMode("reschedule");
                setError(null);
                setSuccess(null);
              }}
              className="btn-secondary flex-1"
            >
              <CalendarIcon className="h-5 w-5" />
              Deplacer le rendez-vous
            </button>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setMode("confirmCancel");
                setError(null);
                setSuccess(null);
              }}
              className="btn-danger w-full"
            >
              <TrashIcon className="h-5 w-5" />
              Annuler mon rendez-vous
            </button>
          </div>
        </>
      ) : mode === "confirmCancel" ? (
        /* --- Confirmation d'annulation --- */
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/[0.07] p-6">
          <h3 className="text-lg font-semibold text-white">
            Confirmer l&apos;annulation ?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-300">
            Votre rendez-vous du{" "}
            <strong className="capitalize text-white">
              {formatFrenchDate(appointment.date)}
            </strong>{" "}
            a{" "}
            <strong className="text-white">
              {formatFrenchTime(appointment.startTime)}
            </strong>{" "}
            sera definitivement annule et le creneau libere. Cette action est
            irreversible.
          </p>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setMode("view")}
              disabled={busy}
              className="btn-secondary flex-1"
            >
              Non, conserver
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              aria-busy={busy}
              className="btn-danger flex-1"
            >
              {busy ? (
                <>
                  <SpinnerIcon className="h-5 w-5" />
                  Annulation…
                </>
              ) : (
                <>
                  <TrashIcon className="h-5 w-5" />
                  Oui, annuler
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* --- Deplacement --- */
        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Choisir un nouveau creneau</h3>
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setNewDate(null);
                setNewTime(null);
                setError(null);
              }}
              className="btn-ghost min-h-0 px-3 py-2 text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Retour
            </button>
          </div>

          <Calendar
            serviceId={appointment.serviceId}
            selectedDate={newDate}
            onSelect={(value) => {
              setNewDate(value);
              setNewTime(null);
            }}
          />

          {newDate && (
            <TimeSlots
              serviceId={appointment.serviceId}
              date={newDate}
              selectedTime={newTime}
              onSelect={setNewTime}
              refreshKey={slotsRefresh}
            />
          )}

          {newDate && newTime && (
            <div className="card p-5">
              <p className="text-sm text-neutral-300">
                Nouveau creneau :{" "}
                <strong className="capitalize text-white">
                  {formatFrenchDate(newDate)}
                </strong>{" "}
                a{" "}
                <strong className="text-white">{formatFrenchTime(newTime)}</strong>
              </p>

              <button
                type="button"
                onClick={handleReschedule}
                disabled={busy}
                aria-busy={busy}
                className="btn-primary mt-4 w-full"
              >
                {busy ? (
                  <>
                    <SpinnerIcon className="h-5 w-5" />
                    Deplacement en cours…
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
                    Confirmer le nouveau creneau
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-400">
        Ce lien est personnel et securise. Ne le partagez pas : il donne acces a
        la gestion de votre rendez-vous.
      </p>
    </div>
  );
}

function Row({
  Icon,
  label,
  value,
  extra,
}: {
  Icon: (props: { className?: string }) => React.ReactElement;
  label: string;
  value: React.ReactNode;
  extra?: string;
}) {
  return (
    <div className="flex gap-4 px-6 py-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-500/70" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs uppercase tracking-wider text-ink-400">{label}</dt>
        <dd className="mt-1 font-medium text-white">{value}</dd>
        {extra && <p className="mt-0.5 text-sm text-neutral-400">{extra}</p>}
      </div>
    </div>
  );
}
