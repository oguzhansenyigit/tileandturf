/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gray-green': {
          50: '#f0f4f2',
          100: '#d9e3dc',
          200: '#b8ccc2',
          300: '#8fada4',
          400: '#6b8b81',
          500: '#527068',
          600: '#425a53',
          700: '#384b45',
          800: '#31403c',
          900: '#2b3733',
        },
        'primary': {
          DEFAULT: '#527068',
          light: '#6b8b81',
          dark: '#384b45',
        }
      },
    },
  },
  plugins: [],
}

