/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        dark: {
          50: '#f6f6f7',
          100: '#e3e3e7',
          700: '#1c1e24',
          800: '#131519',
          900: '#0b0c0e',
          950: '#060708',
        }
      },
    },
  },
  plugins: [],
}
