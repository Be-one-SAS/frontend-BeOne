import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

/**
 * Notificaciones tipo toast, globales — mismo patrón singleton que
 * useGlobalLoader (createGlobalState): el mismo estado se comparte entre el
 * interceptor de Axios (api.ts) y cualquier componente Vue, sin tener que
 * pasar props ni emitir eventos entre ellos.
 */
export const useToast = createGlobalState(() => {
  const toasts = ref([])
  let nextId = 0
  const timers = new Map()

  /**
   * @param {string} message
   * @param {'error'|'warning'|'success'|'info'} type
   * @param {number} duration - ms antes de auto-cerrar (0 = no se cierra solo)
   */
  const pushToast = (message, type = 'info', duration = 5000) => {
    if (!message) return
    const id = ++nextId
    toasts.value.push({ id, message, type })
    if (duration > 0) {
      const timer = setTimeout(() => dismissToast(id), duration)
      timers.set(id, timer)
    }
    return id
  }

  const dismissToast = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  const toastError   = (message, duration = 6000) => pushToast(message, 'error', duration)
  const toastWarning = (message, duration = 6000) => pushToast(message, 'warning', duration)
  const toastSuccess = (message, duration = 4000) => pushToast(message, 'success', duration)
  const toastInfo    = (message, duration = 4000) => pushToast(message, 'info', duration)

  return { toasts, pushToast, dismissToast, toastError, toastWarning, toastSuccess, toastInfo }
})
