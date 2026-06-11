export function formatLoteDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function statusLabel(status) {
  switch (status) {
    case 'processando':
      return 'Processando'
    case 'aguardando_validacao':
      return 'Aguardando validação'
    case 'concluido':
      return 'Concluído'
    default:
      return status
  }
}

export function statusTone(status) {
  switch (status) {
    case 'processando':
      return {
        badge: 'bg-slate-100 text-slate-800 ring-slate-200/80',
        dot: 'bg-slate-500',
        panel: 'from-slate-50/80 to-white',
      }
    case 'aguardando_validacao':
      return {
        badge: 'bg-amber-50 text-amber-900 ring-amber-200/80',
        dot: 'bg-amber-500',
        panel: 'from-amber-50/80 to-white',
      }
    case 'concluido':
      return {
        badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
        dot: 'bg-emerald-500',
        panel: 'from-emerald-50/80 to-white',
      }
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 ring-slate-200/80',
        dot: 'bg-slate-400',
        panel: 'from-slate-50/80 to-white',
      }
  }
}

export function fornecedorInitial(nome) {
  const trimmed = (nome ?? '').trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}
