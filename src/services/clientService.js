import { supabase } from './supabase'

const CLIENT_FIELDS =
  'id, nome, razao_social, cnpj_cpf, email, telefone, municipio, uf, created_at'

const CLIENT_DETAIL_FIELDS =
  'id, nome, razao_social, cnpj_cpf, email, telefone, municipio, uf, cep, logradouro, bairro, created_at'

export async function fetchClientById(id) {
  const { data, error } = await supabase
    .from('clients')
    .select(CLIENT_DETAIL_FIELDS)
    .eq('id', id)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Cliente não encontrado.' }
  return { ok: true, client: data }
}

export async function fetchClientSimulations(clientId) {
  const { data, error } = await supabase
    .from('simulations')
    .select('id, created_at, total_proposta, total_bruto, status')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}


export async function fetchClientsList(params = {}) {
  let q = supabase
    .from('clients')
    .select(CLIENT_FIELDS)
    .order('nome', { ascending: true })

  const search = (params.search ?? '').trim()
  if (search) {
    q = q.or(`nome.ilike.%${search}%,cnpj_cpf.ilike.%${search}%`)
  }

  const { data, error } = await q
  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [] }
}

export async function createClient(payload) {
  const nome = payload.nome?.trim()
  const cnpj_cpf = payload.cnpj_cpf?.trim()

  if (!nome || !cnpj_cpf) {
    return { ok: false, error: 'Informe nome e CPF/CNPJ.' }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      nome,
      cnpj_cpf,
      razao_social: payload.razao_social?.trim() || null,
      email: payload.email?.trim() || null,
      telefone: payload.telefone?.trim() || null,
      municipio: payload.municipio?.trim() || null,
      uf: payload.uf?.trim() || null,
    })
    .select(CLIENT_FIELDS)
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, client: data }
}

export async function updateClient(id, payload) {
  const nome = payload.nome?.trim()
  const cnpj_cpf = payload.cnpj_cpf?.trim()

  if (!nome || !cnpj_cpf) {
    return { ok: false, error: 'Informe nome e CPF/CNPJ.' }
  }

  const { data, error } = await supabase
    .from('clients')
    .update({
      nome,
      cnpj_cpf,
      razao_social: payload.razao_social?.trim() || null,
      email: payload.email?.trim() || null,
      telefone: payload.telefone?.trim() || null,
      municipio: payload.municipio?.trim() || null,
      uf: payload.uf?.trim() || null,
    })
    .eq('id', id)
    .select(CLIENT_FIELDS)
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, client: data }
}
