import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B2118",
        secondary: "#C65D3A",
        accent: "#F4B942",
        cream: "#FFF8EE",
        cardBg: "#FFFFFF",
        textPrimary: "#29221F",
        success: "#248A52",
        danger: "#D94A45",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
