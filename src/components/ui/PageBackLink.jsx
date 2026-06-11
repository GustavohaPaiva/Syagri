import { Link } from 'react-router-dom'

export function PageBackLink({ to, children, className = '' }) {
  return (
    <Link
      to={to}
      className={[
        'mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5 shrink-0"
        aria-hidden
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      {children}
    </Link>
  )
}
