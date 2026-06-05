import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import {
  IGNORE_COLUMN_VALUE,
  REQUIRED_MAPPING_TARGETS,
  SYSTEM_MAPPING_FIELDS,
} from '../constants/mapeamentoCampos'
import { saveTemplateAndProcessLote } from '../services/produtoImportacaoService'
import { parseSpreadsheetFile } from '../utils/spreadsheetParser'

function buildInitialMappings(columns) {
  const initial = {}
  for (const col of columns) {
    initial[col.id] = ''
  }
  return initial
}

export function ConstrutorMapeamento(props = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const session = location.state

  // Modo inline (renderizado dentro de ImportacaoProdutos) usa props;
  // modo rota (/admin/importacao/mapeamento) usa location.state.
  const inline = Boolean(props.onBack || props.onComplete)
  const onBack = props.onBack
  const onComplete = props.onComplete

  const [parseState, setParseState] = useState({
    loading: true,
    error: null,
    columns: [],
    dataRows: [],
    sheetName: '',
  })

  const [mappings, setMappings] = useState({})
  const [nomeLayout, setNomeLayout] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const file = props.file ?? session?.file
  const fornecedorId = props.fornecedorId ?? session?.fornecedorId
  const fornecedorNome =
    props.fornecedorNome ?? session?.fornecedorNome ?? 'Fornecedor'

  useEffect(() => {
    if (!file) return

    let cancelled = false

    void parseSpreadsheetFile(file).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setParseState({
          loading: false,
          error: result.error,
          columns: [],
          dataRows: [],
          sheetName: '',
        })
        return
      }
      setParseState({
        loading: false,
        error: null,
        columns: result.columns,
        dataRows: result.dataRows,
        sheetName: result.sheetName,
      })
      setMappings(buildInitialMappings(result.columns))
    })

    return () => {
      cancelled = true
    }
  }, [file])

  const usedTargets = useMemo(() => {
    const counts = {}
    for (const value of Object.values(mappings)) {
      if (!value || value === IGNORE_COLUMN_VALUE) continue
      counts[value] = (counts[value] ?? 0) + 1
    }
    return counts
  }, [mappings])

  const mappingValidation = useMemo(() => {
    const missingRequired = REQUIRED_MAPPING_TARGETS.filter(
      (target) => !Object.values(mappings).includes(target),
    )
    const duplicates = Object.entries(usedTargets)
      .filter(([, count]) => count > 1)
      .map(([target]) => target)
    return { missingRequired, duplicates }
  }, [mappings, usedTargets])

  if (!file || !fornecedorId) {
    if (inline) {
      onBack?.()
      return null
    }
    return <Navigate to="/admin/importacao" replace />
  }

  async function handleSaveAndProcess() {
    setSubmitError(null)

    if (!nomeLayout.trim()) {
      setSubmitError('Informe um nome para o layout.')
      return
    }
    if (mappingValidation.missingRequired.length > 0) {
      setSubmitError(
        `Mapeie os campos obrigatórios: ${mappingValidation.missingRequired.join(', ').toUpperCase()}.`,
      )
      return
    }
    if (mappingValidation.duplicates.length > 0) {
      setSubmitError(
        'Cada campo do sistema só pode ser usado uma vez (exceto “Ignorar coluna”).',
      )
      return
    }

    const columnMappings = parseState.columns.map((col) => ({
      sourceIndex: col.index,
      sourceLabel: col.label,
      target: mappings[col.id] || IGNORE_COLUMN_VALUE,
    }))

    setSubmitting(true)
    const result = await saveTemplateAndProcessLote({
      fornecedorId,
      nomeLayout: nomeLayout.trim(),
      columnMappings,
      dataRows: parseState.dataRows,
    })
    setSubmitting(false)

    if (!result.ok) {
      setSubmitError(result.error)
      return
    }

    const successMessage = `Layout salvo e lote processado (${result.rowsProcessed} linhas).`

    if (inline) {
      onComplete?.({ successMessage, rowsProcessed: result.rowsProcessed })
      return
    }

    navigate('/admin/importacao', {
      replace: true,
      state: { successMessage },
    })
  }

  return (
    <div className="flex min-h-0 flex-col pb-28">
      <header className="mb-6">
        {inline ? (
          <button
            type="button"
            onClick={() => onBack?.()}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar ao hub de importação
          </button>
        ) : (
          <Link
            to="/admin/importacao"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar ao hub de importação
          </Link>
        )}
        <p className="text-sm font-medium uppercase tracking-wider text-primary-700">
          Novo layout
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Construtor de mapeamento
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{file.name}</span>
          {' · '}
          {fornecedorNome}
          {parseState.sheetName ? ` · aba “${parseState.sheetName}”` : ''}
        </p>
      </header>

      {parseState.loading ? (
        <div className="flex min-h-[16rem] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-slate-600">Lendo colunas da planilha…</p>
        </div>
      ) : parseState.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {parseState.error}
        </div>
      ) : (
        <>
          <div className="mb-4 hidden gap-4 rounded-t-xl border border-b-0 border-gray-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 lg:grid lg:grid-cols-2">
            <span>Colunas lidas da planilha</span>
            <span>Campo no sistema</span>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            {parseState.columns.map((col) => {
              const selected = mappings[col.id] ?? ''
              const isDuplicate =
                selected &&
                selected !== IGNORE_COLUMN_VALUE &&
                usedTargets[selected] > 1

              return (
                <div
                  key={col.id}
                  className="grid gap-3 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0 lg:grid-cols-2 lg:items-center lg:gap-6"
                >
                  <div className="min-w-0">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                      Coluna da planilha
                    </p>
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 shadow-sm">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-400 ring-1 ring-gray-200">
                        <Lock className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-semibold text-slate-900">
                          {col.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          Coluna {col.index + 1} · somente leitura
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                      Mapear para
                    </p>
                    <Select
                      aria-label={`Mapear coluna ${col.label}`}
                      placeholder="Selecione o campo…"
                      value={selected}
                      onChange={(e) =>
                        setMappings((prev) => ({
                          ...prev,
                          [col.id]: e.target.value,
                        }))
                      }
                      options={SYSTEM_MAPPING_FIELDS}
                      error={
                        isDuplicate
                          ? 'Este campo já foi usado em outra coluna.'
                          : undefined
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {parseState.dataRows.length} linha(s) de dados serão importadas após
            salvar. Campos obrigatórios: SKU e Nome.
          </p>
        </>
      )}

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-[5%] py-4 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="mx-auto flex w-full max-w-none flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              label="Nome do layout"
              placeholder='Ex.: Padrão Yara 2024'
              value={nomeLayout}
              onChange={(e) => setNomeLayout(e.target.value)}
              disabled={parseState.loading || Boolean(parseState.error)}
            />
          </div>
          <Button
            type="button"
            loading={submitting}
            disabled={parseState.loading || Boolean(parseState.error)}
            className="w-full shrink-0 sm:w-auto"
            onClick={() => void handleSaveAndProcess()}
          >
            Salvar e processar lote
          </Button>
        </div>
        {submitError ? (
          <p className="mt-3 text-sm font-medium text-feedback-error" role="alert">
            {submitError}
          </p>
        ) : null}
      </footer>
    </div>
  )
}
