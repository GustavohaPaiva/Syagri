import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: https://gustavohapaiva.github.io/Syagri/
const pagesBase = '/Syagri/'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? pagesBase : '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'syagri-spa-fallback',
      transformIndexHtml(html) {
        if (mode !== 'production') return html
        const redirectScript = `
    <script>
      (function () {
        var base = ${JSON.stringify(pagesBase)};
        var path = window.location.pathname;
        if (path.endsWith('/index.html')) {
          window.history.replaceState(null, '', base);
        }
      })();
    </script>`
        return html.replace('</head>', `${redirectScript}\n  </head>`)
      },
    },
  ],
}))
