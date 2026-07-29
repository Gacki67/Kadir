import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/config";

/**
 * Plan du site.
 * Seules les pages publiques y figurent : les pages nominatives
 * (confirmation, gestion d'un rendez-vous) et l'espace administrateur en sont
 * volontairement exclus.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/reservation`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/mentions-legales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/confidentialite`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
