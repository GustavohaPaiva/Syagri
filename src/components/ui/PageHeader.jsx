export function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <header
      className={[
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={[
            'text-2xl font-semibold tracking-tight text-slate-900',
            eyebrow ? 'mt-1' : '',
          ].join(' ')}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
