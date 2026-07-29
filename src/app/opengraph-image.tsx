import { ImageResponse } from "next/og";

import { MAIN_SERVICE, SALON } from "@/lib/config";

/**
 * Image de partage (Open Graph), generee automatiquement.
 * Elle s'affiche lorsqu'un lien vers le site est partage sur les reseaux
 * sociaux ou dans une messagerie.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SALON.name} — Barbier & Coiffeur homme`;

/**
 * Note : le moteur de rendu (Satori) n'implemente qu'un sous-ensemble de CSS.
 * Tout element contenant plusieurs enfants doit declarer explicitement
 * `display: flex` — d'ou la presence de cette propriete sur chaque bloc.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 50% 0%, #1c1c22 0%, #0d0d0f 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 12,
            textTransform: "uppercase",
            color: "#d4af4f",
            marginBottom: 34,
          }}
        >
          Barbier · Coiffeur homme
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 700,
            letterSpacing: -2,
            color: "#ffffff",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Kadir
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 700,
            letterSpacing: -2,
            color: "#d4af4f",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Barber
        </div>

        <div
          style={{
            display: "flex",
            width: 140,
            height: 3,
            background: "#d4af4f",
            margin: "44px 0",
          }}
        />

        <div style={{ display: "flex", fontSize: 30, color: "#a3a3ad" }}>
          {MAIN_SERVICE.name} — {MAIN_SERVICE.price / 100} €
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#5c5c68", marginTop: 18 }}>
          Du lundi au vendredi · 9 h – 21 h · {SALON.address.city}
        </div>

        <div style={{ display: "flex", fontSize: 20, color: "#5c5c68", marginTop: 10 }}>
          {SALON.address.street}, {SALON.address.postalCode} {SALON.address.city}
        </div>
      </div>
    ),
    size,
  );
}
