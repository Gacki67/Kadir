"use client";

import { useCallback, useEffect, useState } from "react";

import { formatDuration, formatPrice } from "@/lib/datetime";
import { ApiError, apiFetch, cn } from "@/lib/utils";
import {
  AlertIcon,
  CheckIcon,
  EditIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/icons";

import { Modal } from "./Modal";

type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  appointmentCount: number;
};

type FormState = {
  name: string;
  description: string;
  duration: string;
  /** Saisi en euros dans l'interface */
  price: string;
  imageUrl: string;
  sortOrder: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  duration: "30",
  price: "25",
  imageUrl: "",
  sortOrder: "0",
  active: true,
};

export function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ services: Service[] }>(
        "/api/admin/services",
      );
      setServices(response.services);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les prestations.",
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
    setTimeout(() => setFlash(null), 6000);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Prestations</h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            Nom, description, duree et tarif. Les modifications sont visibles
            immediatement sur le site.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          Nouvelle prestation
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

      <div className="mt-7">
        {loading ? (
          <div className="card flex items-center justify-center gap-3 py-20 text-neutral-400">
            <SpinnerIcon className="h-6 w-6 text-gold-400" />
            Chargement…
          </div>
        ) : error ? (
          <div className="card py-16 text-center">
            <AlertIcon className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-3 text-red-400">{error}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="card py-20 text-center">
            <p className="text-neutral-400">
              Aucune prestation. Creez-en une pour ouvrir les reservations.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {services.map((service) => (
              <li
                key={service.id}
                className={cn(
                  "card flex flex-wrap items-center gap-4 p-4 sm:p-5",
                  !service.active && "opacity-60",
                )}
              >
                <div className="min-w-[12rem] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-white">{service.name}</h2>
                    {!service.active && (
                      <span className="badge-neutral">Desactivee</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                    {service.description || (
                      <span className="italic text-ink-400">
                        Aucune description
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-400">
                    Ordre d&apos;affichage : {service.sortOrder} ·{" "}
                    {service.appointmentCount} rendez-vous lie
                    {service.appointmentCount > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-xl font-bold text-gold-400">
                    {formatPrice(service.price)}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {formatDuration(service.duration)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(service)}
                    className="btn-secondary min-h-0 px-3 py-2 text-sm"
                    aria-label={`Modifier ${service.name}`}
                  >
                    <EditIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Modifier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(service)}
                    className="btn-danger min-h-0 px-3 py-2 text-sm"
                    aria-label={`Supprimer ${service.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(creating || editing) && (
        <ServiceDialog
          service={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(message) => {
            setCreating(false);
            setEditing(null);
            notify(message);
          }}
        />
      )}

      {deleting && (
        <DeleteServiceDialog
          service={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(message) => {
            setDeleting(null);
            notify(message);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ServiceDialog({
  service,
  onClose,
  onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<FormState>(
    service
      ? {
          name: service.name,
          description: service.description,
          duration: String(service.duration),
          price: (service.price / 100).toFixed(2),
          imageUrl: service.imageUrl ?? "",
          sortOrder: String(service.sortOrder),
          active: service.active,
        }
      : EMPTY_FORM,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    setFieldErrors({});

    // Le prix est saisi en euros, stocke en centimes.
    const priceCents = Math.round(Number(form.price.replace(",", ".")) * 100);

    const payload = {
      name: form.name,
      description: form.description,
      duration: Number(form.duration),
      price: priceCents,
      imageUrl: form.imageUrl || undefined,
      sortOrder: Number(form.sortOrder),
      active: form.active,
    };

    try {
      if (service) {
        await apiFetch(`/api/admin/services/${service.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onSaved("Prestation mise a jour.");
      } else {
        await apiFetch("/api/admin/services", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        onSaved("Prestation creee.");
      }
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message);
        if (cause.fields) setFieldErrors(cause.fields);
      } else {
        setError("L'enregistrement a echoue.");
      }
      setBusy(false);
    }
  };

  return (
    <Modal
      title={service ? "Modifier la prestation" : "Nouvelle prestation"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="svc-name" className="field-label">
            Nom
          </label>
          <input
            id="svc-name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            className={cn("field-input", fieldErrors.name && "field-input-error")}
            placeholder="Coupe homme"
            required
          />
          {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="svc-description" className="field-label">
            Description
          </label>
          <textarea
            id="svc-description"
            rows={3}
            maxLength={400}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            className="field-input resize-y"
            placeholder="Coupe personnalisee, shampoing et coiffage inclus."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="svc-duration" className="field-label">
              Duree (min)
            </label>
            <input
              id="svc-duration"
              type="number"
              min={5}
              max={480}
              step={5}
              value={form.duration}
              onChange={(event) => update("duration", event.target.value)}
              className={cn(
                "field-input",
                fieldErrors.duration && "field-input-error",
              )}
              required
            />
            {fieldErrors.duration && (
              <p className="field-error">{fieldErrors.duration}</p>
            )}
          </div>

          <div>
            <label htmlFor="svc-price" className="field-label">
              Prix (€)
            </label>
            <input
              id="svc-price"
              type="number"
              min={0}
              step="0.5"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
              className={cn("field-input", fieldErrors.price && "field-input-error")}
              required
            />
            {fieldErrors.price && (
              <p className="field-error">{fieldErrors.price}</p>
            )}
          </div>

          <div>
            <label htmlFor="svc-order" className="field-label">
              Ordre
            </label>
            <input
              id="svc-order"
              type="number"
              min={0}
              max={999}
              value={form.sortOrder}
              onChange={(event) => update("sortOrder", event.target.value)}
              className="field-input"
            />
          </div>
        </div>

        <p className="field-hint -mt-2">
          La duree est arrondie au creneau de 30 minutes superieur pour le
          blocage de l&apos;agenda.
        </p>

        <div>
          <label htmlFor="svc-image" className="field-label">
            URL de l&apos;image{" "}
            <span className="font-normal text-ink-400">(facultatif)</span>
          </label>
          <input
            id="svc-image"
            type="url"
            value={form.imageUrl}
            onChange={(event) => update("imageUrl", event.target.value)}
            className={cn(
              "field-input",
              fieldErrors.imageUrl && "field-input-error",
            )}
            placeholder="https://…/photo.jpg ou /photos/coupe.jpg"
          />
          {fieldErrors.imageUrl && (
            <p className="field-error">{fieldErrors.imageUrl}</p>
          )}
          <p className="field-hint">
            Les domaines externes doivent etre autorises dans{" "}
            <code className="text-gold-400">next.config.ts</code>.
          </p>
        </div>

        <label
          htmlFor="svc-active"
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-600 bg-ink-900/60 p-4"
        >
          <input
            id="svc-active"
            type="checkbox"
            checked={form.active}
            onChange={(event) => update("active", event.target.checked)}
            className="h-5 w-5 shrink-0 cursor-pointer rounded accent-gold-500"
          />
          <span className="text-sm text-neutral-300">
            Prestation active (visible et reservable sur le site)
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

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={busy} aria-busy={busy} className="btn-primary">
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
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

function DeleteServiceDialog({
  service,
  onClose,
  onDeleted,
}: {
  service: Service;
  onClose: () => void;
  onDeleted: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await apiFetch<{ message?: string }>(
        `/api/admin/services/${service.id}`,
        { method: "DELETE" },
      );
      onDeleted(response.message ?? "Prestation supprimee.");
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "La suppression a echoue.",
      );
      setBusy(false);
    }
  };

  return (
    <Modal title="Supprimer la prestation ?" onClose={onClose}>
      <p className="text-sm leading-relaxed text-neutral-300">
        Voulez-vous supprimer <strong className="text-white">{service.name}</strong> ?
      </p>

      {service.appointmentCount > 0 && (
        <p className="mt-4 rounded-xl border border-gold-500/30 bg-gold-400/[0.07] p-4 text-sm text-neutral-300">
          Cette prestation est liee a{" "}
          <strong className="text-white">
            {service.appointmentCount} rendez-vous
          </strong>
          . Elle sera <strong className="text-white">desactivee</strong> plutot
          que supprimee, afin de conserver l&apos;historique. Elle
          disparaitra du site immediatement.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="btn-secondary">
          Annuler
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          aria-busy={busy}
          className="btn-danger"
        >
          {busy ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              Suppression…
            </>
          ) : (
            <>
              <TrashIcon className="h-5 w-5" />
              {service.appointmentCount > 0 ? "Desactiver" : "Supprimer"}
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
