import { ref } from 'vue'
import api from '@/services/api'
import { getUsersByRole } from '@/services/user.service'
import { setCoordinadores } from '@/services/quotation.service'

export function useControl() {
  const eventos = ref<any[]>([])
  const loading = ref(false)
  const coordinadores = ref<any[]>([])

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

  const fetchCoordinadores = async () => {
    try {
      const { data } = await getUsersByRole('coordinador')
      coordinadores.value = Array.isArray(data) ? data : (data.data ?? [])
    } catch (e) {
      console.error('[useControl] Error cargando coordinadores:', e)
    }
  }

  const updateEvento = async (id: number, campo: string, valor: any) => {
    await api.patch(`/quotations/${id}`, { [campo]: valor })
    const idx = eventos.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      eventos.value[idx] = { ...eventos.value[idx], [campo]: valor }
    }
  }

  const updateCoordinadores = async (quotationId: number, coordinadorIds: number[]) => {
    await setCoordinadores(quotationId, coordinadorIds)
    const idx = eventos.value.findIndex(e => e.id === quotationId)
    if (idx !== -1) {
      const assigned = coordinadores.value.filter(c => coordinadorIds.includes(c.id))
      eventos.value[idx] = {
        ...eventos.value[idx],
        coordinadores: assigned.map(u => ({ user: u })),
      }
    }
  }

  const refreshEventTeam = async (eventId: number) => {
    try {
      const [coordsRes, membersRes] = await Promise.all([
        api.get(`/quotations/${eventId}/coordinadores`),
        api.get(`/quotations/${eventId}/members`),
      ])
      const idx = eventos.value.findIndex(e => e.id === eventId)
      if (idx !== -1) {
        eventos.value[idx] = {
          ...eventos.value[idx],
          coordinadores: coordsRes.data,
          members: membersRes.data,
        }
      }
    } catch (e) {
      console.error('[useControl] Error refrescando equipo:', e)
    }
  }

  return { eventos, loading, coordinadores, fetchEventos, fetchCoordinadores, updateEvento, updateCoordinadores, refreshEventTeam }
}
