import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
<<<<<<< HEAD
  server: {
    proxy: {
      '/lrf-be': {
        target: 'https://miraboes.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
=======
>>>>>>> e625a39c660817f17650ec74614882cc78ced7e1
})
