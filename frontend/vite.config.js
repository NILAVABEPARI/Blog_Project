import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_PROXY_TARGET || 'http://localhost:5000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    server: {
      port: 5173,
      // Same-origin in development: the browser talks to :5173 and Vite forwards /api to the backend.
      // This keeps the httpOnly refresh-token cookie working without any CORS/cookie tweaks.
      proxy: { '/api': { target: backend, changeOrigin: true } },
    },
  }
})
