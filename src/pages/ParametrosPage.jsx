import { useCallback, useState } from 'react'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { useSyncPageLoading } from '../contexts/PageLoadingContext'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import {
  criarCotacao,
  fetchCotacoesRecentes,
} from '../services/produtoImportacaoService'
import { formatLoteDate } from '../utils/importacaoVisuals'

export function ParametrosPage() {
  const [cotacoes, setCotacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [moeda, setMoeda] = useState('')
  const [taxa, setTaxa] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCotacoes = useCallback(async (isActive) => {
    setLoading(true)
    setError(null)
    const res = await fetchCotacoesRecentes()
    if (isActive && !isActive()) return
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setCotacoes(res.rows)
  }, [])

  useSyncPageLoading(loading)

  useAbortableAsync(
    async (_signal, isActive) => {
      await loadCotacoes(isActive)
    },
    [loadCotacoes],
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    const taxaNum = Number.parseFloat(String(taxa).replace(',', '.'))
    if (!moeda.trim()) {
      setFormError('Informe a moeda (ex.: USD, EUR).')
      return
    }
    if (!Number.isFinite(taxaNum) || taxaNum <= 0) {
      setFormError('Informe uma taxa válida maior que zero.')
      return
    }

    setSaving(true)
    const res = await criarCotacao({
      moeda_origem: moeda.trim(),
      taxa_conversao: taxaNum,
    })
    setSaving(false)

    if (!res.ok) {
      setFormError(res.error)
      return
    }

    setMoeda('')
    setTaxa('')
    setSuccessMessage(
      `Cotação ${res.row.moeda_origem} cadastrada. Preços internos serão recalculados.`,
    )
    await loadCotacoes(() => true)
  }

  const columns = [
    {
      key: 'moeda',
      header: 'Moeda',
      cell: (row) => (
        <span className="font-mono font-semibold text-slate-900">
          {row.moeda_origem}
        </span>
      ),
    },
    {
      key: 'taxa',
      header: 'Taxa (→ BRL)',
      align: 'right',
      cell: (row) => Number(row.taxa_conversao).toLocaleString('pt-BR'),
    },
    {
      key: 'vigencia',
      header: 'Vigência',
      cell: (row) => formatLoteDate(row.data_vigencia),
    },
  ]

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Syagri"
        title="Parâmetros"
        description="Cotações de moeda para cálculo do preço interno dos produtos."
      />

      {error ? <AlertMessage>{error}</AlertMessage> : null}
      {successMessage ? (
        <AlertMessage tone="success" role="status">
          {successMessage}
        </AlertMessage>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">Nova cotação</h2>
        <p className="mt-1 text-sm text-slate-600">
          BRL usa taxa 1 automaticamente. Cadastre USD, EUR e outras moedas
          usadas nos lançamentos.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              label="Moeda de origem"
              placeholder="Ex.: USD"
              value={moeda}
              onChange={(e) => setMoeda(e.target.value.toUpperCase())}
              disabled={saving}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Taxa de conversão"
              placeholder="Ex.: 5.45"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
              disabled={saving}
            />
          </div>
          <Button type="submit" loading={saving} className="shrink-0">
            Cadastrar
          </Button>
        </form>

        {formError ? (
          <p className="mt-3 text-sm font-medium text-feedback-error" role="alert">
            {formError}
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm sm:rounded-3xl">
        <div className="border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
            Histórico de cotações
          </p>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? (
            <EmptyState title="Carregando cotações…" />
          ) : cotacoes.length === 0 ? (
            <EmptyState
              title="Nenhuma cotação cadastrada"
              description="Cadastre a primeira taxa acima."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={cotacoes}
              getRowKey={(row) => row.id}
            />
          )}
        </div>
      </section>
    </div>
  )
}
