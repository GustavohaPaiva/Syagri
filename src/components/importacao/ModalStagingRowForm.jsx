import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
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
  moeda: 'BRL',
}

export function ModalStagingRowForm({
  open,
  onClose,
  onSave,
  initial,
  title = 'Adicionar produto',
}) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

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
            moeda: initial.moeda ?? 'BRL',
          }
        : EMPTY,
    )
    setError(null)
    setSaving(false)
  }, [open, initial])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const preco = Number.parseFloat(
      String(form.preco_original).replace(/\./g, '').replace(',', '.'),
    )

    if (!form.sku_fornecedor.trim()) {
      setError('Informe o SKU.')
      return
    }
    if (!form.nome.trim()) {
      setError('Informe o nome.')
      return
    }
    if (!form.cultura.trim()) {
      setError('Informe a cultura.')
      return
    }
    if (!form.quarter.trim()) {
      setError('Informe o quarter.')
      return
    }
    if (!Number.isFinite(preco) || preco < 0) {
      setError('Informe um preço válido.')
      return
    }

    setSaving(true)
    const res = await onSave({
      sku_fornecedor: form.sku_fornecedor.trim(),
      nome: form.nome.trim(),
      cultura: form.cultura.trim(),
      quarter: form.quarter.trim(),
      preco_original: preco,
      moeda: form.moeda,
    })
    setSaving(false)

    if (res && !res.ok) {
      setError(res.error)
      return
    }

    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <ModalFormFooter
          formId="staging-row-form"
          onCancel={onClose}
          submitLabel="Salvar"
          loading={saving}
        />
      }
    >
      <form
        id="staging-row-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          label="SKU"
          value={form.sku_fornecedor}
          onChange={(e) =>
            setForm((p) => ({ ...p, sku_fornecedor: e.target.value }))
          }
          disabled={saving}
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
            label="Preço"
            value={form.preco_original}
            onChange={(e) =>
              setForm((p) => ({ ...p, preco_original: e.target.value }))
            }
            disabled={saving}
          />
          <Select
            label="Moeda"
            value={form.moeda}
            onChange={(e) => setForm((p) => ({ ...p, moeda: e.target.value }))}
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
