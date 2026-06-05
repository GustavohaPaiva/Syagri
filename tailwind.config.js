import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Esmeralda — escala completa (50–950) mapeada como cor primária semântica */
        primary: colors.emerald,
        /** Fundos de aplicação (padrão: slate-50 no body via `bg-background`) */
        background: {
          DEFAULT: colors.slate[50],
        },
        /** Estados de feedback */
        feedback: {
          success: colors.green[600],
          warning: colors.amber[500],
          error: colors.red[500],
        },
      },
    },
  },
  plugins: [],
}
