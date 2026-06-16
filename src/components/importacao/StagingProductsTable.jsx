import { IconPencil, IconTrash } from '../icons'
import { Button } from '../ui/Button'
import { DataTable } from '../ui/DataTable'
import { EditableNumber } from '../ui/EditableNumber'
import { MobileCardList } from '../ui/MobileCardList'
import { StagingStatusBadge } from './StagingStatusBadge'
import { formatBRL } from '../../utils/money'

function StagingRowCard({ row, readOnly, onEdit, onDelete }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {row.nome || '—'}
          </p>
          <p className="font-mono text-xs text-slate-500">{row.sku_fornecedor}</p>
        </div>
        <StagingStatusBadge status={row.status_linha} compact />
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>
          <dt className="font-medium text-slate-500">Cultura</dt>
          <dd>{row.cultura || '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Quarter</dt>
          <dd>{row.quarter || '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Preço</dt>
          <dd>
            {formatBRL(row.preco_original)} {row.moeda}
          </dd>
        </div>
      </dl>
      {!readOnly ? (
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => onEdit(row)}
          >
            <IconPencil className="size-4" aria-hidden />
            Editar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            onClick={() => onDelete(row.id)}
          >
            <IconTrash className="size-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </li>
  )
}

export function StagingProductsTable({
  rows,
  loading,
  readOnly = false,
  onRowChange,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-800">
          {row.sku_fornecedor}
        </span>
      ),
    },
    {
      key: 'nome',
      header: 'Nome',
      cell: (row) => row.nome || '—',
    },
    {
      key: 'cultura',
      header: 'Cultura',
      cell: (row) => row.cultura || '—',
    },
    {
      key: 'quarter',
      header: 'Quarter',
      cell: (row) => row.quarter || '—',
    },
    {
      key: 'preco',
      header: 'Preço',
      align: 'right',
      cell: (row) =>
        readOnly ? (
          <span>
            {formatBRL(row.preco_original)}{' '}
            <span className="text-xs text-slate-500">{row.moeda}</span>
          </span>
        ) : (
          <EditableNumber
            value={Number(row.preco_original)}
            onChange={(v) => onRowChange(row.id, { preco_original: v })}
            decimals={2}
            ariaLabel={`Preço de ${row.nome}`}
          />
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StagingStatusBadge status={row.status_linha} compact />,
    },
  ]

  if (!readOnly) {
    columns.push({
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="secondary"
            className="!px-2 !py-1"
            onClick={() => onEdit(row)}
            aria-label={`Editar ${row.nome}`}
          >
            <IconPencil className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="!px-2 !py-1"
            onClick={() => onDelete(row.id)}
            aria-label={`Excluir ${row.nome}`}
          >
            <IconTrash className="size-4" aria-hidden />
          </Button>
        </div>
      ),
    })
  }

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        loadingMessage="Carregando produtos extraídos…"
        emptyMessage="Nenhum produto neste lote."
        getRowKey={(row) => row.id}
      />
      <MobileCardList
        items={rows}
        loading={loading}
        emptyMessage="Nenhum produto neste lote."
        renderItem={(row) => (
          <StagingRowCard
            key={row.id}
            row={row}
            readOnly={readOnly}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      />
    </>
  )
}

export function StagingMatchSummary({ summary }) {
  if (!summary) return null

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-center">
        <p className="text-lg font-semibold text-emerald-800">{summary.novos}</p>
        <p className="text-xs font-medium text-emerald-700">Novos</p>
      </div>
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-3 py-2 text-center">
        <p className="text-lg font-semibold text-sky-800">
          {summary.atualizacoes}
        </p>
        <p className="text-xs font-medium text-sky-700">Atualizações</p>
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50/60 px-3 py-2 text-center">
        <p className="text-lg font-semibold text-red-800">{summary.erros}</p>
        <p className="text-xs font-medium text-red-700">Erros</p>
      </div>
    </div>
  )
}
