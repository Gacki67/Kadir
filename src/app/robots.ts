import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",       // espace administrateur
          "/api/",        // routes techniques
          "/rendez-vous/", // pages nominatives accessibles par jeton
          "/reservation/confirmee/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
