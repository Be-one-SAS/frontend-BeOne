import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'
import api from '@/services/api'
import { useAuth } from './useAuth'
import { withLiderIfViewingSede } from '@/utils/hierarchyRoles'

/**
 * Acceso a acciones por rol — configurable desde /configuracion (backend:
 * AppConfigService.getRoleActionAccessConfig, key 'role_action_access').
 *
 * Contraparte de useViewAccess.js pero para botones de acción puntuales
 * (confirmar reserva, gestionar equipo, etc.) en vez de navegación — SÍ
 * refleja lo mismo que decide ActionAccessGuard en el backend, así que
 * ocultar un botón acá corresponde 1:1 con lo que el backend permitiría.
 *
 * ADMIN siempre tiene acceso a todo, igual que en el backend. A propósito
 * NO incluye el bypass de VISOR que sí tiene useViewAccess.canAccess: ahí
 * VISOR debe *ver* toda vista (navega libre, es de solo lectura), acá sería
 * mostrarle un botón de escritura que el backend siempre le rechazaría.
 */
export const useActionAccess = createGlobalState(() => {
  const config  = ref(null) // { actions: [{key,label,group,roles}], allRoles: [...] }
  const loading = ref(false)
  let loadPromise = null

  function ensureLoaded() {
    if (config.value || loading.value) return loadPromise
    loading.value = true
    loadPromise = api.get('/app-config/role-action-access')
      .then(({ data }) => { config.value = data })
      .catch(() => {
        // Config dinámica no disponible (red/backend caído) — los llamadores
        // deben caer de vuelta a los roles estáticos que pasen como fallback.
        config.value = null
      })
      .finally(() => { loading.value = false })
    return loadPromise
  }

  /** Roles dinámicos de una acción, o null si no está gestionada acá (=> usar fallback estático). */
  function getActionRoles(actionKey) {
    if (!config.value || !actionKey) return null
    const action = config.value.actions.find(a => a.key === actionKey)
    return action ? ['ADMIN', ...action.roles] : null
  }

  const { user } = useAuth()

  /**
   * @param actionKey clave en la config dinámica (ver DEFAULT_ROLE_ACTION_ACCESS)
   * @param staticFallbackRoles roles hardcodeados de hoy, usados si la acción
   *        no está en la config dinámica o esta no cargó
   */
  function canDo(actionKey, staticFallbackRoles) {
    const userRoles = user.value?.roles ?? []
    if (userRoles.includes('ADMIN')) return true

    const roles = getActionRoles(actionKey) ?? staticFallbackRoles
    // A diferencia de useViewAccess.js (donde "sin roles" = vista sin
    // restricción = todos pasan), acá "sin roles" significa que la acción es
    // exclusiva de ADMIN (ya evaluado arriba) — un array vacío es justo cómo
    // se marcan esas acciones (ver UsuarioEliminar/UsuarioResetPassword), no
    // "todos permitidos". Devolver true acá dejaría botones de ADMIN
    // visibles para cualquier rol mientras la config no haya cargado.
    if (!roles || roles.length === 0) return false

    // BEONE "viendo" una sede puede hacer exactamente lo que podría hacer el
    // líder real de esa sede.
    const effectiveRoles = withLiderIfViewingSede(userRoles, user.value?.isViewingAsSede)
    return effectiveRoles.some((r) => roles.includes(r))
  }

  return { config, ensureLoaded, getActionRoles, canDo }
})
