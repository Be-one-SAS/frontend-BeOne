import { ref } from 'vue'
import api from '@/services/api'

export function useControl() {
  const eventos = ref<any[]>([])
  const loading = ref(false)

  const fetchEventos = async () => {
    loading.value = true
    try {
      const { data } = await api.get('/quotations/control')
      eventos.value = data
    } catch (e) {
      console.error('[useControl] Error cargando eventos:', e)
    } finally {
      loading.value = false
    }
  }

  const updateEvento = async (id: number, campo: string, valor: any) => {
    await api.patch(`/quotations/${id}`, { [campo]: valor })
    // Optimistic local update — no full reload needed
    const idx = eventos.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      eventos.value[idx] = { ...eventos.value[idx], [campo]: valor }
    }
  }

  return { eventos, loading, fetchEventos, updateEvento }
}
