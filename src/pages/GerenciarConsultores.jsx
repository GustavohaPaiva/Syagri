import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConsultorCard } from '../components/consultores/ConsultorCard'
import { ModalNovoConsultor } from '../components/consultores/ModalNovoConsultor'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import { MobileCardList } from '../components/ui/MobileCardList'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { supabase } from '../services/supabase'
import { formatShortDate } from '../utils/formatShortDate'

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

  const emptyMessage =
    rows.length === 0
      ? 'Nenhum consultor cadastrado.'
      : 'Nenhum resultado para a busca.'

  const tableColumns = useMemo(
    () => [
      {
        key: 'nome',
        header: 'Nome',
        cellClassName: 'font-medium text-slate-900',
        render: (row) => row.nome,
      },
      {
        key: 'created_at',
        header: 'Cadastro',
        render: (row) => formatShortDate(row.created_at),
      },
      {
        key: 'actions',
        header: 'Ações',
        align: 'right',
        headerClassName: 'w-40',
        render: (row) => (
          <Button
            type="button"
            variant="secondary"
            className="min-h-0 px-3"
            onClick={() => navigate(`/admin/consultores/${row.id}`)}
          >
            Ver detalhes
          </Button>
        ),
      },
    ],
    [navigate],
  )

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Administração"
        title="Gestão de consultores"
        description="Cadastre consultores, acompanhe a equipe e acesse o histórico de cada perfil."
        actions={
          <Button type="button" onClick={() => setModalOpen(true)}>
            Novo consultor
          </Button>
        }
      />

      {loadError ? (
        <AlertMessage className="mt-6">{loadError}</AlertMessage>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs lg:max-w-sm">
          <SearchInput
            placeholder="Buscar por nome…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!loading ? (
          <p className="text-sm text-slate-500">
            {filteredRows.length}{' '}
            {filteredRows.length === 1 ? 'consultor' : 'consultores'}
          </p>
        ) : null}
      </div>

      <MobileCardList
        className="mt-6"
        items={filteredRows}
        loading={loading}
        emptyMessage={emptyMessage}
        renderItem={(consultor) => (
          <ConsultorCard
            key={consultor.id}
            consultor={consultor}
            onViewDetails={(id) => navigate(`/admin/consultores/${id}`)}
          />
        )}
      />

      <DataTable
        className="mt-6"
        columns={tableColumns}
        rows={filteredRows}
        loading={loading}
        emptyMessage={emptyMessage}
        getRowKey={(row) => row.id}
      />

      <ModalNovoConsultor
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void loadConsultores(() => true)}
      />
    </div>
  )
}
