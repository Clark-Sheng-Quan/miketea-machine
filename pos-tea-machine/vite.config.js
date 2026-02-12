import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/tea_machine': {
        target: 'http://54.90.180.79',
        changeOrigin: true
      }
    }
  }
})
