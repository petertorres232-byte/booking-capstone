import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Must match CLIENT_ORIGIN in server/.env (http://localhost:5173)
    port: 5173,
    // Fail with a clear error if the port is taken, instead of silently
    // moving to 5174 and breaking CORS for every API call
    strictPort: true,
  },
})