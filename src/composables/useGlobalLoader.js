import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

/**
 * Estado global del loader HTTP.
 * Usa createGlobalState para ser singleton —
 * el mismo estado se comparte entre interceptores Axios y componentes Vue.
 *
 * Patrón de conteo (activeRequests) soporta peticiones concurrentes:
 * el loader permanece activo mientras haya al menos 1 petición en vuelo.
 *
 * El loader se activa con 300ms de debounce para evitar parpadeos en
 * peticiones rápidas (caché, respuestas inmediatas).
 */
export const useGlobalLoader = createGlobalState(() => {
  /** ¿Hay alguna petición activa? */
  const isLoading = ref(false)

  /** Mensaje descriptivo de la petición en curso */
  const loadingMessage = ref('Cargando...')

  /** Contador de peticiones HTTP activas simultáneas */
  const activeRequests = ref(0)

  /** Timer del debounce de activación */
  let _showTimer = null

  /**
   * Inicia el loader con debounce de 300ms.
   * Si la petición termina antes, el loader nunca llega a mostrarse.
   * @param {string} message - Mensaje a mostrar (opcional)
   */
  const startLoading = (message = 'Cargando...') => {
    activeRequests.value++
    loadingMessage.value = message
    if (!isLoading.value) {
      clearTimeout(_showTimer)
      _showTimer = setTimeout(() => {
        if (activeRequests.value > 0) {
          isLoading.value = true
        }
      }, 300)
    }
  }

  /**
   * Detiene el loader cuando se completa una petición.
   * El loader real se apaga solo cuando no quedan peticiones activas.
   */
  const stopLoading = () => {
    activeRequests.value = Math.max(0, activeRequests.value - 1)
    if (activeRequests.value === 0) {
      clearTimeout(_showTimer)
      isLoading.value = false
      loadingMessage.value = 'Cargando...'
    }
  }

  /**
   * Fuerza el reset completo del loader.
   * Usar si el estado queda inconsistente (p.ej. timeout de red).
   */
  const resetLoader = () => {
    clearTimeout(_showTimer)
    activeRequests.value = 0
    isLoading.value = false
    loadingMessage.value = 'Cargando...'
  }

  return {
    isLoading,
    loadingMessage,
    activeRequests,
    startLoading,
    stopLoading,
    resetLoader,
  }
})
