import type { Config } from "tailwindcss";

const config: Config = {
  // "class" permite alternar dark mode pelo seletor `.dark` no <html>
  // (controlado pelo toggle do TopBar e pela preferência do sistema).
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1F3864",
        brand: "#2E74B5",
      },
      backgroundColor: {
        base: "var(--color-bg-base)",
        surface: "var(--color-bg-surface)",
        muted: "var(--color-bg-muted)",
      },
      textColor: {
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
      },
      borderColor: {
        DEFAULT: "var(--color-border)"
      },
    },
  },
  plugins: [],
};
export default config;
