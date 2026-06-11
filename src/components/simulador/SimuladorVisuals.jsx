import {
  IconClipboardList,
  IconDollarSign,
  IconPackage,
  IconTruck,
  IconUser,
} from '../icons'
import { formatBRL } from '../../utils/money'

export function SimuladorSectionPanel({
  icon: Icon,
  title,
  description,
  actions,
  children,
  gradient = 'from-primary-50/70 via-white to-violet-50/40',
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:rounded-3xl">
      <div
        className={[
          'border-b border-slate-100 bg-gradient-to-r px-4 py-3.5 sm:px-6 sm:py-4',
          gradient,
        ].join(' ')}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {Icon ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Icon className="size-4" />
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
                {title}
              </p>
              {description ? (
                <p className="mt-0.5 text-sm text-slate-600">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  )
}

export function SimuladorSummaryBar({
  lineCount,
  totalValor,
  totalProposta,
  globalStatus,
}) {
  const statusAccent =
    globalStatus === 'Aprovado'
      ? 'text-emerald-700 bg-emerald-50'
      : globalStatus === 'Pendente'
        ? 'text-amber-700 bg-amber-50'
        : 'text-slate-700 bg-slate-100'

  const items = [
    {
      label: 'Produtos',
      value: String(lineCount),
      hint: lineCount === 1 ? 'Linha na simulação' : 'Linhas na simulação',
      icon: IconPackage,
      accent: 'text-primary-600 bg-primary-50',
    },
    {
      label: 'Valor bruto',
      value: formatBRL(totalValor),
      hint: 'Soma do catálogo',
      icon: IconDollarSign,
      accent: 'text-sky-700 bg-sky-50',
    },
    {
      label: 'Proposta',
      value: formatBRL(totalProposta),
      hint: 'Total negociado',
      icon: IconDollarSign,
      accent: 'text-violet-700 bg-violet-50',
    },
    {
      label: 'Status',
      value: globalStatus,
      hint: 'Situação da simulação',
      icon: IconClipboardList,
      accent: statusAccent,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const ItemIcon = item.icon
        return (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4"
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
                <ItemIcon className="size-3.5 sm:size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </p>
                <p className="finance-text mt-0.5 truncate text-base font-semibold tracking-tight text-slate-900 sm:mt-1 sm:text-lg">
                  {item.value}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {item.hint}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const SIMULADOR_SECTION_ICONS = {
  cliente: IconUser,
  frete: IconTruck,
  produtos: IconPackage,
  consolidacao: IconDollarSign,
}
