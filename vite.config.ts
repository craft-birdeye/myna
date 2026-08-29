import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// On GitHub Pages the app is served from /myna/, so assets must
// be referenced from that base. On Vercel (and locally) it's served from root.
export default defineConfig(({ command }) => ({
  appType: 'spa',
  base: command === 'build' && !(globalThis as any).process?.env?.VERCEL ? '/myna/' : '/',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: path.resolve(__dirname, './src') + '/' },
    ],
  },
  // Keep SVGs as real files (not data: URIs). CSS mask-image breaks with inlined
  // data URIs on production hosts like Vercel when url() is unquoted / oversized.
  build: {
    assetsInlineLimit: 0,
  },
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
}))
