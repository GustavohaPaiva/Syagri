import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { IconFileSpreadsheet } from '../components/icons'
import { useLocation } from 'react-router-dom'
import {
  ImportacaoLotesSection,
  ImportacaoStatsBar,
  ImportacaoUploadPanel,
} from '../components/importacao/ImportacaoVisuals'
import { RouteFallback } from '../components/layout/RouteFallback'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { ModalConfigurarImportacao } from '../components/ModalConfigurarImportacao'
import { ModalGerenciarFornecedores } from '../components/ModalGerenciarFornecedores'
import { PageHeader } from '../components/ui/PageHeader'
import { useSyncPageLoading } from '../contexts/PageLoadingContext'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import {
  fetchFornecedoresAtivos,
  fetchLotesRecentes,
  processLoteComTemplate,
} from '../services/produtoImportacaoService'

const ConstrutorMapeamento = lazy(() =>
  import('./ConstrutorMapeamento').then((m) => ({
    default: m.ConstrutorMapeamento,
  })),
)

const ACCEPTED_MIME = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
}

function isAcceptedSpreadsheet(file) {
  const name = file.name.toLowerCase()
  return name.endsWith('.xlsx') || name.endsWith('.csv') || name.endsWith('.xls')
}

export function ImportacaoProdutos() {
  const location = useLocation()
  const successFromRoute = location.state?.successMessage

  const [fornecedores, setFornecedores] = useState([])
  const [lotes, setLotes] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [listLoading, setListLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState(successFromRoute ?? null)

  const [pendingFile, setPendingFile] = useState(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [fornecedoresOpen, setFornecedoresOpen] = useState(false)

  const [mapeamentoSession, setMapeamentoSession] = useState(null)

  useSyncPageLoading(listLoading)

  const loadLists = useCallback(async (isActive) => {
    setListLoading(true)
    setLoadError(null)

    const [fornRes, lotesRes] = await Promise.all([
      fetchFornecedoresAtivos(),
      fetchLotesRecentes(),
    ])

    if (!isActive || isActive()) {
      setListLoading(false)

      if (!fornRes.ok) {
        setLoadError(fornRes.error)
        return
      }
      if (!lotesRes.ok) {
        setLoadError(lotesRes.error)
        return
      }

      setFornecedores(fornRes.rows)
      setLotes(lotesRes.rows)
    }
  }, [])

  useAbortableAsync(
    async (_signal, isActive) => {
      await loadLists(isActive)
    },
    [loadLists],
  )

  const pendingCount = useMemo(
    () =>
      lotes.filter(
        (lote) =>
          lote.status === 'aguardando_validacao' || lote.status === 'processando',
      ).length,
    [lotes],
  )

  const completedCount = useMemo(
    () => lotes.filter((lote) => lote.status === 'concluido').length,
    [lotes],
  )

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setLoadError('Envie apenas planilhas .xlsx ou .csv.')
      return
    }
    const file = acceptedFiles[0]
    if (!file || !isAcceptedSpreadsheet(file)) {
      setLoadError('Formato inválido. Use .xlsx ou .csv.')
      return
    }
    setLoadError(null)
    setSuccessMessage(null)
    setPendingFile(file)
    setConfigOpen(true)
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragAccept } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_MIME,
      maxFiles: 1,
      multiple: false,
      disabled: listLoading,
    })

  function closeConfig() {
    setConfigOpen(false)
    setPendingFile(null)
  }

  async function handleAdvanceExisting({ fornecedorId, template }) {
    const res = await processLoteComTemplate({
      fornecedorId,
      templateConfig: template?.config_json,
      file: pendingFile,
    })

    if (!res.ok) {
      return { ok: false, error: res.error }
    }

    closeConfig()
    setSuccessMessage(
      `Lote enviado para importação (${res.rowsProcessed} linha(s)).`,
    )
    await loadLists()
    return { ok: true }
  }

  function handleCreateNew({ fornecedorId, fornecedorNome }) {
    setMapeamentoSession({ file: pendingFile, fornecedorId, fornecedorNome })
    setConfigOpen(false)
  }

  function handleMapeamentoBack() {
    setMapeamentoSession(null)
    setPendingFile(null)
  }

  async function handleMapeamentoComplete({ successMessage: msg }) {
    setMapeamentoSession(null)
    setPendingFile(null)
    setSuccessMessage(msg)
    await loadLists()
  }

  if (mapeamentoSession) {
    return (
      <div className="w-full min-w-0 space-y-4 sm:space-y-6">
        <Suspense fallback={<RouteFallback />}>
          <ConstrutorMapeamento
            file={mapeamentoSession.file}
            fornecedorId={mapeamentoSession.fornecedorId}
            fornecedorNome={mapeamentoSession.fornecedorNome}
            onBack={handleMapeamentoBack}
            onComplete={handleMapeamentoComplete}
          />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50/80 via-white to-sky-50/40 p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:p-8">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-primary-200/30 blur-3xl sm:-right-10 sm:-top-10 sm:size-40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-1/4 size-24 rounded-full bg-sky-200/25 blur-3xl sm:-bottom-8 sm:left-1/3 sm:size-32"
          aria-hidden
        />

        <PageHeader
          eyebrow="Syagri"
          title="Lançamento de Produtos"
          description="Importe planilhas, valide lotes e publique no catálogo oficial."
          actions={
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setFornecedoresOpen(true)}
            >
              Fornecedores
            </Button>
          }
          className="relative mb-0"
        />

        <div className="relative mt-4 flex items-start gap-3 rounded-xl border border-white/80 bg-white/60 p-3 backdrop-blur-sm sm:mt-5 sm:items-center sm:rounded-2xl sm:px-4 sm:py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm sm:size-9 sm:rounded-xl">
            <IconFileSpreadsheet className="size-3.5 sm:size-4" />
          </span>
          <p className="min-w-0 text-sm leading-relaxed text-slate-700">
            {listLoading
              ? 'Carregando fornecedores e lotes recentes…'
              : `${fornecedores.length} fornecedor(es) ativo(s) · ${lotes.length} lote(s) recente(s) no histórico.`}
          </p>
        </div>
      </div>

      {successMessage ? (
        <AlertMessage tone="success" role="status">
          {successMessage}
        </AlertMessage>
      ) : null}

      {loadError ? <AlertMessage>{loadError}</AlertMessage> : null}

      <ImportacaoStatsBar
        fornecedoresCount={fornecedores.length}
        lotesCount={lotes.length}
        pendingCount={pendingCount}
        completedCount={completedCount}
        loading={listLoading}
      />

      <ImportacaoUploadPanel
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        isDragAccept={isDragAccept}
        disabled={listLoading}
      />

      <ImportacaoLotesSection lotes={lotes} loading={listLoading} />

      <ModalConfigurarImportacao
        open={configOpen}
        onClose={closeConfig}
        file={pendingFile}
        fornecedores={fornecedores}
        onAdvanceExisting={handleAdvanceExisting}
        onCreateNew={handleCreateNew}
      />

      <ModalGerenciarFornecedores
        open={fornecedoresOpen}
        onClose={() => setFornecedoresOpen(false)}
        onChanged={() => {
          void loadLists()
        }}
      />
    </div>
  )
}
