import { NextResponse } from "next/server";

import { fail, guardRateLimit, handleApiError, readJson } from "@/lib/api";
import { RATE_LIMITS, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { verifyAdminCredentials } from "@/lib/auth-server";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login
 * Limite a 8 tentatives par IP toutes les 15 minutes.
 * Le message d'erreur est volontairement identique que l'e-mail ou le mot de
 * passe soit faux : cela evite de reveler quels comptes existent.
 */
export async function POST(request: Request) {
  const limited = guardRateLimit(request, "login", RATE_LIMITS.login);
  if (limited) return limited;

  try {
    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Identifiants invalides.", 401);
    }

    const valid = await verifyAdminCredentials(
      parsed.data.email,
      parsed.data.password,
    );

    if (!valid) {
      // Petit delai pour ralentir les attaques par force brute.
      await new Promise((resolve) => setTimeout(resolve, 400));
      return fail("E-mail ou mot de passe incorrect.", 401);
    }

    const token = await createSessionToken(parsed.data.email);

    // Connexion reussie : on remet le compteur de tentatives a zero.
    resetRateLimit(`login:${getClientIp(request)}`);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    // Configuration incomplete (secret manquant) : message explicite en dev.
    if (
      error instanceof Error &&
      (error.message.includes("ADMIN_SESSION_SECRET") ||
        error.message.includes("ADMIN_EMAIL") ||
        error.message.includes("mot de passe administrateur"))
    ) {
      console.error("[admin:login] Configuration incomplete :", error.message);
      return fail(
        "L'espace administrateur n'est pas correctement configure. Consultez les logs du serveur.",
        500,
      );
    }
    return handleApiError(error, "admin:login");
  }
}
