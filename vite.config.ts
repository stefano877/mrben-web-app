import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from https://<user>.github.io/mrben-web-app/ in production, root in dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/mrben-web-app/' : '/',
  plugins: [react(), tailwindcss()],
}))
