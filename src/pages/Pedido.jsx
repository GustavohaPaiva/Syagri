import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormattedInput } from '../components/ui/FormattedInput'
import { Input } from '../components/ui/Input'
import { PageBackLink } from '../components/ui/PageBackLink'
import { PageHeader } from '../components/ui/PageHeader'
import { useSyncPageLoading } from '../contexts/PageLoadingContext'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import {
  fetchSimulationOrderBundle,
  updateClientDeliveryFields,
  updateSimulationStatus,
} from '../services/simulationOrderService'
import { fetchViaCepAddress } from '../services/viaCep'
import { displayCpfCnpj, displayPhone, parseCepInput } from '../utils/dataFormatters'
import { formatBRL } from '../utils/money'
import { roundMoney } from '../utils/roundMoney'

function freightLabel(tipo) {
  if (tipo === 'CIF') return 'CIF — Posto Fazenda'
  if (tipo === 'FOB') return 'FOB — Cliente Retira'
  return '—'
}

export function Pedido({ simulationId }) {
  const printRef = useRef(null)
  const [loadState, setLoadState] = useState('idle')
  const [loadError, setLoadError] = useState(null)
  const [bundle, setBundle] = useState(null)

  useSyncPageLoading(loadState === 'loading' || loadState === 'idle')

  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [bairro, setBairro] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [uf, setUf] = useState('')
  const [complemento, setComplemento] = useState('')

  const [cepLookupLoading, setCepLookupLoading] = useState(false)
  const [cepLookupError, setCepLookupError] = useState(null)

  const [pdfLoading, setPdfLoading] = useState(false)
  const [convertLoading, setConvertLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  const isConverted = bundle?.simulation.status === 'converted'
  const isApproved = bundle?.simulation.status === 'approved'
  const isCif = bundle?.simulation.tipo_frete === 'CIF'
  const formLocked = isConverted

  useAbortableAsync(
    async (_signal, isActive) => {
      setLoadState('loading')
      setLoadError(null)
      const res = await fetchSimulationOrderBundle(simulationId)
      if (!isActive()) return
      if (!res.ok) {
        setLoadState('error')
        setLoadError(res.error)
        setBundle(null)
        return
      }
      setBundle(res.data)
      const c = res.data.client
      setCep(parseCepInput(c.cep ?? ''))
      setLogradouro(c.logradouro ?? '')
      setBairro(c.bairro ?? '')
      setMunicipio(c.municipio ?? '')
      setUf(c.uf ?? '')
      setLoadState('ready')
    },
    [simulationId],
  )

  const lookupCep = useCallback(
    async (digits) => {
      if (formLocked || !isCif || digits.length !== 8) return
      setCepLookupLoading(true)
      setCepLookupError(null)
      const res = await fetchViaCepAddress(digits)
      setCepLookupLoading(false)
      if (!res.ok) {
        setCepLookupError(res.error)
        return
      }
      setLogradouro(res.data.logradouro)
      setBairro(res.data.bairro)
      setMunicipio(res.data.municipio)
      setUf(res.data.uf)
    },
    [formLocked, isCif],
  )

  useEffect(() => {
    if (formLocked || !isCif) return
    const digits = parseCepInput(cep)
    if (digits.length !== 8) return

    const handle = window.setTimeout(() => {
      void lookupCep(digits)
    }, 450)
    return () => window.clearTimeout(handle)
  }, [cep, formLocked, isCif, lookupCep])

  const cepDigits = parseCepInput(cep)
  const displayedCepLookupError =
    isCif && cepDigits.length === 8 ? cepLookupError : null

  const handleGerarPdf = useCallback(async () => {
    if (!bundle || !printRef.current) return

    setActionError(null)
    setPdfLoading(true)
    try {
      const safeName = (bundle.client.nome || 'cliente')
        .replace(/[^\w-]+/g, '_')
        .slice(0, 40)
      const { downloadPedidoPdfFromElement } = await import('../services/pedidoPdf')
      await downloadPedidoPdfFromElement(
        printRef.current,
        `pedido-syagri-${bundle.simulation.id}-${safeName}.pdf`,
      )

      if (isCif) {
        const addr = await updateClientDeliveryFields({
          clientId: bundle.client.id,
          cep: parseCepInput(cep) || null,
          logradouro: logradouro.trim() || null,
          bairro: bairro.trim() || null,
          municipio: municipio.trim() || null,
          uf: uf.trim().toUpperCase().slice(0, 2) || null,
        })
        if (!addr.ok) {
          setActionError(addr.error)
          return
        }
        setBundle((prev) =>
          prev
            ? {
                ...prev,
                client: {
                  ...prev.client,
                  cep: parseCepInput(cep) || null,
                  logradouro: logradouro.trim() || null,
                  bairro: bairro.trim() || null,
                  municipio: municipio.trim() || null,
                  uf: uf.trim().toUpperCase().slice(0, 2) || null,
                },
              }
            : prev,
        )
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao gerar o PDF.'
      setActionError(msg)
    } finally {
      setPdfLoading(false)
    }
  }, [bairro, bundle, cep, isCif, logradouro, municipio, uf])

  const handleMarcarConvertida = useCallback(async () => {
    if (!bundle || bundle.simulation.status !== 'approved') return

    setActionError(null)
    setConvertLoading(true)
    try {
      const st = await updateSimulationStatus(bundle.simulation.id, 'converted')
      if (!st.ok) {
        setActionError(st.error)
        return
      }
      setBundle((prev) =>
        prev
          ? {
              ...prev,
              simulation: { ...prev.simulation, status: 'converted' },
            }
          : prev,
      )
    } finally {
      setConvertLoading(false)
    }
  }, [bundle])

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <div className="w-full py-16 text-center text-slate-600">
        Carregando dados do pedido…
      </div>
    )
  }

  if (loadState === 'error' || !bundle) {
    return (
      <div className="w-full py-8">
        <PageBackLink to="/simulacoes">Voltar para simulações</PageBackLink>
        <AlertMessage className="mt-4">
          {loadError ?? 'Simulação inválida.'}
        </AlertMessage>
      </div>
    )
  }

  if (bundle.simulation.status !== 'approved' && bundle.simulation.status !== 'converted') {
    return (
      <div className="w-full py-8">
        <PageBackLink to="/simulacoes">Voltar para simulações</PageBackLink>
        <AlertMessage className="mt-4">
          Apenas simulações aprovadas podem ser visualizadas como pedido. Status
          atual: {bundle.simulation.status}
        </AlertMessage>
      </div>
    )
  }

  return (
    <div className="w-full py-2">
      <PageBackLink to="/simulacoes">Voltar para simulações</PageBackLink>

      <PageHeader
        eyebrow="Syagri"
        title="Pedido"
        actions={
          isConverted ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              Convertido
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-800 ring-1 ring-primary-200">
              Aprovado
            </span>
          )
        }
        className="mb-6"
      />

      {actionError ? <AlertMessage className="mb-4">{actionError}</AlertMessage> : null}

      <div ref={printRef} className="flex flex-col gap-6">
        <Card className="rounded-3xl">
          <h2 className="mb-4 text-sm font-semibold text-primary-800">Cliente</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Nome</dt>
              <dd className="mt-1 text-base font-medium text-slate-900">
                {bundle.client.nome}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">
                CPF / CNPJ
              </dt>
              <dd className="mt-1 text-base font-medium text-slate-900">
                {displayCpfCnpj(bundle.client.cnpj_cpf)}
              </dd>
            </div>
            {bundle.client.email ? (
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  E-mail
                </dt>
                <dd className="mt-1 text-base text-slate-800">{bundle.client.email}</dd>
              </div>
            ) : null}
            {bundle.client.telefone ? (
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Telefone
                </dt>
                <dd className="mt-1 text-base text-slate-800">
                  {displayPhone(bundle.client.telefone)}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">
                Tipo de frete
              </dt>
              <dd className="mt-1 text-base text-slate-800">
                {freightLabel(bundle.simulation.tipo_frete)}
              </dd>
            </div>
          </dl>
        </Card>

        {isCif ? (
          <Card className="rounded-3xl">
            <h2 className="mb-4 text-sm font-semibold text-primary-800">Entrega</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FormattedInput
                  format="cep"
                  label="CEP"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  disabled={formLocked}
                  className="finance-text"
                />
                {cepLookupLoading ? (
                  <p className="mt-2 text-xs text-slate-500">Consultando ViaCEP…</p>
                ) : null}
                {displayedCepLookupError ? (
                  <p className="mt-2 text-xs font-medium text-feedback-error">
                    {displayedCepLookupError}
                  </p>
                ) : null}
              </div>
              <Input
                label="Complemento (opcional)"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                disabled={formLocked}
              />
              <Input
                label="Logradouro"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                disabled={formLocked}
              />
              <Input
                label="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                disabled={formLocked}
              />
              <Input
                label="Município"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                disabled={formLocked}
              />
              <Input
                label="UF"
                value={uf}
                maxLength={2}
                onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                disabled={formLocked}
              />
            </div>
          </Card>
        ) : null}

        <Card className="rounded-3xl">
          <h2 className="mb-4 text-sm font-semibold text-primary-800">Itens</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Cultura</th>
                  <th className="px-4 py-3">Volume</th>
                  <th className="px-4 py-3">Preço unit.</th>
                  <th className="px-4 py-3">Proposta unit.</th>
                  <th className="px-4 py-3">Valor total</th>
                  <th className="px-4 py-3">Proposta total</th>
                </tr>
              </thead>
              <tbody>
                {bundle.items.map((item) => {
                  const nome = item.product?.nome ?? '—'
                  const cultura = item.product?.cultura ?? '—'
                  const valorTotal = roundMoney(item.volume * item.preco_unitario)
                  const propostaTotal = roundMoney(item.volume * item.proposta)
                  return (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{nome}</td>
                      <td className="px-4 py-3 text-slate-700">{cultura}</td>
                      <td className="finance-text px-4 py-3 text-slate-800">
                        {item.volume}
                      </td>
                      <td className="finance-text px-4 py-3 text-slate-800">
                        {formatBRL(item.preco_unitario)}
                      </td>
                      <td className="finance-text px-4 py-3 text-slate-800">
                        {formatBRL(item.proposta)}
                      </td>
                      <td className="finance-text px-4 py-3 font-medium text-slate-900">
                        {formatBRL(valorTotal)}
                      </td>
                      <td className="finance-text px-4 py-3 font-medium text-slate-900">
                        {formatBRL(propostaTotal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">
                Total bruto (tabela)
              </dt>
              <dd className="finance-text mt-1 text-lg font-semibold text-slate-900">
                {formatBRL(bundle.simulation.total_bruto)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">
                Total proposta
              </dt>
              <dd className="finance-text mt-1 text-lg font-semibold text-slate-900">
                {formatBRL(bundle.simulation.total_proposta)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="mt-6 flex w-full flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          loading={pdfLoading}
          onClick={() => void handleGerarPdf()}
        >
          Gerar PDF
        </Button>
        {isApproved ? (
          <Button
            type="button"
            variant="primary"
            className="w-full"
            loading={convertLoading}
            onClick={() => void handleMarcarConvertida()}
          >
            Marcar como convertida
          </Button>
        ) : null}
      </div>
    </div>
  )
}
