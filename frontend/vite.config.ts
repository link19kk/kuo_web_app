import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Necessary for Docker to expose the port
    port: 3000,
    // Add this to fix the "Blocked request" error
    allowedHosts: ['myself.likuo.cc'], 
    
    // We are disabling Vite's internal proxy because 
    // Nginx handles /api traffic now.
  },
})