import { useCallback, useEffect, useId, useRef } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) {
  const titleId = useId()
  const panelRef = useRef(null)

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, handleKeyDown])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector('input,button,select')?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  const widthClass = size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-md'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-15px_rgba(15,23,42,0.15)]',
          widthClass,
        ].join(' ')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <h2
            id={titleId}
            className="text-base font-semibold tracking-tight text-slate-900"
          >
            {title}
          </h2>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fechar"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
        {footer ? (
          <div className="border-t border-slate-100 px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}
