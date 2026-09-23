import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/tea-machine/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/tea_machine': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3000',
        changeOrigin: true
      }
    },
    // Support SPA routing - redirect all non-file routes to index.html
    middlewareMode: false
  },
  build: {
    // Ensure index.html is the fallback for all routes
    outDir: 'dist',
    emptyOutDir: true
  }
})
