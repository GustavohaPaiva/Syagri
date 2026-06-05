import { useState } from 'react'
import { AlertMessage } from '../ui/AlertMessage'
import { FormSection } from '../ui/FormSection'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ModalFormFooter } from '../ui/ModalFormFooter'
import { Select } from '../ui/Select'
import { STATES } from '../../constants/simulator'
import { useAbortableAsync } from '../../hooks/useAbortableAsync'
import { createClient, updateClient } from '../../services/clientService'

const FORM_ID = 'form-cliente'

const EMPTY = {
  nome: '',
  razao_social: '',
  cnpj_cpf: '',
  email: '',
  telefone: '',
  municipio: '',
  uf: '',
}

export function ModalClienteForm({
  open,
  mode = 'create',
  clientId,
  initial,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const isEdit = mode === 'edit'

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!isActive()) return
      setForm({ ...EMPTY, ...initial })
      setFormError(null)
      setSaving(false)
    },
    [open, initial],
    open,
  )

  function handleClose() {
    if (saving) return
    onClose()
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    const payload = {
      nome: form.nome,
      razao_social: form.razao_social,
      cnpj_cpf: form.cnpj_cpf,
      email: form.email,
      telefone: form.telefone,
      municipio: form.municipio,
      uf: form.uf,
    }

    setSaving(true)
    const result = isEdit
      ? await updateClient(clientId, payload)
      : await createClient(payload)
    setSaving(false)

    if (!result.ok) {
      setFormError(result.error)
      return
    }

    onSaved?.(result.client)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Editar cliente' : 'Novo cliente'}
      footer={
        <ModalFormFooter
          formId={FORM_ID}
          submitLabel={isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
          loading={saving}
          onCancel={handleClose}
        />
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        <FormSection title="Identificação">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome"
              name="nome"
              placeholder="Nome do cliente"
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              disabled={saving}
            />
            <Input
              label="CPF / CNPJ"
              name="cnpj_cpf"
              placeholder="Somente números ou formatado"
              value={form.cnpj_cpf}
              onChange={(e) => setField('cnpj_cpf', e.target.value)}
              disabled={saving}
            />
            <div className="sm:col-span-2">
              <Input
                label="Razão social"
                name="razao_social"
                placeholder="Opcional"
                value={form.razao_social}
                onChange={(e) => setField('razao_social', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Contato e localização">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="E-mail"
              name="email"
              type="email"
              placeholder="contato@empresa.com"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              disabled={saving}
            />
            <Input
              label="Telefone"
              name="telefone"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={(e) => setField('telefone', e.target.value)}
              disabled={saving}
            />
            <Select
              label="Estado"
              placeholder="Selecione…"
              value={form.uf}
              onChange={(e) => setField('uf', e.target.value)}
              options={STATES}
              disabled={saving}
            />
            <Input
              label="Município"
              name="municipio"
              placeholder="Cidade"
              value={form.municipio}
              onChange={(e) => setField('municipio', e.target.value)}
              disabled={saving}
            />
          </div>
        </FormSection>

        {formError ? <AlertMessage>{formError}</AlertMessage> : null}
      </form>
    </Modal>
  )
}
