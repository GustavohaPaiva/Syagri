import { useEffect } from 'react'

/**
 * Executa trabalho assíncrono no mount/atualização de deps, com cancelamento.
 * O callback é agendado em microtask para evitar setState síncrono no corpo do effect.
 */
export function useAbortableAsync(task, deps, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    let active = true
    const isActive = () => active && !controller.signal.aborted

    void Promise.resolve().then(() => task(controller.signal, isActive))

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps repassadas pelo chamador
  }, [enabled, ...deps])
}
