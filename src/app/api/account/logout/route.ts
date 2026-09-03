import { NextResponse } from "next/server";

import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

/** POST /api/account/logout — deconnexion du client (efface le cookie). */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
