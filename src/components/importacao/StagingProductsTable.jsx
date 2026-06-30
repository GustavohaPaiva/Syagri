import { IconPencil, IconTrash } from '../icons'
import { ESTADOS_PRODUTO } from '../../constants/mapeamentoCampos'
import { Button } from '../ui/Button'
import { DataTable } from '../ui/DataTable'
import { EditableNumber } from '../ui/EditableNumber'
import { EditableSelect } from '../ui/EditableSelect'
import { MobileCardList } from '../ui/MobileCardList'
import { StagingStatusBadge } from './StagingStatusBadge'
import { formatBRL } from '../../utils/money'

function effectiveDescontoUsd(row, loteDescontoUsd) {
  if (row.desconto_usd !== undefined && row.desconto_usd !== null) {
    return Number(row.desconto_usd)
  }
  return Number(loteDescontoUsd ?? 0)
}

function effectiveEstado(row, loteEstadoPadrao) {
  return String(row.estado ?? '').trim() || String(loteEstadoPadrao ?? '').trim()
}

function StagingRowCard({
  row,
  readOnly,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  loteMoeda,
  loteDescontoUsd,
  loteEstadoPadrao,
}) {
  const estado = effectiveEstado(row, loteEstadoPadrao)

  return (
    <li
      className={[
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
        !readOnly ? 'cursor-pointer hover:border-primary-200' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={!readOnly ? () => onEdit(row) : undefined}
      onKeyDown={
        !readOnly
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onEdit(row)
              }
            }
          : undefined
      }
      role={!readOnly ? 'button' : undefined}
      tabIndex={!readOnly ? 0 : undefined}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {!readOnly ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(row.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 size-4 rounded border-slate-300"
              aria-label={`Selecionar ${row.nome}`}
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {row.nome || '—'}
            </p>
            <p className="font-mono text-xs text-slate-500">
              {row.referencia_complementar || row.sku_fornecedor || '—'}
            </p>
          </div>
        </div>
        <StagingStatusBadge status={row.status_linha} compact />
      </div>
      {row.staging_erros?.length > 0 ? (
        <p className="mb-3 text-xs leading-relaxed text-red-700">
          {row.staging_erros.join(' · ')}
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>
          <dt className="font-medium text-slate-500">Estado</dt>
          <dd>{estado || '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Classe</dt>
          <dd>{row.classe || 'Convencional'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Desconto USD</dt>
          <dd>{formatBRL(effectiveDescontoUsd(row, loteDescontoUsd))}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Preço de custo</dt>
          <dd>
            {formatBRL(row.preco_original)} {loteMoeda ?? row.moeda}
          </dd>
        </div>
      </dl>
      {!readOnly ? (
        <div className="mt-3 flex gap-2" data-no-row-click>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(row)
            }}
          >
            <IconPencil className="size-4" aria-hidden />
            Editar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(row.id)
            }}
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
  loteMoeda,
  loteDescontoUsd = 0,
  loteEstadoPadrao = '',
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onRowChange,
  onEdit,
  onDelete,
  emptyMessage = 'Nenhum produto neste lote.',
}) {
  const allSelected =
    rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))

  const columns = [
    ...(!readOnly
      ? [
          {
            key: 'select',
            header: (
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="size-4 rounded border-slate-300"
                aria-label="Selecionar todos"
                data-no-row-click
              />
            ),
            cell: (row) => (
              <input
                type="checkbox"
                checked={selectedIds.includes(row.id)}
                onChange={() => onToggleSelect(row.id)}
                className="size-4 rounded border-slate-300"
                aria-label={`Selecionar ${row.nome}`}
                data-no-row-click
              />
            ),
          },
        ]
      : []),
    {
      key: 'produto',
      header: 'Fertilizante',
      cell: (row) => (
        <span className="font-medium text-slate-900">{row.nome || '—'}</span>
      ),
    },
    {
      key: 'ref',
      header: 'Ref. complementar',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-800">
          {row.referencia_complementar || row.sku_fornecedor || '—'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => {
        const estado = effectiveEstado(row, loteEstadoPadrao)
        return readOnly ? (
          estado || '—'
        ) : (
          <EditableSelect
            value={estado}
            onChange={(v) => onRowChange(row.id, { estado: v })}
            options={ESTADOS_PRODUTO}
            ariaLabel={`Estado de ${row.nome}`}
          />
        )
      },
    },
    {
      key: 'classe',
      header: 'Classe',
      cell: (row) => row.classe || 'Convencional',
    },
    {
      key: 'desconto',
      header: 'Desconto USD',
      align: 'right',
      cell: (row) => {
        const display = effectiveDescontoUsd(row, loteDescontoUsd)
        return readOnly ? (
          <span>{formatBRL(display)}</span>
        ) : (
          <EditableNumber
            value={display}
            onChange={(v) => onRowChange(row.id, { desconto_usd: v })}
            decimals={2}
            ariaLabel={`Desconto USD de ${row.nome}`}
          />
        )
      },
    },
    {
      key: 'preco',
      header: 'Preço de custo',
      align: 'right',
      cell: (row) =>
        readOnly ? (
          <span>
            {formatBRL(row.preco_original)}{' '}
            <span className="text-xs text-slate-500">
              {loteMoeda ?? row.moeda}
            </span>
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
      cell: (row) => (
        <div className="min-w-[7rem]">
          <StagingStatusBadge status={row.status_linha} compact />
          {row.staging_erros?.length > 0 ? (
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-red-700">
              {row.staging_erros.join(' · ')}
            </p>
          ) : null}
        </div>
      ),
    },
  ]

  if (!readOnly) {
    columns.push({
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-1" data-no-row-click>
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
        emptyMessage={emptyMessage}
        getRowKey={(row) => row.id}
        onRowClick={!readOnly && onEdit ? (row) => onEdit(row) : undefined}
      />
      <MobileCardList
        items={rows}
        loading={loading}
        emptyMessage={emptyMessage}
        renderItem={(row) => (
          <StagingRowCard
            key={row.id}
            row={row}
            readOnly={readOnly}
            selected={selectedIds.includes(row.id)}
            onToggleSelect={onToggleSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            loteMoeda={loteMoeda}
            loteDescontoUsd={loteDescontoUsd}
            loteEstadoPadrao={loteEstadoPadrao}
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
