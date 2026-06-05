import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { IconSearch } from '../icons'

/**
 * Combobox simples: input com busca + dropdown.
 *
 * Props:
 * - label, placeholder, value (texto exibido), onTextChange(text)
 * - options: array sincrona [{ id, label, sublabel?, payload? }]
 * - onSearch(query): opcional, retorna Promise<options>
 * - onSelect(option): chamado quando o usuário escolhe uma opção
 * - onCreateRequest: chamado quando não há resultados e o usuário quer cadastrar
 * - disabled, allowFreeText (default true)
 */
export function Combobox({
  label,
  placeholder = 'Buscar…',
  value = '',
  onTextChange,
  options,
  onSearch,
  onSelect,
  onCreateRequest,
  createLabel,
  disabled = false,
  allowFreeText = true,
  emptyMessage = 'Nenhum resultado.',
  className = '',
}) {
  const inputId = useId()
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [asyncResults, setAsyncResults] = useState([])
  const [searching, setSearching] = useState(false)

  const isAsync = typeof onSearch === 'function'
  const trimmedValue = value.trim()

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!isAsync) return
    if (!open) return

    const controller = new AbortController()
    const handle = window.setTimeout(() => {
      setSearching(true)
      void Promise.resolve()
        .then(() => onSearch(value, controller.signal))
        .then((r) => {
          if (!controller.signal.aborted) {
            setAsyncResults(r ?? [])
            setSearching(false)
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setSearching(false)
        })
    }, 200)

    return () => {
      window.clearTimeout(handle)
      controller.abort()
    }
  }, [value, open, isAsync, onSearch])

  const filtered = useMemo(() => {
    if (isAsync) return asyncResults
    const q = trimmedValue.toLowerCase()
    if (!q) return options ?? []
    return (options ?? []).filter((o) => o.label.toLowerCase().includes(q))
  }, [isAsync, asyncResults, options, trimmedValue])

  const showCreateAction =
    Boolean(onCreateRequest) &&
    !searching &&
    filtered.length === 0 &&
    trimmedValue.length > 0

  function handleSelect(opt) {
    onSelect?.(opt)
    setOpen(false)
  }

  function handleCreate() {
    onCreateRequest?.()
    setOpen(false)
  }

  const createActionLabel =
    createLabel ?? `Cadastrar "${trimmedValue}"`

  return (
    <div className={['flex w-full flex-col gap-1.5', className].join(' ')}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      ) : null}
      <div ref={wrapRef} className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onTextChange?.(e.target.value)
            if (!open) setOpen(true)
          }}
          className="h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        />
        {open && !disabled ? (
          <ul
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {searching ? (
              <li className="px-3 py-2 text-sm text-slate-500">Buscando…</li>
            ) : showCreateAction ? (
              <li>
                <button
                  type="button"
                  role="option"
                  onClick={handleCreate}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-primary-800 transition-colors hover:bg-primary-50"
                >
                  <span className="font-semibold">{createActionLabel}</span>
                  <span className="text-xs text-slate-500">
                    Cliente não encontrado — cadastrar agora
                  </span>
                </button>
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">
                {allowFreeText && trimmedValue
                  ? 'Digite para buscar ou cadastrar'
                  : emptyMessage}
              </li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    role="option"
                    onClick={() => handleSelect(opt)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-slate-800 transition-colors hover:bg-slate-50"
                  >
                    <span className="font-medium">{opt.label}</span>
                    {opt.sublabel ? (
                      <span className="text-xs text-slate-500">
                        {opt.sublabel}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
