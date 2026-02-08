import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors - Premium Betting Feel
        brand: {
          primary: "#1a1f2e",      // Blu scuro profondo
          secondary: "#252b3d",    // Blu scuro leggermente più chiaro
          accent: "#d4af37",       // Oro premium
          gold: "#ffd700",         // Oro brillante
        },
        // Semantic colors
        back: {
          DEFAULT: "#2563eb",      // Blu per PUNTA
          light: "#3b82f6",
          dark: "#1d4ed8",
        },
        lay: {
          DEFAULT: "#dc2626",      // Rosso per BANCA
          light: "#ef4444",
          dark: "#b91c1c",
        },
        profit: {
          DEFAULT: "#16a34a",      // Verde profitto
          light: "#22c55e",
        },
        loss: {
          DEFAULT: "#dc2626",      // Rosso perdita
          light: "#ef4444",
        },
        // UI colors
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f8fafc",
          dark: "#1e293b",
        },
        border: {
          DEFAULT: "#e2e8f0",
          dark: "#334155",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(212, 175, 55, 0.15)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 25px -5px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;
