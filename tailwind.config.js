/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "#5B0A0A",
          50: "#FDF2F2",
          100: "#F9E0E0",
          200: "#F0BCBC",
          300: "#E48E8E",
          400: "#D45A5A",
          500: "#8B1A1A",
          600: "#7A1414",
          700: "#5B0A0A",
          800: "#3D0606",
          900: "#2A0404",
        },
        gold: {
          DEFAULT: "#C9A84C",
          50: "#FEF9EC",
          100: "#FCF0C8",
          200: "#F8DE8A",
          300: "#E8C95F",
          400: "#C9A84C",
          500: "#A88A30",
          600: "#8A6E22",
          700: "#6B5418",
          800: "#4D3B10",
          900: "#30250A",
        },
        cream: "#FFF8F0",
      },
      fontFamily: {
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
