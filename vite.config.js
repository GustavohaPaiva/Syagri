import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: https://gustavohapaiva.github.io/Syagri/
const pagesBase = '/Syagri/'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? pagesBase : '/',
  plugins: [react(), tailwindcss()],
}))
