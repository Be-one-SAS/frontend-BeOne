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
  | 'EJECUTIVO'
  | 'EJECUTIVO_CUENTA'
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
    LIDER: 'FULL', SUPERVISOR: 'READ', COORDINADOR: 'OWN', EJECUTIVO: 'OWN', EJECUTIVO_CUENTA: 'OWN', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  clientes: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'FULL', SUPERVISOR: 'NONE', COORDINADOR: 'NONE', EJECUTIVO: 'NONE', EJECUTIVO_CUENTA: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  productos: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'READ', SUPERVISOR: 'READ', COORDINADOR: 'NONE', EJECUTIVO: 'NONE', EJECUTIVO_CUENTA: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  reservas: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'FULL', SUPERVISOR: 'FULL', COORDINADOR: 'NONE', EJECUTIVO: 'NONE', EJECUTIVO_CUENTA: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  inventario: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'NONE', SUPERVISOR: 'FULL', COORDINADOR: 'NONE', EJECUTIVO: 'NONE', EJECUTIVO_CUENTA: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  control: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'NONE',
    LIDER: 'NONE', SUPERVISOR: 'FULL', COORDINADOR: 'FULL', EJECUTIVO: 'FULL', EJECUTIVO_CUENTA: 'FULL', LOGISTICO: 'FULL', OPERATIVO: 'FULL',
  },
  materiales: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'NONE',
    LIDER: 'NONE', SUPERVISOR: 'FULL', COORDINADOR: 'FULL', EJECUTIVO: 'FULL', EJECUTIVO_CUENTA: 'FULL', LOGISTICO: 'FULL', OPERATIVO: 'FULL',
  },
  reportes: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'FULL',
    LIDER: 'NONE', SUPERVISOR: 'NONE', COORDINADOR: 'NONE', EJECUTIVO: 'NONE', EJECUTIVO_CUENTA: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  usuarios: {
    ADMIN: 'FULL', ADMINISTRADOR: 'NONE', DIRECCION: 'NONE',
    LIDER: 'NONE', SUPERVISOR: 'NONE', COORDINADOR: 'NONE', EJECUTIVO: 'NONE', EJECUTIVO_CUENTA: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  dashboard: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'FULL',
    LIDER: 'FULL', SUPERVISOR: 'FULL', COORDINADOR: 'NONE', EJECUTIVO: 'NONE', EJECUTIVO_CUENTA: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
  tareas: {
    ADMIN: 'FULL', ADMINISTRADOR: 'FULL', DIRECCION: 'READ',
    LIDER: 'FULL', SUPERVISOR: 'FULL', COORDINADOR: 'NONE', EJECUTIVO: 'NONE', EJECUTIVO_CUENTA: 'NONE', LOGISTICO: 'NONE', OPERATIVO: 'NONE',
  },
}

// Orden de permisividad para fusionar el acceso de varios roles de un mismo
// usuario — modelo RBAC aditivo estándar: los roles SUMAN capacidades, nunca
// las quitan. Si dos roles dan niveles distintos para el mismo módulo, gana
// el más permisivo.
const ACCESS_RANK: Record<AccessLevel, number> = { NONE: 0, READ: 1, OWN: 2, FULL: 3 }

export const usePermissions = () => {
  const { user } = useAuth()

  const activeRoles = computed((): AppRole[] => {
    const roles = user.value?.roles
    if (!roles?.length) return ['ADMINISTRADOR']
    return roles as AppRole[]
  })

  const getAccess = (module: AppModule): AccessLevel =>
    activeRoles.value.reduce<AccessLevel>((best, role) => {
      const level = PERMISSIONS[module]?.[role] ?? 'NONE'
      return ACCESS_RANK[level] > ACCESS_RANK[best] ? level : best
    }, 'NONE')

  const hasRole = (role: AppRole | AppRole[]): boolean =>
    Array.isArray(role)
      ? role.some((r) => activeRoles.value.includes(r))
      : activeRoles.value.includes(role)

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
    activeRoles,
    hasRole,
    canAccess,
    canCreate,
    canEdit,
    canDelete,
    isReadOnly,
    isOwnOnly,
  }
}
