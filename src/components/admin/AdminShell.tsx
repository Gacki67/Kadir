"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/Logo";
import {
  BanIcon,
  ClockIcon,
  ListIcon,
  LogOutIcon,
  MenuIcon,
  ScissorsIcon,
  SpinnerIcon,
  XIcon,
} from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Rendez-vous", Icon: ListIcon },
  { href: "/admin/prestations", label: "Prestations", Icon: ScissorsIcon },
  { href: "/admin/horaires", label: "Horaires", Icon: ClockIcon },
  { href: "/admin/blocages", label: "Blocages", Icon: BanIcon },
];

/** Cadre commun a toutes les pages de l'espace administrateur. */
export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen">
      {/* ================= EN-TETE ================= */}
      <header className="sticky top-0 z-40 border-b border-ink-600 bg-ink-950/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="hidden rounded-full border border-gold-500/30 bg-gold-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-400 sm:inline">
              Administration
            </span>
          </div>

          {/* --- Navigation bureau --- */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {NAV.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-gold-400/12 text-gold-400"
                    : "text-neutral-300 hover:bg-ink-800 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-[16rem] truncate text-sm text-ink-400 lg:inline">
              {email}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-ghost min-h-0 px-3 py-2 text-sm"
            >
              {loggingOut ? (
                <SpinnerIcon className="h-4 w-4" />
              ) : (
                <LogOutIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Deconnexion</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="btn-ghost min-h-0 px-3 py-2 md:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {menuOpen ? (
                <XIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* --- Navigation mobile --- */}
        {menuOpen && (
          <nav
            className="border-t border-ink-700 px-4 py-3 md:hidden"
            aria-label="Sections (mobile)"
          >
            <ul className="space-y-1">
              {NAV.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
                      isActive(href)
                        ? "bg-gold-400/12 text-gold-400"
                        : "text-neutral-300 hover:bg-ink-800",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-ink-700 px-4 pt-3 text-xs text-ink-400">
              Connecte en tant que {email}
            </p>
          </nav>
        )}
      </header>

      {/* ================= CONTENU ================= */}
      <main id="contenu" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
