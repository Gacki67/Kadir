import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/auth";

/**
 * Protection de l'espace administrateur.
 *
 * Toute requete vers /admin ou /api/admin doit presenter un cookie de session
 * valide. C'est la premiere ligne de defense ; chaque route API verifie
 * egalement la session de son cote (defense en profondeur).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // La page de connexion et sa route API doivent rester accessibles.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (session) {
    // Renouvellement glissant : a chaque visite, on repousse l'expiration du
    // cookie. Rayan reste ainsi connecte indefiniment tant qu'il ouvre son
    // espace de temps en temps.
    const response = NextResponse.next();
    try {
      const refreshed = await createSessionToken(session.email);
      response.cookies.set(SESSION_COOKIE, refreshed, sessionCookieOptions);
    } catch {
      // En cas d'echec de renouvellement, la session actuelle reste valable.
    }
    return response;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentification requise." },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  // Memorise la page demandee pour y revenir apres connexion.
  if (pathname !== "/admin") {
    loginUrl.searchParams.set("suivant", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
