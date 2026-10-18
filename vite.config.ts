import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024 // 15MB to allow 3D physics WASM & Three.js caching
      },
      manifest: {
        name: 'SpinoStrike - Tactical 3D Web FPS',
        short_name: 'SpinoStrike',
        description: 'Tactical 3D Web FPS with CS-style gunplay, playable on mobile and desktop.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'landscape',
        theme_color: '#090d16',
        background_color: '#090d16',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat']
  },
  server: {
    host: true
  }
})
