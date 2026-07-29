import type { Metadata } from "next";

import { BlockedSlotsManager } from "@/components/admin/BlockedSlotsManager";

export const metadata: Metadata = { title: "Blocages" };

export default function AdminBlocksPage() {
  return <BlockedSlotsManager />;
}
