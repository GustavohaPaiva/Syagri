import { IconPencil, IconTrash, IconTruck } from '../icons'
import { FreteRouteVisual, origemTone } from './FreteVisuals'
import { formatBRL } from '../../utils/money'

function IconActionButton({ label, tone = 'neutral', loading, onClick, children }) {
  const toneClass =
    tone === 'danger'
      ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
      : 'text-slate-400 hover:bg-white/80 hover:text-slate-700'

  return (
    <button
      type="button"
      className={[
        'inline-flex size-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50',
        toneClass,
      ].join(' ')}
      aria-label={label}
      title={label}
      disabled={loading}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function FreteCard({ frete, canEdit, deleting, onEdit, onDelete }) {
  const tone = origemTone(frete.origem)

  return (
    <article
      className={[
        'group overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br shadow-sm transition-[box-shadow,border-color] hover:border-primary-200 hover:shadow-md',
        tone.panel,
      ].join(' ')}
    >
      <header className="relative border-b border-white/60 px-5 pb-4 pt-5">
        {canEdit ? (
          <div className="absolute right-3 top-3 flex gap-0.5 rounded-xl bg-white/70 p-0.5 backdrop-blur-sm">
            <IconActionButton label="Editar frete" onClick={() => onEdit(frete)}>
              <IconPencil className="size-3.5" />
            </IconActionButton>
            <IconActionButton
              label="Excluir frete"
              tone="danger"
              loading={deleting}
              onClick={() => onDelete(frete)}
            >
              <IconTrash className="size-3.5" />
            </IconActionButton>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-primary-700">
          <span className="flex size-8 items-center justify-center rounded-xl bg-white/80 text-primary-600 shadow-sm">
            <IconTruck className="size-4" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.14em]">Rota de frete</p>
        </div>

        <div className="mt-4">
          <FreteRouteVisual origem={frete.origem} destino={frete.destino} compact />
        </div>
      </header>

      <footer className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
          Valor da rota
        </p>
        <p className="finance-text text-xl font-semibold text-slate-900">
          {formatBRL(frete.valor)}
        </p>
      </footer>
    </article>
  )
}

export function FreteRowActions({ row, deleting, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      <IconActionButton label="Editar frete" onClick={() => onEdit(row)}>
        <IconPencil className="size-3.5" />
      </IconActionButton>
      <IconActionButton
        label="Excluir frete"
        tone="danger"
        loading={deleting}
        onClick={() => onDelete(row)}
      >
        <IconTrash className="size-3.5" />
      </IconActionButton>
    </div>
  )
}
