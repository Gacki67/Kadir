"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminAppointment } from "@/lib/serializers";
import {
  addDays,
  formatCompactFrenchDate,
  formatFrenchDate,
  formatFrenchTime,
  formatPrice,
  startOfWeek,
  todayKey,
} from "@/lib/datetime";
import { formatPhoneForDisplay } from "@/lib/validation";
import { ApiError, apiFetch, cn } from "@/lib/utils";
import {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  SpinnerIcon,
} from "@/components/icons";

import { AppointmentDetail } from "./AppointmentDetail";
import { NewAppointmentDialog } from "./NewAppointmentDialog";

export type AdminService = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type ListResponse = {
  appointments: AdminAppointment[];
  stats: {
    today: number;
    upcoming: number;
    cancelled: number;
    revenue: number;
  };
};

const PERIODS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois-ci" },
  { value: "upcoming", label: "A venir" },
  { value: "all", label: "Tout" },
] as const;

const STATUSES = [
  { value: "all", label: "Tous les statuts" },
  { value: "CONFIRMED", label: "Confirme" },
  { value: "CANCELLED", label: "Annule" },
  { value: "COMPLETED", label: "Termine" },
  { value: "NO_SHOW", label: "Absent" },
] as const;

const REMINDERS = [
  { value: "all", label: "Rappel : tous" },
  { value: "sent", label: "Rappel envoye" },
  { value: "pending", label: "Rappel non envoye" },
] as const;

export function AppointmentsDashboard({
  services,
  providers,
}: {
  services: AdminService[];
  providers: { email: string; sms: string };
}) {
  const [period, setPeriod] = useState<string>("today");
  const [status, setStatus] = useState<string>("all");
  const [reminder, setReminder] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminAppointment | null>(null);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  /* --- Recherche differee (evite une requete a chaque frappe) ------------ */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  /* --- Chargement --------------------------------------------------------- */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      periode: period,
      statut: status,
      rappel: reminder,
    });
    if (debouncedSearch) params.set("q", debouncedSearch);

    try {
      setData(await apiFetch<ListResponse>(`/api/admin/appointments?${params}`));
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les rendez-vous.",
      );
    } finally {
      setLoading(false);
    }
  }, [period, status, reminder, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Affiche un message temporaire et recharge la liste. */
  const notify = (message: string) => {
    setFlash(message);
    void load();
    setTimeout(() => setFlash(null), 6000);
  };

  const appointments = data?.appointments ?? [];

  return (
    <div>
      {/* ================= EN-TETE ================= */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Rendez-vous</h1>
          <p className="mt-1.5 text-sm capitalize text-neutral-400">
            {formatFrenchDate(todayKey())}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          Nouveau rendez-vous
        </button>
      </div>

      {/* ================= INDICATEURS ================= */}
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Aujourd'hui"
          value={data?.stats.today ?? 0}
          hint="rendez-vous confirmes"
        />
        <StatCard
          label="A venir"
          value={data?.stats.upcoming ?? 0}
          hint="a partir d'aujourd'hui"
        />
        <StatCard
          label="Annules"
          value={data?.stats.cancelled ?? 0}
          hint="sur la periode a venir"
          tone="muted"
        />
        <StatCard
          label="Total affiche"
          value={formatPrice(data?.stats.revenue ?? 0)}
          hint="hors rendez-vous annules"
          tone="gold"
        />
      </div>

      {/* --- Etat des services de notification --- */}
      {(providers.email === "console" || providers.sms === "console") && (
        <p className="mt-5 flex items-start gap-3 rounded-xl border border-gold-500/30 bg-gold-400/[0.07] p-4 text-sm text-neutral-300">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
          <span>
            <strong className="text-white">Mode developpement.</strong>{" "}
            {providers.email === "console" && "Les e-mails "}
            {providers.email === "console" && providers.sms === "console" && "et "}
            {providers.sms === "console" && "les SMS "}
            {providers.email === "console" && providers.sms === "console"
              ? "ne sont pas envoyes"
              : "ne sont pas envoyes"}{" "}
            : le contenu s&apos;affiche dans les logs du serveur. Renseignez les
            cles API dans le fichier <code className="text-gold-400">.env</code>{" "}
            pour activer l&apos;envoi reel.
          </span>
        </p>
      )}

      {flash && (
        <p
          role="status"
          className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
          {flash}
        </p>
      )}

      {/* ================= FILTRES ================= */}
      <div className="mt-7 space-y-3">
        {/* Periode */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Periode">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              aria-pressed={period === item.value}
              className={cn(
                "min-h-[40px] rounded-full border px-4 text-sm font-medium transition-colors",
                period === item.value
                  ? "border-gold-400 bg-gold-400/12 text-gold-400"
                  : "border-ink-600 bg-ink-850 text-neutral-300 hover:border-ink-500 hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="relative min-w-[15rem] flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, e-mail, telephone ou reference…"
              aria-label="Rechercher un client"
              className="field-input py-2.5 pl-10"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filtrer par statut"
            className="field-input w-auto py-2.5"
          >
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={reminder}
            onChange={(event) => setReminder(event.target.value)}
            aria-label="Filtrer par etat du rappel"
            className="field-input w-auto py-2.5"
          >
            {REMINDERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          {/* Bascule liste / calendrier */}
          <div className="flex overflow-hidden rounded-xl border border-ink-600">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={cn(
                "flex min-h-[44px] items-center gap-2 px-4 text-sm font-medium transition-colors",
                view === "list"
                  ? "bg-gold-400/12 text-gold-400"
                  : "text-neutral-300 hover:bg-ink-800",
              )}
            >
              <ListIcon className="h-4 w-4" />
              Liste
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              aria-pressed={view === "calendar"}
              className={cn(
                "flex min-h-[44px] items-center gap-2 border-l border-ink-600 px-4 text-sm font-medium transition-colors",
                view === "calendar"
                  ? "bg-gold-400/12 text-gold-400"
                  : "text-neutral-300 hover:bg-ink-800",
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              Calendrier
            </button>
          </div>
        </div>
      </div>

      {/* ================= RESULTATS ================= */}
      <div className="mt-6">
        {loading ? (
          <div className="card flex items-center justify-center gap-3 py-20 text-neutral-400">
            <SpinnerIcon className="h-6 w-6 text-gold-400" />
            Chargement des rendez-vous…
          </div>
        ) : error ? (
          <div className="card py-16 text-center">
            <AlertIcon className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-3 text-red-400">{error}</p>
            <button type="button" onClick={() => void load()} className="btn-secondary mt-5">
              Reessayer
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="card py-20 text-center">
            <CalendarIcon className="mx-auto h-10 w-10 text-ink-400" />
            <p className="mt-4 font-medium text-white">Aucun rendez-vous</p>
            <p className="mt-1.5 text-sm text-neutral-400">
              Aucun resultat pour ces filtres.
            </p>
          </div>
        ) : view === "list" ? (
          <AppointmentsList
            appointments={appointments}
            onSelect={setSelected}
          />
        ) : (
          <WeekCalendar
            appointments={appointments}
            onSelect={setSelected}
          />
        )}
      </div>

      {/* ================= FENETRES ================= */}
      {selected && (
        <AppointmentDetail
          appointment={selected}
          services={services}
          onClose={() => setSelected(null)}
          onChanged={(message) => {
            setSelected(null);
            notify(message);
          }}
        />
      )}

      {creating && (
        <NewAppointmentDialog
          services={services}
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
/*  Indicateur                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint: string;
  tone?: "default" | "gold" | "muted";
}) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-xs uppercase tracking-wider text-ink-400">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold sm:text-3xl",
          tone === "gold" && "text-gold-400",
          tone === "muted" && "text-neutral-400",
          tone === "default" && "text-white",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-400">{hint}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Vue liste                                                                  */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { className: string; label: string }> = {
    CONFIRMED: { className: "badge-success", label: "Confirme" },
    CANCELLED: { className: "badge-danger", label: "Annule" },
    COMPLETED: { className: "badge-neutral", label: "Termine" },
    NO_SHOW: { className: "badge-danger", label: "Absent" },
    PENDING: { className: "badge-gold", label: "En attente" },
  };
  const entry = map[status] ?? map.PENDING;
  return <span className={entry.className}>{entry.label}</span>;
}

function AppointmentsList({
  appointments,
  onSelect,
}: {
  appointments: AdminAppointment[];
  onSelect: (appointment: AdminAppointment) => void;
}) {
  // Regroupement par jour, pour une lecture rapide de la journee.
  const groups = useMemo(() => {
    const map = new Map<string, AdminAppointment[]>();
    for (const appointment of appointments) {
      const list = map.get(appointment.date) ?? [];
      list.push(appointment);
      map.set(appointment.date, list);
    }
    return Array.from(map.entries());
  }, [appointments]);

  return (
    <div className="space-y-7">
      {groups.map(([date, items]) => (
        <section key={date}>
          <h2 className="mb-3 flex items-center gap-3 text-sm font-semibold capitalize text-gold-400">
            {formatFrenchDate(date)}
            <span className="h-px flex-1 bg-ink-600" aria-hidden="true" />
            <span className="text-xs font-normal text-ink-400">
              {items.length} RDV
            </span>
          </h2>

          <ul className="space-y-2">
            {items.map((appointment) => (
              <li key={appointment.id}>
                <button
                  type="button"
                  onClick={() => onSelect(appointment)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border border-ink-600 bg-ink-850/70 p-4 text-left transition-colors hover:border-gold-400/40 hover:bg-ink-800",
                    appointment.status === "CANCELLED" && "opacity-55",
                  )}
                >
                  {/* Heure */}
                  <div className="w-[4.5rem] shrink-0 text-center">
                    <div className="font-display text-lg font-bold tabular-nums text-white">
                      {formatFrenchTime(appointment.startTime)}
                    </div>
                    <div className="text-xs text-ink-400">
                      {formatFrenchTime(appointment.endTime)}
                    </div>
                  </div>

                  <div
                    className="h-11 w-px shrink-0 bg-ink-600"
                    aria-hidden="true"
                  />

                  {/* Client */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate font-semibold text-white",
                        appointment.status === "CANCELLED" && "line-through",
                      )}
                    >
                      {appointment.firstName} {appointment.lastName}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-neutral-400">
                      {appointment.service.name} ·{" "}
                      {formatPhoneForDisplay(appointment.phone)}
                    </p>
                  </div>

                  {/* Statut + notifications */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge status={appointment.status} />
                    <span className="flex items-center gap-1 text-[11px] text-ink-400">
                      <span
                        title={
                          appointment.emailConfirmationSent
                            ? "E-mail de confirmation envoye"
                            : "E-mail de confirmation non envoye"
                        }
                        className={
                          appointment.emailConfirmationSent
                            ? "text-emerald-400"
                            : "text-ink-500"
                        }
                      >
                        ✉
                      </span>
                      <span
                        title={
                          appointment.smsConfirmationSent
                            ? "SMS de confirmation envoye"
                            : "SMS de confirmation non envoye"
                        }
                        className={
                          appointment.smsConfirmationSent
                            ? "text-emerald-400"
                            : "text-ink-500"
                        }
                      >
                        ✆
                      </span>
                      <span
                        title={
                          appointment.emailReminderSent
                            ? "Rappel envoye"
                            : "Rappel non envoye"
                        }
                        className={
                          appointment.emailReminderSent
                            ? "text-gold-400"
                            : "text-ink-500"
                        }
                      >
                        ⏰
                      </span>
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Vue calendrier (semaine)                                                   */
/* -------------------------------------------------------------------------- */

function WeekCalendar({
  appointments,
  onSelect,
}: {
  appointments: AdminAppointment[];
  onSelect: (appointment: AdminAppointment) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayKey()));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, AdminAppointment[]>();
    for (const appointment of appointments) {
      if (appointment.status === "CANCELLED") continue;
      const list = map.get(appointment.date) ?? [];
      list.push(appointment);
      map.set(appointment.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [appointments]);

  const today = todayKey();

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-600 p-4">
        <button
          type="button"
          onClick={() => setWeekStart((value) => addDays(value, -7))}
          className="btn-secondary min-h-0 px-4 py-2 text-sm"
        >
          Semaine precedente
        </button>

        <p className="text-sm font-medium text-white">
          {formatCompactFrenchDate(weekStart)} —{" "}
          {formatCompactFrenchDate(addDays(weekStart, 6))}
        </p>

        <button
          type="button"
          onClick={() => setWeekStart((value) => addDays(value, 7))}
          className="btn-secondary min-h-0 px-4 py-2 text-sm"
        >
          Semaine suivante
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[54rem] grid-cols-7 divide-x divide-ink-700">
          {days.map((day) => {
            const items = byDay.get(day) ?? [];
            const isToday = day === today;

            return (
              <div key={day} className="min-h-[22rem]">
                <div
                  className={cn(
                    "border-b border-ink-700 p-3 text-center",
                    isToday && "bg-gold-400/[0.07]",
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      isToday ? "text-gold-400" : "text-ink-400",
                    )}
                  >
                    {formatCompactFrenchDate(day)}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    {items.length} RDV
                  </p>
                </div>

                <ul className="space-y-1.5 p-2">
                  {items.map((appointment) => (
                    <li key={appointment.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(appointment)}
                        className="w-full rounded-lg border border-gold-500/25 bg-gold-400/[0.07] p-2 text-left transition-colors hover:border-gold-400/60 hover:bg-gold-400/12"
                      >
                        <p className="text-xs font-bold tabular-nums text-gold-400">
                          {formatFrenchTime(appointment.startTime)}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-medium text-white">
                          {appointment.firstName} {appointment.lastName}
                        </p>
                        <p className="truncate text-[11px] text-neutral-400">
                          {appointment.service.name}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <p className="border-t border-ink-700 px-4 py-3 text-xs text-ink-400">
        Seuls les rendez-vous charges par les filtres actuels sont affiches.
        Choisissez « Ce mois-ci » ou « Tout » pour une vue complete.
      </p>
    </div>
  );
}
