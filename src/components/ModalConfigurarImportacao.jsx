import { useMemo, useState } from 'react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Select } from './ui/Select'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { fetchTemplatesByFornecedor } from '../services/produtoImportacaoService'

export const CREATE_TEMPLATE_VALUE = '__criar_novo_modelo__'

export function ModalConfigurarImportacao({
  open,
  onClose,
  file,
  fornecedores,
  onAdvanceExisting,
  onCreateNew,
}) {
  const [fornecedorId, setFornecedorId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!isActive()) return
      setFornecedorId('')
      setTemplateId('')
      setTemplates([])
      setError(null)
      setSubmitting(false)
    },
    [open],
    open,
  )

  useAbortableAsync(
    async (_signal, isActive) => {
      setTemplatesLoading(true)
      setError(null)

      const res = await fetchTemplatesByFornecedor(fornecedorId)
      if (!isActive()) return

      setTemplatesLoading(false)
      if (!res.ok) {
        setError(res.error)
        setTemplates([])
        return
      }
      setTemplates(res.rows)
    },
    [open, fornecedorId],
    Boolean(open && fornecedorId),
  )

  const fornecedorOptions = useMemo(
    () => fornecedores.map((f) => ({ value: f.id, label: f.nome })),
    [fornecedores],
  )

  const templateOptions = useMemo(() => {
    if (!fornecedorId) return []
    const base = templates.map((t) => ({ value: t.id, label: t.nome_layout }))
    return [
      ...base,
      {
        value: CREATE_TEMPLATE_VALUE,
        label: '+ Criar novo modelo para este fornecedor',
      },
    ]
  }, [templates, fornecedorId])

  async function handleAdvance() {
    setError(null)

    if (!fornecedorId) {
      setError('Selecione o fornecedor.')
      return
    }
    if (!templateId) {
      setError('Selecione um modelo de planilha.')
      return
    }

    const fornecedor = fornecedores.find((f) => f.id === fornecedorId)
    const fornecedorNome = fornecedor?.nome ?? ''

    if (templateId === CREATE_TEMPLATE_VALUE) {
      onCreateNew({ fornecedorId, fornecedorNome })
      return
    }

    const template = templates.find((t) => t.id === templateId)

    setSubmitting(true)
    const res = await onAdvanceExisting({
      fornecedorId,
      fornecedorNome,
      template,
    })
    setSubmitting(false)

    if (res && !res.ok) {
      setError(res.error)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar importação"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="w-full shrink-0 sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAdvance}
            loading={submitting}
            className="w-full shrink-0 sm:w-auto"
          >
            Avançar
          </Button>
        </div>
      }
    >
      {file ? (
        <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Arquivo:{' '}
          <span className="font-medium text-slate-900">{file.name}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <Select
          label="Fornecedor"
          placeholder="Selecione o fornecedor…"
          value={fornecedorId}
          onChange={(e) => {
            setFornecedorId(e.target.value)
            setTemplateId('')
            setError(null)
          }}
          options={fornecedorOptions}
        />

        <Select
          label="Modelo de planilha"
          placeholder={
            !fornecedorId
              ? 'Selecione um fornecedor primeiro'
              : templatesLoading
                ? 'Carregando modelos…'
                : 'Selecione o modelo…'
          }
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          options={templateOptions}
          disabled={!fornecedorId || templatesLoading}
        />

        {error ? (
          <p className="text-sm font-medium text-feedback-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
