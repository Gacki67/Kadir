import Link from "next/link";

import { getSnapchatDisplay, getSnapchatUrl } from "@/lib/config";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SnapchatIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <>
      <Header />

      <main
        id="contenu"
        className="flex min-h-screen items-center justify-center px-5 pb-24 pt-[110px]"
      >
        <div className="text-center">
          <p className="font-display text-7xl font-bold text-gold-gradient sm:text-8xl">
            404
          </p>

          <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
            Cette page n&apos;existe pas
          </h1>

          <p className="mx-auto mt-4 max-w-md leading-relaxed text-neutral-400">
            Le lien est peut-etre incorrect ou a expire. Si vous cherchiez a
            gerer un rendez-vous, utilisez le lien recu dans votre e-mail de
            confirmation.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn-primary w-full px-8 sm:w-auto">
              Retour a l&apos;accueil
            </Link>
            <Link
              href="/reservation"
              className="btn-secondary w-full px-8 sm:w-auto"
            >
              Prendre rendez-vous
            </Link>
          </div>

          <p className="mt-8 text-sm text-neutral-400">
            Besoin d&apos;aide ?{" "}
            <a
              href={getSnapchatUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300"
            >
              <SnapchatIcon className="h-4 w-4" />
              Snapchat {getSnapchatDisplay()}
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
