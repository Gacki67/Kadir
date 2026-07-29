import type { Metadata } from "next";

import { ServicesManager } from "@/components/admin/ServicesManager";

export const metadata: Metadata = { title: "Prestations" };

export default function AdminServicesPage() {
  return <ServicesManager />;
}
