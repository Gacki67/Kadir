import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Administration" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Toutes les pages sous /admin sont rendues dynamiquement et protegees.
 * Le middleware bloque deja l'acces ; cette verification supplementaire
 * garantit qu'aucune donnee n'est rendue meme si le middleware etait
 * contourne (defense en profondeur).
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
