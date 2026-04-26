/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        safe: "var(--safe)",
        caution: "var(--caution)",
        dangerous: "var(--dangerous)",
        background: "var(--bg)",
        surface: "var(--surface)",
      }
    },
  },
  plugins: [],
}
