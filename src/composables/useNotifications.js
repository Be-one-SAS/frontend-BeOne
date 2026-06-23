import { ref, computed, onUnmounted } from 'vue'
import { createGlobalState } from '@vueuse/core'

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
      // Reconexión exponencial simple — 5 segundos
      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => connect(token), 5000)
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
