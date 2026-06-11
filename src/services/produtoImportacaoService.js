import { supabase } from './supabase'
import { IGNORE_COLUMN_VALUE } from '../constants/mapeamentoCampos'

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
    .select('id, nome, ativo')
    .order('nome', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
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
    .select('id, fornecedor_id, nome_layout, config_json')
    .eq('fornecedor_id', fornecedorId)
    .order('nome_layout', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
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
      fornecedor_nome: fornecedor?.nome ?? '—',
    }
  })

  return { ok: true, rows }
}

/**
 * Constrói as linhas de produtos_staging a partir dos mapeamentos De-Para.
 */
function buildStagingRows({ loteId, columnMappings, dataRows }) {
  return dataRows.map((row) => {
    const dados_brutos = {}
    const mapped = {}

    for (const map of columnMappings) {
      const raw = row[map.sourceIndex]
      const value =
        raw === null || raw === undefined ? '' : String(raw).trim()
      dados_brutos[map.sourceLabel] = value
      if (map.target && map.target !== IGNORE_COLUMN_VALUE) {
        mapped[map.target] = value
      }
    }

    const precoStr = mapped.preco ?? '0'
    const preco_original = Number.parseFloat(
      String(precoStr).replace(/\./g, '').replace(',', '.'),
    )

    return {
      lote_id: loteId,
      sku_fornecedor: mapped.sku ?? '',
      dados_brutos,
      preco_original: Number.isFinite(preco_original) ? preco_original : 0,
      moeda: (mapped.moeda ?? 'BRL').toUpperCase().slice(0, 8),
      status_linha: 'novo',
    }
  })
}

/**
 * Usa um template existente para processar o arquivo recém-anexado:
 * cria o lote em lotes_importacao e popula produtos_staging com o De-Para salvo.
 */
export async function processLoteComTemplate({
  fornecedorId,
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
