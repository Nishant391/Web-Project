/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#111827', brand: { 50: '#edf9f6', 100: '#d4f1e9', 500: '#10966f', 600: '#087b5a', 700: '#075f46' } },
      boxShadow: { soft: '0 12px 36px rgba(15, 23, 42, 0.08)', glow: '0 18px 48px rgba(16, 150, 111, 0.22)' },
    },
  },
  plugins: [],
}
