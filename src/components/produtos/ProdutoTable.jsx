import { Button } from '../ui/Button'
import { DataTable } from '../ui/DataTable'
import { EmptyState } from '../ui/EmptyState'
import { formatBRL } from '../../utils/money'

function StatusBadge({ ativo }) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
        ativo
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
          : 'bg-slate-100 text-slate-600 ring-slate-200',
      ].join(' ')}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

export function ProdutoTable({
  rows,
  loading,
  emptyMessage,
  onEdit,
  onInativar,
  onViewHistorico,
}) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center text-sm text-slate-500 shadow-sm sm:rounded-3xl">
        Carregando produtos…
      </section>
    )
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:rounded-3xl sm:p-10">
        <EmptyState title={emptyMessage} />
      </section>
    )
  }

  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      cell: (row) => (
        <span className="font-mono text-xs">{row.sku_fornecedor}</span>
      ),
    },
    { key: 'nome', header: 'Nome', cell: (row) => row.nome },
    {
      key: 'fornecedor',
      header: 'Fornecedor',
      cell: (row) => row.fornecedor_nome ?? '—',
    },
    { key: 'cultura', header: 'Cultura', cell: (row) => row.cultura },
    { key: 'quarter', header: 'Quarter', cell: (row) => row.quarter },
    {
      key: 'preco',
      header: 'Preço interno',
      align: 'right',
      cell: (row) => formatBRL(row.preco_interno_calculado),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge ativo={row.ativo} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="!px-2 !py-1 text-xs"
            onClick={() => onViewHistorico(row)}
          >
            Histórico
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="!px-2 !py-1 text-xs"
            onClick={() => onEdit(row)}
          >
            Editar
          </Button>
          {row.ativo ? (
            <Button
              type="button"
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              onClick={() => onInativar(row.id)}
            >
              Inativar
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:rounded-3xl">
      <div className="p-4 sm:p-6">
        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} />
      </div>
    </section>
  )
}
