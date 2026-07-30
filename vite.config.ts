/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const BASE = '/l4-plan-viewer/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
      manifest: {
        name: 'L4 Programme Plan Viewer',
        short_name: 'L4 Plan Viewer',
        description: 'Executive dashboard for an MS Project L4 programme plan export. Fully client-side.',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: '#f4f6fb',
        theme_color: '#1f3864',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
