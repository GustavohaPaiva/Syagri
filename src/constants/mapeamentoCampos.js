export const IGNORE_COLUMN_VALUE = '__ignore__'

export const SYSTEM_MAPPING_FIELDS = [
  { value: IGNORE_COLUMN_VALUE, label: 'Ignorar coluna' },
  { value: 'sku', label: 'SKU' },
  { value: 'nome', label: 'Nome' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'preco', label: 'Preço' },
  { value: 'moeda', label: 'Moeda' },
]

export const REQUIRED_MAPPING_TARGETS = ['sku', 'nome']
