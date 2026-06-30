/**
 * Normaliza SKU para matching consistente entre planilhas.
 * trim → uppercase → colapsar espaços → remover pontuação comum
 */
export function normalizeSku(sku) {
  return String(sku ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[-./\\]/g, '')
}

export function isValidSku(sku) {
  return normalizeSku(sku).length > 0
}

/** Normaliza nome do fertilizante para matching no catálogo. */
export function normalizeFertilizante(nome) {
  return String(nome ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

export function isValidFertilizante(nome) {
  return normalizeFertilizante(nome).length > 0
}
