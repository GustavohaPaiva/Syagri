import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FornecedorCatalogSection,
  FornecedorProfileHero,
  FornecedorTemplatesSection,
  ModalHistoricoPrecos,
  ModalProdutoOficialForm,
} from '../components/fornecedores/FornecedorDetailVisuals'
import { RouteFallback } from '../components/layout/RouteFallback'
import { AlertMessage } from '../components/ui/AlertMessage'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ModalFormFooter } from '../components/ui/ModalFormFooter'
import { PageBackLink } from '../components/ui/PageBackLink'
import { useSyncPageLoading } from '../contexts/PageLoadingContext'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import {
  deleteTemplate,
  fetchFornecedorById,
  fetchHistoricoPrecos,
  fetchProdutosOficiaisByFornecedor,
  fetchTemplatesByFornecedor,
  inativarProdutoOficial,
  saveTemplateOnly,
  updateTemplate,
  upsertProdutoOficialManual,
} from '../services/produtoImportacaoService'
import {
  IGNORE_COLUMN_VALUE,
  REQUIRED_MAPPING_TARGETS,
  SYSTEM_MAPPING_FIELDS,
} from '../constants/mapeamentoCampos'
import { Select } from '../components/ui/Select'

const ConstrutorMapeamento = lazy(() =>
  import('./ConstrutorMapeamento').then((m) => ({
    default: m.ConstrutorMapeamento,
  })),
)

function ModalTemplateEditor({ open, onClose, template, onSave }) {
  const [nomeLayout, setNomeLayout] = useState('')
  const [mappings, setMappings] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setNomeLayout(template?.nome_layout ?? '')
    const saved = template?.config_json?.mappings ?? []
    setMappings(
      saved.length > 0
        ? saved.map((m, i) => ({ ...m, id: `col-${i}` }))
        : [
            {
              id: 'col-0',
              sourceIndex: 0,
              sourceLabel: 'Coluna 1',
              target: '',
            },
          ],
    )
    setError(null)
    setSaving(false)
  }, [open, template])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!nomeLayout.trim()) {
      setError('Informe o nome do layout.')
      return
    }

    const targets = mappings
      .map((m) => m.target)
      .filter((t) => t && t !== IGNORE_COLUMN_VALUE)
    const missing = REQUIRED_MAPPING_TARGETS.filter((t) => !targets.includes(t))
    if (missing.length > 0) {
      setError(`Mapeie os campos obrigatórios: ${missing.join(', ').toUpperCase()}.`)
      return
    }

    const columnMappings = mappings.map((m) => ({
      sourceIndex: m.sourceIndex,
      sourceLabel: m.sourceLabel,
      target: m.target,
    }))

    setSaving(true)
    const res = await onSave({ nomeLayout: nomeLayout.trim(), columnMappings })
    setSaving(false)

    if (res && !res.ok) {
      setError(res.error)
      return
    }

    onClose()
  }

  function addMappingRow() {
    setMappings((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}`,
        sourceIndex: prev.length,
        sourceLabel: `Coluna ${prev.length + 1}`,
        target: '',
      },
    ])
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={template ? 'Editar formato' : 'Novo formato'}
      footer={
        <ModalFormFooter
          formId="template-editor-form"
          onCancel={onClose}
          submitLabel="Salvar"
          loading={saving}
        />
      }
    >
      <form
        id="template-editor-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          label="Nome do layout"
          value={nomeLayout}
          onChange={(e) => setNomeLayout(e.target.value)}
          disabled={saving}
        />

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mapeamento de colunas
          </p>
          {mappings.map((map, index) => (
            <div
              key={map.id}
              className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2"
            >
              <Input
                label={`Coluna ${index + 1}`}
                value={map.sourceLabel}
                onChange={(e) =>
                  setMappings((prev) =>
                    prev.map((m) =>
                      m.id === map.id
                        ? { ...m, sourceLabel: e.target.value }
                        : m,
                    ),
                  )
                }
                disabled={saving}
              />
              <Select
                label="Campo no sistema"
                placeholder="Selecione…"
                value={map.target ?? ''}
                onChange={(e) =>
                  setMappings((prev) =>
                    prev.map((m) =>
                      m.id === map.id ? { ...m, target: e.target.value } : m,
                    ),
                  )
                }
                options={SYSTEM_MAPPING_FIELDS}
                disabled={saving}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-primary-700 hover:text-primary-800"
            onClick={addMappingRow}
          >
            + Adicionar coluna
          </button>
        </div>

        {error ? (
          <p className="text-sm font-medium text-feedback-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  )
}

export function FornecedorDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [fornecedor, setFornecedor] = useState(null)
  const [templates, setTemplates] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)

  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [produtoModalOpen, setProdutoModalOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState(null)
  const [historicoOpen, setHistoricoOpen] = useState(false)
  const [historicoProduto, setHistoricoProduto] = useState(null)
  const [historico, setHistorico] = useState([])
  const [historicoLoading, setHistoricoLoading] = useState(false)
  const [mapeamentoSession, setMapeamentoSession] = useState(null)

  const loadData = useCallback(async (isActive) => {
    if (!id) return

    setLoading(true)
    setError(null)

    const [fornRes, tplRes, prodRes] = await Promise.all([
      fetchFornecedorById(id),
      fetchTemplatesByFornecedor(id),
      fetchProdutosOficiaisByFornecedor(id),
    ])

    if (!isActive || !isActive()) return
    setLoading(false)

    if (!fornRes.ok) {
      setError(fornRes.error)
      setFornecedor(null)
      return
    }

    setFornecedor(fornRes.row)
    setTemplates(tplRes.ok ? tplRes.rows : [])
    setProdutos(prodRes.ok ? prodRes.rows : [])

    if (!tplRes.ok || !prodRes.ok) {
      setActionError(tplRes.error ?? prodRes.error)
    }
  }, [id])

  useSyncPageLoading(loading)

  useAbortableAsync(
    async (_signal, isActive) => {
      await loadData(isActive)
    },
    [loadData],
    Boolean(id),
  )

  async function handleSaveTemplate({ nomeLayout, columnMappings }) {
    if (editingTemplate) {
      return updateTemplate(editingTemplate.id, { nomeLayout, columnMappings })
    }
    return saveTemplateOnly({
      fornecedorId: id,
      nomeLayout,
      columnMappings,
    })
  }

  async function handleTemplateSaved(res) {
    if (res?.ok) {
      setTemplateModalOpen(false)
      setEditingTemplate(null)
      await loadData(() => true)
    }
    return res
  }

  async function handleDeleteTemplate(templateId) {
    if (!window.confirm('Excluir este formato de tabela?')) return
    const res = await deleteTemplate(templateId)
    if (!res.ok) {
      setActionError(res.error)
      return
    }
    await loadData(() => true)
  }

  async function handleSaveProduto(payload) {
    const res = await upsertProdutoOficialManual({
      fornecedorId: id,
      ...payload,
    })
    if (res.ok) await loadData(() => true)
    return res
  }

  async function handleInativar(produtoId) {
    if (!window.confirm('Inativar este produto?')) return
    const res = await inativarProdutoOficial(produtoId)
    if (!res.ok) {
      setActionError(res.error)
      return
    }
    await loadData(() => true)
  }

  async function handleViewHistorico(produto) {
    setHistoricoProduto(produto)
    setHistoricoOpen(true)
    setHistoricoLoading(true)
    const res = await fetchHistoricoPrecos(produto.id)
    setHistoricoLoading(false)
    if (res.ok) setHistorico(res.rows)
    else setHistorico([])
  }

  if (mapeamentoSession) {
    return (
      <div className="w-full min-w-0 space-y-4 sm:space-y-6">
        <Suspense fallback={<RouteFallback />}>
          <ConstrutorMapeamento
            file={mapeamentoSession.file}
            fornecedorId={mapeamentoSession.fornecedorId}
            fornecedorNome={mapeamentoSession.fornecedorNome}
            onBack={() => setMapeamentoSession(null)}
            onComplete={() => {
              setMapeamentoSession(null)
              navigate(`/admin/fornecedores/${id}`)
            }}
          />
        </Suspense>
      </div>
    )
  }

  if (!id) {
    return (
      <div className="w-full min-w-0 space-y-4">
        <PageBackLink to="/admin/fornecedores">Voltar</PageBackLink>
        <AlertMessage>Fornecedor não informado.</AlertMessage>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <PageBackLink to="/admin/fornecedores">Voltar aos fornecedores</PageBackLink>

      {loading ? (
        <EmptyState
          title="Carregando fornecedor…"
          description="Aguarde um instante."
        />
      ) : error && !fornecedor ? (
        <AlertMessage>{error}</AlertMessage>
      ) : fornecedor ? (
        <>
          <FornecedorProfileHero fornecedor={fornecedor} />

          {actionError ? <AlertMessage>{actionError}</AlertMessage> : null}

          <FornecedorTemplatesSection
            templates={templates}
            loading={false}
            onCreate={() => {
              setEditingTemplate(null)
              setTemplateModalOpen(true)
            }}
            onEdit={(tpl) => {
              setEditingTemplate(tpl)
              setTemplateModalOpen(true)
            }}
            onDelete={handleDeleteTemplate}
          />

          <FornecedorCatalogSection
            produtos={produtos}
            loading={false}
            onAdd={() => {
              setEditingProduto(null)
              setProdutoModalOpen(true)
            }}
            onEdit={(p) => {
              setEditingProduto(p)
              setProdutoModalOpen(true)
            }}
            onInativar={handleInativar}
            onViewHistorico={handleViewHistorico}
          />

          <ModalTemplateEditor
            open={templateModalOpen}
            onClose={() => {
              setTemplateModalOpen(false)
              setEditingTemplate(null)
            }}
            template={editingTemplate}
            onSave={async (payload) => {
              const res = await handleSaveTemplate(payload)
              return handleTemplateSaved(res)
            }}
          />

          <ModalProdutoOficialForm
            open={produtoModalOpen}
            onClose={() => {
              setProdutoModalOpen(false)
              setEditingProduto(null)
            }}
            initial={editingProduto}
            title={editingProduto ? 'Editar produto' : 'Novo produto'}
            onSave={handleSaveProduto}
          />

          <ModalHistoricoPrecos
            open={historicoOpen}
            onClose={() => {
              setHistoricoOpen(false)
              setHistoricoProduto(null)
              setHistorico([])
            }}
            produto={historicoProduto}
            historico={historico}
            loading={historicoLoading}
          />
        </>
      ) : null}
    </div>
  )
}
