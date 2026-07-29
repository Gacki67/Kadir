import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { BOOKING } from "@/lib/config";
import { assertClientCanModify } from "@/lib/booking";
import { dateToKey } from "@/lib/datetime";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ManageAppointment } from "@/components/booking/ManageAppointment";

export const metadata: Metadata = {
  title: "Gerer mon rendez-vous",
  // Page nominative accessible par jeton : jamais indexee.
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function ManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Un jeton valide fait 43 caracteres (32 octets en base64url).
  if (!token || token.length < 20) notFound();

  const appointment = await prisma.appointment.findUnique({
    where: { cancellationToken: token },
    include: { service: true },
  });

  if (!appointment) notFound();

  // Le client peut-il encore agir seul ? (delai configurable)
  let canModify = true;
  try {
    assertClientCanModify(appointment);
  } catch {
    canModify = false;
  }

  return (
    <>
      <Header />

      <main id="contenu" className="min-h-screen pb-24 pt-[110px]">
        <div className="container-kb">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="section-eyebrow justify-center">
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
              Espace client
              <span className="h-px w-8 bg-gold-500/50" aria-hidden="true" />
            </p>
            <h1 className="section-title">Gerer mon rendez-vous</h1>
            <p className="mt-4 text-neutral-400">
              Bonjour {appointment.firstName}, retrouvez ici toutes les
              informations de votre rendez-vous.
            </p>
          </div>

          <ManageAppointment
            token={token}
            canModify={canModify}
            cutoffHours={BOOKING.cancellationCutoffHours}
            appointment={{
              reference: appointment.reference,
              firstName: appointment.firstName,
              lastName: appointment.lastName,
              date: dateToKey(appointment.appointmentDate),
              startTime: appointment.startTime,
              endTime: appointment.endTime,
              duration: appointment.duration,
              price: appointment.price,
              status: appointment.status,
              notes: appointment.notes,
              serviceId: appointment.serviceId,
              serviceName: appointment.service.name,
            }}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
