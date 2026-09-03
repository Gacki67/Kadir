import { ImageResponse } from "next/og";

import { SALON, getPhoneDisplay } from "@/lib/config";

/**
 * Image de partage (Open Graph), generee automatiquement.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SALON.name} — Barbier & Coiffeur`;

/**
 * Note : le moteur de rendu (Satori) n'implemente qu'un sous-ensemble de CSS.
 * Tout element contenant plusieurs enfants doit declarer explicitement
 * `display: flex`.
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
            "radial-gradient(ellipse at 50% 0%, #22160d 0%, #140d07 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 12,
            textTransform: "uppercase",
            color: "#c9924f",
            marginBottom: 34,
          }}
        >
          Barbier · Coiffeur · Haut de gamme
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: -2,
            color: "#ffffff",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          L&apos;Espace
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: -2,
            color: "#c9924f",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          de Rayan
        </div>

        <div
          style={{
            display: "flex",
            width: 140,
            height: 3,
            background: "#c9924f",
            margin: "44px 0",
          }}
        />

        <div style={{ display: "flex", fontSize: 30, color: "#c9b8a6" }}>
          {SALON.tagline}
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#8a6b4b", marginTop: 18 }}>
          Du mardi au samedi · 9 h – 17 h · {getPhoneDisplay()}
        </div>
      </div>
    ),
    size,
  );
}
