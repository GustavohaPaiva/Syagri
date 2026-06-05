export function EmptyState({ title, description, className = '' }) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {title ? (
        <p className="text-sm font-semibold text-slate-800">{title}</p>
      ) : null}
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  )
}
