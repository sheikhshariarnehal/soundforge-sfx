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
          bg: "#131416",
          surface: "#28292B",
          card: "#1f2022",
          border: "transparent",
          borderLight: "transparent",
          primary: "#D4ED41",
          primaryHover: "#E0F55A",
          // Alias cyan to primary so all existing studio-cyan references inherit #D4ED41
          cyan: "#D4ED41",
          cyanHover: "#E0F55A",
          amber: "#f59e0b",
          amberHover: "#fbbf24",
          text: "#f8fafc",
          muted: "#9E9FA6",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
