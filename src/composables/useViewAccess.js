import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'
import api from '@/services/api'
import { useAuth } from './useAuth'

/**
 * Acceso a vistas por rol — configurable desde /configuracion (backend:
 * AppConfigService.getRoleViewAccessConfig, key 'role_view_access').
 *
 * Controla SOLO navegación/menú del frontend (router guard + Sidebar). NO
 * reemplaza los @Roles() del backend — un rol puede perder acceso a la
 * navegación de una vista aquí sin que eso cambie lo que puede hacer contra
 * la API si ya tenía el permiso ahí.
 *
 * ADMIN siempre tiene acceso a todo — nunca se consulta la config para ese
 * rol, así que aunque el backend esté caído o la config esté corrupta, un
 * ADMIN nunca queda bloqueado fuera de /configuracion.
 */
export const useViewAccess = createGlobalState(() => {
  const config  = ref(null) // { views: [{key,label,group,roles}], allRoles: [...] }
  const loading = ref(false)
  let loadPromise = null

  function ensureLoaded() {
    if (config.value || loading.value) return loadPromise
    loading.value = true
    loadPromise = api.get('/app-config/role-view-access')
      .then(({ data }) => { config.value = data })
      .catch(() => {
        // Config dinámica no disponible (red/backend caído) — los llamadores
        // deben caer de vuelta a los roles estáticos (meta.roles / item.roles).
        config.value = null
      })
      .finally(() => { loading.value = false })
    return loadPromise
  }

  /** Roles dinámicos de una vista, o null si no está gestionada acá (=> usar fallback estático). */
  function getViewRoles(viewKey) {
    if (!config.value || !viewKey) return null
    const view = config.value.views.find(v => v.key === viewKey)
    return view ? ['ADMIN', ...view.roles] : null
  }

  const { user } = useAuth()

  /**
   * @param viewKey nombre de la ruta (to.name) — clave en la config dinámica
   * @param staticFallbackRoles roles hardcodeados de hoy (meta.roles / item.roles),
   *        usados si la vista no está en la config dinámica o esta no cargó
   */
  function canAccess(viewKey, staticFallbackRoles) {
    const userRoles = user.value?.roles ?? []
    // VISOR es de solo lectura pero puede navegar a cualquier ruta, igual que ADMIN.
    if (userRoles.includes('ADMIN') || userRoles.includes('VISOR')) return true

    // BEONE sin sede elegida: bypassa el guard para poder llegar al shell
    // (Topbar con el switcher de sede) — sin esto queda varado en
    // /unauthorized, una página sin Topbar, y nunca puede elegir una sede.
    // Una vez que elige sede (isViewingAsSede), este bypass deja de aplicar
    // y pasa a evaluarse como LIDER más abajo (effectiveRoles) — replicando
    // fielmente lo que el líder real vería, no un acceso total.
    if (userRoles.includes('BEONE') && !user.value?.isViewingAsSede) return true

    const roles = getViewRoles(viewKey) ?? staticFallbackRoles
    if (!roles || roles.length === 0) return true // sin restricción declarada

    // BEONE "viendo" una sede navega exactamente las vistas que vería el
    // LIDER real de esa sede (no un bypass total — LIDER no tiene acceso a todo).
    const effectiveRoles = user.value?.isViewingAsSede ? [...userRoles, 'LIDER'] : userRoles
    return effectiveRoles.some((r) => roles.includes(r))
  }

  return { config, ensureLoaded, getViewRoles, canAccess }
})
