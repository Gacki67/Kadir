import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth-server";
import {
  dateToKey,
  formatFrenchDate,
  formatFrenchTime,
  formatPrice,
  parisToUtc,
} from "@/lib/datetime";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  ScissorsIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Mes rendez-vous",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirme", className: "badge-success" },
  PENDING: { label: "En attente", className: "badge-gold" },
  COMPLETED: { label: "Termine", className: "badge-neutral" },
  CANCELLED: { label: "Annule", className: "badge-danger" },
  NO_SHOW: { label: "Absence", className: "badge-danger" },
};

export default async function MesRendezVousPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/compte?suivant=/compte/mes-rendez-vous");
  }

  const appointments = await prisma.appointment.findMany({
    where: { customerId: customer.id },
    orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
    include: { service: { select: { name: true } } },
  });

  const now = Date.now();
  const upcoming = appointments.filter(
    (a) =>
      a.status !== "CANCELLED" &&
      parisToUtc(dateToKey(a.appointmentDate), a.startTime).getTime() >= now,
  );
  const past = appointments.filter((a) => !upcoming.includes(a));

  return (
    <>
      <Header />
      <main id="contenu" className="min-h-screen pb-24 pt-[110px]">
        <div className="container-kb max-w-3xl">
          <div className="mb-10">
            <p className="section-eyebrow">
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
              Espace client
            </p>
            <h1 className="section-title text-3xl">
              Bonjour {customer.firstName}
            </h1>
            <p className="mt-3 text-neutral-400">
              Retrouvez ici tous vos rendez-vous chez L&apos;Espace de Rayan.
            </p>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link href="/reservation" className="btn-primary px-6">
              <ScissorsIcon className="h-4 w-4" />
              Prendre un rendez-vous
            </Link>
            <Link href="/prestations" className="btn-secondary px-6">
              Voir les prestations
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="card p-10 text-center">
              <CalendarIcon className="mx-auto h-9 w-9 text-gold-400" />
              <p className="mt-4 text-neutral-300">
                Vous n&apos;avez pas encore de rendez-vous.
              </p>
              <Link href="/reservation" className="btn-primary group mt-6 inline-flex px-6">
                Reserver maintenant
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {upcoming.length > 0 && (
                <Section title="A venir" items={upcoming} highlight />
              )}
              {past.length > 0 && <Section title="Historique" items={past} />}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

type Appt = {
  id: string;
  reference: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
  cancellationToken: string;
  service: { name: string };
};

function Section({
  title,
  items,
  highlight,
}: {
  title: string;
  items: Appt[];
  highlight?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((a) => {
          const status = STATUS_LABELS[a.status] ?? STATUS_LABELS.CONFIRMED;
          return (
            <li key={a.id}>
              <article
                className={
                  "card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between " +
                  (highlight ? "border-gold-500/30" : "")
                }
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-white">
                      {a.service.name}
                    </h3>
                    <span className={status.className}>{status.label}</span>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-400">
                    <span className="flex items-center gap-1.5 capitalize">
                      <CalendarIcon className="h-4 w-4 text-gold-500/70" />
                      {formatFrenchDate(dateToKey(a.appointmentDate))}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="h-4 w-4 text-gold-500/70" />
                      {formatFrenchTime(a.startTime)}
                    </span>
                    <span className="text-gold-400">{formatPrice(a.price)}</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    Reference : {a.reference}
                  </p>
                </div>

                {highlight && a.status !== "CANCELLED" && (
                  <Link
                    href={`/rendez-vous/${a.cancellationToken}`}
                    className="btn-secondary shrink-0 px-5 text-sm"
                  >
                    Gerer
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
