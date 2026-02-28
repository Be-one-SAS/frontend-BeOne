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
  ADMIN:       'background:#FEE2E2;color:#B91C1C',
  COMERCIAL:   'background:#DBEAFE;color:#1D4ED8',
  SUPERVISOR:  'background:#EDE9FE;color:#7C3AED',
  LOGISTICA:   'background:#DCFCE7;color:#16A34A',
  COORDINADOR: 'background:#FEF3C7;color:#B45309',
  FINANCIERO:  'background:#FFEDD5;color:#C2410C',
  SOPORTE:     'background:#F1F5F9;color:#64748B',
}

/** Colores de avatar por letra inicial del username */
const AVATAR_COLORS = [
  '#054EAF', '#7C3AED', '#B45309', '#B91C1C',
  '#16A34A', '#0891B2', '#C2410C',
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
    if (!userRole.value) return false
    return roles.includes(userRole.value)
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

  return {
    userRole,
    canSee,
    roleBadgeStyle,
    userInitials,
    avatarColor,
    displayName,
  }
}
