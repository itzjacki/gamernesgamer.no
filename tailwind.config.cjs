/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        quantico: ["Quantico", "sans-serif"],
      },
      colors: {
        reddish: "#DB5461",
        blueish: "#73C9BB",
        grayish: "#1D1A1F",
      },
    },
  },
  plugins: [],
};
