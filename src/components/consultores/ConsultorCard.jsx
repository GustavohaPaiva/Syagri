import { Button } from '../ui/Button'
import { formatShortDate } from '../../utils/formatShortDate'

function userInitial(name) {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}

export function ConsultorCard({ consultor, onViewDetails }) {
  return (
    <li className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700"
          aria-hidden
        >
          {userInitial(consultor.nome)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{consultor.nome}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Cadastro em {formatShortDate(consultor.created_at)}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="mt-4 w-full"
        onClick={() => onViewDetails(consultor.id)}
      >
        Ver detalhes
      </Button>
    </li>
  )
}
