import { supabase } from './supabase'
import { CATALOG_PRODUCTS } from '../constants/catalogProducts'

/**
 * Busca produtos oficiais ativos para o simulador.
 * Filtra por quarter quando informado.
 */
export async function fetchCatalogoSimulador({ quarter } = {}) {
  let query = supabase
    .from('produtos_oficiais')
    .select(
      'id, nome, cultura, quarter, preco_interno_calculado, preco_original, ativo',
    )
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (quarter) {
    query = query.eq('quarter', quarter)
  }

  const { data, error } = await query

  if (error) return { ok: false, error: error.message }

  const rows = (data ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    cultura: p.cultura,
    quarter: p.quarter,
    precoBase: Number(p.preco_interno_calculado ?? p.preco_original ?? 0),
  }))

  return { ok: true, rows }
}

/** Fallback para dev quando não há produtos lançados. */
export function getFallbackCatalog() {
  return CATALOG_PRODUCTS
}
