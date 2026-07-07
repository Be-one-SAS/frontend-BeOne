/**
 * Instancia Axios centralizada de BeOne.
 *
 * Responsabilidades:
 *  1. Inyección automática del token de autenticación
 *  2. Activación / desactivación del GlobalLoader en cada petición
 *  3. Manejo de errores 401 (logout automático)
 *
 * Todos los servicios de la app importan desde aquí:
 *   import api from '@/services/api'   (o ruta relativa equivalente)
 */

import axios from 'axios'
import { useGlobalLoader } from '@/composables/useGlobalLoader'
import { useAuth }         from '@/composables/useAuth'
import { useNotifications } from '@/composables/useNotifications'

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
})

// ─────────────────────────────────────────────────────────
// Refresh silencioso — evita disparar varios POST /auth/refresh
// en paralelo cuando varias peticiones 401ean al mismo tiempo
// ─────────────────────────────────────────────────────────
let isRefreshing = false
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function flushRefreshQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token as string)
  })
  refreshQueue = []
}

// ─────────────────────────────────────────────────────────
// REQUEST interceptor
//  → Inyecta token + activa loader
// ─────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // 1. Loader global
  const { startLoading } = useGlobalLoader()
  const message = getLoadingMessage(config.url, config.method)
  startLoading(message)

  // 2. Token de autenticación
  //    useAuth guarda con clave 'authToken' en localStorage
  const { token } = useAuth()
  const authToken = token.value ?? localStorage.getItem('authToken')
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }

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

    if (status !== 401 || isAuthEndpoint || originalRequest?._retry) {
      return Promise.reject(error)
    }

    const { refreshToken, setTokens, setLogout } = useAuth()
    if (!refreshToken.value) {
      setLogout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    originalRequest._retry = true

    // Si ya hay un refresh en curso, encolar esta petición y reintentarla
    // cuando el refresh resuelva, en vez de disparar N refresh en paralelo.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      })
    }

    isRefreshing = true
    try {
      const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
        refresh_token: refreshToken.value,
      })
      setTokens(data.access_token, data.refresh_token)
      // El EventSource del SSE hornea el token viejo en su URL — hay que
      // reabrirlo con el token nuevo para que las notificaciones sigan llegando.
      useNotifications().reconnect(data.access_token)

      flushRefreshQueue(null, data.access_token)
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`
      return api(originalRequest)
    } catch (refreshError) {
      flushRefreshQueue(refreshError, null)
      setLogout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
