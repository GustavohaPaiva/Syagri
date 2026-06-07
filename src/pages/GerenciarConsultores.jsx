import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConsultorFiltersPanel, ConsultorStatsBar } from '../components/consultores/ConsultorVisuals'
import { ConsultorTable } from '../components/consultores/ConsultorTable'
import { ModalNovoConsultor } from '../components/consultores/ModalNovoConsultor'
import { IconUsers } from '../components/icons'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { supabase } from '../services/supabase'

export function GerenciarConsultores() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadConsultores = useCallback(async (isActive) => {
    setLoading(true)
    setLoadError(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, created_at')
      .eq('role', 'consultor')
      .order('nome', { ascending: true })

    if (!isActive()) return

    setLoading(false)

    if (error) {
      setLoadError(error.message)
      setRows([])
      return
    }

    setRows(data ?? [])
  }, [])

  useAbortableAsync(
    async (_signal, isActive) => {
      await loadConsultores(isActive)
    },
    [loadConsultores],
  )

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => row.nome.toLowerCase().includes(q))
  }, [rows, searchQuery])

  const hasFilters = Boolean(searchQuery.trim())

  const emptyMessage =
    rows.length === 0
      ? 'Nenhum consultor cadastrado.'
      : 'Nenhum resultado para a busca.'

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50/80 via-white to-violet-50/40 p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:p-8">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-primary-200/30 blur-3xl sm:-right-10 sm:-top-10 sm:size-40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-1/4 size-24 rounded-full bg-violet-200/20 blur-3xl sm:-bottom-8 sm:left-1/3 sm:size-32"
          aria-hidden
        />

        <PageHeader
          eyebrow="Administração"
          title="Gestão de consultores"
          description="Cadastre consultores, acompanhe a equipe e acesse o histórico de cada perfil."
          actions={
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setModalOpen(true)}
            >
              Novo consultor
            </Button>
          }
          className="relative mb-0"
        />

        <div className="relative mt-4 flex items-start gap-3 rounded-xl border border-white/80 bg-white/60 p-3 backdrop-blur-sm sm:mt-5 sm:items-center sm:rounded-2xl sm:px-4 sm:py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm sm:size-9 sm:rounded-xl">
            <IconUsers className="size-3.5 sm:size-4" />
          </span>
          <p className="min-w-0 text-sm leading-relaxed text-slate-700">
            {loading
              ? 'Carregando equipe comercial…'
              : hasFilters
                ? `${filteredRows.length} consultor(es) encontrado(s) na busca.`
                : `${rows.length} consultor(es) cadastrado(s) na operação.`}
          </p>
        </div>
      </div>

      {loadError ? <AlertMessage>{loadError}</AlertMessage> : null}

      <ConsultorStatsBar
        total={rows.length}
        filtered={filteredRows.length}
        loading={loading}
      />

      <ConsultorFiltersPanel
        searchQuery={searchQuery}
        hasFilters={hasFilters}
        onClear={() => setSearchQuery('')}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
      />

      <ConsultorTable
        rows={filteredRows}
        loading={loading}
        emptyMessage={emptyMessage}
        onViewDetails={(id) => navigate(`/admin/consultores/${id}`)}
      />

      <ModalNovoConsultor
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void loadConsultores(() => true)}
      />
    </div>
  )
}
