import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// vite-plugin-vue-devtools deshabilitado: su anchor flotante (el botón
// circular fijo en la esquina inferior) tiene un área de captura de
// eventos más grande de lo que se ve, y bloqueaba el scroll con
// mouse/trackpad en páginas largas (ej. /reportes/*) sin afectar el DOM
// ni los datos — por eso era invisible en el inspector.

// https://vite.dev/config/
export default defineConfig({
    base: '/',
    plugins: [
        vue(),
        tailwindcss()
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src',
                import.meta.url))
        },
    },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['vue-leaflet', 'leaflet'],
  },
})