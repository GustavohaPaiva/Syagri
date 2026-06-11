import { useCallback, useState } from 'react'
import { IconPlus } from './icons'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import {
  criarFornecedor,
  fetchFornecedores,
} from '../services/produtoImportacaoService'

export function ModalGerenciarFornecedores({ open, onClose, onChanged }) {
  const [fornecedores, setFornecedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadFornecedores = useCallback(async (isActive) => {
    setLoading(true)
    setLoadError(null)
    const res = await fetchFornecedores()
    if (isActive && !isActive()) return
    setLoading(false)
    if (!res.ok) {
      setLoadError(res.error)
      return
    }
    setFornecedores(res.rows)
  }, [])

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!isActive()) return
      setNome('')
      setFormError(null)
      await loadFornecedores(isActive)
    },
    [open, loadFornecedores],
    open,
  )

  async function handleAdd(e) {
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

    setNome('')
    setFornecedores((prev) =>
      [...prev, res.row].sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR'),
      ),
    )
    onChanged?.()
  }

  return (
    <Modal open={open} onClose={onClose} title="Fornecedores">
      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Nome do fornecedor"
              placeholder="Ex.: Yara Fertilizantes"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={saving}
            />
          </div>
          <Button type="submit" loading={saving} className="shrink-0">
            <IconPlus className="size-4" aria-hidden />
            Adicionar
          </Button>
        </div>
        {formError ? (
          <p className="text-sm font-medium text-feedback-error" role="alert">
            {formError}
          </p>
        ) : null}
      </form>

      <div className="mt-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Fornecedores cadastrados
        </h3>

        {loading ? (
          <p className="py-6 text-center text-sm text-slate-600">
            Carregando fornecedores…
          </p>
        ) : loadError ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {loadError}
          </p>
        ) : fornecedores.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-600">
            Nenhum fornecedor cadastrado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
            {fornecedores.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 bg-white px-3 py-2.5"
              >
                <span className="truncate text-sm font-medium text-slate-900">
                  {f.nome}
                </span>
                <span
                  className={[
                    'inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
                    f.ativo
                      ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                      : 'bg-slate-100 text-slate-600 ring-slate-200',
                  ].join(' ')}
                >
                  {f.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
