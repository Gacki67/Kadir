"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ApiError, apiFetch, cn } from "@/lib/utils";
import {
  AlertIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  SpinnerIcon,
  UserIcon,
} from "@/components/icons";

type Mode = "login" | "register";

/** Connexion + inscription client, sous forme de deux onglets. */
export function AuthForms({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("suivant") || "/compte/mes-rendez-vous";
  const safeNext = nextUrl.startsWith("/") ? nextUrl : "/compte/mes-rendez-vous";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setFields({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setFields({});

    const url = mode === "login" ? "/api/account/login" : "/api/account/register";
    const body =
      mode === "login"
        ? { email: form.email, password: form.password }
        : {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            password: form.password,
          };

    try {
      await apiFetch(url, { method: "POST", body: JSON.stringify(body) });
      router.replace(safeNext);
      router.refresh();
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message);
        if (cause.fields) setFields(cause.fields);
      } else {
        setError("Une erreur est survenue. Merci de reessayer.");
      }
      setBusy(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* --- Onglets --- */}
      <div className="grid grid-cols-2 border-b border-ink-600" role="tablist">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={cn(
              "px-4 py-4 text-sm font-semibold transition-colors",
              mode === m
                ? "bg-ink-800/60 text-gold-300"
                : "text-neutral-400 hover:text-white",
            )}
          >
            {m === "login" ? "J'ai un compte" : "Creer un compte"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-7" noValidate>
        {mode === "register" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="firstName"
              label="Prenom"
              icon={<UserIcon className="h-4 w-4" />}
              value={form.firstName}
              onChange={set("firstName")}
              autoComplete="given-name"
              error={fields.firstName}
            />
            <Field
              id="lastName"
              label="Nom"
              value={form.lastName}
              onChange={set("lastName")}
              autoComplete="family-name"
              error={fields.lastName}
            />
          </div>
        )}

        <Field
          id="email"
          label="Adresse e-mail"
          type="email"
          icon={<MailIcon className="h-4 w-4" />}
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
          error={fields.email}
        />

        {mode === "register" && (
          <Field
            id="phone"
            label="Telephone"
            type="tel"
            icon={<PhoneIcon className="h-4 w-4" />}
            value={form.phone}
            onChange={set("phone")}
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            error={fields.phone}
          />
        )}

        <Field
          id="password"
          label="Mot de passe"
          type="password"
          icon={<LockIcon className="h-4 w-4" />}
          value={form.password}
          onChange={set("password")}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          error={fields.password}
          hint={mode === "register" ? "Au moins 8 caracteres." : undefined}
        />

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} aria-busy={busy} className="btn-primary w-full">
          {busy ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              Un instant…
            </>
          ) : mode === "login" ? (
            "Se connecter"
          ) : (
            "Creer mon compte"
          )}
        </button>

        <p className="text-center text-xs text-ink-400">
          {mode === "login" ? (
            <>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-semibold text-gold-400 hover:underline"
              >
                Inscrivez-vous
              </button>
            </>
          ) : (
            <>
              Deja client ?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-gold-400 hover:underline"
              >
                Connectez-vous
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  icon,
  autoComplete,
  placeholder,
  error,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className={cn("field-input", icon && "pl-10", error && "field-input-error")}
        />
      </div>
      {error ? (
        <p className="field-error">
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}
