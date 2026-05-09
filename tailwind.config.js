/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Resource Library cards use gradient classes stored in DB; keep utilities in the build.
  safelist: [
    'from-green-500',
    'to-emerald-600',
    'from-amber-600',
    'to-orange-700',
    'from-blue-500',
    'to-indigo-600',
    'from-gray-600',
    'to-slate-700',
    'from-teal-500',
    'to-cyan-600',
    'from-purple-500',
    'to-pink-600',
    'from-rose-500',
    'to-red-600',
    'from-amber-500',
    'to-yellow-600',
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

