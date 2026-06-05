import { Link } from 'react-router-dom'

export function PageBackLink({ to, children, className = '' }) {
  return (
    <Link
      to={to}
      className={[
        'mb-6 inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-primary-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      {children}
    </Link>
  )
}
