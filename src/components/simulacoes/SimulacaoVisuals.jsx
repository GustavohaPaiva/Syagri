import { IconClipboardList, IconSearch, IconSliders } from "../icons";
import { Button } from "../ui/Button";
import { SearchInput } from "../ui/SearchInput";

const SIMULACAO_STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "draft", label: "Rascunhos" },
  { key: "pending", label: "Pendentes" },
  { key: "approved", label: "Aprovados" },
];

export function SimulacaoFiltersPanel({
  searchQuery,
  onSearchChange,
  quickFilter,
  onQuickFilterChange,
  onClear,
  hasFilters,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:rounded-3xl">
      <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50/70 via-white to-violet-50/40 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
              Filtros
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Busque por cliente ou consultor e refine por status.
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

      <div className="space-y-5 p-4 sm:p-6">
        <div>
          <label
            htmlFor="simulacao-filter-busca"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
          >
            <IconSearch className="size-3.5" />
            Busca
          </label>
          <SearchInput
            id="simulacao-filter-busca"
            ariaLabel="Buscar simulação por cliente ou consultor"
            placeholder="Buscar por cliente ou consultor…"
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>

        <div>
          <p
            id="simulacao-filter-status-label"
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
          >
            <IconSliders className="size-3.5" />
            Status
          </p>
          <div
            role="tablist"
            aria-labelledby="simulacao-filter-status-label"
            className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/90 p-1 ring-1 ring-slate-200/70 sm:grid-cols-4"
          >
            {SIMULACAO_STATUS_FILTERS.map((pill) => {
              const active = quickFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={[
                    "inline-flex min-h-10 items-center justify-center rounded-xl px-2.5 py-2 text-center text-sm font-medium transition-all",
                    active
                      ? "bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-900",
                  ].join(" ")}
                  onClick={() => onQuickFilterChange(pill.key)}
                >
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SimulacaoStatsBar({ total, filtered, loading, statusLabel }) {
  const items = [
    {
      label: "Na listagem",
      value: loading ? "—" : String(filtered),
      hint: statusLabel ? `Filtro: ${statusLabel}` : "Resultados visíveis",
      icon: IconClipboardList,
      accent: "text-primary-600 bg-primary-50",
    },
    {
      label: "Carregadas",
      value: loading ? "—" : String(total),
      hint: "Simulações neste status",
      icon: IconClipboardList,
      accent: "text-violet-700 bg-violet-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm sm:rounded-3xl sm:p-4"
          >
            <div
              className="pointer-events-none justify-center absolute -right-4 -top-4 size-20 rounded-full bg-gradient-to-br from-primary-100/40 to-transparent blur-2xl"
              aria-hidden
            />
            <div className="relative flex items-start gap-2.5 sm:gap-3">
              <span
                className={[
                  "flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10 sm:rounded-2xl",
                  item.accent,
                ].join(" ")}
              >
                <Icon className="size-3.5 sm:size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </p>
                <p className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                  {item.value}
                </p>
                <p className="truncate text-xs text-slate-500">{item.hint}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
