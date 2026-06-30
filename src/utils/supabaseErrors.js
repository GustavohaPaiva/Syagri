const MIGRATION_HINT =
  'Execute no Supabase (SQL Editor) o arquivo supabase/migrations/20260618130000_produtos_staging_schema_fix.sql e recarregue a página.'

export function isMissingColumnError(error) {
  const msg = String(error?.message ?? '')
  return (
    error?.code === 'PGRST204' ||
    /Could not find the .* column/i.test(msg) ||
    /column .* does not exist/i.test(msg)
  )
}

export function formatSupabaseError(error, fallback = 'Erro ao comunicar com o servidor.') {
  if (!error) return fallback
  if (isMissingColumnError(error)) {
    return `Banco de dados desatualizado para o lançamento de produtos. ${MIGRATION_HINT}`
  }
  const parts = [error.message, error.details, error.hint].filter(Boolean)
  return parts.join(' — ') || fallback
}
