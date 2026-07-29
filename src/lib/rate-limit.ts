/**
 * Limitation du nombre de requetes (protection anti-abus).
 *
 * Implementation en memoire : suffisante pour un salon sur une instance unique
 * et sans dependance externe. Sur un deploiement multi-instances (plusieurs
 * regions Vercel), remplacez le `Map` par Upstash Redis ou Vercel KV — seule
 * la fonction `rateLimit` est a reecrire.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Nettoyage periodique pour eviter que la Map ne grossisse indefiniment. */
function sweep(now: number): void {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Secondes a attendre avant de reessayer */
  retryAfter: number;
};

export function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(identifier);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(identifier, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    success: true,
    remaining: limit - bucket.count,
    retryAfter: 0,
  };
}

/** Remet un compteur a zero (apres une connexion reussie, par exemple). */
export function resetRateLimit(identifier: string): void {
  buckets.delete(identifier);
}

/**
 * Extrait l'adresse IP du client en tenant compte des proxys (Vercel, Nginx).
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/** Reglages utilises par les routes API. */
export const RATE_LIMITS = {
  /** Creation de rendez-vous : 5 par IP toutes les 10 minutes */
  booking: { limit: 5, window: 600 },
  /** Connexion admin : 8 tentatives par IP toutes les 15 minutes */
  login: { limit: 8, window: 900 },
  /** Consultation des disponibilites : 120 par IP et par minute */
  availability: { limit: 120, window: 60 },
  /** Gestion d'un RDV par jeton : 20 par IP toutes les 5 minutes */
  manage: { limit: 20, window: 300 },
} as const;
