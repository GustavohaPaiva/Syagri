export function FormSection({
  title,
  description,
  children,
  className = '',
  accent = false,
}) {
  return (
    <section className={['flex flex-col gap-4', className].filter(Boolean).join(' ')}>
      {title ? (
        <div
          className={
            accent ? 'border-b border-primary-100 pb-3' : undefined
          }
        >
          <p
            className={
              accent
                ? 'text-sm font-semibold tracking-tight text-primary-800'
                : 'text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'
            }
          >
            {title}
          </p>
          {description ? (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
