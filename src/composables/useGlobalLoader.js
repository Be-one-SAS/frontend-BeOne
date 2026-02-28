import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

/**
 * Estado global del loader HTTP.
 * Usa createGlobalState para ser singleton —
 * el mismo estado se comparte entre interceptores Axios y componentes Vue.
 *
 * Patrón de conteo (activeRequests) soporta peticiones concurrentes:
 * el loader permanece activo mientras haya al menos 1 petición en vuelo.
 */
export const useGlobalLoader = createGlobalState(() => {
  /** ¿Hay alguna petición activa? */
  const isLoading = ref(false)

  /** Mensaje descriptivo de la petición en curso */
  const loadingMessage = ref('Cargando...')

  /** Contador de peticiones HTTP activas simultáneas */
  const activeRequests = ref(0)

  /**
   * Inicia el loader.
   * Llamar por cada petición que comienza.
   * @param {string} message - Mensaje a mostrar (opcional)
   */
  const startLoading = (message = 'Cargando...') => {
    activeRequests.value++
    isLoading.value = true
    loadingMessage.value = message
  }

  /**
   * Detiene el loader cuando se completa una petición.
   * El loader real se apaga solo cuando no quedan peticiones activas.
   */
  const stopLoading = () => {
    activeRequests.value = Math.max(0, activeRequests.value - 1)
    if (activeRequests.value === 0) {
      isLoading.value = false
      loadingMessage.value = 'Cargando...'
    }
  }

  /**
   * Fuerza el reset completo del loader.
   * Usar si el estado queda inconsistente (p.ej. timeout de red).
   */
  const resetLoader = () => {
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
