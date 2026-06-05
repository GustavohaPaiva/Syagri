import { forwardRef, useId } from 'react'

const baseClass =
  'h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

export const Select = forwardRef(function Select(
  {
    label,
    placeholder,
    options,
    error,
    id: idProp,
    className = '',
    children,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const selectId = idProp ?? generatedId
  const errorId = `${selectId}-error`
  const hasError = Boolean(error)

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className={[
          baseClass,
          hasError ? 'border-feedback-error' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {hasError ? (
        <p id={errorId} className="text-xs font-medium text-feedback-error">
          {error}
        </p>
      ) : null}
    </div>
  )
})

Select.displayName = 'Select'
