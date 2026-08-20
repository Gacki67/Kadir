"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PublicService } from "@/lib/services";
import { groupByCategory } from "@/lib/services";
import { getAddressLines, hasAddress } from "@/lib/config";
import {
  addMinutesToTime,
  formatDuration,
  formatFrenchDate,
  formatFrenchTime,
  formatPrice,
} from "@/lib/datetime";
import { ApiError, apiFetch, cn } from "@/lib/utils";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  ScissorsIcon,
  SpinnerIcon,
  UserIcon,
} from "@/components/icons";

import { Calendar } from "./Calendar";
import { TimeSlots } from "./TimeSlots";

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type Step = "service" | "date" | "time" | "summary";
const ORDER: Step[] = ["service", "date", "time", "summary"];
const STEP_LABEL: Record<Step, string> = {
  service: "Prestation",
  date: "Date",
  time: "Heure",
  summary: "Confirmation",
};

type CreateResponse = { appointment: { reference: string; manageToken: string } };

export function AccountBookingWizard({
  services,
  customer,
}: {
  services: PublicService[];
  customer: Customer;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Seules les prestations reservables en ligne sont proposees dans le tunnel.
  const bookable = useMemo(
    () => services.filter((s) => s.bookableOnline),
    [services],
  );
  const groups = useMemo(() => groupByCategory(bookable), [bookable]);

  const [activeCat, setActiveCat] = useState(groups[0]?.key ?? "HOMME");
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<PublicService | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slotsRefresh, setSlotsRefresh] = useState(0);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const submitLock = useRef(false);

  /* --- Preselection via ?prestation=<id> --------------------------------- */
  useEffect(() => {
    const pre = searchParams.get("prestation");
    if (!pre) return;
    const match = bookable.find((s) => s.id === pre);
    if (match) {
      setService(match);
      setActiveCat(match.category as typeof activeCat);
      setStep("date");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, bookable]);

  useEffect(() => {
    headingRef.current?.focus();
    if (typeof window !== "undefined" && ORDER.indexOf(step) > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const goTo = useCallback((next: Step) => {
    setStep(next);
    setSubmitError(null);
  }, []);

  const chooseService = (next: PublicService) => {
    if (service?.id !== next.id) setTime(null);
    setService(next);
    goTo("date");
  };
  const chooseDate = (next: string) => {
    setDate(next);
    setTime(null);
    goTo("time");
  };
  const chooseTime = (next: string) => {
    setTime(next);
    goTo("summary");
  };

  const confirmBooking = async () => {
    if (!service || !date || !time) return;
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await apiFetch<CreateResponse>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          serviceId: service.id,
          date,
          time,
          notes: notes.trim() || undefined,
        }),
      });
      router.push(`/reservation/confirmee/${response.appointment.manageToken}`);
    } catch (error) {
      submitLock.current = false;
      setSubmitting(false);
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        if (error.status === 401) {
          router.push("/compte?suivant=/reservation");
          return;
        }
        if (error.code === "SLOT_TAKEN" || error.status === 409) {
          setTime(null);
          setSlotsRefresh((v) => v + 1);
          setStep("time");
        }
      } else {
        setSubmitError("Une erreur est survenue. Merci de reessayer.");
      }
    }
  };

  const currentIndex = ORDER.indexOf(step);
  const HEADINGS: Record<Step, string> = {
    service: "Choisissez votre prestation",
    date: "Choisissez une date",
    time: "Choisissez un horaire",
    summary: "Verifiez votre reservation",
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* --- Fil d'etapes --- */}
      <ol className="mb-10 flex items-center gap-2">
        {ORDER.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const reachable = i <= currentIndex;
          return (
            <li key={s} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && goTo(s)}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  active && "border-gold-400 bg-gold-gradient text-ink-950",
                  done && "border-gold-500/50 bg-gold-400/10 text-gold-300",
                  !active && !done && "border-ink-600 text-ink-400",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
              </button>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  active ? "text-white" : "text-ink-400",
                )}
              >
                {STEP_LABEL[s]}
              </span>
              {i < ORDER.length - 1 && (
                <span className="ml-1 hidden h-px flex-1 bg-ink-600 sm:block" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-2 text-2xl font-bold outline-none sm:text-3xl"
      >
        {HEADINGS[step]}
      </h2>
      <p className="mb-8 text-sm text-neutral-400">
        Etape {currentIndex + 1} sur {ORDER.length} — connecte en tant que{" "}
        <span className="text-gold-400">{customer.firstName}</span>
      </p>

      {/* ===================== ETAPE PRESTATION ===================== */}
      {step === "service" && (
        <div className="space-y-6">
          {groups.length === 0 ? (
            <div className="card p-10 text-center">
              <AlertIcon className="mx-auto h-8 w-8 text-gold-400" />
              <p className="mt-4 text-neutral-300">
                Aucune prestation reservable en ligne pour le moment.
              </p>
            </div>
          ) : (
            <>
              <div role="tablist" className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.key}
                    role="tab"
                    aria-selected={g.key === activeCat}
                    onClick={() => setActiveCat(g.key)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                      g.key === activeCat
                        ? "border-gold-400 bg-gold-gradient text-ink-950"
                        : "border-ink-600 bg-ink-850/70 text-neutral-300 hover:border-gold-400/50",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {(groups.find((g) => g.key === activeCat) ?? groups[0]).services.map(
                  (item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => chooseService(item)}
                      aria-pressed={service?.id === item.id}
                      className={cn(
                        "group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5",
                        service?.id === item.id
                          ? "border-gold-400 bg-gold-400/[0.07] shadow-gold"
                          : "border-ink-600 bg-ink-850/80 hover:border-gold-400/50 hover:bg-ink-800",
                      )}
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold-500/25 bg-gold-400/5">
                        <ScissorsIcon className="h-5 w-5 text-gold-400" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="font-semibold text-white">{item.name}</span>
                          <span className="font-display text-lg font-bold text-gold-400">
                            {formatPrice(item.price)}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-neutral-400">
                          {item.description}
                        </span>
                        <span className="mt-2 flex items-center gap-1.5 text-xs text-ink-400">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {formatDuration(item.duration)}
                        </span>
                      </span>
                      <ArrowRightIcon className="h-5 w-5 shrink-0 text-ink-400 transition-all group-hover:translate-x-1 group-hover:text-gold-400" />
                    </button>
                  ),
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================== ETAPE DATE ===================== */}
      {step === "date" && service && (
        <div className="space-y-5">
          <SelectionRecap service={service} />
          <Calendar serviceId={service.id} selectedDate={date} onSelect={chooseDate} />
          <button type="button" onClick={() => goTo("service")} className="btn-secondary">
            <ArrowLeftIcon className="h-4 w-4" />
            Changer de prestation
          </button>
        </div>
      )}

      {/* ===================== ETAPE HEURE ===================== */}
      {step === "time" && service && date && (
        <div className="space-y-5">
          <SelectionRecap service={service} date={date} />
          <TimeSlots
            serviceId={service.id}
            date={date}
            selectedTime={time}
            onSelect={chooseTime}
            refreshKey={slotsRefresh}
          />
          {submitError && <ErrorBanner message={submitError} />}
          <button type="button" onClick={() => goTo("date")} className="btn-secondary">
            <ArrowLeftIcon className="h-4 w-4" />
            Changer de date
          </button>
        </div>
      )}

      {/* ===================== ETAPE RECAP ===================== */}
      {step === "summary" && service && date && time && (
        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="border-b border-ink-600 bg-ink-900/50 px-6 py-4">
              <h3 className="font-semibold text-white">Recapitulatif de votre rendez-vous</h3>
            </div>
            <dl className="divide-y divide-ink-700">
              <RecapRow Icon={ScissorsIcon} label="Prestation" value={service.name} extra={`${formatDuration(service.duration)} · ${formatPrice(service.price)}`} />
              <RecapRow Icon={CalendarIcon} label="Date" value={<span className="capitalize">{formatFrenchDate(date)}</span>} />
              <RecapRow Icon={ClockIcon} label="Heure" value={formatFrenchTime(time)} extra={`Fin prevue vers ${formatFrenchTime(addMinutesToTime(time, service.duration))}`} />
              <RecapRow Icon={UserIcon} label="Client" value={`${customer.firstName} ${customer.lastName}`} extra={customer.phone} />
              {hasAddress() && (
                <RecapRow
                  Icon={MapPinIcon}
                  label="Adresse du rendez-vous"
                  value={
                    <span className="block">
                      {getAddressLines().map((line, i) => (
                        <span key={line} className={cn("block", i > 0 && "font-normal text-neutral-300")}>
                          {line}
                        </span>
                      ))}
                    </span>
                  }
                />
              )}
            </dl>
            <div className="border-t border-ink-600 bg-ink-900/50 px-6 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-neutral-400">Total a regler sur place</span>
                <span className="font-display text-2xl font-bold text-gold-400">
                  {formatPrice(service.price)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="field-label">
              Un commentaire pour Rayan ? (facultatif)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ex. : degrade bas, garder de la longueur dessus…"
              className="field-input resize-none"
            />
          </div>

          {submitError && <ErrorBanner message={submitError} />}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => goTo("time")} disabled={submitting} className="btn-secondary">
              <ArrowLeftIcon className="h-4 w-4" />
              Modifier
            </button>
            <button
              type="button"
              onClick={confirmBooking}
              disabled={submitting}
              aria-busy={submitting}
              className="btn-primary px-8 text-base"
            >
              {submitting ? (
                <>
                  <SpinnerIcon className="h-5 w-5" />
                  Confirmation…
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
                  Confirmer definitivement
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SelectionRecap({
  service,
  date,
}: {
  service: PublicService;
  date?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-600 bg-ink-850/60 px-4 py-3 text-sm">
      <span className="flex items-center gap-1.5 text-gold-400">
        <ScissorsIcon className="h-4 w-4" />
        <span className="font-medium">{service.name}</span>
      </span>
      <span className="text-ink-400">·</span>
      <span className="text-neutral-400">{formatDuration(service.duration)}</span>
      <span className="text-ink-400">·</span>
      <span className="font-medium text-gold-400">{formatPrice(service.price)}</span>
      {date && (
        <>
          <span className="text-ink-400">·</span>
          <span className="capitalize text-neutral-300">{formatFrenchDate(date)}</span>
        </>
      )}
    </div>
  );
}

function RecapRow({
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
      <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      <p className="text-sm leading-relaxed text-red-200">{message}</p>
    </div>
  );
}
