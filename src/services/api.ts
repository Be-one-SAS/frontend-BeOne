/**
 * Instancia Axios centralizada de BeOne.
 *
 * Responsabilidades:
 *  1. Autenticación vía cookies httpOnly (withCredentials) — el navegador
 *     adjunta access_token/refresh_token solo, no hay JWT que inyectar a mano
 *  2. Activación / desactivación del GlobalLoader en cada petición
 *  3. Manejo de errores 401 (refresh silencioso + logout automático)
 *
 * Todos los servicios de la app importan desde aquí:
 *   import api from '@/services/api'   (o ruta relativa equivalente)
 */

import axios from 'axios'
import { useGlobalLoader } from '@/composables/useGlobalLoader'
import { useAuth }         from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

// ─────────────────────────────────────────────────────────
// Mensajes descriptivos por endpoint/método
// ─────────────────────────────────────────────────────────
const getLoadingMessage = (url = '', method = ''): string => {
  const u = url.toLowerCase()
  if (u.includes('/auth'))       return 'Verificando credenciales...'
  if (u.includes('/quotation'))  return 'Cargando cotizaciones...'
  if (u.includes('/users'))      return 'Cargando usuarios...'
  if (u.includes('/supplier'))   return 'Cargando proveedores...'
  if (u.includes('/product'))    return 'Cargando productos...'
  if (u.includes('/customer'))   return 'Cargando clientes...'
  if (u.includes('/report'))     return 'Generando reporte...'
  if (u.includes('/inventory'))  return 'Cargando inventario...'
  const m = method.toLowerCase()
  if (m === 'post')   return 'Guardando información...'
  if (m === 'put')    return 'Actualizando información...'
  if (m === 'patch')  return 'Actualizando información...'
  if (m === 'delete') return 'Eliminando registro...'
  return 'Cargando...'
}

// ─────────────────────────────────────────────────────────
// Instancia Axios
// ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  // Manda las cookies httpOnly de auth (access_token/refresh_token) en cada
  // request — reemplaza la inyección manual de `Authorization: Bearer …`.
  withCredentials: true,
})

// ─────────────────────────────────────────────────────────
// Refresh silencioso — evita disparar varios POST /auth/refresh
// en paralelo cuando varias peticiones 401ean al mismo tiempo
// ─────────────────────────────────────────────────────────
let isRefreshing = false
let refreshQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = []

function flushRefreshQueue(error: unknown) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve()
  })
  refreshQueue = []
}

// ─────────────────────────────────────────────────────────
// REQUEST interceptor
//  → Activa el loader global (el token ya viaja solo, vía cookie)
// ─────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const { startLoading } = useGlobalLoader()
  const message = getLoadingMessage(config.url, config.method)
  startLoading(message)
  return config
})

// ─────────────────────────────────────────────────────────
// RESPONSE interceptor — éxito
//  → Detiene loader
// ─────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    const { stopLoading } = useGlobalLoader()
    stopLoading()
    return response
  },

  // ─────────────────────────────────────────────────────
  // RESPONSE interceptor — error
  //  → Detiene loader + maneja 401 con refresh silencioso
  // ─────────────────────────────────────────────────────
  async (error) => {
    const { stopLoading } = useGlobalLoader()
    stopLoading()

    const originalRequest = error.config
    const status = error.response?.status
    const url = originalRequest?.url ?? ''
    // login/refresh 401ean por credenciales/refresh inválido, no por sesión
    // expirada — no tiene sentido intentar renovar el token en esos casos
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh')

    // Toast global de error — se omite en endpoints de auth (login/refresh ya
    // muestran su propio mensaje inline en el formulario) y en un 401 normal
    // que todavía va a intentar renovarse solo vía refresh token (ver abajo):
    // ahí la sesión se renueva de forma transparente, no hay nada que mostrar
    // salvo que el refresh termine fallando y se redirija a /login.
    const willSilentlyRetryAuth = status === 401 && !isAuthEndpoint && !originalRequest?._retry
    const isCanceled = axios.isCancel(error)
    const message = error.response?.data?.message
      ?? (!error.response && !isCanceled ? 'No se pudo conectar con el servidor. Revisa tu conexión.' : null)

    // Rol BEONE sin sede elegida: TODA la API responde 403 a propósito (ver
    // roles.guard.ts) hasta que elija una desde el Topbar — no son errores
    // reales, así que no tiene sentido llenar la pantalla de toasts rojos.
    // MainLayout.vue ya muestra un único toast-prompt invitando a elegir sede.
    const { user } = useAuth()
    const isBeoneWithoutSede = status === 403
      && user.value?.roles?.includes('BEONE')
      && !user.value?.isViewingAsSede

    if (message && !isAuthEndpoint && !willSilentlyRetryAuth && !isBeoneWithoutSede) {
      useToast().toastError(message)
    }

    if (status !== 401 || isAuthEndpoint || originalRequest?._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    // Si ya hay un refresh en curso, encolar esta petición y reintentarla
    // cuando el refresh resuelva, en vez de disparar N refresh en paralelo.
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then(() => api(originalRequest))
    }

    isRefreshing = true
    const { setLogout } = useAuth()
    try {
      // El refresh_token viaja como cookie httpOnly — no hace falta mandar nada
      // en el body, el backend lo lee de la cookie y responde con cookies nuevas.
      await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
      // La conexión SSE ya no necesita reabrirse: la cookie de sesión no cambia
      // de "lugar" al refrescarse (antes el token viajaba en la URL del stream).
      flushRefreshQueue(null)
      return api(originalRequest)
    } catch (refreshError) {
      flushRefreshQueue(refreshError)
      setLogout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
