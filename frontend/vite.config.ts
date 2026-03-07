import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Determine the backend URL based on environment
const getBackendUrl = () => {
  // In Docker, use the service name 'backend'
  // In local development, use localhost
  if (process.env.DOCKER_ENV === 'true') {
    return 'http://backend:8000'
  }
  return 'http://localhost:8000'
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: getBackendUrl(),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
