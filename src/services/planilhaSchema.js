/**
 * Schema v3 é o único suportado (produtos_staging + lotes_importacao com metadados).
 */

export async function getStagingSchemaLevel() {
  return 'v3'
}

export async function hasLoteMetadataSchema() {
  return true
}

export async function hasLoteV3Schema() {
  return true
}

/** @deprecated */
export async function hasPlanilhaV2Schema() {
  return true
}

export function resetPlanilhaV2SchemaCache() {
  // noop — cache removido
}
