import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileSpreadsheet, Upload, Users } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ConstrutorMapeamento } from './ConstrutorMapeamento'
import { ModalConfigurarImportacao } from '../components/ModalConfigurarImportacao'
import { ModalGerenciarFornecedores } from '../components/ModalGerenciarFornecedores'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import {
  fetchFornecedoresAtivos,
  fetchLotesRecentes,
  processLoteComTemplate,
} from '../services/produtoImportacaoService'

const ACCEPTED_MIME = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
}

function isAcceptedSpreadsheet(file) {
  const name = file.name.toLowerCase()
  return name.endsWith('.xlsx') || name.endsWith('.csv') || name.endsWith('.xls')
}

function formatLoteDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadgeClass(status) {
  switch (status) {
    case 'processando':
      return 'bg-gray-100 text-gray-800 ring-gray-200'
    case 'aguardando_validacao':
      return 'bg-amber-100 text-amber-900 ring-amber-200'
    case 'concluido':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'processando':
      return 'Processando'
    case 'aguardando_validacao':
      return 'Aguardando validação'
    case 'concluido':
      return 'Concluído'
    default:
      return status
  }
}

export function ImportacaoProdutos() {
  const navigate = useNavigate()
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

  // Quando preenchido, renderiza o construtor de mapeamento inline.
  const [mapeamentoSession, setMapeamentoSession] = useState(null)

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
      <div className="w-full py-6">
        <ConstrutorMapeamento
          file={mapeamentoSession.file}
          fornecedorId={mapeamentoSession.fornecedorId}
          fornecedorNome={mapeamentoSession.fornecedorNome}
          onBack={handleMapeamentoBack}
          onComplete={handleMapeamentoComplete}
        />
      </div>
    )
  }

  const dropzoneClass = [
    'flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
    isDragAccept || isDragActive
      ? 'border-primary-500 bg-primary-50/60'
      : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/30',
    listLoading ? 'pointer-events-none opacity-60' : '',
  ].join(' ')

  return (
    <div className="w-full py-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-primary-700">
            Syagri
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Lançamento de Produtos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Importe planilhas, valide lotes e publique no catálogo oficial.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setFornecedoresOpen(true)}
          >
            <Users className="size-4" aria-hidden />
            Fornecedores
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/moedas')}
          >
            Gestão de Moedas
          </Button>
        </div>
      </header>

      {successMessage ? (
        <p
          className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      {loadError ? (
        <p
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}

      <section className="mb-10">
        <div {...getRootProps({ className: dropzoneClass })}>
          <input {...getInputProps()} />
          <div
            className={[
              'flex size-14 items-center justify-center rounded-full',
              isDragActive ? 'bg-primary-100 text-primary-700' : 'bg-white text-slate-500 shadow-sm',
            ].join(' ')}
          >
            {isDragActive ? (
              <FileSpreadsheet className="size-7" aria-hidden />
            ) : (
              <Upload className="size-7" aria-hidden />
            )}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">
              {isDragActive
                ? 'Solte a planilha aqui'
                : 'Arraste e solte sua planilha'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              ou clique para selecionar · .xlsx, .csv
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Lotes recentes
        </h2>

        {listLoading ? (
          <div className="flex min-h-[8rem] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white">
            <p className="text-sm text-slate-600">Carregando lotes…</p>
          </div>
        ) : lotes.length === 0 ? (
          <div className="flex min-h-[8rem] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white">
            <p className="text-sm text-slate-600">
              Nenhum lote importado ainda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lotes.map((lote) => (
              <article
                key={lote.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Data
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-900">
                      {formatLoteDate(lote.data_upload)}
                    </p>
                  </div>
                  <span
                    className={[
                      'inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                      statusBadgeClass(lote.status),
                    ].join(' ')}
                  >
                    {statusLabel(lote.status)}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Fornecedor
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                    {lote.fornecedor_nome}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

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
