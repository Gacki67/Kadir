/**
 * Verification des identifiants administrateur.
 *
 * Ce module est volontairement separe de `auth.ts` : il utilise bcrypt, qui
 * n'est pas compatible avec le runtime Edge du middleware. Il ne doit donc
 * etre importe que depuis des routes API s'executant sous Node.js.
 *
 * Le mot de passe peut etre fourni :
 *   - de preference sous forme de hachage bcrypt : ADMIN_PASSWORD_HASH
 *   - a defaut en clair : ADMIN_PASSWORD (pratique en local, deconseille en prod)
 */

import bcrypt from "bcryptjs";

/** Comparaison a temps constant, pour ne pas fuiter d'information par le timing. */
function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // On compare quand meme pour garder un temps d'execution comparable.
    let dummy = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      dummy |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifie le CODE D'ACCES de Rayan (connexion a l'espace administrateur).
 *
 * Le code attendu vient de la variable d'environnement ADMIN_ACCESS_CODE.
 * A defaut (pratique en local), un code par defaut est utilise — a changer
 * imperativement avant la mise en ligne.
 *
 * La comparaison se fait a temps constant pour ne pas fuiter d'information.
 */
export function verifyAdminAccessCode(code: string): boolean {
  // Le code peut etre defini via la variable d'environnement ADMIN_ACCESS_CODE
  // (recommande, surtout si le depot est public). A defaut, on utilise le code
  // choisi par Rayan.
  const expected = process.env.ADMIN_ACCESS_CODE || "Ryan1230";
  return safeEquals(code.trim(), expected.trim());
}

/**
 * Verifie l'e-mail et le mot de passe fournis par le formulaire de connexion.
 * Leve une erreur explicite si la configuration est incomplete.
 * (Conserve pour compatibilite ; l'espace de Rayan utilise desormais un code.)
 */
export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL n'est pas configure.");
  }
  if (!passwordHash && !plainPassword) {
    throw new Error(
      "Aucun mot de passe administrateur configure : definissez ADMIN_PASSWORD_HASH (recommande) ou ADMIN_PASSWORD.",
    );
  }

  const emailMatches = safeEquals(
    email.trim().toLowerCase(),
    adminEmail.trim().toLowerCase(),
  );

  let passwordMatches = false;
  if (passwordHash) {
    passwordMatches = await bcrypt.compare(password, passwordHash);
  } else if (plainPassword) {
    passwordMatches = safeEquals(password, plainPassword);
  }

  // Les deux conditions sont toujours evaluees avant de repondre.
  return emailMatches && passwordMatches;
}
