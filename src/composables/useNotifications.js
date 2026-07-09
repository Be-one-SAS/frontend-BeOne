import { ref, computed, onUnmounted } from 'vue'
import { createGlobalState } from '@vueuse/core'
import api from '@/services/api'
import { useAuth } from '@/composables/useAuth'

// Tope y backoff del reintento — ver comentario en evtSource.onerror más abajo
// sobre por qué esto es necesario incluso con la detección de 401 vía /auth/me.
const MAX_RECONNECT_ATTEMPTS = 6
const BASE_RECONNECT_DELAY_MS = 5000
const MAX_RECONNECT_DELAY_MS = 60000

export const useNotifications = createGlobalState(() => {
  const notifications = ref([])
  const unread = computed(() => notifications.value.filter(n => !n.read).length)
  let evtSource = null
  let reconnectTimer = null
  let reconnectAttempts = 0

  function connect() {
    if (evtSource) return

    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3003/api'
    // La cookie httpOnly de sesión viaja sola — withCredentials hace que el
    // navegador la adjunte igual que en cualquier request de axios.
    const url = `${base}/notifications/stream`

    evtSource = new EventSource(url, { withCredentials: true })

    // Conexión sana → resetea el contador de reintentos (si veníamos de varios
    // fallos y esta reconexión sí prendió, no arrastramos el backoff acumulado).
    evtSource.onopen = () => { reconnectAttempts = 0 }

    // EventSource estándar — el backend NestJS SSE envía eventos con data: <json>
    evtSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        // Evitar duplicados
        if (notifications.value.find(n => n.id === payload.id)) return
        notifications.value.unshift({ ...payload, read: false })
        // Mantener máximo 50 notificaciones en memoria
        if (notifications.value.length > 50) notifications.value.splice(50)
      } catch (_) {}
    }

    evtSource.onerror = () => {
      evtSource?.close()
      evtSource = null
      clearTimeout(reconnectTimer)

      // Tope duro de reintentos con backoff exponencial: si tras varios
      // intentos seguimos sin poder reconectar (típicamente porque la sesión
      // quedó inválida — cerrada al iniciar sesión en otro dispositivo, ver
      // auth.service.ts login() — y por lo que sea el flujo de abajo no logró
      // refrescarla/redirigir a tiempo), forzamos logout en vez de seguir
      // golpeando al backend cada pocos segundos para siempre.
      reconnectAttempts++
      if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
        const { setLogout } = useAuth()
        setLogout()
        window.location.href = '/login'
        return
      }
      const delay = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** (reconnectAttempts - 1), MAX_RECONNECT_DELAY_MS)

      // EventSource no expone el status code del error (podría ser un corte de
      // red pasajero o una sesión ya inválida — cookie vencida o cerrada porque
      // alguien inició sesión en otro dispositivo). Lo distinguimos pegándole
      // a un endpoint autenticado real: si responde 401, el interceptor de
      // api.ts ya se encarga de sacar al usuario (logout + redirect a /login),
      // así que no tiene sentido seguir reintentando la conexión SSE. Si fue
      // cualquier otro error (red, backend caído), sí reintentamos como antes.
      api.get('/auth/me')
        .then(() => {
          reconnectTimer = setTimeout(connect, delay)
        })
        .catch((err) => {
          if (err?.response?.status !== 401) {
            reconnectTimer = setTimeout(connect, delay)
          }
          // Si fue 401: el interceptor de api.ts ya disparó logout+redirect en
          // paralelo — no programamos otro intento.
        })
    }
  }

  function disconnect() {
    clearTimeout(reconnectTimer)
    reconnectAttempts = 0
    evtSource?.close()
    evtSource = null
  }

  // Llamado tras un refresh de sesión o un enter/exit-sede: la cookie de auth
  // ya está actualizada por el backend, solo hay que reabrir el stream para
  // que el JwtStrategy la vuelva a validar con el payload vigente.
  function reconnect() {
    disconnect()
    connect()
  }

  function markRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
  }

  function markAllRead() {
    notifications.value.forEach(n => { n.read = true })
  }

  function clear() {
    notifications.value = []
  }

  return { notifications, unread, connect, disconnect, reconnect, markRead, markAllRead, clear }
})
