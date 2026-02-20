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
        /* Deep forest — authority without being corporate */
        forest: {
          50: "#F0F5F1",
          100: "#DAE5DC",
          200: "#B5CCB9",
          300: "#8AB291",
          400: "#5E9968",
          500: "#2D5A3A",
          600: "#244A30",
          700: "#1B3A25",
          800: "#122A1A",
          900: "#0A1A10",
        },
        /* Warm stone — approachable backgrounds */
        stone: {
          50: "#FAFAF8",
          100: "#F5F4F0",
          200: "#EBEAE4",
          300: "#D5D3CB",
          400: "#A8A59B",
          500: "#78756B",
        },
        /* Amber accent — warmth, urgency without alarm */
        amber: {
          50: "#FFF8EB",
          100: "#FFEEC4",
          200: "#FFDB82",
          300: "#FFC94D",
          400: "#F5AD1B",
          500: "#D4940A",
          600: "#A87208",
        },
        /* Slate for text */
        ink: {
          50: "#F8F9FA",
          100: "#E9ECEF",
          200: "#CED4DA",
          300: "#ADB5BD",
          400: "#6C757D",
          500: "#343A40",
          600: "#212529",
          700: "#191C1F",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ['"Source Sans 3"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        hero: [
          "clamp(2.25rem, 5.5vw, 4.25rem)",
          { lineHeight: "1.08", letterSpacing: "-0.025em" },
        ],
        display: [
          "clamp(1.75rem, 3.5vw, 3rem)",
          { lineHeight: "1.12", letterSpacing: "-0.02em" },
        ],
        heading: [
          "clamp(1.375rem, 2.5vw, 2rem)",
          { lineHeight: "1.2" },
        ],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
        elevated: "0 12px 48px rgba(0,0,0,0.08)",
        glow: "0 0 0 3px rgba(212,148,10,0.2)",
      },
      animation: {
        "fade-up": "fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
