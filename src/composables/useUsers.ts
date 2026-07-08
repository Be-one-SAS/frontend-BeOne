import { ref, computed } from 'vue'
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from '@/services/users.service'

export const rolePermissions: Record<string, string[]> = {
  ADMIN:         ['Acceso total', 'Gestión usuarios', 'Configuración', 'Eliminación', 'Reportes'],
  ADMINISTRADOR: ['Cotizaciones', 'Clientes', 'Productos', 'Reservas', 'Inventario', 'Control', 'Tareas', 'Reportes'],
  DIRECCION:     ['Vista cotizaciones', 'Vista clientes', 'Vista productos', 'Inventario (lectura)', 'Reportes'],
  LIDER:         ['Cotizaciones', 'Clientes', 'Productos (lectura)', 'Reservas', 'Tareas'],
  SUPERVISOR:    ['Reservas', 'Inventario', 'Control operativo', 'Materiales', 'Tareas'],
  COORDINADOR:   ['Sus cotizaciones asignadas', 'Control operativo', 'Materiales', 'Check-in/out'],
  EJECUTIVO:         ['Sus cotizaciones asignadas', 'Control operativo', 'Materiales', 'Check-in/out'],
  EJECUTIVO_CUENTA:  ['Sus cotizaciones asignadas', 'Control operativo', 'Materiales', 'Check-in/out'],
  LOGISTICO:     ['Control operativo', 'Materiales', 'Check-in/out'],
  OPERATIVO:     ['Control operativo', 'Materiales', 'Check-in/out'],
}

export function useUsers() {
  const users    = ref<any[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  // ── Filtros ────────────────────────────────────────────
  const search       = ref('')
  const rolFiltro    = ref('')
  const statusFiltro = ref('')

  // ── Carga ──────────────────────────────────────────────
  // El backend solo puede alternar el booleano `isActive` (endpoint
  // toggle-active); el campo `status` de texto no se actualiza en ningún
  // otro endpoint, así que se deriva aquí para que siempre refleje el
  // estado real tras crear/editar/activar/desactivar un usuario.
  const loadUsers = async () => {
    loading.value = true
    error.value   = null
    try {
      const data  = await getUsers()
      const raw   = Array.isArray(data) ? data : (data?.data ?? [])
      users.value = raw.map((u: any) => ({ ...u, status: u.isActive ? 'Activo' : 'Inactivo' }))
    } catch (e: any) {
      error.value = e?.message ?? 'Error al cargar usuarios'
    } finally {
      loading.value = false
    }
  }

  // ── Lista filtrada ─────────────────────────────────────
  const filteredUsers = computed(() => {
    const q = search.value.toLowerCase().trim()
    return users.value.filter(u => {
      const matchSearch = !q ||
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
      const matchRol    = !rolFiltro.value    || (u.roles ?? []).includes(rolFiltro.value)
      const matchStatus = !statusFiltro.value || u.status === statusFiltro.value
      return matchSearch && matchRol && matchStatus
    })
  })

  // ── KPIs ───────────────────────────────────────────────
  const kpis = computed(() => ({
    total:    users.value.length,
    activos:  users.value.filter(u => u.status === 'Activo').length,
    inactivos: users.value.filter(u => u.status !== 'Activo').length,
    roles:    new Set(users.value.flatMap(u => u.roles ?? [])).size,
  }))

  // ── Parser de error amigable ───────────────────────────
  const parseUserError = (e: any, defaultMsg: string): string => {
    const status = e?.response?.status
    const msg = (e?.response?.data?.message ?? '').toLowerCase()
    if (status === 404 || msg.includes('not found') || msg.includes('no encontrado')) {
      return 'El usuario no fue encontrado.'
    }
    return e?.message ?? defaultMsg
  }

  // ── Upsert (crear o editar) ────────────────────────────
  const upsertUser = async (data: any) => {
    error.value = null
    try {
      if (data.id) {
        await updateUser(data.id, data)
      } else {
        await createUser(data)
      }
      await loadUsers()
    } catch (e: any) {
      const msg = parseUserError(e, 'Error al guardar el usuario')
      error.value = msg
      throw new Error(msg)
    }
  }

  // ── Toggle estado ──────────────────────────────────────
  const toggleStatus = async (u: any) => {
    error.value = null
    try {
      await toggleUserStatus(u.id)
      await loadUsers()
    } catch (e: any) {
      const msg = parseUserError(e, 'Error al cambiar el estado del usuario')
      error.value = msg
      throw new Error(msg)
    }
  }

  // ── Eliminar ───────────────────────────────────────────
  const removeUser = async (id: any) => {
    error.value = null
    try {
      await deleteUser(id)
      await loadUsers()
    } catch (e: any) {
      const msg = parseUserError(e, 'Error al eliminar el usuario')
      error.value = msg
      throw new Error(msg)
    }
  }

  // ── Helpers de fecha ───────────────────────────────────
  const formatDate = (date: string) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  const getTimeAgo = (date: string) => {
    if (!date) return 'Nunca'
    const diff  = Date.now() - new Date(date).getTime()
    const mins  = Math.floor(diff / 60000)
    if (mins < 1)  return 'Ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days  = Math.floor(hours / 24)
    if (days === 1) return 'Ayer'
    if (days < 30)  return `Hace ${days} días`
    return formatDate(date)
  }

  // Sin historial de acciones en esta versión de la API
  const getUserActions = (_id: any): string[] => []

  return {
    users,
    loading,
    error,
    search,
    rolFiltro,
    statusFiltro,
    filteredUsers,
    kpis,
    loadUsers,
    toggleStatus,
    removeUser,
    upsertUser,
    getTimeAgo,
    formatDate,
    getUserActions,
  }
}
