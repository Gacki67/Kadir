import { NextResponse } from "next/server";

import { fail, guardRateLimit, handleApiError, readJson } from "@/lib/api";
import { RATE_LIMITS, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { verifyAdminAccessCode } from "@/lib/auth-server";
import { adminCodeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login — connexion de Ryan par CODE D'ACCES.
 * Limite a 8 tentatives par IP toutes les 15 minutes.
 */
export async function POST(request: Request) {
  const limited = guardRateLimit(request, "login", RATE_LIMITS.login);
  if (limited) return limited;

  try {
    const parsed = adminCodeSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Code d'acces requis.", 401);
    }

    if (!verifyAdminAccessCode(parsed.data.code)) {
      // Petit delai pour ralentir les attaques par force brute.
      await new Promise((resolve) => setTimeout(resolve, 400));
      return fail("Code d'acces incorrect.", 401);
    }

    const token = await createSessionToken("ryan");

    // Connexion reussie : on remet le compteur de tentatives a zero.
    resetRateLimit(`login:${getClientIp(request)}`);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("ADMIN_SESSION_SECRET")
    ) {
      console.error("[admin:login] Configuration incomplete :", error.message);
      return fail(
        "L'espace de Ryan n'est pas correctement configure. Consultez les logs du serveur.",
        500,
      );
    }
    return handleApiError(error, "admin:login");
  }
}
