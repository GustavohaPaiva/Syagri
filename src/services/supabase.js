import { createClient } from '@supabase/supabase-js'

export function readSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!url || !key) {
    return {
      ok: false,
      error:
        'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ausentes. No GitHub Pages, configure-as em Settings → Secrets and variables → Actions.',
    }
  }

  return { ok: true, url, key }
}

const config = readSupabaseConfig()

export const supabaseConfigError = config.ok ? null : config.error

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase = config.ok
  ? createClient(config.url, config.key)
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? 'Supabase não configurado.')
  }
  return supabase
}
