import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SimulationListCard } from '../components/SimulationListCard'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { useAuth } from '../hooks/useAuth'
import {
  fetchSimulationsList,
  updateSimulationStatus,
} from '../services/simulationOrderService'

const FILTER_PILLS = [
  { key: 'all', label: 'Todos' },
  { key: 'draft', label: 'Rascunhos' },
  { key: 'pending', label: 'Aguardando aprovação' },
  { key: 'approved', label: 'Aprovados' },
]

export function ListagemSimulacoes() {
  const { user, role, initializing } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [consultorNomeById, setConsultorNomeById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quickFilter, setQuickFilter] = useState('all')
  const [pendingAction, setPendingAction] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const statusForQuery = quickFilter === 'all' ? null : quickFilter

  const canFetch = !initializing && Boolean(user?.id) && Boolean(role)

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!user?.id || !role) {
        if (!isActive()) return
        setLoading(false)
        setError('Perfil não encontrado.')
        setRows([])
        return
      }

      setLoading(true)
      setError(null)

      const result = await fetchSimulationsList({
        userId: user.id,
        role,
        statusFilter: statusForQuery,
      })

      if (!isActive()) return

      setLoading(false)
      if (!result.ok) {
        setError(result.error)
        setRows([])
        setConsultorNomeById({})
        return
      }
      setRows(result.rows)
      setConsultorNomeById(result.consultorNomeById)
    },
    [user, role, statusForQuery, reloadToken],
    canFetch,
  )

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1)
  }, [])

  function openSimulador(simulationId) {
    navigate(`/simulador?simulationId=${encodeURIComponent(simulationId)}`)
  }

  async function handleApprove(id) {
    setPendingAction({ id, type: 'approve' })
    const r = await updateSimulationStatus(id, 'approved')
    setPendingAction(null)
    if (!r.ok) {
      setError(r.error)
      return
    }
    reload()
  }

  async function handleReject(id) {
    setPendingAction({ id, type: 'reject' })
    const r = await updateSimulationStatus(id, 'rejected')
    setPendingAction(null)
    if (!r.ok) {
      setError(r.error)
      return
    }
    reload()
  }

  const filterPillClass = (key) =>
    [
      'h-9 rounded-2xl border px-4 text-sm font-medium transition-colors',
      quickFilter === key
        ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
        : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-slate-50',
    ].join(' ')

  const isGestor = role === 'gestor'

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const client = row.client_nome.toLowerCase()
      const consultor = (consultorNomeById[row.user_id] ?? '').toLowerCase()
      return client.includes(q) || consultor.includes(q)
    })
  }, [rows, searchQuery, consultorNomeById])

  return (
    <div className="w-full">
      <PageHeader
        title={isGestor ? 'Simulações' : 'Minhas simulações'}
        description="Acompanhe rascunhos, aprovações e propostas convertidas."
        actions={
          <Button type="button" onClick={() => navigate('/simulador')}>
            Nova simulação
          </Button>
        }
        className="mb-6"
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="lg:w-80 lg:shrink-0">
          <SearchInput
            placeholder="Buscar por cliente ou consultor…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 lg:ml-auto lg:justify-end">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.key}
              type="button"
              className={filterPillClass(pill.key)}
              onClick={() => setQuickFilter(pill.key)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <AlertMessage className="mt-4">{error}</AlertMessage> : null}

      {loading || initializing ? (
        <EmptyState
          className="mt-6"
          title="Carregando simulações…"
          description="Aguarde um instante."
        />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={
            rows.length === 0
              ? 'Nenhuma simulação encontrada'
              : 'Nenhum resultado para a busca'
          }
          description={
            rows.length === 0
              ? 'Crie uma nova simulação para começar.'
              : 'Tente outro termo ou limpe os filtros.'
          }
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map((row) => (
            <SimulationListCard
              key={row.id}
              row={row}
              isGestor={isGestor}
              consultorNome={consultorNomeById[row.user_id]}
              pendingAction={pendingAction}
              onContinueEdit={openSimulador}
              onViewDetails={openSimulador}
              onApprove={(id) => void handleApprove(id)}
              onReject={(id) => void handleReject(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
