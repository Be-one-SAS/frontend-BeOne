import { ref, computed } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { useAuth } from './useAuth'

// ─────────────────────────────────────────────────────────────────
// MOBILE SIDEBAR STATE — singleton global para compartir entre
// Sidebar.vue y cualquier componente que quiera togglearlo (Topbar, etc.)
// ─────────────────────────────────────────────────────────────────
export const useMobileSidebar = createGlobalState(() => {
  const showMobile = ref(false)
  const toggle     = () => { showMobile.value = !showMobile.value }
  const close      = () => { showMobile.value = false }
  return { showMobile, toggle, close }
})

// ─────────────────────────────────────────────────────────────────
// SIDEBAR PERMISSIONS — control de visibilidad por rol
// ─────────────────────────────────────────────────────────────────

/** Mapa de estilos inline para el badge de cada rol */
const ROLE_BADGE_STYLES = {
  ADMIN:         'background:#FEE2E2;color:#B91C1C',
  ADMINISTRADOR: 'background:#CCEFF2;color:#27C8D8',
  DIRECCION:     'background:#EDE9FE;color:#7C3AED',
  LIDER:         'background:#DCFCE7;color:#16A34A',
  SUPERVISOR:    'background:#FEF3C7;color:#B45309',
  COORDINADOR:   'background:#FFEDD5;color:#C2410C',
  LOGISTICO:     'background:#F1F5F9;color:#64748B',
}

/** Colores de avatar por letra inicial del username */
const AVATAR_COLORS = [
  '#27C8D8', '#7C3AED', '#B45309', '#B91C1C',
  '#16A34A', '#27C8D8', '#C2410C',
]

export const useSidebarPermissions = () => {
  const { user } = useAuth()

  /** Rol activo del usuario autenticado */
  const userRole = computed(() => user.value?.roles?.[0] ?? null)

  /**
   * Verifica si el usuario puede ver un ítem de menú.
   * Si roles está vacío o es undefined → siempre visible.
   * @param {string[]} roles
   */
  const canSee = (roles) => {
    if (!roles || roles.length === 0) return true
    // VISOR es de solo lectura pero ve todo el menú, igual que ADMIN.
    if (userRole.value === 'VISOR') return true
    const role = userRole.value ?? 'ADMINISTRADOR'
    return roles.includes(role)
  }

  /** Estilo CSS inline del badge del rol actual */
  const roleBadgeStyle = computed(() =>
    ROLE_BADGE_STYLES[userRole.value] ?? ROLE_BADGE_STYLES.SOPORTE
  )

  /**
   * Iniciales del usuario para el avatar.
   * Usa fullName si existe en el objeto user, sino username.
   */
  const userInitials = computed(() => {
    const name = user.value?.fullName ?? user.value?.username ?? ''
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  })

  /** Color del avatar determinístico según el primer carácter del username */
  const avatarColor = computed(() => {
    const name = user.value?.username ?? ''
    const idx  = (name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx]
  })

  /** Nombre a mostrar en el sidebar (fullName → username → email) */
  const displayName = computed(() =>
    user.value?.fullName ?? user.value?.username ?? user.value?.email ?? '—'
  )

  /** Nombre de la sede activa, o null si es nivel organización */
  const sedeName = computed(() => user.value?.sedeName ?? null)

  /** true cuando el usuario es admin de nivel organización (sin sede) */
  const isOrgAdmin = computed(() =>
    user.value?.roles?.includes('ADMIN') && !user.value?.sedeId
  )

  return {
    userRole,
    canSee,
    roleBadgeStyle,
    userInitials,
    avatarColor,
    displayName,
    sedeName,
    isOrgAdmin,
  }
}
