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
        studio: {
          bg: "#090d16",
          surface: "#0f172a",
          card: "#131c31",
          border: "#1e293b",
          borderLight: "#334155",
          cyan: "#06b6d4",
          cyanHover: "#22d3ee",
          amber: "#f59e0b",
          amberHover: "#fbbf24",
          text: "#f8fafc",
          muted: "#94a3b8"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
};

export default config;
