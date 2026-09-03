/**
 * Authentification de l'espace administrateur.
 *
 * Choix technique : une session signee (JWT HS256, librairie `jose`) stockee
 * dans un cookie httpOnly. Pas de base d'utilisateurs : le salon a un seul
 * compte administrateur, defini par variables d'environnement. C'est plus simple
 * a exploiter et il n'y a aucun mot de passe stocke en base.
 *
 * IMPORTANT : ce fichier est importe par le middleware, qui s'execute dans le
 * runtime Edge. Il ne doit donc contenir QUE du code compatible Edge (ici,
 * `jose`, qui s'appuie sur l'API Web Crypto). La verification du mot de passe,
 * qui necessite bcrypt, vit dans `auth-server.ts`.
 */

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "kb_admin_session";
// Session tres longue : Ryan reste connecte (le cookie persiste apres
// fermeture d'onglet ou extinction du telephone). 400 jours = maximum autorise
// par les navigateurs ; le middleware la renouvelle a chaque visite, si bien
// que tant que Ryan ouvre son espace de temps en temps, il ne re-saisit
// jamais son code.
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 400; // ~400 jours

export type AdminSession = {
  email: string;
  role: "admin";
};

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET est manquant ou trop court (32 caracteres minimum). " +
        "Generez-en un avec : openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Cree un jeton de session signe. */
export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("kadir-barber")
    .setAudience("kadir-barber-admin")
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/**
 * Verifie un jeton de session.
 * Compatible Edge Runtime : utilise uniquement l'API Web Crypto (via `jose`),
 * ce qui permet de l'appeler depuis le middleware.
 */
export async function verifySessionToken(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: "kadir-barber",
      audience: "kadir-barber-admin",
    });
    if (payload.role !== "admin" || typeof payload.email !== "string") {
      return null;
    }
    return { email: payload.email, role: "admin" };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};
