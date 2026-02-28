import { ref, computed } from 'vue'
// Conectar API aquí → descomentar cuando el backend esté listo
// import { getUsers, toggleUserStatus, deleteUser as deleteUserService } from '@/services/users.service'

// ─────────────────────────────────────────────────────────
// MOCK DATA (reemplazar con llamada real en loadUsers)
// ─────────────────────────────────────────────────────────
const mockUsers = [
  {
    id: 1,
    fullName: 'Santiago Restrepo',
    username: 'srestrepo',
    email: 'santiago@beone.co',
    role: 'ADMIN',
    status: 'Activo',
    ciudad: 'Medellín',
    telefono: '310 456 7890',
    documento: '71234567',
    lastLogin: '2025-02-26T10:30:00',
    createdAt: '2024-08-01T00:00:00',
    notas: 'Usuario administrador principal del sistema.',
  },
  {
    id: 2,
    fullName: 'Valentina Ospina',
    username: 'vospina',
    email: 'valentina@beone.co',
    role: 'COMERCIAL',
    status: 'Activo',
    ciudad: 'Medellín',
    telefono: '315 234 5678',
    documento: '43987654',
    lastLogin: '2025-02-25T16:00:00',
    createdAt: '2024-09-15T00:00:00',
    notas: '',
  },
  {
    id: 3,
    fullName: 'Andrés Cardona',
    username: 'acardona',
    email: 'andres@beone.co',
    role: 'LOGISTICA',
    status: 'Activo',
    ciudad: 'Bogotá',
    telefono: '312 890 1234',
    documento: '80456789',
    lastLogin: '2025-02-20T08:00:00',
    createdAt: '2024-10-01T00:00:00',
    notas: '',
  },
  {
    id: 4,
    fullName: 'Mariana Torres',
    username: 'mtorres',
    email: 'mariana@beone.co',
    role: 'SUPERVISOR',
    status: 'Inactivo',
    ciudad: 'Cali',
    telefono: '318 345 6789',
    documento: '38765432',
    lastLogin: null,
    createdAt: '2025-01-10T00:00:00',
    notas: 'Cuenta desactivada temporalmente.',
  },
  {
    id: 5,
    fullName: 'Felipe Gómez',
    username: 'fgomez',
    email: 'felipe@beone.co',
    role: 'COORDINADOR',
    status: 'Suspendido',
    ciudad: 'Barranquilla',
    telefono: '300 123 4567',
    documento: '77654321',
    lastLogin: '2025-01-30T12:00:00',
    createdAt: '2024-11-20T00:00:00',
    notas: 'Cuenta suspendida por revisión.',
  },
  {
    id: 6,
    fullName: 'Laura Jiménez',
    username: 'ljimenez',
    email: 'laura@beone.co',
    role: 'FINANCIERO',
    status: 'Activo',
    ciudad: 'Medellín',
    telefono: '311 987 6543',
    documento: '42345678',
    lastLogin: '2025-02-27T09:15:00',
    createdAt: '2024-12-01T00:00:00',
    notas: '',
  },
  {
    id: 7,
    fullName: 'Camilo Ríos',
    username: 'crios',
    email: 'camilo@beone.co',
    role: 'SOPORTE',
    status: 'Activo',
    ciudad: 'Bogotá',
    telefono: '317 678 9012',
    documento: '79876543',
    lastLogin: '2025-02-24T14:00:00',
    createdAt: '2025-01-05T00:00:00',
    notas: '',
  },
]

// ─────────────────────────────────────────────────────────
// PERMISOS POR ROL (mock visual)
// ─────────────────────────────────────────────────────────
export const rolePermissions = {
  ADMIN:       ['Acceso total', 'Gestión usuarios', 'Configuración', 'Eliminación', 'Reportes'],
  COMERCIAL:   ['Cotizaciones', 'Clientes', 'Proveedores', 'Propuestas comerciales'],
  SUPERVISOR:  ['Supervisión operacional', 'Reportes', 'Solo lectura general'],
  LOGISTICA:   ['Inventario', 'Montajes', 'Operaciones logísticas', 'Desmontaje'],
  COORDINADOR: ['Eventos en campo', 'Coordinación de equipo', 'Check-in/out'],
  FINANCIERO:  ['Resúmenes financieros', 'Aprobaciones', 'Reportes de facturación'],
  SOPORTE:     ['Solo lectura general', 'Consultas básicas'],
}

// ─────────────────────────────────────────────────────────
// MOCK ACCIONES (historial rápido por usuario)
// ─────────────────────────────────────────────────────────
const userActions = {
  1: ['Creó cotización #COT-2025-042', 'Confirmó evento Ecopetrol', 'Configuró permisos de usuario'],
  2: ['Creó cotización #COT-2025-041', 'Actualizó cliente Bancolombia', 'Envió propuesta Grupo Éxito'],
  3: ['Actualizó inventario castillo XL', 'Registró montaje evento Bavaria', 'Marcó desmontaje completado'],
  4: ['Generó reporte mensual', 'Supervisó operación Medellín', 'Revisó cumplimiento de tareas'],
  5: ['Coordinó evento Cencosud', 'Reportó incidencia en campo', 'Actualizó cronograma'],
  6: ['Aprobó factura #F-2025-018', 'Generó resumen financiero Q1', 'Revisó presupuesto eventos'],
  7: ['Consultó inventario general', 'Revisó cotizaciones pendientes', 'Accedió a reportes'],
}

// ─────────────────────────────────────────────────────────
// COMPOSABLE
// ─────────────────────────────────────────────────────────
export const useUsers = () => {
  const users    = ref([])
  const loading  = ref(false)
  const search       = ref('')
  const rolFiltro    = ref('')
  const statusFiltro = ref('')

  // ── Filtrado reactivo ─────────────────────────────────
  const filteredUsers = computed(() => {
    let result = users.value

    if (search.value.trim()) {
      const q = search.value.toLowerCase().trim()
      result = result.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)    ||
        u.username?.toLowerCase().includes(q)
      )
    }

    if (rolFiltro.value)    result = result.filter(u => u.role   === rolFiltro.value)
    if (statusFiltro.value) result = result.filter(u => u.status === statusFiltro.value)

    return result
  })

  // ── KPIs computados ───────────────────────────────────
  const kpis = computed(() => ({
    total:    users.value.length,
    activos:  users.value.filter(u => u.status === 'Activo').length,
    inactivos:users.value.filter(u => u.status !== 'Activo').length,
    roles:    new Set(users.value.map(u => u.role)).size,
  }))

  // ── Cargar usuarios ───────────────────────────────────
  const loadUsers = async () => {
    loading.value = true
    try {
      // Conectar API aquí:
      // const response = await getUsers()
      // users.value = response.data
      await new Promise(r => setTimeout(r, 600)) // simular latencia
      users.value = mockUsers
    } catch (error) {
      console.error('[useUsers] Error cargando usuarios:', error)
    } finally {
      loading.value = false
    }
  }

  // ── Toggle estado ─────────────────────────────────────
  const toggleStatus = async (usuario) => {
    const newStatus = usuario.status === 'Activo' ? 'Inactivo' : 'Activo'
    const idx = users.value.findIndex(u => u.id === usuario.id)
    if (idx === -1) return

    // Optimistic update
    users.value[idx] = { ...users.value[idx], status: newStatus }

    try {
      // Conectar API aquí:
      // await toggleUserStatus(usuario.id, newStatus)
    } catch (error) {
      // Revertir en caso de error
      users.value[idx] = { ...users.value[idx], status: usuario.status }
      console.error('[useUsers] Error actualizando estado:', error)
    }
  }

  // ── Eliminar usuario ──────────────────────────────────
  const removeUser = async (id) => {
    try {
      // Conectar API aquí:
      // await deleteUserService(id)
      users.value = users.value.filter(u => u.id !== id)
    } catch (error) {
      console.error('[useUsers] Error eliminando usuario:', error)
      throw error
    }
  }

  // ── Actualizar usuario en lista ───────────────────────
  const upsertUser = (usuario) => {
    const idx = users.value.findIndex(u => u.id === usuario.id)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...usuario }
    } else {
      users.value.unshift({ ...usuario, id: Date.now(), createdAt: new Date().toISOString() })
    }
  }

  // ── Tiempo relativo ───────────────────────────────────
  const getTimeAgo = (date) => {
    if (!date) return 'Nunca'
    const now     = new Date()
    const d       = new Date(date)
    const diffMs  = now - d
    const mins    = Math.floor(diffMs / 60000)
    const hours   = Math.floor(mins / 60)
    const days    = Math.floor(hours / 24)
    const months  = Math.floor(days / 30)
    const years   = Math.floor(months / 12)

    if (mins  < 1)  return 'Ahora mismo'
    if (mins  < 60) return `hace ${mins} min`
    if (hours < 24) return `hace ${hours}h`
    if (days  === 1) return 'hace 1 día'
    if (days  < 30) return `hace ${days} días`
    if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`
    return `hace ${years} año${years > 1 ? 's' : ''}`
  }

  // ── Formatear fecha corta ─────────────────────────────
  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  // ── Acciones historial del usuario ────────────────────
  const getUserActions = (id) => userActions[id] ?? []

  return {
    users, loading, search, rolFiltro, statusFiltro,
    filteredUsers, kpis,
    loadUsers, toggleStatus, removeUser, upsertUser,
    getTimeAgo, formatDate, getUserActions,
  }
}
