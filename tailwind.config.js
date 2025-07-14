// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        // Define a custom font family named 'inter'
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}