"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ApiError, apiFetch } from "@/lib/utils";
import { AlertIcon, LockIcon, SpinnerIcon } from "@/components/icons";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("suivant") ?? "/admin";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      await apiFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      // `refresh` force le middleware a relire le cookie fraichement pose.
      router.replace(nextUrl.startsWith("/admin") ? nextUrl : "/admin");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Connexion impossible. Merci de reessayer.",
      );
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
      <div>
        <label htmlFor="code" className="field-label">
          Code d&apos;acces
        </label>
        <input
          id="code"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="field-input text-center tracking-[0.3em]"
          placeholder="••••••••"
        />
        <p className="field-hint">
          Code confidentiel connu de Ryan uniquement.
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

      <button
        type="submit"
        disabled={busy || !code}
        aria-busy={busy}
        className="btn-primary w-full"
      >
        {busy ? (
          <>
            <SpinnerIcon className="h-5 w-5" />
            Connexion…
          </>
        ) : (
          <>
            <LockIcon className="h-5 w-5" />
            Acceder a mon espace
          </>
        )}
      </button>
    </form>
  );
}
