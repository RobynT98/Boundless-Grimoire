/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: { 50: '#f7f1e1', 100: '#efe3c3', 200: '#e7d6a6' }
      },
      boxShadow: { soft: '0 8px 24px rgba(0,0,0,0.25)' }
    }
  },
  plugins: []
}