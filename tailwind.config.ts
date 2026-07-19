import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1F3864",
        brand: "#2E74B5",
      },
    },
  },
  plugins: [],
};
export default config;
