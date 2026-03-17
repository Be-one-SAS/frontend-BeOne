import { ref } from 'vue'

export const rolePermissions: Record<string, string[]> = {
  ADMIN:       ['Acceso total', 'Gestión usuarios', 'Configuración', 'Eliminación', 'Reportes'],
  COMERCIAL:   ['Cotizaciones', 'Clientes', 'Proveedores', 'Propuestas comerciales'],
  SUPERVISOR:  ['Supervisión operacional', 'Reportes', 'Solo lectura general'],
  LOGISTICA:   ['Inventario', 'Montajes', 'Operaciones logísticas', 'Desmontaje'],
  COORDINADOR: ['Eventos en campo', 'Coordinación de equipo', 'Check-in/out'],
  FINANCIERO:  ['Resúmenes financieros', 'Aprobaciones', 'Reportes de facturación'],
  SOPORTE:     ['Solo lectura general', 'Consultas básicas'],
}
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserActive,
  reassignUser,
} from '@/services/user.service'

export function useUsers() {
  const users = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await getUsers()
      users.value = res.data ?? []
    } catch (e: any) {
      error.value = e?.message ?? 'Error al cargar usuarios'
    } finally {
      loading.value = false
    }
  }

  const addUser = async (data: { email: string; password: string; fullName: string; role: string }) => {
    const res = await createUser(data)
    await fetchUsers()
    return res.data
  }

  const editUser = async (id: string, data: Partial<{ fullName: string; email: string; role: string }>) => {
    const res = await updateUser(id, data)
    await fetchUsers()
    return res.data
  }

  const toggleActive = async (id: string) => {
    const res = await toggleUserActive(id)
    await fetchUsers()
    return res.data
  }

  const reassign = async (id: string, newParentId: string) => {
    const res = await reassignUser(id, newParentId)
    await fetchUsers()
    return res.data
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    editUser,
    toggleActive,
    reassign,
  }
}
