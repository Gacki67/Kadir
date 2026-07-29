import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { AppointmentsDashboard } from "@/components/admin/AppointmentsDashboard";
import { getEmailProvider, getSmsProvider } from "@/lib/notifications";

export const metadata: Metadata = { title: "Rendez-vous" };

export default async function AdminHomePage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, duration: true, price: true },
  });

  return (
    <AppointmentsDashboard
      services={services}
      providers={{ email: getEmailProvider(), sms: getSmsProvider() }}
    />
  );
}
