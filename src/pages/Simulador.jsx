import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ModalClienteForm } from '../components/clientes/ModalClienteForm'
import { SimulationLineCard } from '../components/simulador/SimulationLineCard'
import { SimulationLinesTable } from '../components/simulador/SimulationLinesTable'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Combobox } from '../components/ui/Combobox'
import { EmptyState } from '../components/ui/EmptyState'
import { FormSection } from '../components/ui/FormSection'
import { Input } from '../components/ui/Input'
import { PageBackLink } from '../components/ui/PageBackLink'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import {
  FREIGHT_TYPES,
  QUARTERS,
  STATES,
  getCitiesForState,
} from '../constants/simulator'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { useAuth } from '../hooks/useAuth'
import { useSimulation } from '../hooks/useSimulation'
import {
  fetchSimulationOrderBundle,
  persistApprovedSimulation,
  searchClients,
} from '../services/simulationOrderService'
import { formatBRL } from '../utils/money'

export function Simulador() {
  const [searchParams] = useSearchParams()
  const simulationId = searchParams.get('simulationId')
  const { role } = useAuth()
  const sim = useSimulation({ role })
  const navigate = useNavigate()
  const [persisting, setPersisting] = useState(false)
  const [persistError, setPersistError] = useState(null)
  const [launchError, setLaunchError] = useState(null)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [convertAfterClientSave, setConvertAfterClientSave] = useState(false)

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!simulationId) {
        sim.resetLocal()
        return
      }
      const result = await fetchSimulationOrderBundle(simulationId)
      if (!isActive()) return
      if (!result.ok) {
        navigate('/simulacoes', { replace: true })
        return
      }
      sim.hydrateFromBundle(result.data)
    },
    [simulationId, navigate, sim.hydrateFromBundle, sim.resetLocal],
  )

  const handleClientSearch = useCallback(async (query, signal) => {
    const r = await searchClients(query, signal)
    if (!r.ok) return []
    return r.rows.map((c) => ({
      id: c.id,
      label: c.nome,
      sublabel: [c.cnpj_cpf, c.municipio, c.uf].filter(Boolean).join(' • '),
      payload: c,
    }))
  }, [])

  const openClientRegistration = useCallback(() => {
    if (sim.isReadOnly) return
    if (!sim.clientName.trim()) {
      setLaunchError('Informe o nome do cliente antes de cadastrar.')
      return
    }
    setLaunchError(null)
    setClientModalOpen(true)
  }, [sim.clientName, sim.isReadOnly])

  async function persistAndNavigate(overrideClientId) {
    setPersisting(true)
    try {
      const result = await persistApprovedSimulation({
        clientId: overrideClientId ?? sim.clientId,
        clientName: sim.clientName,
        clientCnpjCpf: sim.clientCnpjCpf,
        estado: sim.estado,
        tipoFrete: sim.tipoFrete,
        origemFrete: sim.origemFrete,
        destinoFrete: sim.destinoFrete,
        dataPagamento: sim.dataPagamento || null,
        quarter: sim.quarter,
        lines: sim.simulationLines.map((l) => ({
          productId: l.productId,
          volume: l.volume,
          precoUnitario: l.precoUnitario,
          proposta: l.proposta,
        })),
        totalValor: sim.totalValor,
        totalProposta: sim.totalProposta,
      })
      if (!result.ok) {
        setPersistError(result.error)
        return
      }
      navigate(`/pedido/${result.simulationId}`)
    } finally {
      setPersisting(false)
    }
  }

  async function handleConvertToPedido() {
    setPersistError(null)
    setLaunchError(null)
    const blockReason = sim.getLaunchBlockReason()
    if (blockReason) {
      setLaunchError(blockReason)
      return
    }
    if (!sim.canConvert) return

    if (!sim.clientId) {
      if (!sim.clientName.trim() || !sim.clientCnpjCpf.trim()) {
        setLaunchError('Informe nome e CPF/CNPJ do cliente.')
        return
      }
      setConvertAfterClientSave(true)
      setClientModalOpen(true)
      return
    }

    await persistAndNavigate()
  }

  const cityOptions = getCitiesForState(sim.estado).map((c) => ({
    id: c,
    label: c,
  }))

  const productsByCulture = (cultura) =>
    sim.catalog.filter((p) => !cultura || p.cultura === cultura)

  const pageTitle = simulationId ? 'Editar simulação' : 'Nova simulação'

  const showReadOnlyNotice = sim.isReadOnly

  const clientModalInitial = useMemo(
    () => ({
      nome: sim.clientName,
      cnpj_cpf: sim.clientCnpjCpf,
      uf: sim.estado ?? '',
    }),
    [sim.clientName, sim.clientCnpjCpf, sim.estado],
  )

  return (
    <div className="w-full py-2">
      <PageBackLink to="/simulacoes">Voltar para simulações</PageBackLink>

      <PageHeader eyebrow="Syagri" title={pageTitle} className="mb-8" />

      {sim.actionBanner ? (
        <AlertMessage tone="info" role="status" className="mb-6">
          <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{sim.actionBanner}</span>
            <Button
              type="button"
              variant="secondary"
              className="h-9 shrink-0 px-4"
              onClick={sim.dismissActionBanner}
            >
              Fechar
            </Button>
          </span>
        </AlertMessage>
      ) : null}

      <div className="flex flex-col gap-6">
        <Card className="rounded-3xl p-6">
          <FormSection title="Cliente" accent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Estado"
                placeholder="Selecione…"
                value={sim.estado ?? ''}
                onChange={(e) => sim.setEstado(e.target.value)}
                options={STATES}
                disabled={sim.isReadOnly}
              />
              <Combobox
                label="Cliente"
                placeholder="Buscar cliente…"
                value={sim.clientName}
                onTextChange={sim.setClientName}
                onSearch={handleClientSearch}
                onSelect={(opt) => sim.selectClient(opt.payload)}
                onCreateRequest={openClientRegistration}
                disabled={sim.isReadOnly}
                className="sm:col-span-2"
              />
              <Input
                label="CPF / CNPJ"
                placeholder="Somente números ou formatado"
                value={sim.clientCnpjCpf}
                onChange={(e) => sim.setClientCnpjCpf(e.target.value)}
                disabled={sim.isReadOnly}
              />
            </div>
          </FormSection>
        </Card>

        <Card className="rounded-3xl p-6">
          <FormSection title="Frete e logística" accent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Data de pagamento"
                type="date"
                value={sim.dataPagamento}
                onChange={(e) => sim.setDataPagamento(e.target.value)}
                disabled={sim.isReadOnly}
              />
              <Select
                label="Tipo de frete"
                placeholder="Selecione…"
                value={sim.tipoFrete ?? ''}
                onChange={(e) => sim.setTipoFrete(e.target.value)}
                options={FREIGHT_TYPES}
                disabled={sim.isReadOnly}
              />
              <Select
                label="Quarter"
                placeholder="Selecione…"
                value={sim.quarter ?? ''}
                onChange={(e) => sim.setQuarter(e.target.value)}
                options={QUARTERS}
                disabled={sim.isReadOnly}
              />
              {sim.showFreteRotas ? (
                <>
                  <Combobox
                    label="Origem do frete"
                    placeholder={
                      sim.estado
                        ? 'Cidade de saída…'
                        : 'Selecione um estado primeiro'
                    }
                    value={sim.origemFrete}
                    onTextChange={sim.setOrigemFrete}
                    onSelect={(opt) => sim.setOrigemFrete(opt.label)}
                    options={cityOptions}
                    disabled={sim.isReadOnly || !sim.estado}
                  />
                  <Combobox
                    label="Destino do frete"
                    placeholder={
                      sim.estado
                        ? 'Cidade de destino…'
                        : 'Selecione um estado primeiro'
                    }
                    value={sim.destinoFrete}
                    onTextChange={sim.setDestinoFrete}
                    onSelect={(opt) => sim.setDestinoFrete(opt.label)}
                    options={cityOptions}
                    disabled={sim.isReadOnly || !sim.estado}
                  />
                </>
              ) : null}
            </div>
          </FormSection>
        </Card>

        <Card className="rounded-3xl p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FormSection title="Produtos" accent className="mb-0 gap-0" />
            <Button
              type="button"
              variant="secondary"
              onClick={sim.addLine}
              disabled={sim.isReadOnly}
            >
              Adicionar produto
            </Button>
          </div>

          {sim.lines.length === 0 ? (
            <EmptyState title="Nenhum produto na simulação" />
          ) : (
            <>
              <div className="grid gap-2 lg:hidden">
                {sim.lines.map((row) => (
                  <SimulationLineCard
                    key={row.id}
                    row={row}
                    cultureOptions={sim.cultureOptions}
                    productOptions={productsByCulture(row.cultura)}
                    isReadOnly={sim.isReadOnly}
                    canOverrideFloor={sim.canOverrideFloor}
                    onVolumeChange={(v) => sim.setLineVolume(row.id, v)}
                    onCulturaChange={(c) => sim.setLineCultura(row.id, c)}
                    onProductChange={(id) => sim.setLineProduct(row.id, id)}
                    onPropostaChange={(p) => sim.setLineProposta(row.id, p)}
                    onRemove={() => sim.removeLine(row.id)}
                  />
                ))}
              </div>
              <SimulationLinesTable
                lines={sim.lines}
                cultureOptions={sim.cultureOptions}
                productsByCulture={productsByCulture}
                isReadOnly={sim.isReadOnly}
                canOverrideFloor={sim.canOverrideFloor}
                onVolumeChange={sim.setLineVolume}
                onCulturaChange={sim.setLineCultura}
                onProductChange={sim.setLineProduct}
                onPropostaChange={sim.setLineProposta}
                onRemove={sim.removeLine}
              />
            </>
          )}
        </Card>

        <Card className="rounded-3xl p-6">
          <FormSection title="Consolidação" accent>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Soma valor total
                </dt>
                <dd className="finance-text mt-1 text-xl font-semibold text-slate-900">
                  {formatBRL(sim.totalValor)}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Soma total proposta
                </dt>
                <dd className="finance-text mt-1 text-xl font-semibold text-slate-900">
                  {formatBRL(sim.totalProposta)}
                </dd>
              </div>
              <div
                className={[
                  'rounded-2xl px-4 py-3',
                  sim.globalStatus === 'Aprovado'
                    ? 'bg-emerald-50 ring-1 ring-emerald-200'
                    : sim.globalStatus === 'Pendente'
                      ? 'bg-amber-50 ring-1 ring-amber-200'
                      : 'bg-slate-50',
                ].join(' ')}
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Status geral
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">
                  {sim.globalStatus}
                </dd>
              </div>
            </dl>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              {showReadOnlyNotice ? (
                <p className="text-sm text-slate-600">
                  Proposta enviada — aguardando decisão do gestor.
                </p>
              ) : null}
              <div className="flex w-full flex-col gap-2">
                {!sim.isReadOnly &&
                !sim.isGestor &&
                sim.globalStatus === 'Pendente' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={sim.notifyGestor}
                  >
                    Notificar gestor
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  loading={persisting}
                  onClick={() => void handleConvertToPedido()}
                >
                  Converter em pedido
                </Button>
              </div>
            </div>

            {launchError ? (
              <AlertMessage className="mt-4">{launchError}</AlertMessage>
            ) : null}
            {persistError ? (
              <AlertMessage className="mt-4">{persistError}</AlertMessage>
            ) : null}
          </FormSection>
        </Card>
      </div>

      <ModalClienteForm
        open={clientModalOpen}
        initial={clientModalInitial}
        onClose={() => {
          setClientModalOpen(false)
          setConvertAfterClientSave(false)
        }}
        onSaved={(client) => {
          sim.selectClient(client)
          if (convertAfterClientSave) {
            setConvertAfterClientSave(false)
            void persistAndNavigate(client.id)
          }
        }}
      />
    </div>
  )
}
