import { useEffect, useState } from 'react'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ModalFormFooter } from '../ui/ModalFormFooter'
import { Select } from '../ui/Select'

const MOEDA_OPTIONS = [
  { value: 'BRL', label: 'BRL' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
]

const EMPTY = {
  sku_fornecedor: '',
  nome: '',
  cultura: '',
  quarter: '',
  preco_original: '',
  moeda_origem: 'BRL',
}

export function ModalProdutoOficialForm({
  open,
  onClose,
  onSave,
  initial,
  title = 'Novo produto',
  fornecedores,
}) {
  const [form, setForm] = useState(EMPTY)
  const [fornecedorId, setFornecedorId] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const showFornecedorSelect = Boolean(fornecedores?.length) && !initial?.id

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            sku_fornecedor: initial.sku_fornecedor ?? '',
            nome: initial.nome ?? '',
            cultura: initial.cultura ?? '',
            quarter: initial.quarter ?? '',
            preco_original: String(initial.preco_original ?? ''),
            moeda_origem: initial.moeda_origem ?? 'BRL',
          }
        : EMPTY,
    )
    setFornecedorId(
      initial?.fornecedor_id ?? fornecedores?.[0]?.id ?? '',
    )
    setError(null)
    setSaving(false)
  }, [open, initial, fornecedores])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (showFornecedorSelect && !fornecedorId) {
      setError('Selecione um fornecedor.')
      return
    }

    const preco = Number.parseFloat(
      String(form.preco_original).replace(/\./g, '').replace(',', '.'),
    )

    if (!form.sku_fornecedor.trim()) {
      setError('Informe o SKU.')
      return
    }
    if (!form.nome.trim() || !form.cultura.trim() || !form.quarter.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (!Number.isFinite(preco) || preco < 0) {
      setError('Informe um preço válido.')
      return
    }

    setSaving(true)
    const res = await onSave({
      id: initial?.id,
      fornecedorId: showFornecedorSelect ? fornecedorId : undefined,
      sku_fornecedor: form.sku_fornecedor.trim(),
      nome: form.nome.trim(),
      cultura: form.cultura.trim(),
      quarter: form.quarter.trim(),
      preco_original: preco,
      moeda_origem: form.moeda_origem,
    })
    setSaving(false)

    if (res && !res.ok) {
      setError(res.error)
      return
    }

    onClose()
  }

  const fornecedorOptions =
    fornecedores?.map((f) => ({ value: f.id, label: f.nome })) ?? []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <ModalFormFooter
          formId="produto-oficial-form"
          onCancel={onClose}
          submitLabel="Salvar"
          loading={saving}
        />
      }
    >
      <form
        id="produto-oficial-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {showFornecedorSelect ? (
          <Select
            label="Fornecedor"
            value={fornecedorId}
            onChange={(e) => setFornecedorId(e.target.value)}
            options={fornecedorOptions}
            disabled={saving}
          />
        ) : null}
        <Input
          label="SKU"
          value={form.sku_fornecedor}
          onChange={(e) =>
            setForm((p) => ({ ...p, sku_fornecedor: e.target.value }))
          }
          disabled={saving || Boolean(initial?.id)}
        />
        <Input
          label="Nome"
          value={form.nome}
          onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
          disabled={saving}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Cultura"
            value={form.cultura}
            onChange={(e) =>
              setForm((p) => ({ ...p, cultura: e.target.value }))
            }
            disabled={saving}
          />
          <Input
            label="Quarter"
            value={form.quarter}
            onChange={(e) =>
              setForm((p) => ({ ...p, quarter: e.target.value }))
            }
            disabled={saving}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Preço original"
            value={form.preco_original}
            onChange={(e) =>
              setForm((p) => ({ ...p, preco_original: e.target.value }))
            }
            disabled={saving}
          />
          <Select
            label="Moeda"
            value={form.moeda_origem}
            onChange={(e) =>
              setForm((p) => ({ ...p, moeda_origem: e.target.value }))
            }
            options={MOEDA_OPTIONS}
            disabled={saving}
          />
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
