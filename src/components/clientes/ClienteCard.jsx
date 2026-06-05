import { Button } from '../ui/Button'
import { formatShortDate } from '../../utils/formatShortDate'

export function ClienteCard({ cliente, canEdit, onViewDetails, onEdit }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{cliente.nome}</h2>
      <dl className="mt-3 space-y-2 text-sm text-slate-600">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            CPF / CNPJ
          </dt>
          <dd className="font-medium text-slate-800">{cliente.cnpj_cpf}</dd>
        </div>
        {cliente.municipio || cliente.uf ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Local
            </dt>
            <dd>
              {[cliente.municipio, cliente.uf].filter(Boolean).join(' — ')}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Cadastro
          </dt>
          <dd>{formatShortDate(cliente.created_at)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="w-full sm:flex-1"
          onClick={() => onViewDetails(cliente.id)}
        >
          Ver detalhes
        </Button>
        {canEdit ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:flex-1"
            onClick={() => onEdit(cliente)}
          >
            Editar
          </Button>
        ) : null}
      </div>
    </article>
  )
}
