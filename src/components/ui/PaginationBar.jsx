import { Button } from './Button'

export function PaginationBar({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  total,
  loading,
  onPrev,
  onNext,
  itemLabel = 'itens',
}) {
  if (total <= 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm sm:rounded-3xl sm:px-5 sm:py-4 md:flex-row md:items-center md:justify-between">
      <p className="text-center text-sm text-slate-600 md:text-left">
        Exibindo{' '}
        <span className="font-medium text-slate-900">
          {rangeStart}–{rangeEnd}
        </span>{' '}
        de{' '}
        <span className="font-medium text-slate-900">
          {total.toLocaleString('pt-BR')}
        </span>{' '}
        {itemLabel}
      </p>
      {totalPages <= 1 ? null : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-center text-xs font-medium uppercase tracking-[0.12em] text-slate-500 sm:text-left">
            Página {page} / {totalPages}
          </span>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={page <= 1 || loading}
              onClick={onPrev}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={page >= totalPages || loading}
              onClick={onNext}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
