import { ref, computed, onUnmounted } from 'vue'
import { createGlobalState } from '@vueuse/core'
import api from '@/services/api'

export const useNotifications = createGlobalState(() => {
  const notifications = ref([])
  const unread = computed(() => notifications.value.filter(n => !n.read).length)
  let evtSource = null
  let reconnectTimer = null

  function connect(token) {
    if (evtSource) return

    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3003/api'
    // EventSource no soporta custom headers — pasamos el JWT como query param.
    // El backend lo acepta vía jwt.strategy.ts (fromBearerOrQuery extractor).
    const url  = `${base}/notifications/stream?token=${encodeURIComponent(token)}`

    evtSource = new EventSource(url)

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

      // EventSource no expone el status code del error (podría ser un corte de
      // red pasajero o una sesión ya inválida — token vencido o cerrada porque
      // alguien inició sesión en otro dispositivo). Lo distinguimos pegándole
      // a un endpoint autenticado real: si responde 401, el interceptor de
      // api.ts ya se encarga de sacar al usuario (logout + redirect a /login),
      // así que no tiene sentido seguir reintentando la conexión SSE. Si fue
      // cualquier otro error (red, backend caído), sí reintentamos como antes.
      api.get('/auth/me')
        .then(() => {
          reconnectTimer = setTimeout(() => connect(token), 5000)
        })
        .catch((err) => {
          if (err?.response?.status !== 401) {
            reconnectTimer = setTimeout(() => connect(token), 5000)
          }
        })
    }
  }

  function disconnect() {
    clearTimeout(reconnectTimer)
    evtSource?.close()
    evtSource = null
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

  return { notifications, unread, connect, disconnect, markRead, markAllRead, clear }
})
