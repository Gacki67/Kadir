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
        ink: {
          950: "#080808",
          900: "#0d0d0f",
          850: "#121215",
          800: "#17171b",
          700: "#1f1f24",
          600: "#2a2a31",
          500: "#3a3a43",
          400: "#5c5c68",
        },
        gold: {
          50: "#fbf7ec",
          100: "#f5ecd3",
          200: "#ecd9a6",
          300: "#e0c274",
          400: "#d4af4f",
          500: "#c69a33",
          600: "#a87c27",
          700: "#835e22",
          800: "#5e4319",
          900: "#3d2c11",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(212, 175, 79, 0.35), 0 12px 40px -16px rgba(212, 175, 79, 0.45)",
        card: "0 24px 60px -30px rgba(0, 0, 0, 0.9)",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #e0c274 0%, #d4af4f 45%, #a87c27 100%)",
        "ink-gradient": "linear-gradient(180deg, #0d0d0f 0%, #17171b 100%)",
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
