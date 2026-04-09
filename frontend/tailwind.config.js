/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#C9A84C',
        'gold-light': '#E8C97A',
        dark: '#1A1A2E',
        surface: '#16213E',
        'surface-2': '#0F3460',
      },
    },
  },
  plugins: [],
}
