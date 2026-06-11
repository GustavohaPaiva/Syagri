import { useCallback, useMemo, useState } from 'react'
import { CATALOG_PRODUCTS } from '../constants/catalogProducts'
import { CULTURES } from '../constants/simulator'
import { FLOOR_RATIO } from '../types/simulation'
import { parseCpfCnpjInput } from '../utils/dataFormatters'
import { roundMoney } from '../utils/roundMoney'

function clampProposta(proposta, precoUnitario, allowAnyPrice) {
  const p = Number.isFinite(proposta) ? proposta : 0
  if (allowAnyPrice) return Math.max(0, p)
  const safePu = Math.max(0, precoUnitario)
  return Math.min(Math.max(0, p), safePu)
}

function buildLineView(line) {
  const valorTotal = roundMoney(line.volume * line.precoUnitario)
  const propostaTotal = roundMoney(line.volume * line.proposta)
  const floorUnit = FLOOR_RATIO * line.precoUnitario
  const isLineBelowFloor = line.proposta < floorUnit
  return {
    id: line.id,
    productId: line.productId,
    cultura: line.cultura,
    volume: line.volume,
    precoUnitario: line.precoUnitario,
    proposta: line.proposta,
    valorTotal,
    propostaTotal,
    isLineBelowFloor,
  }
}

function createLine(product) {
  const pu = roundMoney(product.precoBase)
  return {
    id: crypto.randomUUID(),
    productId: product.id,
    cultura: product.cultura,
    volume: 1,
    precoUnitario: pu,
    proposta: pu,
  }
}

export function useSimulation(options = {}) {
  const catalog = options.catalog ?? CATALOG_PRODUCTS
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

  const lineViews = useMemo(
    () => lines.map((line) => buildLineView(line)),
    [lines],
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
  const canOverrideFloor = isGestor
  const canConvert =
    lines.length > 0 &&
    totalValor > 0 &&
    (canOverrideFloor || globalStatus === 'Aprovado')

  const showFreteRotas = tipoFrete !== 'FOB'

  const cultureOptions = useMemo(() => {
    const fromCatalog = new Set(catalog.map((p) => p.cultura))
    const merged = new Set([...CULTURES, ...fromCatalog])
    return [...merged].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [catalog])

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
    setLines((prev) => [...prev, createLine(first)])
  }, [catalog, isReadOnly])

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
      const pu = roundMoney(product.precoBase)
      setLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId) return line
          return {
            ...line,
            productId,
            cultura: product.cultura,
            precoUnitario: pu,
            proposta: pu,
          }
        }),
      )
    },
    [catalog, isReadOnly],
  )

  const setLineCultura = useCallback(
    (lineId, cultura) => {
      if (isReadOnly) return
      setLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId) return line
          const currentProduct = catalog.find((p) => p.id === line.productId)
          if (currentProduct?.cultura === cultura) {
            return { ...line, cultura }
          }
          const next = catalog.find((p) => p.cultura === cultura)
          if (!next) return { ...line, cultura }
          const pu = roundMoney(next.precoBase)
          return {
            ...line,
            cultura,
            productId: next.id,
            precoUnitario: pu,
            proposta: pu,
          }
        }),
      )
    },
    [catalog, isReadOnly],
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
          return {
            ...line,
            proposta: clampProposta(proposta, line.precoUnitario, canOverrideFloor),
          }
        }),
      )
    },
    [isReadOnly, canOverrideFloor],
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
          .map((it) => {
            const prod = catalog.find((p) => p.id === it.product_id)
            return {
              id: it.id,
              productId: it.product_id,
              cultura: prod?.cultura ?? it.product?.cultura ?? '',
              volume: it.volume,
              precoUnitario: roundMoney(it.preco_unitario),
              proposta: roundMoney(it.proposta),
            }
          }),
      )
    },
    [catalog, isGestor],
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
