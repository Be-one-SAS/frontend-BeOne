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
  headers: { 'Content-Type': 'application/json' },
})

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
  //  → Detiene loader + maneja 401
  // ─────────────────────────────────────────────────────
  (error) => {
    const { stopLoading } = useGlobalLoader()
    stopLoading()

    if (error.response?.status === 401) {
      const { setLogout } = useAuth()
      setLogout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
