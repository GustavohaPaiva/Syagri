import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  IconBell,
  IconClipboardList,
  IconLayoutDashboard,
  IconTruck,
} from '../components/icons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../hooks/useAuth'

function DashboardLinkCard({ to, title, description, icon: Icon }) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-[border-color,box-shadow] hover:border-primary-200 hover:shadow-md"
    >
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-100">
        <Icon className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
    </Link>
  )
}

export function DashboardPage() {
  const { role, initializing } = useAuth()
  const navigate = useNavigate()

  if (!initializing && role === 'gestor') {
    return <Navigate to="/gestor" replace />
  }

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Início"
        title="Dashboard"
        description="Acesse simulações, clientes, fretes e notificações."
        actions={
          <Button type="button" onClick={() => navigate('/simulador')}>
            Nova simulação
          </Button>
        }
        className="mb-6"
      />

      <Card className="mb-6 border-primary-100 bg-gradient-to-br from-white to-primary-50/40 p-6">
        <p className="text-sm leading-relaxed text-slate-700">
          Monte propostas no simulador, acompanhe aprovações e consulte o catálogo
          de fretes por origem e destino.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardLinkCard
          to="/simulador"
          title="Simulador"
          description="Crie ou edite propostas comerciais."
          icon={IconLayoutDashboard}
        />
        <DashboardLinkCard
          to="/simulacoes"
          title="Minhas simulações"
          description="Histórico, rascunhos e status de aprovação."
          icon={IconClipboardList}
        />
        <DashboardLinkCard
          to="/frete"
          title="Fretes"
          description="Consulte rotas e valores do catálogo de fretes."
          icon={IconTruck}
        />
        <DashboardLinkCard
          to="/notificacoes"
          title="Notificações"
          description="Retornos do gestor e confirmações."
          icon={IconBell}
        />
      </div>
    </div>
  )
}
