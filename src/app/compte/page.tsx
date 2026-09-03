import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentCustomer } from "@/lib/customer-auth-server";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AuthForms } from "@/components/account/AuthForms";
import { SpinnerIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Mon compte",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string; mode?: string }>;
}) {
  const params = await searchParams;

  // Deja connecte : on l'envoie directement ou il voulait aller.
  const customer = await getCurrentCustomer();
  if (customer) {
    const next = params.suivant?.startsWith("/")
      ? params.suivant
      : "/compte/mes-rendez-vous";
    redirect(next);
  }

  const initialMode = params.mode === "register" ? "register" : "login";

  return (
    <>
      <Header />
      <main
        id="contenu"
        className="flex min-h-screen items-center justify-center px-5 pb-20 pt-[110px]"
      >
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="section-eyebrow justify-center">
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
              Espace client
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            </p>
            <h1 className="section-title text-3xl">Votre compte</h1>
            <p className="mt-4 text-sm text-neutral-400">
              Un compte est necessaire pour reserver en ligne : creez-le en 30
              secondes, puis choisissez votre prestation et votre creneau.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex justify-center py-10">
                <SpinnerIcon className="h-6 w-6 text-gold-400" />
              </div>
            }
          >
            <AuthForms initialMode={initialMode} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
