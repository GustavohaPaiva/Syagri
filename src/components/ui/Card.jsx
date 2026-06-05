export function Card({ children, className = '', ...rest }) {
  return (
    <div
      className={[
        'rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
