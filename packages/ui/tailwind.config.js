/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marine: {
          50: '#f0f3f9',
          100: '#dde5f1',
          200: '#c2d1e5',
          300: '#9bb4d5',
          400: '#6d8fc0',
          500: '#4e72a8',
          600: '#3c5a89',
          700: '#31486f',
          800: '#2a3d5b',
          900: '#1e2a4d', // Primaire (brand)
          950: '#141c33',
        },
        slate: {
          50: '#f8f9fa',
          100: '#eef2f8', // Fond très clair
          200: '#dde2eb',
          300: '#c5ccda',
          400: '#a3aec4',
          500: '#8493ab',
          600: '#69778e',
          700: '#546073',
          800: '#47505e',
          900: '#3d4450',
          950: '#272b33',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(30, 42, 77, 0.05)',
      }
    },
  },
  plugins: [],
}
