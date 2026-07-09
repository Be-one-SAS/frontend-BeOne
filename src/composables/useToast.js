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
   * @param {'error'|'warning'|'success'|'info'|'prompt'} type
   * @param {number} duration - ms antes de auto-cerrar (0 = no se cierra solo)
   */
  const pushToast = (message, type = 'info', duration = 5000) => {
    if (!message) return

    // Deduplicar: si ya se está mostrando un toast idéntico (mismo mensaje y
    // tipo), no apilar otra tarjeta igual encima — reinicia su temporizador
    // para que siga visible mientras el mismo error/aviso sigue ocurriendo.
    const existing = toasts.value.find((t) => t.message === message && t.type === type)
    if (existing) {
      const oldTimer = timers.get(existing.id)
      if (oldTimer) clearTimeout(oldTimer)
      if (duration > 0) {
        const timer = setTimeout(() => dismissToast(existing.id), duration)
        timers.set(existing.id, timer)
      }
      return existing.id
    }

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
  // 'prompt': invita a hacer algo (no es un error ni una confirmación) —
  // ToastContainer.vue le da un estilo propio, no el genérico con barra
  // lateral de color de los otros tipos.
  const toastPrompt  = (message, duration = 7000) => pushToast(message, 'prompt', duration)

  return { toasts, pushToast, dismissToast, toastError, toastWarning, toastSuccess, toastInfo, toastPrompt }
})
