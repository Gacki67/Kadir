import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette centrale du salon — modifiable ici pour changer tout le site.
        // "ink" : fonds sombres, bruns espresso chauds (brun luxe).
        ink: {
          950: "#0b0704",
          900: "#140d07",
          850: "#1a1109",
          800: "#22160d",
          700: "#2f2013",
          600: "#3e2c1c",
          500: "#523c28",
          400: "#7a5c40",
        },
        // "gold" : accents chauds bronze / caramel / beige (brun luxe).
        gold: {
          50: "#faf3e8",
          100: "#f1e2cb",
          200: "#e6c9a0",
          300: "#d8ac74",
          400: "#c9924f",
          500: "#b67a38",
          600: "#97612b",
          700: "#744924",
          800: "#52341b",
          900: "#362110",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(201, 146, 79, 0.35), 0 12px 40px -16px rgba(201, 146, 79, 0.45)",
        card: "0 24px 60px -30px rgba(0, 0, 0, 0.9)",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #e6c9a0 0%, #c9924f 45%, #97612b 100%)",
        "ink-gradient": "linear-gradient(180deg, #140d07 0%, #22160d 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
