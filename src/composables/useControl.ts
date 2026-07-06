import { ref } from 'vue'
import api from '@/services/api'
import { getUsersByRole } from '@/services/user.service'
import { setCoordinadores } from '@/services/quotation.service'

export function useControl() {
  const eventos = ref<any[]>([])
  const loading = ref(false)
  const coordinadores = ref<any[]>([])

  // registroFotografico refleja evidencia real: se marca automáticamente cuando
  // llega un check-in de campo con fotos. No es editable a mano desde la UI —
  // ver Control.vue (Foto ya no tiene @click, es un indicador de solo lectura).
  const fetchEventos = async () => {
    loading.value = true
    try {
      const [eventosRes, checkinsRes] = await Promise.all([
        api.get('/quotations/control'),
        api.get('/checkins').catch(() => ({ data: [] })),
      ])

      eventos.value = eventosRes.data

      const checkins: any[] = checkinsRes.data ?? []
      const checkinPorQuotation = new Map<number, any>()
      checkins.forEach((c: any) => {
        if (c.quotationId) checkinPorQuotation.set(c.quotationId, c)
      })

      const hasPhotos = (c: any): boolean => {
        const urls = c.fotosUrl ?? (c.fotoUrl ? [c.fotoUrl] : [])
        return (Array.isArray(urls) ? urls : [urls]).filter(Boolean).length > 0
      }

      const syncOps: Promise<any>[] = []
      eventos.value.forEach((ev: any) => {
        const checkin = checkinPorQuotation.get(ev.id)
        if (!checkin) return
        if (!ev.registroFotografico && hasPhotos(checkin)) {
          syncOps.push(updateEvento(ev.id, 'registroFotografico', true).catch(() => {}))
        }
      })
      await Promise.all(syncOps)
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

  const patchEventLocal = (eventId: number, patch: Record<string, any>) => {
    const idx = eventos.value.findIndex(e => e.id === eventId)
    if (idx !== -1) {
      eventos.value[idx] = { ...eventos.value[idx], ...patch }
    }
  }

  return { eventos, loading, coordinadores, fetchEventos, fetchCoordinadores, updateEvento, updateCoordinadores, refreshEventTeam, patchEventLocal }
}
