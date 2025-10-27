/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Basen hämtar från variablerna du definierade i CSS
        app: 'var(--bg)',
        panel: 'var(--panel)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        border: 'var(--border)',

        // Extra ton för pergament-tema
        parchment: {
          50: '#f7f1e1',
          100: '#efe3c3',
          200: '#e7d6a6'
        }
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.25)'
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem'
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'serif'],
        display: ['"Cinzel Decorative"', 'serif']
      }
    }
  },
  plugins: []
}