import { EmptyState } from './EmptyState'

function isInteractiveTarget(target) {
  return Boolean(
    target.closest(
      'input, button, select, textarea, a, [data-no-row-click], label',
    ),
  )
}

export function DataTable({
  columns,
  rows,
  loading = false,
  loadingMessage = 'Carregando…',
  emptyMessage = 'Nenhum registro encontrado.',
  getRowKey,
  onRowClick,
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
                className={[
                  'transition-colors hover:bg-slate-50/70',
                  onRowClick ? 'cursor-pointer' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={
                  onRowClick
                    ? (e) => {
                        if (isInteractiveTarget(e.target)) return
                        onRowClick(row)
                      }
                    : undefined
                }
              >
                {columns.map((col) => {
                  const renderCell = col.render ?? col.cell
                  return (
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
                      {renderCell ? renderCell(row) : null}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
