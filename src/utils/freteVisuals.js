export function origemTone(origem) {
  switch (origem) {
    case 'UBERABA':
      return {
        badge: 'bg-amber-50 text-amber-900 ring-amber-200/80',
        dot: 'bg-amber-500',
        panel: 'from-amber-50/80 to-white',
      }
    case 'CUBATAO':
      return {
        badge: 'bg-sky-50 text-sky-900 ring-sky-200/80',
        dot: 'bg-sky-500',
        panel: 'from-sky-50/80 to-white',
      }
    case 'RIO GRANDE':
      return {
        badge: 'bg-violet-50 text-violet-900 ring-violet-200/80',
        dot: 'bg-violet-500',
        panel: 'from-violet-50/80 to-white',
      }
    case 'FOB':
      return {
        badge: 'bg-slate-100 text-slate-800 ring-slate-200/80',
        dot: 'bg-slate-500',
        panel: 'from-slate-50/80 to-white',
      }
    default:
      return {
        badge: 'bg-primary-50 text-primary-900 ring-primary-200/80',
        dot: 'bg-primary-500',
        panel: 'from-primary-50/80 to-white',
      }
  }
}
