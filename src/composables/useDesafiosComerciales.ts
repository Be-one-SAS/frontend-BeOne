import { ref } from 'vue'
import {
  getDesafios,
  getResumenDesafios,
  createDesafio,
  updateDesafio,
  updateDesafioEstado,
  updateDesafioPago,
  deleteDesafio,
} from '@/services/desafios-comerciales.service'

export function useDesafiosComerciales() {
  const desafios = ref<any[]>([])
  const resumen  = ref<any[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  const fetchDesafios = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await getDesafios()
      desafios.value = res.data ?? []
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? e?.message ?? 'Error al cargar los desafíos comerciales'
    } finally {
      loading.value = false
    }
  }

  const fetchResumen = async () => {
    try {
      const res = await getResumenDesafios()
      resumen.value = res.data ?? []
    } catch (e: any) {
      // El resumen es informativo — un fallo aquí no debe romper la vista principal
      console.error('Error al cargar el resumen de desafíos comerciales:', e)
    }
  }

  const addDesafio = async (data: object) => {
    const res = await createDesafio(data)
    await fetchDesafios()
    return res.data
  }

  const editDesafio = async (id: number, data: object) => {
    const res = await updateDesafio(id, data)
    await fetchDesafios()
    return res.data
  }

  const changeEstado = async (id: number, estado: string) => {
    const res = await updateDesafioEstado(id, estado)
    await fetchDesafios()
    return res.data
  }

  const removeDesafio = async (id: number) => {
    await deleteDesafio(id)
    await fetchDesafios()
  }

  const marcarPago = async (id: number, comisionPagada: boolean) => {
    const res = await updateDesafioPago(id, comisionPagada)
    await fetchDesafios()
    return res.data
  }

  return {
    desafios,
    resumen,
    loading,
    error,
    fetchDesafios,
    fetchResumen,
    addDesafio,
    editDesafio,
    changeEstado,
    removeDesafio,
    marcarPago,
  }
}
