/** Normaliza texto de origem/destino do frete (maiúsculas, espaços extras). */
export function normalizeFreteLocation(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

/** Normaliza valor monetário do frete. */
export function normalizeFreteValor(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}
