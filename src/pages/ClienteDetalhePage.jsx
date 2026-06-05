import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ModalClienteForm } from '../components/clientes/ModalClienteForm'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { EmptyState } from '../components/ui/EmptyState'
import { FormSection } from '../components/ui/FormSection'
import { PageBackLink } from '../components/ui/PageBackLink'
import { PageHeader } from '../components/ui/PageHeader'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { useAuth } from '../hooks/useAuth'
import {
  fetchClientById,
  fetchClientSimulations,
} from '../services/clientService'
import { formatShortDate } from '../utils/formatShortDate'
import { formatBRL } from '../utils/money'

function statusLabel(status) {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'pending':
      return 'Pendente'
    case 'approved':
      return 'Aprovado'
    case 'rejected':
      return 'Reprovado'
    case 'converted':
      return 'Convertido'
    default:
      return status
  }
}

export function ClienteDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const isGestor = role === 'gestor'
  const [client, setClient] = useState(null)
  const [simulations, setSimulations] = useState([])
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!id) return

      setLoading(true)
      setError(null)

      const [clientRes, simRes] = await Promise.all([
        fetchClientById(id),
        fetchClientSimulations(id),
      ])

      if (!isActive()) return

      setLoading(false)

      if (!clientRes.ok) {
        setError(clientRes.error)
        setClient(null)
        setSimulations([])
        return
      }
      if (!simRes.ok) {
        setError(simRes.error)
        setClient(clientRes.client)
        setSimulations([])
        return
      }

      setClient(clientRes.client)
      setSimulations(simRes.rows)
    },
    [id],
    Boolean(id),
  )

  const stats = useMemo(() => {
    const total = simulations.length
    const vendas = simulations.filter((s) => s.status === 'converted').length
    const volume = simulations.reduce(
      (acc, s) => acc + Number(s.total_proposta ?? 0),
      0,
    )
    return { total, vendas, volume }
  }, [simulations])

  const tableColumns = useMemo(
    () => [
      {
        key: 'created_at',
        header: 'Data',
        render: (row) => formatShortDate(row.created_at),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => statusLabel(row.status),
      },
      {
        key: 'total_proposta',
        header: 'Proposta',
        align: 'right',
        cellClassName: 'finance-text font-medium text-slate-900',
        render: (row) => formatBRL(row.total_proposta),
      },
      {
        key: 'actions',
        header: 'Ações',
        align: 'right',
        render: (row) =>
          row.status === 'approved' || row.status === 'converted' ? (
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3"
              onClick={() => navigate(`/pedido/${row.id}`)}
            >
              Ver pedido
            </Button>
          ) : (
            '—'
          ),
      },
    ],
    [navigate],
  )

  if (!id) {
    return (
      <div className="w-full">
        <PageBackLink to="/clientes">Voltar para clientes</PageBackLink>
        <AlertMessage>Cliente não informado.</AlertMessage>
      </div>
    )
  }

  return (
    <div className="w-full">
      <PageBackLink to="/clientes">Voltar para clientes</PageBackLink>

      {loading ? (
        <EmptyState title="Carregando cliente…" className="mt-6" />
      ) : error && !client ? (
        <AlertMessage className="mt-4">{error}</AlertMessage>
      ) : client ? (
        <>
          <PageHeader
            title={client.nome}
            actions={
              isGestor ? (
                <Button type="button" variant="secondary" onClick={() => setEditOpen(true)}>
                  Editar
                </Button>
              ) : null
            }
            className="mb-6"
          />

          {error ? <AlertMessage className="mb-4">{error}</AlertMessage> : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-3xl lg:col-span-2">
              <FormSection title="Dados cadastrais" accent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      CPF / CNPJ
                    </dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {client.cnpj_cpf}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cadastro
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {formatShortDate(client.created_at)}
                    </dd>
                  </div>
                  {client.razao_social ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Razão social
                      </dt>
                      <dd className="mt-1 text-slate-800">{client.razao_social}</dd>
                    </div>
                  ) : null}
                  {client.email ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        E-mail
                      </dt>
                      <dd className="mt-1 text-slate-800">{client.email}</dd>
                    </div>
                  ) : null}
                  {client.telefone ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Telefone
                      </dt>
                      <dd className="mt-1 text-slate-800">{client.telefone}</dd>
                    </div>
                  ) : null}
                  {client.municipio || client.uf ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Local
                      </dt>
                      <dd className="mt-1 text-slate-800">
                        {[client.municipio, client.uf].filter(Boolean).join(' — ')}
                      </dd>
                    </div>
                  ) : null}
                  {client.logradouro ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Endereço
                      </dt>
                      <dd className="mt-1 text-slate-800">
                        {[client.logradouro, client.bairro, client.cep]
                          .filter(Boolean)
                          .join(' · ')}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </FormSection>
            </Card>

            <Card className="rounded-3xl">
              <FormSection title="Resumo comercial" accent>
                <dl className="flex flex-col gap-4">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Simulações
                    </dt>
                    <dd className="finance-text mt-1 text-2xl font-semibold text-slate-900">
                      {stats.total}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Vendas
                    </dt>
                    <dd className="finance-text mt-1 text-2xl font-semibold text-emerald-900">
                      {stats.vendas}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Volume proposto
                    </dt>
                    <dd className="finance-text mt-1 text-xl font-semibold text-slate-900">
                      {formatBRL(stats.volume)}
                    </dd>
                  </div>
                </dl>
              </FormSection>
            </Card>
          </div>

          <DataTable
            className="mt-6"
            columns={tableColumns}
            rows={simulations}
            loading={false}
            emptyMessage="Nenhuma simulação ou compra registrada para este cliente."
            getRowKey={(row) => row.id}
          />

          <ModalClienteForm
            open={editOpen}
            mode="edit"
            clientId={client.id}
            initial={client}
            onClose={() => setEditOpen(false)}
            onSaved={(updated) => {
              setClient(updated)
              setEditOpen(false)
            }}
          />
        </>
      ) : null}
    </div>
  )
}
