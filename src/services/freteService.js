import { normalizeFreteLocation, normalizeFreteValor } from '../utils/normalizeFrete'
import { supabase } from './supabase'

const DUPLICATE_ERROR =
  'Já existe um frete cadastrado para esta origem e destino.'

function mapFreteRow(row) {
  return {
    id: String(row.id),
    origem: String(row.origem ?? ''),
    destino: String(row.destino ?? ''),
    valor: Number(row.valor),
    ativo: Boolean(row.ativo),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

function parseDbError(error) {
  if (!error) return 'Não foi possível concluir a operação.'
  if (error.code === '23505') return DUPLICATE_ERROR
  return error.message
}

export async function fetchFretesList(params = {}) {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let q = supabase
    .from('fretes')
    .select('id, origem, destino, valor, ativo, created_at, updated_at', {
      count: 'exact',
    })
    .order('origem', { ascending: true })
    .order('destino', { ascending: true })
    .range(from, to)

  const origemSearch = (params.origemSearch ?? '').trim().replace(/[%_,]/g, ' ')
  const destinoSearch = (params.destinoSearch ?? '').trim().replace(/[%_,]/g, ' ')

  if (origemSearch) {
    q = q.ilike('origem', `%${origemSearch}%`)
  }

  if (destinoSearch) {
    q = q.ilike('destino', `%${destinoSearch}%`)
  }

  const { data, error, count } = await q
  if (error) return { ok: false, error: error.message }

  return {
    ok: true,
    rows: (data ?? []).map(mapFreteRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function findFreteDuplicate({ origem, destino, excludeId }) {
  const origemNorm = normalizeFreteLocation(origem)
  const destinoNorm = normalizeFreteLocation(destino)

  if (!origemNorm || !destinoNorm) {
    return { ok: false, error: 'Informe origem e destino.' }
  }

  let q = supabase
    .from('fretes')
    .select('id, origem, destino, valor')
    .eq('origem', origemNorm)
    .eq('destino', destinoNorm)
    .limit(1)

  if (excludeId) {
    q = q.neq('id', excludeId)
  }

  const { data, error } = await q.maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: true, duplicate: null }

  return { ok: true, duplicate: mapFreteRow(data) }
}

export async function createFrete(input) {
  const origem = normalizeFreteLocation(input.origem)
  const destino = normalizeFreteLocation(input.destino)
  const valor = normalizeFreteValor(input.valor)

  if (!origem || !destino) {
    return { ok: false, error: 'Informe origem e destino.' }
  }
  if (valor == null) {
    return { ok: false, error: 'Informe um valor válido (R$).' }
  }

  const duplicateCheck = await findFreteDuplicate({ origem, destino })
  if (!duplicateCheck.ok) return duplicateCheck
  if (duplicateCheck.duplicate) {
    return { ok: false, error: DUPLICATE_ERROR }
  }

  const { data, error } = await supabase
    .from('fretes')
    .insert({ origem, destino, valor })
    .select('id, origem, destino, valor, ativo, created_at, updated_at')
    .single()

  if (error) return { ok: false, error: parseDbError(error) }
  return { ok: true, frete: mapFreteRow(data) }
}

export async function updateFrete(id, input) {
  const origem = normalizeFreteLocation(input.origem)
  const destino = normalizeFreteLocation(input.destino)
  const valor = normalizeFreteValor(input.valor)

  if (!origem || !destino) {
    return { ok: false, error: 'Informe origem e destino.' }
  }
  if (valor == null) {
    return { ok: false, error: 'Informe um valor válido (R$).' }
  }

  const duplicateCheck = await findFreteDuplicate({
    origem,
    destino,
    excludeId: id,
  })
  if (!duplicateCheck.ok) return duplicateCheck
  if (duplicateCheck.duplicate) {
    return { ok: false, error: DUPLICATE_ERROR }
  }

  const { data, error } = await supabase
    .from('fretes')
    .update({ origem, destino, valor })
    .eq('id', id)
    .select('id, origem, destino, valor, ativo, created_at, updated_at')
    .single()

  if (error) return { ok: false, error: parseDbError(error) }
  return { ok: true, frete: mapFreteRow(data) }
}

export async function deleteFrete(id) {
  const { error } = await supabase.from('fretes').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function lookupFreteValor(origem, destino) {
  const result = await findFreteDuplicate({
    origem: normalizeFreteLocation(origem),
    destino: normalizeFreteLocation(destino),
  })
  if (!result.ok) return result
  if (!result.duplicate) {
    return { ok: false, error: 'Frete não encontrado para esta rota.' }
  }
  return { ok: true, frete: result.duplicate }
}
