"use client";

import { useState } from "react";

import type { AdminAppointment } from "@/lib/serializers";
import {
  formatDuration,
  formatFrenchDate,
  formatFrenchTime,
  formatInstantFr,
  formatPrice,
} from "@/lib/datetime";
import { formatPhoneForDisplay } from "@/lib/validation";
import { ApiError, apiFetch, cn } from "@/lib/utils";
import {
  AlertIcon,
  CheckIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/icons";

import { Modal } from "./Modal";
import { SlotPicker } from "./SlotPicker";
import type { AdminService } from "./AppointmentsDashboard";

type Mode = "view" | "edit" | "confirmCancel" | "confirmDelete";

/** Fiche detaillee d'un rendez-vous : consultation, modification, annulation. */
export function AppointmentDetail({
  appointment,
  services,
  onClose,
  onChanged,
}: {
  appointment: AdminAppointment;
  services: AdminService[];
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Champs modifiables
  const [serviceId, setServiceId] = useState(appointment.service.id);
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState<string | null>(appointment.startTime);
  const [firstName, setFirstName] = useState(appointment.firstName);
  const [lastName, setLastName] = useState(appointment.lastName);
  const [email, setEmail] = useState(appointment.email);
  const [phone, setPhone] = useState(appointment.phone);
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [status, setStatus] = useState(appointment.status);

  const cancelled = appointment.status === "CANCELLED";

  const run = async (
    action: () => Promise<void>,
    onSuccess: string,
    fallback: string,
  ) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged(onSuccess);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : fallback);
      setBusy(false);
    }
  };

  const handleSave = () =>
    run(
      async () => {
        await apiFetch(`/api/admin/appointments/${appointment.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phone,
            serviceId,
            date,
            time,
            notes: notes || null,
            status,
          }),
        });
      },
      "Rendez-vous mis a jour.",
      "La modification a echoue.",
    );

  const handleCancel = () =>
    run(
      async () => {
        await apiFetch(`/api/admin/appointments/${appointment.id}`, {
          method: "DELETE",
        });
      },
      "Rendez-vous annule. Le creneau est de nouveau disponible.",
      "L'annulation a echoue.",
    );

  const handleDelete = () =>
    run(
      async () => {
        await apiFetch(
          `/api/admin/appointments/${appointment.id}?definitif=1`,
          { method: "DELETE" },
        );
      },
      "Rendez-vous supprime definitivement.",
      "La suppression a echoue.",
    );

  return (
    <Modal
      title={`${appointment.firstName} ${appointment.lastName}`}
      subtitle={`${appointment.reference} · ${formatFrenchDate(appointment.date)} a ${formatFrenchTime(appointment.startTime)}`}
      onClose={onClose}
      size="lg"
    >
      {error && (
        <p
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {/* ==================== CONSULTATION ==================== */}
      {mode === "view" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Prestation" value={appointment.service.name} />
            <Info
              label="Duree et tarif"
              value={`${formatDuration(appointment.duration)} · ${formatPrice(appointment.price)}`}
            />
            <Info
              label="Date"
              value={
                <span className="capitalize">
                  {formatFrenchDate(appointment.date)}
                </span>
              }
            />
            <Info
              label="Horaire"
              value={`${formatFrenchTime(appointment.startTime)} – ${formatFrenchTime(appointment.endTime)}`}
            />
            <Info
              label="E-mail"
              value={
                <a
                  href={`mailto:${appointment.email}`}
                  className="break-all text-gold-400 hover:text-gold-300"
                >
                  {appointment.email}
                </a>
              }
            />
            <Info
              label="Telephone"
              value={
                <a
                  href={`tel:${appointment.phone}`}
                  className="text-gold-400 hover:text-gold-300"
                >
                  {formatPhoneForDisplay(appointment.phone)}
                </a>
              }
            />
            <Info
              label="Statut"
              value={
                <span
                  className={cancelled ? "badge-danger" : "badge-success"}
                >
                  {cancelled ? "Annule" : "Confirme"}
                </span>
              }
            />
            <Info
              label="Reserve le"
              value={formatInstantFr(new Date(appointment.createdAt))}
            />
          </div>

          {appointment.notes && (
            <div className="rounded-xl border border-ink-600 bg-ink-900/60 p-4">
              <p className="text-xs uppercase tracking-wider text-ink-400">
                Commentaire du client
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-200">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* --- Etat des notifications --- */}
          <div>
            <p className="mb-3 text-xs uppercase tracking-wider text-ink-400">
              Notifications
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <NotifyState
                Icon={MailIcon}
                label="E-mail confirm."
                sent={appointment.emailConfirmationSent}
              />
              <NotifyState
                Icon={PhoneIcon}
                label="SMS confirm."
                sent={appointment.smsConfirmationSent}
              />
              <NotifyState
                Icon={MailIcon}
                label="E-mail rappel"
                sent={appointment.emailReminderSent}
              />
              <NotifyState
                Icon={PhoneIcon}
                label="SMS rappel"
                sent={appointment.smsReminderSent}
              />
            </div>
          </div>

          {cancelled && appointment.cancelledAt && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/[0.07] p-4 text-sm text-neutral-300">
              Annule le {formatInstantFr(new Date(appointment.cancelledAt))}
              {appointment.cancelledBy === "CLIENT"
                ? " par le client."
                : " par le salon."}
            </p>
          )}

          {/* --- Actions --- */}
          <div className="flex flex-wrap gap-3 border-t border-ink-600 pt-5">
            {!cancelled && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className="btn-secondary"
                >
                  <EditIcon className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setMode("confirmCancel")}
                  className="btn-danger"
                >
                  <TrashIcon className="h-4 w-4" />
                  Annuler le RDV
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setMode("confirmDelete")}
              className="btn-ghost text-sm text-ink-400 hover:text-red-300"
            >
              Supprimer definitivement (RGPD)
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODIFICATION ==================== */}
      {mode === "edit" && (
        <div className="space-y-5">
          <div>
            <label htmlFor="edit-service" className="field-label">
              Prestation
            </label>
            <select
              id="edit-service"
              value={serviceId}
              onChange={(event) => {
                setServiceId(event.target.value);
                setTime(null);
              }}
              className="field-input"
            >
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatDuration(item.duration)}
                </option>
              ))}
              {/* La prestation d'origine peut avoir ete desactivee depuis. */}
              {!services.some((item) => item.id === appointment.service.id) && (
                <option value={appointment.service.id}>
                  {appointment.service.name} (desactivee)
                </option>
              )}
            </select>
          </div>

          <SlotPicker
            serviceId={serviceId}
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            excludeId={appointment.id}
          />

          <div className="gold-rule" />

          <div className="grid gap-4 sm:grid-cols-2">
            <EditField id="edit-firstName" label="Prenom" value={firstName} onChange={setFirstName} />
            <EditField id="edit-lastName" label="Nom" value={lastName} onChange={setLastName} />
            <EditField id="edit-email" label="E-mail" type="email" value={email} onChange={setEmail} />
            <EditField id="edit-phone" label="Telephone" type="tel" value={phone} onChange={setPhone} />
          </div>

          <div>
            <label htmlFor="edit-status" className="field-label">
              Statut
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="field-input"
            >
              <option value="CONFIRMED">Confirme</option>
              <option value="COMPLETED">Termine</option>
              <option value="NO_SHOW">Client absent</option>
              <option value="CANCELLED">Annule</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-notes" className="field-label">
              Commentaire
            </label>
            <textarea
              id="edit-notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="field-input resize-y"
            />
          </div>

          <p className="text-xs text-ink-400">
            Si vous changez la date, l&apos;heure ou la prestation, le client
            recevra automatiquement un e-mail et un SMS l&apos;informant du
            nouveau creneau.
          </p>

          <div className="flex flex-col-reverse gap-3 border-t border-ink-600 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setMode("view")}
              disabled={busy}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !time}
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
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================== CONFIRMATIONS ==================== */}
      {mode === "confirmCancel" && (
        <ConfirmPanel
          tone="danger"
          title="Annuler ce rendez-vous ?"
          text={`Le creneau du ${formatFrenchDate(appointment.date)} a ${formatFrenchTime(appointment.startTime)} sera libere et redeviendra reservable. Le client sera prevenu par e-mail et par SMS.`}
          confirmLabel="Oui, annuler"
          busy={busy}
          onCancel={() => setMode("view")}
          onConfirm={handleCancel}
        />
      )}

      {mode === "confirmDelete" && (
        <ConfirmPanel
          tone="danger"
          title="Supprimer definitivement ?"
          text="Toutes les donnees de ce rendez-vous seront effacees de la base, sans possibilite de recuperation. Utilisez cette action pour repondre a une demande de suppression (RGPD). Le client ne sera pas prevenu."
          confirmLabel="Supprimer definitivement"
          busy={busy}
          onCancel={() => setMode("view")}
          onConfirm={handleDelete}
        />
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-ink-400">{label}</p>
      <div className="mt-1 font-medium text-white">{value}</div>
    </div>
  );
}

function NotifyState({
  Icon,
  label,
  sent,
}: {
  Icon: (props: { className?: string }) => React.ReactElement;
  label: string;
  sent: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2.5",
        sent
          ? "border-emerald-500/30 bg-emerald-500/[0.07]"
          : "border-ink-600 bg-ink-900/60",
      )}
    >
      <Icon
        className={cn("h-4 w-4 shrink-0", sent ? "text-emerald-400" : "text-ink-400")}
      />
      <div className="min-w-0">
        <p className="truncate text-[11px] text-ink-400">{label}</p>
        <p
          className={cn(
            "text-xs font-medium",
            sent ? "text-emerald-300" : "text-neutral-400",
          )}
        >
          {sent ? "Envoye" : "Non envoye"}
        </p>
      </div>
    </div>
  );
}

function EditField({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
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
        className="field-input"
      />
    </div>
  );
}

function ConfirmPanel({
  title,
  text,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  tone: "danger";
  title: string;
  text: string;
  confirmLabel: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-500/40 bg-red-500/[0.07] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-300">{text}</p>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="btn-secondary"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy}
          className="btn-danger"
        >
          {busy ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              Traitement…
            </>
          ) : (
            <>
              <TrashIcon className="h-5 w-5" />
              {confirmLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
