import { IconSearch, IconUsers } from '../icons'
import { Button } from '../ui/Button'
import { SearchInput } from '../ui/SearchInput'

export function ConsultorFiltersPanel({
  searchQuery,
  onSearchChange,
  onClear,
  hasFilters,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:rounded-3xl">
      <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50/70 via-white to-violet-50/40 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
              Busca
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Encontre consultores pelo nome.
            </p>
          </div>
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full shrink-0 px-3 sm:w-auto"
              onClick={onClear}
            >
              Limpar busca
            </Button>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <label
          htmlFor="consultor-filter-nome"
          className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
        >
          <IconSearch className="size-3.5" />
          Nome do consultor
        </label>
        <SearchInput
          id="consultor-filter-nome"
          ariaLabel="Buscar consultor por nome"
          placeholder="Ex.: João, Maria…"
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
    </section>
  )
}

export function ConsultorStatsBar({ total, filtered, loading }) {
  const items = [
    {
      label: 'Equipe',
      value: loading ? '—' : String(total),
      hint: 'Consultores cadastrados',
      icon: IconUsers,
      accent: 'text-primary-600 bg-primary-50',
    },
    {
      label: 'Na listagem',
      value: loading ? '—' : String(filtered),
      hint: 'Resultados visíveis',
      icon: IconUsers,
      accent: 'text-violet-700 bg-violet-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <p className="mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-900 sm:mt-1 sm:text-xl">
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

function consultorInitial(nome) {
  const trimmed = (nome ?? '').trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}

export function ConsultorNameBadge({ nome }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700 ring-1 ring-primary-100"
        aria-hidden
      >
        {consultorInitial(nome)}
      </span>
      <span className="truncate font-medium text-slate-900">{nome}</span>
    </span>
  )
}
