"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PublicService } from "@/components/site/ServicesSection";
import { getAddressLines } from "@/lib/config";
import {
  addMinutesToTime,
  formatDuration,
  formatFrenchDate,
  formatFrenchTime,
  formatPrice,
} from "@/lib/datetime";
import { normalizePhone, type CustomerFormValues } from "@/lib/validation";
import { ApiError, apiFetch, cn } from "@/lib/utils";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ScissorsIcon,
  SpinnerIcon,
  UserIcon,
} from "@/components/icons";

import { buildSteps, ProgressBar, type StepKey } from "./ProgressBar";
import { Calendar } from "./Calendar";
import { TimeSlots } from "./TimeSlots";
import { DetailsForm } from "./DetailsForm";

type CreateResponse = {
  appointment: { reference: string; manageToken: string };
};

export function BookingWizard({ services }: { services: PublicService[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Le salon ne propose qu'une seule prestation : elle est selectionnee
   * automatiquement et l'etape de choix disparait du parcours.
   */
  const singleService = services.length === 1 ? services[0] : null;
  const steps = useMemo(
    () => buildSteps(singleService === null),
    [singleService],
  );

  const [step, setStep] = useState<StepKey>(singleService ? "date" : "service");
  const [maxReached, setMaxReached] = useState<StepKey>(
    singleService ? "date" : "service",
  );

  const [service, setService] = useState<PublicService | null>(singleService);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerFormValues | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Incremente pour forcer le rechargement des creneaux apres un conflit */
  const [slotsRefresh, setSlotsRefresh] = useState(0);

  const headingRef = useRef<HTMLHeadingElement>(null);
  /** Verrou anti double-clic : plus fiable qu'un state pour un envoi reseau */
  const submitLock = useRef(false);

  const stepIndex = useCallback(
    (key: StepKey) => steps.findIndex((item) => item.key === key),
    [steps],
  );

  /* --- Prestation pre-selectionnee via ?prestation=<id> ------------------ */
  useEffect(() => {
    if (singleService) return; // rien a choisir

    const preselected = searchParams.get("prestation");
    if (!preselected) return;

    const match = services.find((item) => item.id === preselected);
    if (match) {
      setService(match);
      setStep("date");
      setMaxReached("date");
    }
  }, [searchParams, services, singleService]);

  /* --- Deplace le focus sur le titre a chaque changement d'etape --------- */
  useEffect(() => {
    headingRef.current?.focus();
    if (typeof window !== "undefined" && stepIndex(step) > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step, stepIndex]);

  const goTo = useCallback(
    (next: StepKey) => {
      setStep(next);
      // On ne recule jamais l'etape la plus avancee atteinte : le client garde
      // la possibilite de revenir en avant via la barre de progression.
      setMaxReached((current) =>
        stepIndex(next) > stepIndex(current) ? next : current,
      );
      setSubmitError(null);
    },
    [stepIndex],
  );

  /* --- Selections -------------------------------------------------------- */
  const chooseService = (next: PublicService) => {
    // Changer de prestation invalide le creneau : la duree peut differer.
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
    goTo("details");
  };

  const submitDetails = (values: CustomerFormValues) => {
    setCustomer(values);
    goTo("summary");
  };

  /* --- Confirmation definitive ------------------------------------------- */
  const confirmBooking = async () => {
    if (!service || !date || !time || !customer) return;
    // Double protection contre les clics multiples.
    if (submitLock.current) return;

    submitLock.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await apiFetch<CreateResponse>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          // Normalisation en E.164 ; le serveur revalide de toute facon.
          phone: normalizePhone(customer.phone) ?? customer.phone,
          serviceId: service.id,
          date,
          time,
          notes: customer.notes || undefined,
          privacyAccepted: true,
        }),
      });

      // Redirection vers la page de confirmation (rendue depuis la base).
      router.push(`/reservation/confirmee/${response.appointment.manageToken}`);
    } catch (error) {
      submitLock.current = false;
      setSubmitting(false);

      if (error instanceof ApiError) {
        setSubmitError(error.message);

        // Creneau pris entre-temps : on renvoie l'utilisateur au choix
        // de l'horaire avec une liste fraichement rechargee.
        if (error.code === "SLOT_TAKEN" || error.status === 409) {
          setTime(null);
          setSlotsRefresh((value) => value + 1);
          setStep("time");
        }
      } else {
        setSubmitError(
          "Une erreur est survenue. Merci de reessayer dans un instant.",
        );
      }
    }
  };

  const currentIndex = stepIndex(step);
  const currentLabel = steps[currentIndex]?.label ?? "";

  const HEADINGS: Record<StepKey, string> = {
    service: "Choisissez votre prestation",
    date: "Choisissez une date",
    time: "Choisissez un horaire",
    details: "Vos coordonnees",
    summary: "Verifiez votre reservation",
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-10">
        <ProgressBar
          steps={steps}
          current={step}
          maxReached={maxReached}
          onStepClick={goTo}
        />
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-2 text-2xl font-bold outline-none sm:text-3xl"
      >
        {HEADINGS[step]}
      </h2>
      <p className="mb-8 text-sm text-neutral-400">
        Etape {currentIndex + 1} sur {steps.length} — {currentLabel}
      </p>

      {/* ================= ETAPE — PRESTATION =================
          Affichee uniquement si le salon propose plusieurs prestations. */}
      {step === "service" && (
        <div className="space-y-3">
          {services.length === 0 ? (
            <div className="card p-10 text-center">
              <AlertIcon className="mx-auto h-8 w-8 text-gold-400" />
              <p className="mt-4 text-neutral-300">
                Aucune prestation n&apos;est disponible pour le moment. Merci de
                contacter directement le salon.
              </p>
            </div>
          ) : (
            services.map((item) => (
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
            ))
          )}
        </div>
      )}

      {/* ================= ETAPE — DATE ================= */}
      {step === "date" && service && (
        <div className="space-y-5">
          <SelectionRecap service={service} />
          <Calendar
            serviceId={service.id}
            selectedDate={date}
            onSelect={chooseDate}
          />
          {!singleService && (
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => goTo("service")}
                className="btn-secondary"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Changer de prestation
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= ETAPE — HEURE ================= */}
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

          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => goTo("date")}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Changer de date
            </button>
          </div>
        </div>
      )}

      {/* ================= ETAPE — COORDONNEES ================= */}
      {step === "details" && service && date && time && (
        <div className="space-y-5">
          <SelectionRecap service={service} date={date} time={time} />
          <DetailsForm
            defaultValues={customer ?? {}}
            onSubmit={submitDetails}
            onBack={() => goTo("time")}
          />
        </div>
      )}

      {/* ================= ETAPE — RECAPITULATIF ================= */}
      {step === "summary" && service && date && time && customer && (
        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="border-b border-ink-600 bg-ink-900/50 px-6 py-4">
              <h3 className="font-semibold text-white">
                Recapitulatif de votre rendez-vous
              </h3>
            </div>

            <dl className="divide-y divide-ink-700">
              <RecapRow
                Icon={ScissorsIcon}
                label="Prestation"
                value={service.name}
                extra={`${formatDuration(service.duration)} · ${formatPrice(service.price)}`}
              />
              <RecapRow
                Icon={CalendarIcon}
                label="Date"
                value={
                  <span className="capitalize">{formatFrenchDate(date)}</span>
                }
              />
              <RecapRow
                Icon={ClockIcon}
                label="Heure"
                value={formatFrenchTime(time)}
                extra={`Fin prevue vers ${formatFrenchTime(
                  addMinutesToTime(time, service.duration),
                )}`}
              />
              <RecapRow
                Icon={UserIcon}
                label="Client"
                value={`${customer.firstName} ${customer.lastName}`}
              />
              <RecapRow
                Icon={MailIcon}
                label="E-mail"
                value={<span className="break-all">{customer.email}</span>}
              />
              <RecapRow
                Icon={PhoneIcon}
                label="Telephone"
                value={customer.phone}
              />
              {customer.notes && (
                <RecapRow
                  Icon={AlertIcon}
                  label="Commentaire"
                  value={customer.notes}
                />
              )}

              {/* Adresse du rendez-vous — toujours visible avant validation */}
              <RecapRow
                Icon={MapPinIcon}
                label="Adresse du rendez-vous"
                value={
                  <span className="block">
                    {getAddressLines().map((line, index) => (
                      <span key={line} className={cn("block", index > 0 && "font-normal text-neutral-300")}>
                        {line}
                      </span>
                    ))}
                  </span>
                }
              />
            </dl>

            <div className="border-t border-ink-600 bg-ink-900/50 px-6 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-neutral-400">
                  Total a regler sur place
                </span>
                <span className="font-display text-2xl font-bold text-gold-400">
                  {formatPrice(service.price)}
                </span>
              </div>
            </div>
          </div>

          {submitError && <ErrorBanner message={submitError} />}

          <p className="text-center text-sm text-neutral-400">
            En confirmant, vous recevrez immediatement un e-mail et un SMS de
            confirmation, puis un rappel automatique 24 h avant le rendez-vous.
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => goTo("details")}
              disabled={submitting}
              className="btn-secondary"
            >
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
                  Confirmation en cours…
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
                  Confirmer definitivement
                </>
              )}
            </button>
          </div>

          {/* Message d'attente annonce aux lecteurs d'ecran */}
          <p className="sr-only" aria-live="assertive">
            {submitting ? "Enregistrement de votre reservation en cours." : ""}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sous-composants                                                            */
/* -------------------------------------------------------------------------- */

/** Rappel compact des choix deja faits, affiche en haut des etapes. */
function SelectionRecap({
  service,
  date,
  time,
}: {
  service: PublicService;
  date?: string;
  time?: string;
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
      <span className="font-medium text-gold-400">
        {formatPrice(service.price)}
      </span>

      {date && (
        <>
          <span className="text-ink-400">·</span>
          <span className="capitalize text-neutral-300">
            {formatFrenchDate(date)}
          </span>
        </>
      )}

      {time && (
        <>
          <span className="text-ink-400">·</span>
          <span className="font-medium text-neutral-200">
            {formatFrenchTime(time)}
          </span>
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
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4"
    >
      <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      <p className="text-sm leading-relaxed text-red-200">{message}</p>
    </div>
  );
}
