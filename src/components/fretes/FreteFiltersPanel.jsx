import { IconSearch } from '../icons'
import { Button } from '../ui/Button'
import { SearchInput } from '../ui/SearchInput'

export function FreteFiltersPanel({
  origemSearch,
  destinoSearch,
  onOrigemChange,
  onDestinoChange,
  onClear,
  hasFilters,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:rounded-3xl">
      <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50/70 via-white to-sky-50/50 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
              Filtros
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Refine a busca por origem e destino da rota.
            </p>
          </div>
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full shrink-0 px-3 sm:w-auto"
              onClick={onClear}
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <div>
          <label
            htmlFor="frete-filter-origem"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
          >
            <IconSearch className="size-3.5" />
            Origem
          </label>
          <SearchInput
            id="frete-filter-origem"
            ariaLabel="Buscar origem"
            placeholder="Ex.: Uberaba, Cubatão…"
            value={origemSearch}
            onChange={onOrigemChange}
          />
        </div>
        <div>
          <label
            htmlFor="frete-filter-destino"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
          >
            <IconSearch className="size-3.5" />
            Destino
          </label>
          <SearchInput
            id="frete-filter-destino"
            ariaLabel="Buscar destino"
            placeholder="Ex.: Uberlândia, Ribeirão Preto…"
            value={destinoSearch}
            onChange={onDestinoChange}
          />
        </div>
      </div>
    </section>
  )
}
