import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { parseSpreadsheetFile } from './spreadsheetParser'
import {
  buildStagingIdentityCounts,
  stagingRowIdentityKey,
} from '../services/produtoImportacaoService'
import { normalizeFertilizante } from './normalizeSku'

function buildStagingPreviewRows(parsed) {
  const mappings = parsed.autoMappings
  const prodIdx = mappings.find((m) => m.target === 'produto')?.sourceIndex
  const refIdx = mappings.find((m) => m.target === 'referencia_complementar')
    ?.sourceIndex
  const codeIdx = mappings.find((m) => m.target === 'codigo_produto')?.sourceIndex

  return parsed.dataRows.map((row) => {
    const codigo = codeIdx !== undefined ? String(row[codeIdx] ?? '').trim() : ''
    const referencia = refIdx !== undefined ? String(row[refIdx] ?? '').trim() : ''
    return {
      nome: prodIdx !== undefined ? String(row[prodIdx] ?? '').trim() : '',
      referencia_complementar: referencia,
      sku_fornecedor: codigo || referencia,
      dados_brutos: {
        Produto: codigo,
        _codigo_produto: codigo,
      },
    }
  })
}

describe('staging identity for YARA planilhas', () => {
  for (const fileName of [
    '1.1 Lista_fertilizante_YARA_UBA_Q2_25_05_26.xlsx',
    '1.2 Lista_fertilizante_YARA_UBA_Q3_25_05_26.xlsx',
    '2.1 Lista_fertilizante_YARA_CBT_Q2_25_05_26.xlsx',
  ]) {
    it(`não marca duplicatas legítimas em ${fileName}`, async () => {
      const buffer = readFileSync(`./Planilhas de Fornecedores/${fileName}`)
      const file = {
        name: fileName,
        arrayBuffer: async () =>
          buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
          ),
      }

      const parsed = await parseSpreadsheetFile(file)
      expect(parsed.ok).toBe(true)

      const rows = buildStagingPreviewRows(parsed)
      const identityCounts = buildStagingIdentityCounts(rows)
      const dupKeys = [...identityCounts.entries()].filter(([, c]) => c > 1)

      expect(dupKeys).toEqual([])
      expect(rows.every((row) => stagingRowIdentityKey(row))).toBe(true)
      expect(
        rows.every(
          (row) =>
            stagingRowIdentityKey(row).startsWith('codigo:') ||
            `${normalizeFertilizante(row.nome)}|${row.referencia_complementar.toLowerCase()}` ===
              stagingRowIdentityKey(row),
        ),
      ).toBe(true)
    })
  }
})
