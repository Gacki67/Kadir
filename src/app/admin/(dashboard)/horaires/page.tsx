import type { Metadata } from "next";

import { getBusinessRules } from "@/lib/booking";
import { BOOKING } from "@/lib/config";
import { BusinessHoursManager } from "@/components/admin/BusinessHoursManager";

export const metadata: Metadata = { title: "Horaires" };

export default async function AdminHoursPage() {
  const hours = await getBusinessRules();

  return (
    <BusinessHoursManager
      initialHours={hours}
      slotDuration={BOOKING.slotDurationMinutes}
    />
  );
}
