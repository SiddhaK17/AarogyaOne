import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "brand-navy": "#0F172A",
        "brand-white": "#F8FAFC",
        "brand-blue": "#1E3ABA",
        "brand-grey": "#64748B",
        "brand-cyan": "#06B6D4",
      },
    },
  },
  plugins: [],
};
export default config;
