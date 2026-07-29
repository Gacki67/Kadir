/**
 * Helpers partages par les routes API : reponses normalisees, garde
 * d'authentification et traitement uniforme des erreurs.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodError } from "zod";

import { SESSION_COOKIE, verifySessionToken, type AdminSession } from "./auth";
import { BookingError } from "./booking";
import { formatZodErrors } from "./validation";
import { getClientIp, rateLimit, type RateLimitResult } from "./rate-limit";

/* -------------------------------------------------------------------------- */
/*  Reponses                                                                    */
/* -------------------------------------------------------------------------- */

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {},
): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function tooManyRequests(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error:
        "Trop de tentatives. Merci de patienter quelques instants avant de reessayer.",
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    },
  );
}

/* -------------------------------------------------------------------------- */
/*  Limitation de debit                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Applique une limitation de debit. Retourne une reponse 429 a renvoyer
 * immediatement, ou `null` si la requete peut continuer.
 */
export function guardRateLimit(
  request: Request,
  scope: string,
  config: { limit: number; window: number },
): NextResponse | null {
  const result = rateLimit(
    `${scope}:${getClientIp(request)}`,
    config.limit,
    config.window,
  );
  return result.success ? null : tooManyRequests(result);
}

/* -------------------------------------------------------------------------- */
/*  Authentification administrateur                                             */
/* -------------------------------------------------------------------------- */

/** Retourne la session admin courante, ou null. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Garde d'authentification pour les routes /api/admin.
 * Retourne une reponse 401 a renvoyer telle quelle, ou `null` si l'acces
 * est autorise.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) {
    return fail("Authentification requise.", 401);
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Gestion centralisee des erreurs                                             */
/* -------------------------------------------------------------------------- */

/**
 * Convertit une exception en reponse HTTP appropriee.
 * Les details techniques ne sont jamais renvoyes au client en production.
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  if (error instanceof BookingError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Certains champs sont invalides.",
        fields: formatZodErrors(error),
      },
      { status: 422 },
    );
  }

  console.error(`[api:${context}]`, error);
  return NextResponse.json(
    {
      error:
        "Une erreur technique est survenue. Merci de reessayer dans un instant.",
    },
    { status: 500 },
  );
}

/** Lit le corps JSON d'une requete sans jamais lever d'exception. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
