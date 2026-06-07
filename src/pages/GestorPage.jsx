import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IconBell,
  IconClipboardList,
  IconPackage,
  IconTruck,
  IconUser,
  IconUsers,
} from '../components/icons'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { SimulationListCard } from '../components/SimulationListCard'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { useAuth } from '../hooks/useAuth'
import { fetchUnreadNotificationCount } from '../services/notificationService'
import {
  fetchGestorDashboardStats,
  fetchSimulationsList,
  updateSimulationStatus,
} from '../services/simulationOrderService'

function StatCard({ label, value, hint, to }) {
  const content = (
    <Card className="flex h-full flex-col gap-2 p-5 transition-colors hover:border-primary-200">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="text-sm text-slate-600">{hint}</p> : null}
    </Card>
  )

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}

function QuickLinkCard({ to, title, description, icon: Icon }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-primary-200 hover:shadow-md"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-100">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-slate-600">
          {description}
        </span>
      </span>
    </Link>
  )
}

export function GestorPage() {
  const { user, role, initializing } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [pendingRows, setPendingRows] = useState([])
  const [consultorNomeById, setConsultorNomeById] = useState({})
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1)
  }, [])

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!user?.id || role !== 'gestor') {
        if (!isActive()) return
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const [statsResult, pendingResult, unreadResult] = await Promise.all([
        fetchGestorDashboardStats(),
        fetchSimulationsList({
          userId: user.id,
          role: 'gestor',
          statusFilter: 'pending',
        }),
        fetchUnreadNotificationCount(),
      ])

      if (!isActive()) return

      setLoading(false)

      if (!statsResult.ok || !pendingResult.ok || !unreadResult.ok) {
        setError(
          statsResult.error ??
            pendingResult.error ??
            unreadResult.error ??
            'Não foi possível carregar o painel.',
        )
        return
      }

      setStats(statsResult.stats)
      setPendingRows(pendingResult.rows.slice(0, 6))
      setConsultorNomeById(pendingResult.consultorNomeById)
      setUnreadCount(unreadResult.count)
    },
    [user, role, reloadToken],
    !initializing && Boolean(user?.id) && role === 'gestor',
  )

  async function handleApprove(id, clientName) {
    setPendingAction({ id, type: 'approve' })
    const result = await updateSimulationStatus(id, 'approved', {
      notifyConsultor: true,
      clientName,
    })
    setPendingAction(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    reload()
  }

  async function handleReject(id, clientName) {
    setPendingAction({ id, type: 'reject' })
    const result = await updateSimulationStatus(id, 'rejected', {
      notifyConsultor: true,
      clientName,
    })
    setPendingAction(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    reload()
  }

  if (role !== 'gestor' && !initializing) {
    return (
      <EmptyState
        title="Acesso restrito"
        description="Esta área é exclusiva para gestores."
      />
    )
  }

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Gestão"
        title="Painel do gestor"
        description="Acompanhe aprovações pendentes, notificações e a operação comercial."
        actions={
          <Button type="button" onClick={() => navigate('/simulacoes')}>
            Ver fila completa
          </Button>
        }
        className="mb-6"
      />

      {error ? <AlertMessage className="mb-4">{error}</AlertMessage> : null}

      {loading || initializing ? (
        <EmptyState title="Carregando painel…" description="Aguarde um instante." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Aguardando aprovação"
              value={stats?.pendingCount ?? 0}
              hint="Simulações abaixo de 97%"
              to="/simulacoes"
            />
            <StatCard
              label="Notificações"
              value={unreadCount}
              hint="Mensagens não lidas"
              to="/notificacoes"
            />
            <StatCard
              label="Clientes"
              value={stats?.clientsCount ?? 0}
              hint="Cadastro ativo"
              to="/clientes"
            />
            <StatCard
              label="Consultores"
              value={stats?.consultoresCount ?? 0}
              hint="Equipe comercial"
              to="/admin/consultores"
            />
          </div>

          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Fila de aprovação
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {stats?.pendingCount ?? 0} simulação(ões) aguardando decisão.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/notificacoes')}
              >
                Abrir notificações
              </Button>
            </div>

            {pendingRows.length === 0 ? (
              <EmptyState
                title="Nenhuma simulação pendente"
                description="Quando um consultor notificar o gestor, ela aparecerá aqui."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {pendingRows.map((row) => (
                  <SimulationListCard
                    key={row.id}
                    row={row}
                    isGestor
                    consultorNome={consultorNomeById[row.user_id]}
                    pendingAction={pendingAction}
                    onContinueEdit={(id) =>
                      navigate(`/simulador?simulationId=${encodeURIComponent(id)}`)
                    }
                    onViewDetails={(id) =>
                      navigate(`/simulador?simulationId=${encodeURIComponent(id)}`)
                    }
                    onApprove={(id) => void handleApprove(id, row.client_nome)}
                    onReject={(id) => void handleReject(id, row.client_nome)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Atalhos</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <QuickLinkCard
                to="/notificacoes"
                title="Notificações"
                description="Solicitações de aprovação e retornos da equipe."
                icon={IconBell}
              />
              <QuickLinkCard
                to="/frete"
                title="Fretes"
                description="Catálogo de rotas e valores de frete."
                icon={IconTruck}
              />
              <QuickLinkCard
                to="/simulacoes"
                title="Todas simulações"
                description={`${stats?.approvedCount ?? 0} aprovadas no total.`}
                icon={IconClipboardList}
              />
              <QuickLinkCard
                to="/admin/consultores"
                title="Consultores"
                description="Gerencie credenciais e a equipe comercial."
                icon={IconUsers}
              />
              <QuickLinkCard
                to="/admin/importacao"
                title="Produtos"
                description="Importação e lançamento de catálogo."
                icon={IconPackage}
              />
              <QuickLinkCard
                to="/clientes"
                title="Clientes"
                description="Cadastro, histórico e métricas por cliente."
                icon={IconUser}
              />
            </div>
          </section>

          {stats?.approvedCount != null ? (
            <p className="mt-8 text-sm text-slate-500">
              Volume aprovado registrado:{' '}
              <span className="font-medium text-slate-700">
                {stats.approvedCount} simulação(ões)
              </span>
              {' · '}
              consulte o catálogo em{' '}
              <Link to="/frete" className="font-medium text-primary-700 hover:underline">
                Fretes
              </Link>
              .
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
