/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        hindi: ["var(--font-noto-devanagari)", "sans-serif"],
        sans:  ["var(--font-noto-sans)", "sans-serif"],
        mono:  ["var(--font-ibm-mono)", "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: "#1a56db",
          dark:    "#1e429f",
          light:   "#e8f0fe",
        },
        saffron: "#ff9933",
        "india-green": "#138808",
      },
    },
  },
  plugins: [],
};
