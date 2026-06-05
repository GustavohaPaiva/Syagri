const toneClass = {
  error: 'border-red-200/90 bg-red-50 text-red-800',
  success: 'border-emerald-200/90 bg-emerald-50 text-emerald-800',
  info: 'border-slate-200 bg-slate-50 text-slate-700',
}

export function AlertMessage({
  tone = 'error',
  children,
  className = '',
  role = 'alert',
}) {
  return (
    <p
      role={role}
      className={[
        'rounded-2xl border px-4 py-3 text-sm font-medium',
        toneClass[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </p>
  )
}
