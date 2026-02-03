import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
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
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
