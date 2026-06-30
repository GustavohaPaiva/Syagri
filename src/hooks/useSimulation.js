import { useCallback, useMemo, useState } from 'react'
import { CATALOG_PRODUCTS } from '../constants/catalogProducts'
import { CULTURES } from '../constants/simulator'
import { FLOOR_RATIO } from '../types/simulation'
import { parseCpfCnpjInput } from '../utils/dataFormatters'
import {
  calcDiasAntecipacao,
  calcPrecoSimulacao,
} from '../utils/pricingCalculations'
import { roundMoney } from '../utils/roundMoney'

function clampProposta(proposta, precoUnitario, allowAnyPrice) {
  const p = Number.isFinite(proposta) ? proposta : 0
  if (allowAnyPrice) return Math.max(0, p)
  const safePu = Math.max(0, precoUnitario)
  return Math.min(Math.max(0, p), safePu)
}

function resolvePrecoUnitario(product, context) {
  if (!product) return 0
  const { dataPagamento, freteUnitario = 0 } = context
  const dias = calcDiasAntecipacao(dataPagamento, product.vencimentoLista)
  const { precoFinal } = calcPrecoSimulacao({
    custoIcms: product.custoIcms ?? product.custoBrl * 0.96,
    freteUnitario,
    diasAntecipacao: dias,
  })
  return precoFinal
}

function buildLineView(line, catalog, context, canOverrideFloor) {
  const product = catalog.find((p) => p.id === line.productId)
  const precoUnitario = resolvePrecoUnitario(product, context)
  const proposta = clampProposta(
    line.proposta ?? precoUnitario,
    precoUnitario,
    canOverrideFloor,
  )
  const valorTotal = roundMoney(line.volume * precoUnitario)
  const propostaTotal = roundMoney(line.volume * proposta)
  const floorUnit = FLOOR_RATIO * precoUnitario
  const isLineBelowFloor = proposta < floorUnit

  return {
    id: line.id,
    productId: line.productId,
    cultura: line.cultura,
    volume: line.volume,
    precoUnitario,
    proposta,
    valorTotal,
    propostaTotal,
    isLineBelowFloor,
    displayNome: product?.displayNome ?? product?.nome ?? '—',
  }
}

function createLine(product, context) {
  const pu = resolvePrecoUnitario(product, context)
  return {
    id: crypto.randomUUID(),
    productId: product.id,
    cultura: CULTURES[0] ?? '',
    volume: 1,
    proposta: pu,
  }
}

export function useSimulation(options = {}) {
  const catalog = options.catalog ?? CATALOG_PRODUCTS
  const freteUnitario = options.freteUnitario ?? 0
  const isGestor = options.role === 'gestor'

  const [estado, setEstadoState] = useState(null)
  const [clientId, setClientId] = useState(null)
  const [clientName, setClientNameState] = useState('')
  const [clientCnpjCpf, setClientCnpjCpfState] = useState('')
  const [dataPagamento, setDataPagamentoState] = useState('')
  const [tipoFrete, setTipoFreteState] = useState(null)
  const [origemFrete, setOrigemFreteState] = useState('')
  const [destinoFrete, setDestinoFreteState] = useState('')
  const [quarter, setQuarterState] = useState(null)

  const [lines, setLines] = useState([])
  const [actionBanner, setActionBanner] = useState(null)
  const [remotePendingLock, setRemotePendingLock] = useState(false)

  const pricingContext = useMemo(
    () => ({ dataPagamento, freteUnitario }),
    [dataPagamento, freteUnitario],
  )

  const canOverrideFloor = isGestor

  const lineViews = useMemo(
    () =>
      lines.map((line) =>
        buildLineView(line, catalog, pricingContext, canOverrideFloor),
      ),
    [lines, catalog, pricingContext, canOverrideFloor],
  )

  const { totalValor, totalProposta, globalStatus } = useMemo(() => {
    const totalValorRaw = lineViews.reduce((acc, row) => acc + row.valorTotal, 0)
    const totalPropostaRaw = lineViews.reduce(
      (acc, row) => acc + row.propostaTotal,
      0,
    )
    const tValor = roundMoney(totalValorRaw)
    const tProposta = roundMoney(totalPropostaRaw)
    let status
    if (tValor <= 0) status = 'Rascunho'
    else if (tProposta >= FLOOR_RATIO * tValor) status = 'Aprovado'
    else status = 'Pendente'
    return { totalValor: tValor, totalProposta: tProposta, globalStatus: status }
  }, [lineViews])

  const isReadOnly = !isGestor && remotePendingLock
  const canConvert =
    lines.length > 0 &&
    totalValor > 0 &&
    (canOverrideFloor || globalStatus === 'Aprovado')

  const showFreteRotas = tipoFrete !== 'FOB'

  const cultureOptions = useMemo(() => [...CULTURES].sort((a, b) => a.localeCompare(b, 'pt-BR')), [])

  const setClientName = useCallback(
    (value) => {
      if (isReadOnly) return
      setClientNameState(value)
      setClientId(null)
    },
    [isReadOnly],
  )

  const setClientCnpjCpf = useCallback(
    (value) => {
      if (isReadOnly) return
      setClientCnpjCpfState(parseCpfCnpjInput(value))
    },
    [isReadOnly],
  )

  const selectClient = useCallback(
    (client) => {
      if (isReadOnly) return
      setClientId(client.id ?? null)
      setClientNameState(client.nome ?? '')
      setClientCnpjCpfState(parseCpfCnpjInput(client.cnpj_cpf ?? ''))
      if (client.uf) setEstadoState(client.uf)
    },
    [isReadOnly],
  )

  const setEstado = useCallback(
    (value) => {
      if (isReadOnly) return
      setEstadoState(value || null)
    },
    [isReadOnly],
  )

  const setDataPagamento = useCallback(
    (value) => {
      if (isReadOnly) return
      setDataPagamentoState(value)
    },
    [isReadOnly],
  )

  const setTipoFrete = useCallback(
    (value) => {
      if (isReadOnly) return
      const next = value || null
      setTipoFreteState(next)
      if (next === 'FOB') {
        setOrigemFreteState('')
        setDestinoFreteState('')
      }
    },
    [isReadOnly],
  )

  const setOrigemFrete = useCallback(
    (value) => {
      if (isReadOnly) return
      setOrigemFreteState(value)
    },
    [isReadOnly],
  )

  const setDestinoFrete = useCallback(
    (value) => {
      if (isReadOnly) return
      setDestinoFreteState(value)
    },
    [isReadOnly],
  )

  const setQuarter = useCallback(
    (value) => {
      if (isReadOnly) return
      setQuarterState(value || null)
    },
    [isReadOnly],
  )

  const addLine = useCallback(() => {
    if (isReadOnly) return
    const first = catalog[0]
    if (!first) return
    setLines((prev) => [...prev, createLine(first, pricingContext)])
  }, [catalog, isReadOnly, pricingContext])

  const removeLine = useCallback(
    (lineId) => {
      if (isReadOnly) return
      setLines((prev) => prev.filter((l) => l.id !== lineId))
    },
    [isReadOnly],
  )

  const setLineProduct = useCallback(
    (lineId, productId) => {
      if (isReadOnly) return
      const product = catalog.find((p) => p.id === productId)
      if (!product) return
      const pu = resolvePrecoUnitario(product, pricingContext)
      setLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId) return line
          return {
            ...line,
            productId,
            proposta: pu,
          }
        }),
      )
    },
    [catalog, isReadOnly, pricingContext],
  )

  const setLineCultura = useCallback(
    (lineId, cultura) => {
      if (isReadOnly) return
      setLines((prev) =>
        prev.map((line) =>
          line.id === lineId ? { ...line, cultura } : line,
        ),
      )
    },
    [isReadOnly],
  )

  const setLineVolume = useCallback(
    (lineId, volume) => {
      if (isReadOnly) return
      const v = Number.isFinite(volume) && volume >= 0 ? volume : 0
      setLines((prev) =>
        prev.map((line) =>
          line.id === lineId ? { ...line, volume: v } : line,
        ),
      )
    },
    [isReadOnly],
  )

  const setLineProposta = useCallback(
    (lineId, proposta) => {
      if (isReadOnly) return
      setLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId) return line
          const product = catalog.find((p) => p.id === line.productId)
          const pu = resolvePrecoUnitario(product, pricingContext)
          return {
            ...line,
            proposta: clampProposta(proposta, pu, canOverrideFloor),
          }
        }),
      )
    },
    [catalog, isReadOnly, canOverrideFloor, pricingContext],
  )

  const dismissActionBanner = useCallback(() => setActionBanner(null), [])

  const lockAsPending = useCallback(() => {
    setRemotePendingLock(true)
  }, [])

  const showActionBanner = useCallback((message) => {
    setActionBanner(message)
  }, [])

  const getLaunchBlockReason = useCallback(() => {
    if (lines.length === 0) return 'Inclua ao menos um produto.'
    if (totalValor <= 0) return 'Informe volumes válidos nos produtos.'
    if (canOverrideFloor) return null
    if (globalStatus === 'Pendente') {
      return 'A consolidação está abaixo de 97%. Notifique o gestor ou ajuste as propostas.'
    }
    if (globalStatus !== 'Aprovado') return 'Complete a simulação antes de converter.'
    return null
  }, [canOverrideFloor, globalStatus, lines.length, totalValor])

  const hydrateFromBundle = useCallback(
    (bundle) => {
      setRemotePendingLock(
        !isGestor && bundle.simulation.status === 'pending',
      )
      setClientId(bundle.client.id ?? null)
      setClientNameState(bundle.client.nome)
      setClientCnpjCpfState(parseCpfCnpjInput(bundle.client.cnpj_cpf ?? ''))
      setEstadoState(bundle.client.uf || null)
      setDataPagamentoState(bundle.simulation.data_pagamento ?? '')
      setTipoFreteState(bundle.simulation.tipo_frete ?? null)
      setOrigemFreteState(bundle.simulation.origem_frete ?? '')
      setDestinoFreteState(bundle.simulation.destino_frete ?? '')
      setQuarterState(bundle.simulation.quarter ?? null)
      setActionBanner(null)
      setLines(
        bundle.items
          .filter((it) => it.product_id.length > 0)
          .map((it) => ({
            id: it.id,
            productId: it.product_id,
            cultura: it.cultura ?? CULTURES[0] ?? '',
            volume: it.volume,
            proposta: roundMoney(it.proposta),
          })),
      )
    },
    [isGestor],
  )

  const resetLocal = useCallback(() => {
    setRemotePendingLock(false)
    setClientId(null)
    setClientNameState('')
    setClientCnpjCpfState('')
    setEstadoState(null)
    setDataPagamentoState('')
    setTipoFreteState(null)
    setOrigemFreteState('')
    setDestinoFreteState('')
    setQuarterState(null)
    setLines([])
    setActionBanner(null)
  }, [])

  return {
    catalog,
    cultureOptions,
    estado,
    setEstado,
    clientId,
    clientName,
    setClientName,
    selectClient,
    clientCnpjCpf,
    setClientCnpjCpf,
    dataPagamento,
    setDataPagamento,
    tipoFrete,
    setTipoFrete,
    origemFrete,
    setOrigemFrete,
    destinoFrete,
    setDestinoFrete,
    quarter,
    setQuarter,
    lines: lineViews,
    simulationLines: lines,
    totalValor,
    totalProposta,
    globalStatus,
    isReadOnly,
    isGestor,
    canOverrideFloor,
    canConvert,
    remotePendingLock,
    showFreteRotas,
    addLine,
    removeLine,
    setLineProduct,
    setLineCultura,
    setLineVolume,
    setLineProposta,
    lockAsPending,
    showActionBanner,
    getLaunchBlockReason,
    actionBanner,
    dismissActionBanner,
    hydrateFromBundle,
    resetLocal,
  }
}
