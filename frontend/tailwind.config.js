/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use CSS variables injected by next/font — zero FOUT, self-hosted
        hindi: ["var(--font-noto-devanagari)", "sans-serif"],
        sans:  ["var(--font-noto-sans)", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#1a56db",
          dark:    "#1e429f",
          light:   "#e8f0fe",
        },
        saffron: "#ff9933",
        green:   "#138808",
      },
    },
  },
  plugins: [],
};
