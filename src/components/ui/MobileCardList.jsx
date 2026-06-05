import { EmptyState } from './EmptyState'

export function MobileCardList({
  items,
  loading = false,
  loadingMessage = 'Carregando…',
  emptyMessage = 'Nenhum registro encontrado.',
  renderItem,
  className = '',
}) {
  if (loading) {
    return (
      <div
        className={[
          'rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 lg:hidden',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {loadingMessage}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={['lg:hidden', className].filter(Boolean).join(' ')}>
        <EmptyState title={emptyMessage} />
      </div>
    )
  }

  return (
    <ul
      className={[
        'flex flex-col gap-3 lg:hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item) => renderItem(item))}
    </ul>
  )
}
