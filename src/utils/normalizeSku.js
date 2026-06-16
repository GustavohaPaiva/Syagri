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
