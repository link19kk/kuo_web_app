import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendTarget = process.env.DOCKER_ENV === 'true'
  ? 'http://backend:8000'
  : 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['localhost', '127.0.0.1', 'myself.likuo.cc'],
    // Keep /api for local dev and Docker; nginx can still route /api in production.
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})