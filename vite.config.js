import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vite only exposes env vars prefixed "VITE_" to client code by default.
  // Vercel's env var UI rejects that prefix, so API_URL is allowed through too.
  envPrefix: ['VITE_', 'API_'],
  server: {
    proxy: {
      '/lrf-be': {
        target: 'https://miraboes.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
