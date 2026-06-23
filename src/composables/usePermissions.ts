// src/composables/usePermissions.ts
import { computed } from 'vue'
import { useAuth } from './useAuth'

export type AppRole =
  | 'ADMIN'
  | 'ADMINISTRADOR'
  | 'DIRECCION'
  | 'LIDER'
  | 'SUPERVISOR'
  | 'COORDINADOR'
  | 'LOGISTICO'
  | 'OPERATIVO'

export type AppModule =
  | 'cotizaciones'
  | 'clientes'
  | 'productos'
  | 'reservas'
  | 'inventario'
  | 'control'
  | 'materiales'
  | 'reportes'
  | 'usuarios'
  | 'dashboard'
  | 'tareas'

type AccessLevel = 'FULL' | 'READ' | 'OWN' | 'NONE'

const PERMISSIONS: Record<AppModule, Record<AppRole, AccessLevel>> = {
  cotizaciones: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'FULL', SUPERVISOR: 'READ', COORDINADOR: 'OWN', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  clientes: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'FULL', SUPERVISOR: 'NONE', COORDINADOR: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  productos: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'READ', SUPERVISOR: 'READ', COORDINADOR: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  reservas: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'FULL', SUPERVISOR: 'FULL', COORDINADOR: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  inventario: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'NONE', SUPERVISOR: 'FULL', COORDINADOR: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  control: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'NONE',
    LIDER: 'NONE', SUPERVISOR: 'FULL', COORDINADOR: 'FULL', LOGISTICO: 'FULL', OPERATIVO: 'FULL',
  },
  materiales: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'NONE',
    LIDER: 'NONE', SUPERVISOR: 'FULL', COORDINADOR: 'FULL', LOGISTICO: 'FULL', OPERATIVO: 'FULL',
  },
  reportes: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'FULL',
    LIDER: 'NONE', SUPERVISOR: 'NONE', COORDINADOR: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  usuarios: {
    ADMIN: 'FULL', ADMINISTRADOR: 'NONE', DIRECCION: 'NONE',
    LIDER: 'NONE', SUPERVISOR: 'NONE', COORDINADOR: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  dashboard: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'FULL',
    LIDER: 'FULL', SUPERVISOR: 'FULL', COORDINADOR: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  tareas: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'FULL', SUPERVISOR: 'FULL', COORDINADOR: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
}

export const usePermissions = () => {
  const { user } = useAuth()

  const activeRole = computed((): AppRole => {
    const role = user.value?.roles?.[0]
    if (!role) return 'ADMINISTRADOR'
    return role as AppRole
  })

  const getAccess = (module: AppModule): AccessLevel =>
    PERMISSIONS[module]?.[activeRole.value] ?? 'NONE'

  const hasRole = (role: AppRole | AppRole[]): boolean =>
    Array.isArray(role) ? role.includes(activeRole.value) : activeRole.value === role

  const canAccess = (module: AppModule): boolean =>
    getAccess(module) !== 'NONE'

  const canCreate = (module: AppModule): boolean =>
    getAccess(module) === 'FULL'

  const canEdit = (module: AppModule): boolean =>
    getAccess(module) === 'FULL'

  const canDelete = (module: AppModule): boolean =>
    getAccess(module) === 'FULL'

  const isReadOnly = (module: AppModule): boolean =>
    getAccess(module) === 'READ'

  const isOwnOnly = (module: AppModule): boolean =>
    getAccess(module) === 'OWN'

  return {
    activeRole,
    hasRole,
    canAccess,
    canCreate,
    canEdit,
    canDelete,
    isReadOnly,
    isOwnOnly,
  }
}
