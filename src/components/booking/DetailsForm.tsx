"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { customerFormSchema, type CustomerFormValues } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

/**
 * Etape 4 — coordonnees du client.
 *
 * Validation en direct via react-hook-form + Zod : le bouton de validation
 * reste inactif tant que les champs obligatoires ne sont pas corrects, et
 * chaque erreur est annoncee aux lecteurs d'ecran.
 */
export function DetailsForm({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    watch,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: defaultValues.firstName ?? "",
      lastName: defaultValues.lastName ?? "",
      email: defaultValues.email ?? "",
      phone: defaultValues.phone ?? "",
      notes: defaultValues.notes ?? "",
      privacyAccepted: defaultValues.privacyAccepted ?? undefined,
    },
  });

  const notesLength = watch("notes")?.length ?? 0;

  const fieldClass = (hasError: boolean) =>
    cn("field-input", hasError && "field-input-error");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {/* --- Prenom --- */}
        <div>
          <label htmlFor="firstName" className="field-label">
            Prenom <span className="text-gold-400">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            enterKeyHint="next"
            className={fieldClass(Boolean(errors.firstName))}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            placeholder="Lucas"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p id="firstName-error" role="alert" className="field-error">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.firstName.message}
            </p>
          )}
        </div>

        {/* --- Nom --- */}
        <div>
          <label htmlFor="lastName" className="field-label">
            Nom <span className="text-gold-400">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            enterKeyHint="next"
            className={fieldClass(Boolean(errors.lastName))}
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            placeholder="Martin"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p id="lastName-error" role="alert" className="field-error">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.lastName.message}
            </p>
          )}
        </div>

        {/* --- E-mail --- */}
        <div>
          <label htmlFor="email" className="field-label">
            Adresse e-mail <span className="text-gold-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            className={fieldClass(Boolean(errors.email))}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? "email-error" : "email-hint"
            }
            placeholder="lucas.martin@exemple.fr"
            {...register("email")}
          />
          {errors.email ? (
            <p id="email-error" role="alert" className="field-error">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.email.message}
            </p>
          ) : (
            <p id="email-hint" className="field-hint">
              Pour recevoir votre confirmation et votre rappel.
            </p>
          )}
        </div>

        {/* --- Telephone --- */}
        <div>
          <label htmlFor="phone" className="field-label">
            Telephone <span className="text-gold-400">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="next"
            className={fieldClass(Boolean(errors.phone))}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
            placeholder="06 12 34 56 78"
            {...register("phone")}
          />
          {errors.phone ? (
            <p id="phone-error" role="alert" className="field-error">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.phone.message}
            </p>
          ) : (
            <p id="phone-hint" className="field-hint">
              Pour le SMS de confirmation et de rappel.
            </p>
          )}
        </div>

        {/* --- Commentaire --- */}
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="field-label">
            Commentaire ou demande particuliere{" "}
            <span className="font-normal text-ink-400">(facultatif)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            maxLength={500}
            className={cn(fieldClass(Boolean(errors.notes)), "resize-y")}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby="notes-count"
            placeholder="Degrade bas, contours nets, allergie a un produit…"
            {...register("notes")}
          />
          <p id="notes-count" className="field-hint text-right">
            {notesLength} / 500 caracteres
          </p>
        </div>
      </div>

      {/* --- Consentement RGPD --- */}
      <div className="mt-6 rounded-xl border border-ink-600 bg-ink-900/60 p-4">
        <label
          htmlFor="privacyAccepted"
          className="flex cursor-pointer items-start gap-3"
        >
          <input
            id="privacyAccepted"
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-ink-500 bg-ink-800 text-gold-500 accent-gold-500 focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-900"
            aria-invalid={Boolean(errors.privacyAccepted)}
            aria-describedby={
              errors.privacyAccepted ? "privacy-error" : undefined
            }
            {...register("privacyAccepted")}
          />
          <span className="text-sm leading-relaxed text-neutral-300">
            J&apos;accepte que mes coordonnees soient utilisees{" "}
            <strong className="font-medium text-white">
              uniquement pour gerer et me rappeler ce rendez-vous
            </strong>
            . J&apos;ai pris connaissance de la{" "}
            <Link
              href="/confidentialite"
              target="_blank"
              className="text-gold-400 underline underline-offset-2 hover:text-gold-300"
            >
              politique de confidentialite
            </Link>
            . <span className="text-gold-400">*</span>
          </span>
        </label>

        {errors.privacyAccepted && (
          <p id="privacy-error" role="alert" className="field-error mt-3">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {errors.privacyAccepted.message}
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-ink-400">
        Les champs marques d&apos;un <span className="text-gold-400">*</span>{" "}
        sont obligatoires.
      </p>

      {/* --- Navigation --- */}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} className="btn-secondary">
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </button>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="btn-primary group"
        >
          Verifier ma reservation
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}
