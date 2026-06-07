import { IconDollarSign, IconTruck } from '../icons'
import { formatBRL } from '../../utils/money'

export function origemTone(origem) {
  switch (origem) {
    case 'UBERABA':
      return {
        badge: 'bg-amber-50 text-amber-900 ring-amber-200/80',
        dot: 'bg-amber-500',
        panel: 'from-amber-50/80 to-white',
      }
    case 'CUBATAO':
      return {
        badge: 'bg-sky-50 text-sky-900 ring-sky-200/80',
        dot: 'bg-sky-500',
        panel: 'from-sky-50/80 to-white',
      }
    case 'RIO GRANDE':
      return {
        badge: 'bg-violet-50 text-violet-900 ring-violet-200/80',
        dot: 'bg-violet-500',
        panel: 'from-violet-50/80 to-white',
      }
    case 'FOB':
      return {
        badge: 'bg-slate-100 text-slate-800 ring-slate-200/80',
        dot: 'bg-slate-500',
        panel: 'from-slate-50/80 to-white',
      }
    default:
      return {
        badge: 'bg-primary-50 text-primary-900 ring-primary-200/80',
        dot: 'bg-primary-500',
        panel: 'from-primary-50/80 to-white',
      }
  }
}

export function FreteStatsBar({ total, page, pageSize, rows, loading }) {
  const pageCount = rows.length
  const avgValor =
    pageCount > 0
      ? rows.reduce((acc, row) => acc + row.valor, 0) / pageCount
      : 0
  const origensNaPagina = new Set(rows.map((row) => row.origem)).size
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const items = [
    {
      label: 'Rotas no catálogo',
      value: loading ? '—' : total.toLocaleString('pt-BR'),
      hint: 'Total cadastrado',
      icon: IconTruck,
      accent: 'text-primary-600 bg-primary-50',
    },
    {
      label: 'Nesta página',
      value: loading ? '—' : String(pageCount),
      hint: `Página ${page} de ${totalPages}`,
      icon: IconTruck,
      accent: 'text-sky-700 bg-sky-50',
    },
    {
      label: 'Valor médio',
      value: loading || pageCount === 0 ? '—' : formatBRL(avgValor),
      hint: 'Média dos itens visíveis',
      icon: IconDollarSign,
      accent: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Origens distintas',
      value: loading ? '—' : String(origensNaPagina),
      hint: 'Na listagem atual',
      icon: IconTruck,
      accent: 'text-violet-700 bg-violet-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm sm:rounded-3xl sm:p-4"
          >
            <div
              className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full bg-gradient-to-br from-primary-100/40 to-transparent blur-2xl"
              aria-hidden
            />
            <div className="relative flex items-start gap-2.5 sm:gap-3">
              <span
                className={[
                  'flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10 sm:rounded-2xl',
                  item.accent,
                ].join(' ')}
              >
                <Icon className="size-3.5 sm:size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </p>
                <p className="finance-text mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-900 sm:mt-1 sm:text-xl">
                  {item.value}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{item.hint}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FreteOrigemBadge({ origem, compact = false }) {
  const tone = origemTone(origem)

  return (
    <span
      className={[
        'inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        compact ? 'px-2 py-0.5 text-[0.65rem]' : 'px-3 py-1 text-xs',
        tone.badge,
      ].join(' ')}
    >
      <span className={['size-1.5 shrink-0 rounded-full', tone.dot].join(' ')} aria-hidden />
      <span className="truncate">{origem}</span>
    </span>
  )
}

export function FreteRouteVisual({ origem, destino, compact = false }) {
  const tone = origemTone(origem)

  return (
    <div
      className={[
        'flex items-center justify-center gap-2',
        compact ? 'flex-wrap' : 'gap-3',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
          tone.badge,
        ].join(' ')}
      >
        <span className={['size-1.5 rounded-full', tone.dot].join(' ')} aria-hidden />
        {origem}
      </span>

      <span className="flex items-center gap-1 text-slate-300" aria-hidden>
        <span className="h-px w-4 bg-gradient-to-r from-transparent via-slate-300 to-slate-400 sm:w-8" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-3.5 text-slate-400"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
        <span className="h-px w-4 bg-gradient-to-r from-slate-400 via-slate-300 to-transparent sm:w-8" />
      </span>

      <span className="text-sm font-medium text-slate-800">{destino}</span>
    </div>
  )
}
