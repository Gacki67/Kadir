"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/utils";
import { LogOutIcon, UserIcon } from "@/components/icons";

type Me = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
} | null;

/** Etat de connexion client partage dans le header (bureau + mobile). */
export function useMe() {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch<{ customer: Me }>("/api/account/me")
      .then((res) => {
        if (active) setMe(res.customer);
      })
      .catch(() => {
        if (active) setMe(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { me, loading };
}

export function AccountMenu({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const router = useRouter();
  const { me, loading } = useMe();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch("/api/account/logout", { method: "POST" });
    } catch {
      /* on ignore : on redirige de toute facon */
    }
    router.refresh();
    router.push("/");
  };

  if (loading) {
    return <span className="h-9 w-24 rounded-full bg-ink-700/50" aria-hidden />;
  }

  if (variant === "mobile") {
    return me ? (
      <div className="flex flex-col gap-1">
        <Link
          href="/compte/mes-rendez-vous"
          className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-neutral-200 hover:bg-ink-800"
        >
          <UserIcon className="h-5 w-5 text-gold-400" />
          {me.firstName} — mes rendez-vous
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-base font-medium text-neutral-200 hover:bg-ink-800"
        >
          <LogOutIcon className="h-5 w-5 text-gold-400" />
          Se deconnecter
        </button>
      </div>
    ) : (
      <Link
        href="/compte"
        className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-neutral-200 hover:bg-ink-800"
      >
        <UserIcon className="h-5 w-5 text-gold-400" />
        Mon compte / Connexion
      </Link>
    );
  }

  return me ? (
    <div className="hidden items-center gap-1 sm:flex">
      <Link
        href="/compte/mes-rendez-vous"
        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-ink-800 hover:text-white"
      >
        <UserIcon className="h-4 w-4 text-gold-400" />
        {me.firstName}
      </Link>
      <button
        type="button"
        onClick={logout}
        aria-label="Se deconnecter"
        className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-ink-800 hover:text-white"
      >
        <LogOutIcon className="h-4 w-4" />
      </button>
    </div>
  ) : (
    <Link
      href="/compte"
      className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-ink-800 hover:text-white sm:flex"
    >
      <UserIcon className="h-4 w-4" />
      Connexion
    </Link>
  );
}
