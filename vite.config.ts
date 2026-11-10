import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The hosted Tandoor sends no CORS headers, so the browser talks to this
// same-origin proxy (/api, /media) which forwards to TANDOOR_URL.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const target = env.TANDOOR_URL || 'https://oge-recipes.seiggy.com'
  const proxy = {
    '/api': { target, changeOrigin: true, secure: true },
    '/media': { target, changeOrigin: true, secure: true },
  }
  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 5173, proxy },
  }
})
