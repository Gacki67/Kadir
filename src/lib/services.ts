/**
 * Type public d'une prestation, partage entre les pages et les composants.
 * (Sorti de ServicesSection pour eviter tout couplage entre modules.)
 */

import { SERVICE_CATEGORIES, type ServiceCategory } from "./config";

export type PublicService = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  bookableOnline: boolean;
  imageUrl: string | null;
};

/** Selection Prisma reutilisable pour exposer une prestation cote public. */
export const publicServiceSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  duration: true,
  price: true,
  bookableOnline: true,
  imageUrl: true,
} as const;

/** Libelle lisible d'une categorie ("HOMME" -> "Homme"). */
export function categoryLabel(key: string): string {
  return SERVICE_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/**
 * Regroupe les prestations par categorie, dans l'ordre defini par
 * SERVICE_CATEGORIES. Les categories vides sont omises.
 */
export function groupByCategory(
  services: PublicService[],
): { key: ServiceCategory; label: string; tagline: string; services: PublicService[] }[] {
  return SERVICE_CATEGORIES.map((cat) => ({
    ...cat,
    services: services.filter((s) => s.category === cat.key),
  })).filter((group) => group.services.length > 0);
}
