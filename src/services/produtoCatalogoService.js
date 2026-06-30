import { supabase } from './supabase'
import { CATALOG_PRODUCTS } from '../constants/catalogProducts'

/**
 * Busca produtos oficiais ativos para o simulador.
 * Filtra por quarter e estado quando informados.
 */
export async function fetchCatalogoSimulador({ quarter, estado } = {}) {
  let query = supabase
    .from('produtos_oficiais')
    .select(
      'id, nome, referencia_complementar, fornecedor_id, estado, classe, quarter, moeda_origem, preco_original, desconto_usd, preco_interno_calculado, custo_icms, vencimento_lista, ativo, fornecedores(nome)',
    )
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (quarter) {
    query = query.ilike('quarter', `%${quarter}%`)
  }

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query

  if (error) return { ok: false, error: error.message }

  const rows = (data ?? []).map((p) => {
    const fornecedorNome = p.fornecedores?.nome ?? ''
    const displayNome = [p.nome, p.referencia_complementar, fornecedorNome]
      .filter((x) => String(x ?? '').trim())
      .join(' · ')

    return {
      id: p.id,
      nome: p.nome,
      displayNome,
      referenciaComplementar: p.referencia_complementar ?? '',
      fornecedorNome,
      estado: p.estado,
      classe: p.classe,
      quarter: p.quarter,
      moedaOrigem: p.moeda_origem,
      custoUsd: Number(p.preco_original ?? 0),
      descontoUsd: Number(p.desconto_usd ?? 0),
      custoBrl: Number(p.preco_interno_calculado ?? 0),
      custoIcms: Number(p.custo_icms ?? p.preco_interno_calculado * 0.96),
      vencimentoLista: p.vencimento_lista ?? '',
    }
  })

  return { ok: true, rows }
}

/** Fallback para dev quando não há produtos lançados. */
export function getFallbackCatalog() {
  return CATALOG_PRODUCTS.map((p) => ({
    ...p,
    displayNome: p.nome,
    referenciaComplementar: '',
    fornecedorNome: '',
    estado: 'MG',
    classe: 'Convencional',
    moedaOrigem: 'BRL',
    custoUsd: p.precoBase,
    descontoUsd: 0,
    custoBrl: p.precoBase,
    custoIcms: p.precoBase * 0.96,
    vencimentoLista: '',
  }))
}

export async function fetchFreteValor(origem, destino) {
  const o = String(origem ?? '').trim()
  const d = String(destino ?? '').trim()
  if (!o || !d) return { ok: true, valor: 0 }

  const { data, error } = await supabase
    .from('fretes')
    .select('valor')
    .eq('ativo', true)
    .ilike('origem', o)
    .ilike('destino', d)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  return { ok: true, valor: Number(data?.valor ?? 0) }
}
