/**
 * Preparation de l'environnement de test.
 * Charge le fichier .env pour que DATABASE_URL soit disponible dans les tests
 * d'integration. Sans effet si le fichier est absent (les tests unitaires purs
 * fonctionnent de toute facon).
 */
try {
  process.loadEnvFile?.(".env");
} catch {
  // .env introuvable : on utilise les variables deja definies.
}

// Valeurs de repli pour les tests qui touchent a l'authentification.
process.env.ADMIN_SESSION_SECRET ||=
  "secret-de-test-suffisamment-long-pour-etre-valide-32";
process.env.ADMIN_EMAIL ||= "admin@kadirbarber.fr";
process.env.ADMIN_PASSWORD ||= "mot-de-passe-de-test";
