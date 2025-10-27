// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Boundless-Grimoire/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true }, // gör uppdateringar tydliga i dev/preview

      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-512x512.png'
      ],

      manifest: {
        name: 'Boundless Grimoire',
        short_name: 'Grimoire',
        description: 'A personal, modular grimoire—offline-first and customizable.',
        theme_color: '#0b0b0b',
        background_color: '#0b0b0b',
        display: 'standalone',
        start_url: '/Boundless-Grimoire/',
        scope: '/Boundless-Grimoire/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        cleanupOutdatedCaches: true,                 // rensa gamla cache-nycklar
        navigateFallbackDenylist: [/__vite_ping/],   // undvik att fånga Vite ping
      },
    }),
  ],
})