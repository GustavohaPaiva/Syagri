import { DataTable } from '../ui/DataTable'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'
import { formatBRL } from '../../utils/money'
import { formatLoteDate } from '../../utils/importacaoVisuals'

export function ModalHistoricoPrecos({ open, onClose, produto, historico, loading }) {
  const columns = [
    { key: 'quarter', header: 'Quarter', cell: (row) => row.quarter },
    {
      key: 'preco',
      header: 'Preço original',
      align: 'right',
      cell: (row) => (
        <span>
          {formatBRL(row.preco_original)}{' '}
          <span className="text-xs text-slate-500">{row.moeda_origem}</span>
        </span>
      ),
    },
    {
      key: 'interno',
      header: 'Preço interno',
      align: 'right',
      cell: (row) => formatBRL(row.preco_interno_calculado),
    },
    {
      key: 'data',
      header: 'Lançado em',
      cell: (row) => formatLoteDate(row.lancado_em),
    },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={produto ? `Histórico — ${produto.nome}` : 'Histórico de preços'}
    >
      {loading ? (
        <EmptyState title="Carregando histórico…" />
      ) : historico.length === 0 ? (
        <EmptyState title="Nenhum registro de histórico." />
      ) : (
        <DataTable
          columns={columns}
          rows={historico}
          getRowKey={(row) => row.id}
          className="!block"
        />
      )}
    </Modal>
  )
}
