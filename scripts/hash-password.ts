/**
 * Genere un hachage bcrypt pour le mot de passe administrateur.
 *
 *   npm run hash-password -- "MonMotDePasse"
 *
 * Copiez ensuite la valeur affichee dans la variable ADMIN_PASSWORD_HASH
 * de votre fichier .env (ou dans les variables d'environnement Vercel).
 */

import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error(
    '\n✖ Mot de passe manquant.\n\n  Utilisation :  npm run hash-password -- "MonMotDePasse"\n',
  );
  process.exit(1);
}

if (password.length < 10) {
  console.warn(
    "\n⚠  Mot de passe court (moins de 10 caracteres). Choisissez-en un plus long pour la production.\n",
  );
}

const hash = bcrypt.hashSync(password, 12);

console.log("\n✔ Hachage genere. Ajoutez cette ligne a votre fichier .env :\n");
console.log(`ADMIN_PASSWORD_HASH='${hash}'\n`);
console.log(
  "Note : utilisez des apostrophes simples, le hachage contient des caracteres $.\n",
);
