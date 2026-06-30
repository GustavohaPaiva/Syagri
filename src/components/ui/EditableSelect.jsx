import { useEffect, useRef, useState } from 'react'

export function EditableSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = 'Selecione…',
  className = '',
  ariaLabel,
}) {
  const [editing, setEditing] = useState(false)
  const selectRef = useRef(null)

  useEffect(() => {
    if (editing) selectRef.current?.focus()
  }, [editing])

  const selectedOption = options.find((o) => o.value === value)
  const display = selectedOption?.label ?? value ?? '—'

  function commit(nextValue) {
    setEditing(false)
    if (nextValue !== value) onChange(nextValue)
  }

  if (disabled) {
    return (
      <span className={['text-sm text-slate-800', className].filter(Boolean).join(' ')}>
        {display}
      </span>
    )
  }

  if (editing) {
    return (
      <select
        ref={selectRef}
        aria-label={ariaLabel}
        value={value ?? ''}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setEditing(false)
        }}
        data-no-row-click
        className={[
          'h-9 w-full min-w-[5rem] rounded-xl border border-primary-300 bg-white px-2 text-sm text-slate-900 outline-none ring-2 ring-primary-500/20',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <button
      type="button"
      data-no-row-click
      aria-label={
        ariaLabel ? `${ariaLabel}: ${display}. Clique para editar.` : undefined
      }
      className={[
        'cursor-pointer rounded-lg px-1 text-sm text-slate-800 underline decoration-dotted decoration-slate-300 underline-offset-4 transition-colors hover:text-primary-800 hover:decoration-primary-400',
        !value ? 'text-amber-700' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => setEditing(true)}
    >
      {value ? display : 'Pendente'}
    </button>
  )
}
