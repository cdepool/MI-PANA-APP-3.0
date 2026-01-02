/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mipana: {
          navy: "#001F3F",
          cyan: "#00BCD4",
          mediumBlue: "#0077B6",
          orange: "#FF9800",
          gray: "#F4F7F6",
          dark: "#1A1A1A",
          lightGray: "#F4F7F6",
          darkBlue: "#003366",
          black: "#1A1A1A",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
