import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FornecedorFiltersPanel,
  FornecedorStatsBar,
} from '../components/fornecedores/FornecedorVisuals'
import { FornecedorTable } from '../components/fornecedores/FornecedorTable'
import { ModalNovoFornecedor } from '../components/fornecedores/ModalNovoFornecedor'
import { IconUsers } from '../components/icons'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { PageInfoBanner } from '../components/ui/InfoStatCard'
import { useSyncPageLoading } from '../contexts/PageLoadingContext'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { fetchFornecedores } from '../services/produtoImportacaoService'

export function GerenciarFornecedores() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useSyncPageLoading(loading)

  const loadFornecedores = useCallback(async (isActive) => {
    setLoading(true)
    setLoadError(null)

    const res = await fetchFornecedores()

    if (!isActive()) return

    setLoading(false)

    if (!res.ok) {
      setLoadError(res.error)
      setRows([])
      return
    }

    setRows(res.rows)
  }, [])

  useAbortableAsync(
    async (_signal, isActive) => {
      await loadFornecedores(isActive)
    },
    [loadFornecedores],
  )

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => row.nome.toLowerCase().includes(q))
  }, [rows, searchQuery])

  const ativosCount = useMemo(
    () => rows.filter((row) => row.ativo).length,
    [rows],
  )

  const hasFilters = Boolean(searchQuery.trim())

  const emptyMessage =
    rows.length === 0
      ? 'Nenhum fornecedor cadastrado.'
      : 'Nenhum resultado para a busca.'

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50/80 via-white to-sky-50/40 p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:p-8">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-primary-200/30 blur-3xl sm:-right-10 sm:-top-10 sm:size-40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-1/4 size-24 rounded-full bg-sky-200/25 blur-3xl sm:-bottom-8 sm:left-1/3 sm:size-32"
          aria-hidden
        />

        <PageHeader
          eyebrow="Administração"
          title="Fornecedores"
          description="Cadastre fornecedores, acompanhe o status e acesse formatos de importação e catálogo."
          actions={
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setModalOpen(true)}
            >
              Novo fornecedor
            </Button>
          }
          className="relative mb-0"
        />

        <PageInfoBanner icon={IconUsers}>
          {loading
            ? 'Carregando fornecedores…'
            : hasFilters
              ? `${filteredRows.length} fornecedor(es) encontrado(s) na busca.`
              : `${rows.length} fornecedor(es) cadastrado(s) na operação.`}
        </PageInfoBanner>
      </div>

      {loadError ? <AlertMessage>{loadError}</AlertMessage> : null}

      <FornecedorStatsBar
        total={rows.length}
        filtered={filteredRows.length}
        ativos={ativosCount}
        loading={loading}
      />

      <FornecedorFiltersPanel
        searchQuery={searchQuery}
        hasFilters={hasFilters}
        onClear={() => setSearchQuery('')}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
      />

      <FornecedorTable
        rows={filteredRows}
        loading={loading}
        emptyMessage={emptyMessage}
        onViewDetails={(id) => navigate(`/admin/fornecedores/${id}`)}
      />

      <ModalNovoFornecedor
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void loadFornecedores(() => true)}
      />
    </div>
  )
}
