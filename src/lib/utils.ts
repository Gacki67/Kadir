import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine des classes Tailwind en resolvant les conflits.
 * Exemple : cn("px-4", condition && "px-6") -> "px-6"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Appelle une route API et renvoie le JSON, en normalisant les erreurs.
 * Toutes les erreurs remontent avec un message deja en francais.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Connexion impossible. Verifiez votre connexion internet et reessayez.",
      0,
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const data = (payload ?? {}) as {
      error?: string;
      fields?: Record<string, string>;
      code?: string;
    };
    throw new ApiError(
      data.error ?? "Une erreur est survenue. Merci de reessayer.",
      response.status,
      data.fields,
      data.code,
    );
  }

  return payload as T;
}
