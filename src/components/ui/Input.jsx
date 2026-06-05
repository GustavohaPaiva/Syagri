import { forwardRef, useId } from 'react'


const inputBaseClass =
  'h-11 w-full rounded-2xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

export const Input = forwardRef(
  function Input(
    { label, error, id: idProp, className = '', ...props },
    ref,
  ) {
    const generatedId = useId()
    const inputId = idProp ?? generatedId
    const errorId = `${inputId}-error`
    const hasError = Boolean(error)

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          {...(hasError ? { 'aria-invalid': 'true' } : {})}
          aria-describedby={hasError ? errorId : undefined}
          className={[
            inputBaseClass,
            hasError
              ? 'border-feedback-error focus:border-feedback-error focus:ring-feedback-error/25'
              : 'border-gray-200',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {hasError ? (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-medium text-feedback-error"
          >
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)


Input.displayName = 'Input'
