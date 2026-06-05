import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ModalEditarConsultor } from '../components/consultores/ModalEditarConsultor'
import { ModalTrocarCredenciais } from '../components/consultores/ModalTrocarCredenciais'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { FormSection } from '../components/ui/FormSection'
import { PageBackLink } from '../components/ui/PageBackLink'
import { PageHeader } from '../components/ui/PageHeader'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { supabase } from '../services/supabase'
import { formatShortDate } from '../utils/formatShortDate'
import { parseSyagriLocalFromEmail } from '../utils/syagriEmail'

export function ConsultorDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [metric, setMetric] = useState(null)
  const [email, setEmail] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [credOpen, setCredOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1)
  }, [])

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!id) return

      setLoading(true)
      setError(null)

      const [metricRes, profileRes, emailRes] = await Promise.all([
        supabase
          .from('consultor_metricas')
          .select('consultor_id, consultor_nome, total_simulacoes, total_vendas')
          .eq('consultor_id', id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('id, nome, created_at, role')
          .eq('id', id)
          .maybeSingle(),
        supabase.rpc('get_consultant_email', { p_consultor_id: id }),
      ])

      if (!isActive()) return

      setLoading(false)

      if (metricRes.error) {
        setError(metricRes.error.message)
        setMetric(null)
        setProfile(null)
        return
      }
      if (profileRes.error) {
        setError(profileRes.error.message)
        setMetric(null)
        setProfile(null)
        return
      }
      if (!metricRes.data || !profileRes.data) {
        setError('Consultor não encontrado ou sem permissão para visualizar.')
        setMetric(null)
        setProfile(null)
        return
      }

      setMetric(metricRes.data)
      setProfile(profileRes.data)
      if (emailRes.error) {
        setEmail('')
      } else {
        setEmail(String(emailRes.data ?? ''))
      }
    },
    [id, reloadToken],
    Boolean(id),
  )

  if (!id) {
    return (
      <div className="w-full">
        <PageBackLink to="/admin/consultores">Voltar para consultores</PageBackLink>
        <AlertMessage>Consultor não informado.</AlertMessage>
      </div>
    )
  }

  const usuario = parseSyagriLocalFromEmail(email)
  const conversionRate =
    metric && Number(metric.total_simulacoes) > 0
      ? Math.round(
          (Number(metric.total_vendas) / Number(metric.total_simulacoes)) * 100,
        )
      : 0

  return (
    <div className="w-full">
      <PageBackLink to="/admin/consultores">Voltar para consultores</PageBackLink>

      {loading ? (
        <EmptyState title="Carregando consultor…" />
      ) : error ? (
        <AlertMessage>{error}</AlertMessage>
      ) : profile && metric ? (
        <>
          <PageHeader
            title={profile.nome}
            description="Detalhes, desempenho e gestão de acesso do consultor."
            actions={
              <>
                <Button type="button" variant="secondary" onClick={() => setEditOpen(true)}>
                  Editar nome
                </Button>
                <Button type="button" onClick={() => setCredOpen(true)}>
                  Trocar credenciais
                </Button>
              </>
            }
            className="mb-6"
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-3xl p-6 lg:col-span-2">
              <FormSection title="Desempenho">
                <dl className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Simulações
                    </dt>
                    <dd className="finance-text mt-1 text-3xl font-semibold text-slate-900">
                      {metric.total_simulacoes}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Vendas
                    </dt>
                    <dd className="finance-text mt-1 text-3xl font-semibold text-slate-900">
                      {metric.total_vendas}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-100">
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      Conversão
                    </dt>
                    <dd className="finance-text mt-1 text-3xl font-semibold text-emerald-900">
                      {conversionRate}%
                    </dd>
                  </div>
                </dl>
              </FormSection>
            </Card>

            <Card className="rounded-3xl p-6">
              <FormSection title="Cadastro e acesso">
                <dl className="flex flex-col gap-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Cadastro
                    </dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {formatShortDate(profile.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Usuário
                    </dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {usuario ? `${usuario}@syagri.com.br` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Perfil
                    </dt>
                    <dd className="mt-1 font-medium capitalize text-slate-900">
                      {profile.role}
                    </dd>
                  </div>
                </dl>
              </FormSection>
            </Card>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin/consultores')}
            >
              Ver todos os consultores
            </Button>
          </div>

          <ModalEditarConsultor
            open={editOpen}
            consultorId={id}
            initialNome={profile.nome}
            onClose={() => setEditOpen(false)}
            onSaved={() => reload()}
          />
          <ModalTrocarCredenciais
            open={credOpen}
            consultorId={id}
            initialUsuario={usuario}
            onClose={() => setCredOpen(false)}
            onSaved={() => reload()}
          />
        </>
      ) : null}
    </div>
  )
}
