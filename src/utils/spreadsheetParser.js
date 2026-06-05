import * as XLSX from 'xlsx'

/**
 * Lê a primeira planilha e retorna cabeçalhos (linha 1) + linhas de dados.
 */
export async function parseSpreadsheetFile(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', raw: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { ok: false, error: 'A planilha está vazia.' }
  }

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  if (!matrix.length) {
    return { ok: false, error: 'Nenhuma linha encontrada na planilha.' }
  }

  const headerCells = matrix[0] ?? []
  const columns = headerCells
    .map((cell, index) => {
      const label = String(cell ?? '').trim()
      return {
        id: `col-${index}`,
        index,
        label: label || `Coluna ${index + 1}`,
      }
    })
    .filter((col) => col.label.length > 0)

  if (columns.length === 0) {
    return {
      ok: false,
      error: 'Não foi possível identificar colunas na primeira linha.',
    }
  }

  const dataRows = matrix.slice(1).filter((row) =>
    row.some((cell) => String(cell ?? '').trim().length > 0),
  )

  return {
    ok: true,
    sheetName,
    columns,
    dataRows,
    headerCells,
  }
}
