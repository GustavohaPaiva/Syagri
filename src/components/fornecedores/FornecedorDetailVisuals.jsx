import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { DataTable } from '../ui/DataTable'
import { EmptyState } from '../ui/EmptyState'
import { formatBRL } from '../../utils/money'
import { formatLoteDate } from '../../utils/importacaoVisuals'

export { ModalHistoricoPrecos } from '../produtos/ModalHistoricoPrecos'
export { ModalProdutoOficialForm } from '../produtos/ModalProdutoOficialForm'

export function FornecedorProfileHero({ fornecedor }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50/80 via-white to-sky-50/40 p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
        Fornecedor
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {fornecedor.nome}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {fornecedor.ativo ? 'Ativo' : 'Inativo'} · cadastrado em{' '}
        {formatLoteDate(fornecedor.created_at)}
      </p>
    </section>
  )
}

export function FornecedorTemplatesSection({
  templates,
  loading,
  onCreate,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      key: 'nome',
      header: 'Layout',
      cell: (row) => (
        <span className="font-medium text-slate-900">{row.nome_layout}</span>
      ),
    },
    {
      key: 'created',
      header: 'Criado em',
      cell: (row) => formatLoteDate(row.created_at),
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
            onClick={() => onEdit(row)}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="!px-2 !py-1 text-xs"
            onClick={() => onDelete(row.id)}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
            Formatos de tabela
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Mapeamentos de colunas salvos para este fornecedor.
          </p>
        </div>
        <Button type="button" onClick={onCreate} className="w-full sm:w-auto">
          Novo formato
        </Button>
      </div>
      <div className="p-4 sm:p-6">
        {loading ? (
          <EmptyState title="Carregando formatos…" />
        ) : templates.length === 0 ? (
          <EmptyState
            title="Nenhum formato cadastrado"
            description="Crie um formato para mapear colunas de planilhas deste fornecedor."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={templates}
            getRowKey={(row) => row.id}
          />
        )}
      </div>
    </section>
  )
}

export function FornecedorCatalogSection({
  produtos,
  loading,
  onAdd,
  onEdit,
  onInativar,
  onViewHistorico,
}) {
  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      cell: (row) => (
        <span className="font-mono text-xs">{row.sku_fornecedor}</span>
      ),
    },
    { key: 'nome', header: 'Nome', cell: (row) => row.nome },
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
      cell: (row) => (
        <span
          className={[
            'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
            row.ativo
              ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
              : 'bg-slate-100 text-slate-600 ring-slate-200',
          ].join(' ')}
        >
          {row.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
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
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
            Catálogo oficial
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Produtos lançados deste fornecedor.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/admin/importacao"
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-primary-200 hover:bg-slate-50 sm:w-auto"
          >
            Importar planilha
          </Link>
          <Button type="button" onClick={onAdd} className="w-full sm:w-auto">
            Novo produto
          </Button>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {loading ? (
          <EmptyState title="Carregando catálogo…" />
        ) : produtos.length === 0 ? (
          <EmptyState
            title="Nenhum produto no catálogo"
            description="Lance produtos via planilha ou adicione manualmente."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={produtos}
            getRowKey={(row) => row.id}
          />
        )}
      </div>
    </section>
  )
}
