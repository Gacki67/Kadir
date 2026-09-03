/**
 * Authentification des comptes CLIENT.
 *
 * Chaque client cree un compte (e-mail + mot de passe) pour pouvoir reserver.
 * La session est un JWT signe (HS256, librairie `jose`) stocke dans un cookie
 * httpOnly, distinct du cookie administrateur.
 *
 * IMPORTANT : ce fichier ne doit contenir QUE du code compatible Edge Runtime
 * (jose s'appuie sur l'API Web Crypto). Le hachage bcrypt et les acces base de
 * donnees vivent dans `customer-auth-server.ts`.
 */

import { SignJWT, jwtVerify } from "jose";

export const CUSTOMER_SESSION_COOKIE = "er_customer_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 jours

export type CustomerSession = {
  customerId: string;
  email: string;
};

function getSecretKey(): Uint8Array {
  // On reutilise le meme secret que l'espace admin : une seule variable a
  // configurer. L'audience differe, donc un jeton client ne peut pas servir
  // de jeton admin et inversement.
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET est manquant ou trop court (32 caracteres minimum). " +
        "Generez-en un avec : openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Cree un jeton de session client signe. */
export async function createCustomerSessionToken(
  customerId: string,
  email: string,
): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customerId)
    .setIssuedAt()
    .setIssuer("espace-ryan")
    .setAudience("espace-ryan-client")
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/** Verifie un jeton de session client. Compatible Edge Runtime. */
export async function verifyCustomerSessionToken(
  token: string | undefined,
): Promise<CustomerSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: "espace-ryan",
      audience: "espace-ryan-client",
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { customerId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export const customerSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};
