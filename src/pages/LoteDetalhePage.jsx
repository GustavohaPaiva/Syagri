import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ModalStagingRowForm } from '../components/importacao/ModalStagingRowForm'
import {
  StagingMatchSummary,
  StagingProductsTable,
} from '../components/importacao/StagingProductsTable'
import { ImportacaoStatusBadge } from '../components/importacao/ImportacaoVisuals'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { PageBackLink } from '../components/ui/PageBackLink'
import { PageHeader } from '../components/ui/PageHeader'
import { useSyncPageLoading } from '../contexts/PageLoadingContext'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import {
  applyStagingMatchToLote,
  createStagingRow,
  deleteStagingRow,
  fetchLoteById,
  fetchStagingByLote,
  promoverLote,
  updateStagingRow,
} from '../services/produtoImportacaoService'
import { formatLoteDate } from '../utils/importacaoVisuals'

export function LoteDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lote, setLote] = useState(null)
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [launching, setLaunching] = useState(false)
  const [confirmLaunchOpen, setConfirmLaunchOpen] = useState(false)
  const [rowModalOpen, setRowModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  const readOnly = lote?.status === 'concluido'

  const loadData = useCallback(async (isActive) => {
    if (!id) return

    setLoading(true)
    setError(null)

    const loteRes = await fetchLoteById(id)
    if (!isActive || !isActive()) return

    if (!loteRes.ok) {
      setLoading(false)
      setError(loteRes.error)
      setLote(null)
      setRows([])
      return
    }

    setLote(loteRes.row)

    const stagingRes = await fetchStagingByLote(id)
    if (!isActive || !isActive()) return

    if (!stagingRes.ok) {
      setLoading(false)
      setError(stagingRes.error)
      return
    }

    if (loteRes.row.status === 'aguardando_validacao') {
      const matchRes = await applyStagingMatchToLote(id, loteRes.row.fornecedor_id)
      if (!isActive || !isActive()) return

      if (matchRes.ok) {
        setRows(matchRes.rows)
        setSummary(matchRes.summary)
      } else {
        setRows(stagingRes.rows)
      }
    } else {
      setRows(stagingRes.rows)
    }

    setLoading(false)
  }, [id])

  useSyncPageLoading(loading)

  useAbortableAsync(
    async (_signal, isActive) => {
      await loadData(isActive)
    },
    [loadData],
    Boolean(id),
  )

  const canLaunch = useMemo(() => {
    if (!lote || lote.status !== 'aguardando_validacao') return false
    if (!summary) return rows.length > 0
    return summary.erros === 0 && rows.length > 0
  }, [lote, summary, rows.length])

  async function handleRowChange(rowId, patch) {
    setActionError(null)
    const res = await updateStagingRow(rowId, patch)
    if (!res.ok) {
      setActionError(res.error)
      return
    }

    const matchRes = await applyStagingMatchToLote(id, lote.fornecedor_id)
    if (matchRes.ok) {
      setRows(matchRes.rows)
      setSummary(matchRes.summary)
    }
  }

  async function handleSaveRow(payload) {
    setActionError(null)

    if (editingRow) {
      const res = await updateStagingRow(editingRow.id, payload)
      if (!res.ok) return res

      const matchRes = await applyStagingMatchToLote(id, lote.fornecedor_id)
      if (matchRes.ok) {
        setRows(matchRes.rows)
        setSummary(matchRes.summary)
      }
      return { ok: true }
    }

    const res = await createStagingRow(id, payload)
    if (!res.ok) return res

    const matchRes = await applyStagingMatchToLote(id, lote.fornecedor_id)
    if (matchRes.ok) {
      setRows(matchRes.rows)
      setSummary(matchRes.summary)
    }
    return { ok: true }
  }

  async function handleDeleteRow(rowId) {
    if (!window.confirm('Excluir este produto do lote?')) return

    setActionError(null)
    const res = await deleteStagingRow(rowId)
    if (!res.ok) {
      setActionError(res.error)
      return
    }

    const matchRes = await applyStagingMatchToLote(id, lote.fornecedor_id)
    if (matchRes.ok) {
      setRows(matchRes.rows)
      setSummary(matchRes.summary)
    } else {
      setRows((prev) => prev.filter((r) => r.id !== rowId))
    }
  }

  async function handleLaunch() {
    setLaunching(true)
    setActionError(null)

    const res = await promoverLote(id)
    setLaunching(false)
    setConfirmLaunchOpen(false)

    if (!res.ok) {
      setActionError(res.error)
      return
    }

    const { novos = 0, atualizacoes = 0 } = res.result ?? {}
    navigate('/admin/importacao', {
      state: {
        successMessage: `Lote lançado com sucesso: ${novos} novo(s), ${atualizacoes} atualização(ões).`,
      },
    })
  }

  if (!id) {
    return (
      <div className="w-full min-w-0 space-y-4">
        <PageBackLink to="/admin/importacao">Voltar ao lançamento</PageBackLink>
        <AlertMessage>Lote não informado.</AlertMessage>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <PageBackLink to="/admin/importacao">Voltar ao lançamento</PageBackLink>

      {loading ? (
        <EmptyState
          title="Carregando lote…"
          description="Buscando produtos extraídos."
        />
      ) : error && !lote ? (
        <AlertMessage>{error}</AlertMessage>
      ) : lote ? (
        <>
          <PageHeader
            eyebrow="Revisão de extração"
            title={lote.fornecedor_nome}
            description={`Enviado em ${formatLoteDate(lote.data_upload)}`}
            actions={
              <ImportacaoStatusBadge status={lote.status} />
            }
          />

          {error ? <AlertMessage>{error}</AlertMessage> : null}
          {actionError ? <AlertMessage>{actionError}</AlertMessage> : null}

          {!readOnly && summary ? (
            <StagingMatchSummary summary={summary} />
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {rows.length} produto(s) neste lote
              {readOnly ? ' · somente leitura' : ''}
            </p>
            {!readOnly ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingRow(null)
                    setRowModalOpen(true)
                  }}
                >
                  Adicionar produto
                </Button>
                <Button
                  type="button"
                  disabled={!canLaunch}
                  onClick={() => setConfirmLaunchOpen(true)}
                >
                  Lançar produtos
                </Button>
              </div>
            ) : null}
          </div>

          {!readOnly && summary?.erros > 0 ? (
            <AlertMessage tone="info">
              Corrija {summary.erros} linha(s) com erro antes de lançar.
            </AlertMessage>
          ) : null}

          <StagingProductsTable
            rows={rows}
            loading={false}
            readOnly={readOnly}
            onRowChange={handleRowChange}
            onEdit={(row) => {
              setEditingRow(row)
              setRowModalOpen(true)
            }}
            onDelete={handleDeleteRow}
          />

          <ModalStagingRowForm
            open={rowModalOpen}
            onClose={() => {
              setRowModalOpen(false)
              setEditingRow(null)
            }}
            initial={editingRow}
            title={editingRow ? 'Editar produto' : 'Adicionar produto'}
            onSave={handleSaveRow}
          />

          <Modal
            open={confirmLaunchOpen}
            onClose={() => setConfirmLaunchOpen(false)}
            title="Confirmar lançamento"
            footer={
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmLaunchOpen(false)}
                  disabled={launching}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  loading={launching}
                  onClick={() => void handleLaunch()}
                >
                  Confirmar lançamento
                </Button>
              </div>
            }
          >
            <p className="text-sm text-slate-700">
              {summary
                ? `Serão lançados ${summary.novos} produto(s) novo(s) e ${summary.atualizacoes} atualização(ões) no catálogo oficial.`
                : 'Os produtos serão publicados no catálogo oficial.'}
            </p>
          </Modal>
        </>
      ) : null}
    </div>
  )
}
