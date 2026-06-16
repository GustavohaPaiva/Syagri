import { useState } from 'react'
import { AlertMessage } from '../ui/AlertMessage'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ModalFormFooter } from '../ui/ModalFormFooter'
import { useAbortableAsync } from '../../hooks/useAbortableAsync'
import { criarFornecedor } from '../../services/produtoImportacaoService'

const FORM_ID = 'form-novo-fornecedor'

export function ModalNovoFornecedor({ open, onClose, onCreated }) {
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!isActive()) return
      setNome('')
      setFormError(null)
      setSaving(false)
    },
    [open],
    open,
  )

  function handleClose() {
    if (saving) return
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    const nomeLimpo = nome.trim()
    if (!nomeLimpo) {
      setFormError('Informe o nome do fornecedor.')
      return
    }

    setSaving(true)
    const res = await criarFornecedor(nomeLimpo)
    setSaving(false)

    if (!res.ok) {
      setFormError(res.error)
      return
    }

    onCreated?.()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo fornecedor"
      footer={
        <ModalFormFooter
          formId={FORM_ID}
          submitLabel="Cadastrar fornecedor"
          loading={saving}
          onCancel={handleClose}
        />
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Nome do fornecedor"
          placeholder="Ex.: Yara Fertilizantes"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={saving}
        />
        {formError ? <AlertMessage>{formError}</AlertMessage> : null}
      </form>
    </Modal>
  )
}
