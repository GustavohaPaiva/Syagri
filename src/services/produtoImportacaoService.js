import { supabase } from './supabase'
import { IGNORE_COLUMN_VALUE } from '../constants/mapeamentoCampos'
import { isValidSku, normalizeSku } from '../utils/normalizeSku'

export async function fetchFornecedoresAtivos() {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('id, nome, ativo')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

export async function fetchFornecedores() {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('id, nome, ativo, created_at')
    .order('nome', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

export async function fetchFornecedorById(id) {
  if (!id) return { ok: false, error: 'Fornecedor não informado.' }

  const { data, error } = await supabase
    .from('fornecedores')
    .select('id, nome, ativo, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Fornecedor não encontrado.' }
  return { ok: true, row: data }
}

export async function criarFornecedor(nome) {
  const nomeLimpo = String(nome ?? '').trim()
  if (!nomeLimpo) {
    return { ok: false, error: 'Informe o nome do fornecedor.' }
  }

  const { data, error } = await supabase
    .from('fornecedores')
    .insert({ nome: nomeLimpo, ativo: true })
    .select('id, nome, ativo')
    .single()

  if (error) {
    const message =
      error.code === '23505'
        ? 'Já existe um fornecedor com esse nome.'
        : error.message
    return { ok: false, error: message }
  }

  return { ok: true, row: data }
}

export async function fetchTemplatesByFornecedor(fornecedorId) {
  if (!fornecedorId) return { ok: true, rows: [] }

  const { data, error } = await supabase
    .from('templates_mapeamento')
    .select('id, fornecedor_id, nome_layout, config_json, created_at')
    .eq('fornecedor_id', fornecedorId)
    .order('nome_layout', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

export async function fetchTemplateById(templateId) {
  if (!templateId) return { ok: false, error: 'Template não informado.' }

  const { data, error } = await supabase
    .from('templates_mapeamento')
    .select('id, fornecedor_id, nome_layout, config_json')
    .eq('id', templateId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Template não encontrado.' }
  return { ok: true, row: data }
}

export async function saveTemplateOnly({ fornecedorId, nomeLayout, columnMappings }) {
  const config_json = { version: 1, mappings: columnMappings }

  const { data, error } = await supabase
    .from('templates_mapeamento')
    .insert({
      fornecedor_id: fornecedorId,
      nome_layout: nomeLayout.trim(),
      config_json,
    })
    .select('id, fornecedor_id, nome_layout, config_json')
    .single()

  if (error) {
    const message =
      error.code === '23505'
        ? 'Já existe um layout com esse nome para este fornecedor.'
        : error.message
    return { ok: false, error: message }
  }

  return { ok: true, row: data }
}

export async function updateTemplate(templateId, { nomeLayout, columnMappings }) {
  const patch = {}
  if (nomeLayout !== undefined) patch.nome_layout = nomeLayout.trim()
  if (columnMappings !== undefined) {
    patch.config_json = { version: 1, mappings: columnMappings }
  }

  const { data, error } = await supabase
    .from('templates_mapeamento')
    .update(patch)
    .eq('id', templateId)
    .select('id, fornecedor_id, nome_layout, config_json')
    .single()

  if (error) {
    const message =
      error.code === '23505'
        ? 'Já existe um layout com esse nome para este fornecedor.'
        : error.message
    return { ok: false, error: message }
  }

  return { ok: true, row: data }
}

export async function deleteTemplate(templateId) {
  const { error } = await supabase
    .from('templates_mapeamento')
    .delete()
    .eq('id', templateId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function fetchLotesRecentes(limit = 12) {
  const { data, error } = await supabase
    .from('lotes_importacao')
    .select(
      `
      id,
      status,
      data_upload,
      fornecedor_id,
      fornecedores ( nome )
    `,
    )
    .order('data_upload', { ascending: false })
    .limit(limit)

  if (error) return { ok: false, error: error.message }

  const rows = (data ?? []).map((row) => {
    const rawFornecedor = row.fornecedores
    const fornecedor =
      Array.isArray(rawFornecedor) ? rawFornecedor[0] : rawFornecedor
    return {
      id: row.id,
      status: row.status,
      data_upload: row.data_upload,
      fornecedor_id: row.fornecedor_id,
      fornecedor_nome: fornecedor?.nome ?? '—',
    }
  })

  return { ok: true, rows }
}

export async function fetchLoteById(loteId) {
  if (!loteId) return { ok: false, error: 'Lote não informado.' }

  const { data, error } = await supabase
    .from('lotes_importacao')
    .select(
      `
      id,
      status,
      data_upload,
      fornecedor_id,
      template_id,
      fornecedores ( id, nome )
    `,
    )
    .eq('id', loteId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Lote não encontrado.' }

  const rawFornecedor = data.fornecedores
  const fornecedor = Array.isArray(rawFornecedor)
    ? rawFornecedor[0]
    : rawFornecedor

  return {
    ok: true,
    row: {
      id: data.id,
      status: data.status,
      data_upload: data.data_upload,
      fornecedor_id: data.fornecedor_id,
      template_id: data.template_id,
      fornecedor_nome: fornecedor?.nome ?? '—',
    },
  }
}

export async function fetchStagingByLote(loteId) {
  if (!loteId) return { ok: true, rows: [] }

  const { data, error } = await supabase
    .from('produtos_staging')
    .select(
      'id, lote_id, sku_fornecedor, nome, cultura, quarter, preco_original, moeda, status_linha, dados_brutos',
    )
    .eq('lote_id', loteId)
    .order('created_at', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

function parsePreco(precoStr) {
  const preco_original = Number.parseFloat(
    String(precoStr ?? '0').replace(/\./g, '').replace(',', '.'),
  )
  return Number.isFinite(preco_original) ? preco_original : 0
}

function mapRowToStagingPayload({ loteId, columnMappings, row }) {
  const dados_brutos = {}
  const mapped = {}

  for (const map of columnMappings) {
    const raw = row[map.sourceIndex]
    const value = raw === null || raw === undefined ? '' : String(raw).trim()
    dados_brutos[map.sourceLabel] = value
    if (map.target && map.target !== IGNORE_COLUMN_VALUE) {
      mapped[map.target] = value
    }
  }

  const sku = String(mapped.sku ?? '').trim()

  return {
    lote_id: loteId,
    sku_fornecedor: sku,
    nome: String(mapped.nome ?? '').trim(),
    cultura: String(mapped.cultura ?? '').trim(),
    quarter: String(mapped.quarter ?? '').trim(),
    dados_brutos,
    preco_original: parsePreco(mapped.preco),
    moeda: (mapped.moeda ?? 'BRL').toUpperCase().slice(0, 8),
    status_linha: 'novo',
  }
}

/**
 * Constrói as linhas de produtos_staging a partir dos mapeamentos De-Para.
 */
function buildStagingRows({ loteId, columnMappings, dataRows }) {
  return dataRows
    .map((row) => mapRowToStagingPayload({ loteId, columnMappings, row }))
    .filter((row) => isValidSku(row.sku_fornecedor))
}

export function validateStagingRowFields(row) {
  const errors = []
  if (!isValidSku(row.sku_fornecedor)) errors.push('SKU')
  if (!String(row.nome ?? '').trim()) errors.push('Nome')
  if (!String(row.cultura ?? '').trim()) errors.push('Cultura')
  if (!String(row.quarter ?? '').trim()) errors.push('Quarter')
  if (!String(row.moeda ?? '').trim()) errors.push('Moeda')
  if (Number(row.preco_original) < 0) errors.push('Preço')
  return errors
}

/**
 * Calcula status_linha para cada row com base no catálogo oficial.
 */
export async function computeStagingMatch(fornecedorId, stagingRows) {
  if (!fornecedorId || stagingRows.length === 0) {
    return {
      ok: true,
      rows: stagingRows.map((r) => ({ ...r, status_linha: 'novo' })),
      summary: { novos: 0, atualizacoes: 0, erros: 0 },
    }
  }

  const { data: oficiais, error } = await supabase
    .from('produtos_oficiais')
    .select('id, sku_fornecedor')
    .eq('fornecedor_id', fornecedorId)

  if (error) return { ok: false, error: error.message }

  const catalogBySku = new Map()
  for (const p of oficiais ?? []) {
    catalogBySku.set(normalizeSku(p.sku_fornecedor), p.id)
  }

  const skuCounts = new Map()
  for (const row of stagingRows) {
    const key = normalizeSku(row.sku_fornecedor)
    if (key) skuCounts.set(key, (skuCounts.get(key) ?? 0) + 1)
  }

  let novos = 0
  let atualizacoes = 0
  let erros = 0

  const rows = stagingRows.map((row) => {
    const fieldErrors = validateStagingRowFields(row)
    const skuKey = normalizeSku(row.sku_fornecedor)
    const isDuplicate = skuKey && (skuCounts.get(skuKey) ?? 0) > 1

    let status_linha = 'novo'
    if (fieldErrors.length > 0 || isDuplicate) {
      status_linha = 'erro'
      erros += 1
    } else if (catalogBySku.has(skuKey)) {
      status_linha = 'atualizacao'
      atualizacoes += 1
    } else {
      novos += 1
    }

    return { ...row, status_linha }
  })

  return {
    ok: true,
    rows,
    summary: { novos, atualizacoes, erros },
  }
}

export async function applyStagingMatchToLote(loteId, fornecedorId) {
  const stagingRes = await fetchStagingByLote(loteId)
  if (!stagingRes.ok) return stagingRes

  const matchRes = await computeStagingMatch(fornecedorId, stagingRes.rows)
  if (!matchRes.ok) return matchRes

  for (const row of matchRes.rows) {
    const { error } = await supabase
      .from('produtos_staging')
      .update({ status_linha: row.status_linha })
      .eq('id', row.id)

    if (error) return { ok: false, error: error.message }
  }

  return { ok: true, rows: matchRes.rows, summary: matchRes.summary }
}

export async function updateStagingRow(id, patch) {
  const payload = {}
  if (patch.sku_fornecedor !== undefined) {
    payload.sku_fornecedor = String(patch.sku_fornecedor).trim()
  }
  if (patch.nome !== undefined) payload.nome = String(patch.nome).trim()
  if (patch.cultura !== undefined) payload.cultura = String(patch.cultura).trim()
  if (patch.quarter !== undefined) payload.quarter = String(patch.quarter).trim()
  if (patch.preco_original !== undefined) {
    payload.preco_original = Number(patch.preco_original)
  }
  if (patch.moeda !== undefined) {
    payload.moeda = String(patch.moeda).toUpperCase().slice(0, 8)
  }
  if (patch.status_linha !== undefined) payload.status_linha = patch.status_linha

  const { data, error } = await supabase
    .from('produtos_staging')
    .update(payload)
    .eq('id', id)
    .select(
      'id, lote_id, sku_fornecedor, nome, cultura, quarter, preco_original, moeda, status_linha',
    )
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, row: data }
}

export async function createStagingRow(loteId, payload) {
  const row = {
    lote_id: loteId,
    sku_fornecedor: String(payload.sku_fornecedor ?? '').trim(),
    nome: String(payload.nome ?? '').trim(),
    cultura: String(payload.cultura ?? '').trim(),
    quarter: String(payload.quarter ?? '').trim(),
    preco_original: Number(payload.preco_original ?? 0),
    moeda: String(payload.moeda ?? 'BRL').toUpperCase().slice(0, 8),
    dados_brutos: payload.dados_brutos ?? {},
    status_linha: 'novo',
  }

  if (!isValidSku(row.sku_fornecedor)) {
    return { ok: false, error: 'Informe um SKU válido.' }
  }

  const { data, error } = await supabase
    .from('produtos_staging')
    .insert(row)
    .select(
      'id, lote_id, sku_fornecedor, nome, cultura, quarter, preco_original, moeda, status_linha',
    )
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, row: data }
}

export async function deleteStagingRow(id) {
  const { error } = await supabase.from('produtos_staging').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function promoverLote(loteId) {
  const { data, error } = await supabase.rpc('promover_lote_importacao', {
    p_lote_id: loteId,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, result: data }
}

export async function fetchProdutosOficiaisByFornecedor(fornecedorId) {
  if (!fornecedorId) return { ok: true, rows: [] }

  const { data, error } = await supabase
    .from('produtos_oficiais')
    .select(
      'id, fornecedor_id, sku_fornecedor, nome, cultura, quarter, moeda_origem, preco_original, preco_interno_calculado, ativo',
    )
    .eq('fornecedor_id', fornecedorId)
    .order('nome', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

const PRODUTO_LIST_FIELDS =
  'id, fornecedor_id, sku_fornecedor, nome, cultura, quarter, moeda_origem, preco_original, preco_interno_calculado, ativo, fornecedores(nome)'

export async function fetchProdutosTotalCount({ ativo } = {}) {
  let q = supabase
    .from('produtos_oficiais')
    .select('id', { count: 'exact', head: true })

  if (ativo === true || ativo === false) {
    q = q.eq('ativo', ativo)
  }

  const { count, error } = await q
  if (error) return { ok: false, error: error.message }
  return { ok: true, total: count ?? 0 }
}

export async function fetchProdutosList(params = {}) {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let q = supabase
    .from('produtos_oficiais')
    .select(PRODUTO_LIST_FIELDS, { count: 'exact' })
    .order('nome', { ascending: true })
    .range(from, to)

  const search = (params.search ?? '').trim()
  if (search) {
    const term = `%${search}%`
    q = q.or(
      `nome.ilike.${term},sku_fornecedor.ilike.${term},cultura.ilike.${term}`,
    )
  }

  if (params.fornecedorId) {
    q = q.eq('fornecedor_id', params.fornecedorId)
  }

  const cultura = (params.cultura ?? '').trim()
  if (cultura) {
    q = q.ilike('cultura', `%${cultura}%`)
  }

  if (params.ativo === true || params.ativo === false) {
    q = q.eq('ativo', params.ativo)
  }

  const { data, error, count } = await q
  if (error) return { ok: false, error: error.message }

  const rows = (data ?? []).map((row) => ({
    ...row,
    fornecedor_nome: row.fornecedores?.nome ?? '—',
  }))

  return { ok: true, rows, total: count ?? 0 }
}

export async function fetchHistoricoPrecos(produtoId, limit = 20) {
  if (!produtoId) return { ok: true, rows: [] }

  const { data, error } = await supabase
    .from('produtos_oficiais_historico')
    .select(
      'id, produto_oficial_id, quarter, moeda_origem, preco_original, preco_interno_calculado, lancado_em, lote_id',
    )
    .eq('produto_oficial_id', produtoId)
    .order('lancado_em', { ascending: false })
    .limit(limit)

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

async function getTaxaConversao(moeda) {
  const moedaUpper = String(moeda ?? 'BRL').toUpperCase().trim()
  if (moedaUpper === 'BRL') return 1

  const { data, error } = await supabase
    .from('cotacoes_moeda')
    .select('taxa_conversao')
    .eq('moeda_origem', moedaUpper)
    .order('data_vigencia', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return Number(data.taxa_conversao)
}

export async function upsertProdutoOficialManual({
  fornecedorId,
  id,
  sku_fornecedor,
  nome,
  cultura,
  quarter,
  moeda_origem,
  preco_original,
  ativo = true,
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return { ok: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const sku = String(sku_fornecedor ?? '').trim()
  if (!isValidSku(sku)) return { ok: false, error: 'Informe um SKU válido.' }

  const moeda = String(moeda_origem ?? 'BRL').toUpperCase().slice(0, 8)
  const preco = Number(preco_original ?? 0)
  const taxa = await getTaxaConversao(moeda)
  if (taxa === null) {
    return {
      ok: false,
      error: `Cotação não encontrada para moeda ${moeda}. Cadastre em Parâmetros.`,
    }
  }
  const preco_interno_calculado = Math.round(preco * taxa * 100) / 100

  const payload = {
    fornecedor_id: fornecedorId,
    sku_fornecedor: sku,
    nome: String(nome ?? '').trim(),
    cultura: String(cultura ?? '').trim(),
    quarter: String(quarter ?? '').trim(),
    moeda_origem: moeda,
    preco_original: preco,
    preco_interno_calculado,
    ativo,
  }

  if (id) {
    const { data, error } = await supabase
      .from('produtos_oficiais')
      .update(payload)
      .eq('id', id)
      .select(
        'id, fornecedor_id, sku_fornecedor, nome, cultura, quarter, moeda_origem, preco_original, preco_interno_calculado, ativo',
      )
      .single()

    if (error) return { ok: false, error: error.message }

    await supabase.from('produtos_oficiais_historico').insert({
      produto_oficial_id: data.id,
      quarter: payload.quarter,
      moeda_origem: payload.moeda_origem,
      preco_original: payload.preco_original,
      preco_interno_calculado: payload.preco_interno_calculado,
      criado_por: session.user.id,
    })

    return { ok: true, row: data }
  }

  const { data, error } = await supabase
    .from('produtos_oficiais')
    .insert(payload)
    .select(
      'id, fornecedor_id, sku_fornecedor, nome, cultura, quarter, moeda_origem, preco_original, preco_interno_calculado, ativo',
    )
    .single()

  if (error) {
    const message =
      error.code === '23505'
        ? 'Já existe um produto com esse SKU para este fornecedor.'
        : error.message
    return { ok: false, error: message }
  }

  await supabase.from('produtos_oficiais_historico').insert({
    produto_oficial_id: data.id,
    quarter: payload.quarter,
    moeda_origem: payload.moeda_origem,
    preco_original: payload.preco_original,
    preco_interno_calculado: payload.preco_interno_calculado,
    criado_por: session.user.id,
  })

  return { ok: true, row: data }
}

export async function inativarProdutoOficial(id) {
  const { data, error } = await supabase
    .from('produtos_oficiais')
    .update({ ativo: false })
    .eq('id', id)
    .select('id, ativo')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, row: data }
}

// --- Cotacoes ---

export async function fetchCotacoesRecentes(limit = 50) {
  const { data, error } = await supabase
    .from('cotacoes_moeda')
    .select('id, moeda_origem, taxa_conversao, data_vigencia, created_at')
    .order('data_vigencia', { ascending: false })
    .limit(limit)

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

export async function criarCotacao({ moeda_origem, taxa_conversao }) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return { ok: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const moeda = String(moeda_origem ?? '').toUpperCase().trim()
  const taxa = Number(taxa_conversao)

  if (!moeda) return { ok: false, error: 'Informe a moeda.' }
  if (!Number.isFinite(taxa) || taxa <= 0) {
    return { ok: false, error: 'Informe uma taxa válida maior que zero.' }
  }

  const { data, error } = await supabase
    .from('cotacoes_moeda')
    .insert({
      moeda_origem: moeda,
      taxa_conversao: taxa,
      criado_por: session.user.id,
    })
    .select('id, moeda_origem, taxa_conversao, data_vigencia')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, row: data }
}

/**
 * Usa um template existente para processar o arquivo recém-anexado.
 */
export async function processLoteComTemplate({
  fornecedorId,
  templateId,
  templateConfig,
  file,
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return { ok: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const columnMappings = Array.isArray(templateConfig?.mappings)
    ? templateConfig.mappings
    : []

  if (columnMappings.length === 0) {
    return {
      ok: false,
      error: 'O modelo selecionado não possui um mapeamento válido.',
    }
  }

  const { parseSpreadsheetFile } = await import('../utils/spreadsheetParser')
  const parsed = await parseSpreadsheetFile(file)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error }
  }

  const { data: loteRow, error: loteError } = await supabase
    .from('lotes_importacao')
    .insert({
      usuario_id: session.user.id,
      fornecedor_id: fornecedorId,
      template_id: templateId ?? null,
      status: 'processando',
    })
    .select('id')
    .single()

  if (loteError || !loteRow) {
    return {
      ok: false,
      error: loteError?.message ?? 'Não foi possível criar o lote.',
    }
  }

  const stagingPayload = buildStagingRows({
    loteId: loteRow.id,
    columnMappings,
    dataRows: parsed.dataRows,
  })

  if (stagingPayload.length > 0) {
    const { error: stagingError } = await supabase
      .from('produtos_staging')
      .insert(stagingPayload)

    if (stagingError) {
      return { ok: false, error: stagingError.message }
    }

    await applyStagingMatchToLote(loteRow.id, fornecedorId)
  }

  const nextStatus =
    stagingPayload.length > 0 ? 'aguardando_validacao' : 'concluido'

  const { error: statusError } = await supabase
    .from('lotes_importacao')
    .update({ status: nextStatus })
    .eq('id', loteRow.id)

  if (statusError) {
    return { ok: false, error: statusError.message }
  }

  return {
    ok: true,
    loteId: loteRow.id,
    rowsProcessed: stagingPayload.length,
  }
}

/**
 * Salva template, cria lote e insere linhas em produtos_staging.
 */
export async function saveTemplateAndProcessLote({
  fornecedorId,
  nomeLayout,
  columnMappings,
  dataRows,
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return { ok: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const config_json = {
    version: 1,
    mappings: columnMappings,
  }

  const { data: templateRow, error: templateError } = await supabase
    .from('templates_mapeamento')
    .insert({
      fornecedor_id: fornecedorId,
      nome_layout: nomeLayout.trim(),
      config_json,
    })
    .select('id')
    .single()

  if (templateError || !templateRow) {
    return {
      ok: false,
      error: templateError?.message ?? 'Não foi possível salvar o layout.',
    }
  }

  const { data: loteRow, error: loteError } = await supabase
    .from('lotes_importacao')
    .insert({
      usuario_id: session.user.id,
      fornecedor_id: fornecedorId,
      template_id: templateRow.id,
      status: 'processando',
    })
    .select('id')
    .single()

  if (loteError || !loteRow) {
    return {
      ok: false,
      error: loteError?.message ?? 'Não foi possível criar o lote.',
    }
  }

  const stagingPayload = buildStagingRows({
    loteId: loteRow.id,
    columnMappings,
    dataRows,
  })

  if (stagingPayload.length > 0) {
    const { error: stagingError } = await supabase
      .from('produtos_staging')
      .insert(stagingPayload)

    if (stagingError) {
      return { ok: false, error: stagingError.message }
    }

    await applyStagingMatchToLote(loteRow.id, fornecedorId)
  }

  const nextStatus =
    stagingPayload.length > 0 ? 'aguardando_validacao' : 'concluido'

  const { error: statusError } = await supabase
    .from('lotes_importacao')
    .update({ status: nextStatus })
    .eq('id', loteRow.id)

  if (statusError) {
    return { ok: false, error: statusError.message }
  }

  return {
    ok: true,
    templateId: templateRow.id,
    loteId: loteRow.id,
    rowsProcessed: stagingPayload.length,
  }
}
