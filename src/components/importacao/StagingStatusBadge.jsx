import { ImportacaoStatusBadge } from './ImportacaoVisuals'
import {
  statusLinhaLabel,
  statusLinhaTone,
} from '../../utils/importacaoVisuals'

export function StagingStatusBadge({ status, compact = false }) {
  const tone = statusLinhaTone(status)

  return (
    <span
      className={[
        'inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        compact ? 'px-2 py-0.5 text-[0.65rem]' : 'px-3 py-1 text-xs',
        tone.badge,
      ].join(' ')}
    >
      <span
        className={['size-1.5 shrink-0 rounded-full', tone.dot].join(' ')}
        aria-hidden
      />
      <span className="truncate">{statusLinhaLabel(status)}</span>
    </span>
  )
}

export { ImportacaoStatusBadge }
