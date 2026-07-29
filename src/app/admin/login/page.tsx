import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/site/Logo";
import { SpinnerIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main
      id="contenu"
      className="flex min-h-screen items-center justify-center px-5 py-16"
    >
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Logo size="lg" asLink={false} />
        </div>

        <div className="card p-7 sm:p-8">
          <h1 className="text-xl font-semibold">Espace administrateur</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Connectez-vous pour gerer les rendez-vous du salon.
          </p>

          <Suspense
            fallback={
              <div className="flex justify-center py-10">
                <SpinnerIcon className="h-6 w-6 text-gold-400" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          Acces reserve a l&apos;equipe du salon. Les tentatives de connexion
          sont limitees.
        </p>
      </div>
    </main>
  );
}
