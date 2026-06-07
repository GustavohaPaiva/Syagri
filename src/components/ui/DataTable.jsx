import { EmptyState } from './EmptyState'

export function DataTable({
  columns,
  rows,
  loading = false,
  loadingMessage = 'Carregando…',
  emptyMessage = 'Nenhum registro encontrado.',
  getRowKey,
  className = '',
}) {
  return (
    <div
      className={[
        'hidden overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm lg:block',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  'px-4 py-3',
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : '',
                  col.headerClassName ?? '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-slate-500"
              >
                {loadingMessage}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6">
                <EmptyState title={emptyMessage} />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="transition-colors hover:bg-slate-50/70"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      'px-4 py-3 text-slate-600',
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                          ? 'text-center'
                          : '',
                      col.cellClassName ?? '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
