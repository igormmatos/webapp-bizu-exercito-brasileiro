import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const appVersion = process.env.npm_package_version || '1.0.0';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Manual de Bolso',
        short_name: 'Manual de Bolso',
        description: 'Toques de corneta, manuais, bizus e canções na palma da mão',
        theme_color: '#ffffff',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any',
          },
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallbackDenylist: [/^\/ads\.txt$/],
        runtimeCaching: [
          {
            urlPattern: ({url, request}) =>
              /https:\/\/.*\.supabase\.co/i.test(url.origin) &&
              url.pathname.includes('/storage/v1/object/public/') &&
              request.destination === 'audio',
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({url, request}) =>
              /https:\/\/.*\.supabase\.co/i.test(url.origin) &&
              url.pathname.includes('/storage/v1/object/public/') &&
              request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Optional toggle used in constrained environments where HMR must be off.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          vendor: ['lucide-react', 'dompurify', 'idb-keyval'],
        },
      },
    },
  },
});
