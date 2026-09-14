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
      { find: '@icons', replacement: path.resolve(__dirname, './icons') },
    ],
  },
  // Keep SVGs as real files (not data: URIs). CSS mask-image breaks with inlined
  // data URIs on production hosts like Vercel when url() is unquoted / oversized.
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      // Second entry: a standalone page that mounts the real AgentBuilder/
      // FlowCanvas workflow canvas in isolation, keyed off query params. The
      // Super Agent prototype (public/super-agent-prototype.html, a separate
      // static file that can't import from src/) embeds this via <iframe>
      // so its own Workflow tab renders the literal same canvas as every
      // other agent's Workflow tab, instead of a hand-drawn visual clone.
      input: {
        main: path.resolve(__dirname, 'index.html'),
        workflowViewer: path.resolve(__dirname, 'workflow-viewer.html'),
      },
    },
  },
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
}))
