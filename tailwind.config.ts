import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.85)",
          hover: "rgba(255, 255, 255, 0.95)",
          active: "rgba(241, 245, 249, 0.95)",
        },
        violet: {
          DEFAULT: "#7C3AED",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7C3AED",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      animation: {
        "shimmer": "shimmer 2.5s infinite linear",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "liquid": "liquid 3s ease-in-out infinite",
        "target-ping": "targetPing 3s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        liquid: {
          "0%, 100%": { filter: "brightness(1)" },
          "50%": { filter: "brightness(1.1) drop-shadow(0 0 10px rgba(124, 58, 237, 0.35))" },
        },
        targetPing: {
          "75%, 100%": {
            transform: "scale(1.3)",
            opacity: "0",
          },
        },
      },
      boxShadow: {
        "violet-glow": "0 0 25px -5px rgba(124, 58, 237, 0.2)",
        "violet-glow-lg": "0 10px 40px -10px rgba(124, 58, 237, 0.25)",
        "glass": "0 10px 35px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        "soft-card": "0 20px 45px -15px rgba(15, 23, 42, 0.07), 0 0 0 1px rgba(226, 232, 240, 0.8)",
      },
    },
  },
  plugins: [],
};

export default config;

