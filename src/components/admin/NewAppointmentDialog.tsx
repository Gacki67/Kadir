"use client";

import { useState } from "react";

import { todayKey, formatDuration, formatPrice } from "@/lib/datetime";
import { ApiError, apiFetch } from "@/lib/utils";
import { AlertIcon, CheckIcon, SpinnerIcon } from "@/components/icons";

import { Modal } from "./Modal";
import { SlotPicker } from "./SlotPicker";
import type { AdminService } from "./AppointmentsDashboard";

/** Creation manuelle d'un rendez-vous depuis l'espace administrateur. */
export function NewAppointmentDialog({
  services,
  onClose,
  onCreated,
}: {
  services: AdminService[];
  onClose: () => void;
  onCreated: (message: string) => void;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sendNotifications, setSendNotifications] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canSubmit =
    Boolean(serviceId && date && time && firstName && lastName && email && phone) &&
    !busy;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    setFieldErrors({});

    try {
      await apiFetch("/api/admin/appointments", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          serviceId,
          date,
          time,
          notes: notes || undefined,
          sendNotifications,
        }),
      });

      onCreated(
        sendNotifications
          ? "Rendez-vous cree. Le client a recu sa confirmation."
          : "Rendez-vous cree (sans notification au client).",
      );
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message);
        if (cause.fields) setFieldErrors(cause.fields);
        // Creneau pris entre-temps : on reinitialise l'heure.
        if (cause.status === 409) setTime(null);
      } else {
        setError("La creation a echoue. Merci de reessayer.");
      }
      setBusy(false);
    }
  };

  const service = services.find((item) => item.id === serviceId);

  return (
    <Modal
      title="Nouveau rendez-vous"
      subtitle="Creation manuelle — par telephone ou au comptoir"
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* --- Prestation --- */}
        <div>
          <label htmlFor="new-service" className="field-label">
            Prestation
          </label>
          <select
            id="new-service"
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
              setTime(null);
            }}
            className="field-input"
            required
          >
            {services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {formatDuration(item.duration)} ·{" "}
                {formatPrice(item.price)}
              </option>
            ))}
          </select>
        </div>

        {/* --- Creneau --- */}
        {serviceId && (
          <SlotPicker
            serviceId={serviceId}
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
          />
        )}

        <div className="gold-rule" />

        {/* --- Client --- */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="new-firstName"
            label="Prenom"
            value={firstName}
            onChange={setFirstName}
            error={fieldErrors.firstName}
            autoComplete="given-name"
            required
          />
          <Field
            id="new-lastName"
            label="Nom"
            value={lastName}
            onChange={setLastName}
            error={fieldErrors.lastName}
            autoComplete="family-name"
            required
          />
          <Field
            id="new-email"
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            error={fieldErrors.email}
            autoComplete="email"
            placeholder="client@exemple.fr"
            required
          />
          <Field
            id="new-phone"
            label="Telephone"
            type="tel"
            value={phone}
            onChange={setPhone}
            error={fieldErrors.phone}
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            required
          />
        </div>

        <div>
          <label htmlFor="new-notes" className="field-label">
            Note interne <span className="font-normal text-ink-400">(facultatif)</span>
          </label>
          <textarea
            id="new-notes"
            rows={2}
            maxLength={500}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="field-input resize-y"
          />
        </div>

        {/* --- Notifications --- */}
        <label
          htmlFor="new-notify"
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-600 bg-ink-900/60 p-4"
        >
          <input
            id="new-notify"
            type="checkbox"
            checked={sendNotifications}
            onChange={(event) => setSendNotifications(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-gold-500"
          />
          <span className="text-sm leading-relaxed text-neutral-300">
            Envoyer la confirmation par e-mail et SMS au client.
            <span className="mt-0.5 block text-xs text-ink-400">
              Decochez si le client a deja ete prevenu de vive voix.
            </span>
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {/* --- Actions --- */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            aria-busy={busy}
            className="btn-primary"
          >
            {busy ? (
              <>
                <SpinnerIcon className="h-5 w-5" />
                Creation…
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
                Creer le rendez-vous
                {service ? ` (${formatPrice(service.price)})` : ""}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`field-input ${error ? "field-input-error" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
