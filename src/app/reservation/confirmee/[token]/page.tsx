import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  getAddressLines,
  getPhoneDisplay,
  getPhoneHref,
  hasAddress,
} from "@/lib/config";
import {
  dateToKey,
  formatDuration,
  formatFrenchDate,
  formatFrenchTime,
  formatPrice,
} from "@/lib/datetime";
import { formatPhoneForDisplay } from "@/lib/validation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ScissorsIcon,
  TagIcon,
  UserIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Rendez-vous confirme",
  // Une page de confirmation nominative ne doit jamais etre indexee.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { cancellationToken: token },
    include: { service: true },
  });

  if (!appointment) notFound();

  const dateKey = dateToKey(appointment.appointmentDate);
  const cancelled = appointment.status === "CANCELLED";

  return (
    <>
      <Header />

      <main id="contenu" className="min-h-screen pb-24 pt-[110px]">
        <div className="container-kb">
          <div className="mx-auto max-w-2xl">
            {/* --- Bandeau de succes --- */}
            <div className="text-center">
              <div
                className={`mx-auto flex h-20 w-20 animate-fade-up items-center justify-center rounded-full ${
                  cancelled
                    ? "border border-red-500/40 bg-red-500/10"
                    : "bg-gold-gradient shadow-gold"
                }`}
              >
                {cancelled ? (
                  <span className="text-3xl text-red-400" aria-hidden="true">
                    ×
                  </span>
                ) : (
                  <CheckIcon className="h-10 w-10 text-ink-950" strokeWidth={3} />
                )}
              </div>

              <h1 className="mt-7 animate-fade-up text-3xl font-bold sm:text-4xl">
                {cancelled
                  ? "Rendez-vous annule"
                  : "Votre rendez-vous est confirme"}
              </h1>

              <p
                className="mx-auto mt-4 max-w-lg animate-fade-up text-neutral-400"
                style={{ animationDelay: "80ms" }}
              >
                {cancelled ? (
                  <>
                    Ce rendez-vous a ete annule. Vous pouvez en reserver un
                    nouveau a tout moment.
                  </>
                ) : (
                  <>
                    Merci {appointment.firstName}. Un e-mail et un SMS de
                    confirmation viennent de vous etre envoyes. Vous recevrez un
                    rappel automatique 24 h avant votre venue.
                  </>
                )}
              </p>

              <p
                className="mt-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-gold-500/30 bg-gold-400/[0.07] px-4 py-2 text-sm"
                style={{ animationDelay: "140ms" }}
              >
                <span className="text-neutral-400">Numero de reservation</span>
                <strong className="font-mono font-bold tracking-wider text-gold-400">
                  {appointment.reference}
                </strong>
              </p>
            </div>

            {/* --- Details --- */}
            <div
              className="card mt-10 animate-fade-up overflow-hidden"
              style={{ animationDelay: "200ms" }}
            >
              <div className="border-b border-ink-600 bg-ink-900/50 px-6 py-4">
                <h2 className="font-semibold text-white">
                  Details de votre rendez-vous
                </h2>
              </div>

              <dl className="divide-y divide-ink-700">
                <Row
                  Icon={UserIcon}
                  label="Client"
                  value={`${appointment.firstName} ${appointment.lastName}`}
                />
                <Row
                  Icon={ScissorsIcon}
                  label="Prestation"
                  value={appointment.service.name}
                />
                <Row
                  Icon={TagIcon}
                  label="Tarif"
                  value={formatPrice(appointment.price)}
                  extra="A regler sur place"
                />
                <Row
                  Icon={CalendarIcon}
                  label="Date"
                  value={
                    <span className="capitalize">{formatFrenchDate(dateKey)}</span>
                  }
                />
                <Row
                  Icon={ClockIcon}
                  label="Heure"
                  value={`${formatFrenchTime(appointment.startTime)} – ${formatFrenchTime(appointment.endTime)}`}
                  extra={`Duree : ${formatDuration(appointment.duration)}`}
                />
                <Row
                  Icon={MailIcon}
                  label="Confirmation envoyee a"
                  value={<span className="break-all">{appointment.email}</span>}
                  extra={formatPhoneForDisplay(appointment.phone)}
                />
              </dl>
            </div>

            {/* --- Actions --- */}
            {!cancelled && (
              <div
                className="mt-6 flex animate-fade-up flex-col gap-3 sm:flex-row"
                style={{ animationDelay: "260ms" }}
              >
                <a
                  href={`/api/appointments/${appointment.cancellationToken}/ics`}
                  className="btn-primary flex-1"
                  download
                >
                  <DownloadIcon className="h-5 w-5" />
                  Ajouter a mon calendrier
                </a>

                <Link
                  href={`/rendez-vous/${appointment.cancellationToken}`}
                  className="btn-secondary flex-1"
                >
                  Modifier ou annuler
                </Link>
              </div>
            )}

            {cancelled && (
              <div className="mt-6 flex justify-center">
                <Link href="/reservation" className="btn-primary px-8">
                  Reserver un nouveau rendez-vous
                </Link>
              </div>
            )}

            {/* --- Coordonnees du salon --- */}
            <div
              className="card mt-6 animate-fade-up p-6"
              style={{ animationDelay: "320ms" }}
            >
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gold-400">
                Rendez-vous au salon
              </h2>

              <ul className="space-y-3.5 text-sm">
                {hasAddress() && (
                  <li className="flex gap-3">
                    <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-500/70" />
                    <address className="not-italic">
                      {getAddressLines().map((line, index) => (
                        <span
                          key={line}
                          className={
                            index === 0
                              ? "block font-semibold text-white"
                              : "block text-neutral-200"
                          }
                        >
                          {line}
                        </span>
                      ))}
                    </address>
                  </li>
                )}
                <li className="flex gap-3">
                  <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-500/70" />
                  <a
                    href={getPhoneHref()}
                    className="text-neutral-200 hover:text-gold-400"
                  >
                    {getPhoneDisplay()}
                  </a>
                </li>
              </ul>

              {!cancelled && (
                <p className="mt-5 rounded-xl border border-gold-500/20 bg-gold-400/[0.06] p-4 text-sm leading-relaxed text-neutral-300">
                  Merci de vous presenter quelques minutes avant l&apos;heure
                  prevue. En cas d&apos;empechement, prevenez-nous au plus tot
                  pour liberer le creneau.
                </p>
              )}
            </div>

            <p className="mt-8 text-center text-sm">
              <Link href="/" className="text-neutral-400 hover:text-gold-400">
                Retour a l&apos;accueil
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function Row({
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
