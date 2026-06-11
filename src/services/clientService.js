import { supabase } from './supabase'
import {
  digitsOnly,
  parseCpfCnpjInput,
  parsePhoneInput,
} from '../utils/dataFormatters'

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


export async function fetchClientsTotalCount() {
  const { count, error } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, total: count ?? 0 }
}

export async function fetchClientsList(params = {}) {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let q = supabase
    .from('clients')
    .select(CLIENT_FIELDS, { count: 'exact' })
    .order('nome', { ascending: true })
    .range(from, to)

  const search = (params.search ?? '').trim()
  if (search) {
    const searchDigits = digitsOnly(search)
    const filters = [`nome.ilike.%${search}%`, `cnpj_cpf.ilike.%${search}%`]
    if (searchDigits.length >= 3 && searchDigits !== search) {
      filters.push(`cnpj_cpf.ilike.%${searchDigits}%`)
    }
    q = q.or(filters.join(','))
  }

  const { data, error, count } = await q
  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: data ?? [], total: count ?? 0 }
}

export async function createClient(payload) {
  const nome = payload.nome?.trim()
  const cnpj_cpf = parseCpfCnpjInput(payload.cnpj_cpf ?? '')

  if (!nome || !cnpj_cpf) {
    return { ok: false, error: 'Informe nome e CPF/CNPJ.' }
  }

  const telefoneRaw = payload.telefone ? parsePhoneInput(payload.telefone) : ''

  const { data, error } = await supabase
    .from('clients')
    .insert({
      nome,
      cnpj_cpf,
      razao_social: payload.razao_social?.trim() || null,
      email: payload.email?.trim() || null,
      telefone: telefoneRaw || null,
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
  const cnpj_cpf = parseCpfCnpjInput(payload.cnpj_cpf ?? '')

  if (!nome || !cnpj_cpf) {
    return { ok: false, error: 'Informe nome e CPF/CNPJ.' }
  }

  const telefoneRaw = payload.telefone ? parsePhoneInput(payload.telefone) : ''

  const { data, error } = await supabase
    .from('clients')
    .update({
      nome,
      cnpj_cpf,
      razao_social: payload.razao_social?.trim() || null,
      email: payload.email?.trim() || null,
      telefone: telefoneRaw || null,
      municipio: payload.municipio?.trim() || null,
      uf: payload.uf?.trim() || null,
    })
    .eq('id', id)
    .select(CLIENT_FIELDS)
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, client: data }
}
