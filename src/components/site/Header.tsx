"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getPhoneDisplay, getPhoneHref } from "@/lib/config";
import { cn } from "@/lib/utils";
import { MenuIcon, PhoneIcon, XIcon } from "@/components/icons";
import { AccountMenu } from "@/components/account/AccountMenu";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/prestations", label: "Prestations" },
  { href: "/coupes", label: "Les Coupes" },
  { href: "/#salon", label: "Le salon" },
  { href: "/#horaires", label: "Horaires" },
  { href: "/#contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fond opaque des que l'on quitte le haut de la page.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloque le defilement de l'arriere-plan quand le menu mobile est ouvert.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Fermeture au clavier.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || menuOpen
          ? "border-b border-ink-600/80 bg-ink-950/90 backdrop-blur-lg"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-kb flex h-[72px] items-center justify-between gap-4">
        <Logo size="md" />

        {/* --- Navigation bureau --- */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Navigation principale"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-ink-800 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AccountMenu variant="desktop" />

          <a
            href={getPhoneHref()}
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-300 transition-colors hover:text-gold-400 xl:flex"
          >
            <PhoneIcon className="h-4 w-4" />
            {getPhoneDisplay()}
          </a>

          <Link href="/reservation" className="btn-primary hidden px-5 sm:inline-flex">
            Reserver
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="btn-ghost -mr-2 px-3 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOpen ? (
              <XIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* --- Menu mobile --- */}
      <div
        id="menu-mobile"
        className={cn(
          "overflow-hidden border-t border-ink-700 bg-ink-950/98 backdrop-blur-lg transition-[max-height] duration-300 lg:hidden",
          menuOpen ? "max-h-[34rem]" : "max-h-0 border-t-0",
        )}
      >
        <nav className="container-kb flex flex-col gap-1 py-4" aria-label="Menu mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3.5 text-base font-medium text-neutral-200 transition-colors hover:bg-ink-800 hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          <div className="my-1 h-px bg-ink-700" aria-hidden="true" />

          <div onClick={() => setMenuOpen(false)}>
            <AccountMenu variant="mobile" />
          </div>

          <a
            href={getPhoneHref()}
            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-neutral-200 hover:bg-ink-800"
          >
            <PhoneIcon className="h-5 w-5 text-gold-400" />
            {getPhoneDisplay()}
          </a>

          <Link
            href="/reservation"
            onClick={() => setMenuOpen(false)}
            className="btn-primary mt-3 w-full"
          >
            Reserver un rendez-vous
          </Link>
        </nav>
      </div>
    </header>
  );
}
