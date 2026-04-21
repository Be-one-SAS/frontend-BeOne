<template>
  <!-- ── Backdrop mobile ──────────────────────────────── -->
  <Transition name="backdrop-fade">
    <div
      v-if="showMobile"
      class="mobile-backdrop"
      @click="closeMobile"
    />
  </Transition>

  <!-- ── Aside principal ──────────────────────────────── -->
  <aside
    class="sidebar"
    :class="{
      'sidebar--expanded': sidebarExpanded,
      'sidebar--mobile-open': showMobile,
    }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >

    <!-- ── Logo ──────────────────────────────────────── -->
    <div class="sidebar-logo">
      <Transition name="logo-switch" mode="out-in">
        <div v-if="sidebarExpanded" key="full" class="logo-full">
          <img src="/assets/logo.png" alt="BeOne" class="logo-img" />
        </div>
        <div v-else key="iso" class="logo-iso">
          <span>B</span>
        </div>
      </Transition>
    </div>

    <!-- ── Perfil del usuario ─────────────────────────── -->
    <div class="user-section">
      <Transition name="profile-expand" mode="out-in">

        <!-- Expandido: card completa -->
        <div v-if="sidebarExpanded" key="full" class="user-card">
          <div class="user-avatar" :style="{ background: avatarColor }">
            {{ userInitials }}
          </div>
          <div class="user-info">
            <p class="user-name">{{ displayName }}</p>
            <span class="user-role-badge" :style="roleBadgeStyle">
              {{ userRole ?? 'Sin rol' }}
            </span>
          </div>
        </div>

        <!-- Colapsado: solo avatar centrado -->
        <div v-else key="mini" class="user-avatar-center">
          <div
            class="user-avatar"
            :style="{ background: avatarColor }"
            :title="displayName"
          >
            {{ userInitials }}
          </div>
        </div>

      </Transition>
    </div>

    <!-- ── Separador ──────────────────────────────────── -->
    <div class="nav-sep" />

    <!-- ── Navegación ────────────────────────────────── -->
    <nav class="sidebar-nav">
      <template v-for="(item, index) in visibleMenuItems" :key="item.label">

        <!-- Separador de grupo -->
        <div
          v-if="item.separator && index > 0"
          class="nav-sep nav-sep--group"
        />

        <MenuItem
          :icon="item.icon"
          :label="item.label"
          :route="item.route ?? null"
          :items="item.children ?? []"
          :is-open="openMenu === item.label"
          :is-expanded="sidebarExpanded"
          @toggle="toggleMenu(item.label)"
        />

      </template>
    </nav>

    <!-- ── Logout ─────────────────────────────────────── -->
    <div class="sidebar-footer">
      <button
        class="logout-btn"
        :title="!sidebarExpanded ? 'Cerrar sesión' : undefined"
        @click="logoutClearStorange"
      >
        <LogOut class="logout-icon" />
        <Transition name="label-fade">
          <span v-if="sidebarExpanded" class="logout-label">Cerrar sesión</span>
        </Transition>
      </button>
    </div>

  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  LayoutDashboard, TrendingUp, FilePlus, FileText,
  Building2, UserCheck, Handshake, Boxes, Package,
  PackageSearch, Truck, ClipboardList, MapPin,
  Archive, Wrench, Users, BarChart2, PieChart,
  DollarSign, Activity, UserCog, Settings,
  LogOut, CheckSquare, ClipboardCheck, SlidersHorizontal,
} from 'lucide-vue-next'
import { useAuth }               from '@/composables/useAuth'
import { useSidebarPermissions, useMobileSidebar } from '@/composables/useSidebarPermissions'
import MenuItem                  from './MenuItem.vue'

// ── Auth & logout ──────────────────────────────────────
const { setLogout }  = useAuth()
const router         = useRouter()

const logoutClearStorange = () => {
  setLogout()
  router.push('/login')
}

// ── Permisos & perfil ──────────────────────────────────
const {
  userRole, canSee, roleBadgeStyle,
  userInitials, avatarColor, displayName,
} = useSidebarPermissions()

// ── Mobile sidebar state ───────────────────────────────
const { showMobile, close: closeMobile } = useMobileSidebar()

// ── Collapse hover (desktop) ───────────────────────────
const isExpanded = ref(false)

const onMouseEnter = () => { isExpanded.value = true }
const onMouseLeave = () => { isExpanded.value = false }

/** En mobile siempre muestra expandido; en desktop depende del hover */
const sidebarExpanded = computed(() => isExpanded.value || showMobile.value)

// ── Accordion de submenús ──────────────────────────────
const openMenu = ref(null)

const toggleMenu = (label) => {
  openMenu.value = openMenu.value === label ? null : label
}

// ── Definición del menú completo con roles ─────────────
const ALL_MENU_ITEMS = [
  // ── Grupo: Principal
  {
    separator: false,
    icon:  LayoutDashboard,
    label: 'Dashboard',
    route: '/dashboard',
    roles: ['ADMIN', 'COMERCIAL', 'SUPERVISOR', 'LOGISTICA', 'COORDINADOR', 'FINANCIERO', 'SOPORTE'],
  },

  // ── Grupo: Comercial ──────────────────────────────────
  {
    separator: true,
    icon:  TrendingUp,
    label: 'Dpto Comercial',
    roles: ['ADMIN', 'COMERCIAL', 'SUPERVISOR'],
    children: [
      { label: 'Nueva cotización',  route: '/admin/cotizar',            icon: FilePlus,   roles: ['ADMIN', 'COMERCIAL'] },
      { label: 'Cotizaciones',      route: '/admin/ver-cotizaciones',   icon: FileText,   roles: ['ADMIN', 'COMERCIAL', 'SUPERVISOR'] },
      { label: 'Clientes',          route: '/customer/customer',        icon: Building2,  roles: ['ADMIN', 'COMERCIAL'] },
      { label: 'Clientes directos', route: '/customer/price',           icon: UserCheck,  roles: ['ADMIN', 'COMERCIAL'] },
      { label: 'Proveedores',       route: '/suppliers/suppliers',      icon: Handshake,  roles: ['ADMIN'] },
    ],
  },
  {
    separator: false,
    icon:  Boxes,
    label: 'Productos',
    roles: ['ADMIN', 'COMERCIAL', 'LOGISTICA'],
    children: [
      { label: 'Productos propios',   route: '/products',           icon: Package,       roles: ['ADMIN', 'LOGISTICA'] },
      { label: 'Productos externos',  route: '/products/no-propios',icon: PackageSearch, roles: ['ADMIN', 'LOGISTICA'] },
    ],
  },

  // ── Grupo: Operativo ──────────────────────────────────
  {
    separator: true,
    icon:  Truck,
    label: 'Dpto Operativo',
    roles: ['ADMIN', 'COMERCIAL', 'SUPERVISOR', 'LOGISTICA', 'COORDINADOR'],
    children: [
      { label: 'Control',             route: '/admin/control',        icon: ClipboardCheck, roles: ['ADMIN', 'COMERCIAL', 'SUPERVISOR'] },
      { label: 'Reporte diario',      route: '/operativa/reporte',    icon: ClipboardList,  roles: ['ADMIN', 'SUPERVISOR', 'LOGISTICA'] },
      { label: 'Check-ins',           route: '/operativa/checkins',   icon: MapPin,         roles: ['ADMIN', 'LOGISTICA', 'COORDINADOR'] },
      { label: 'Inventario',          route: '/inventory',            icon: Archive,        roles: ['ADMIN', 'SUPERVISOR', 'LOGISTICA'] },
      { label: 'Montajes',            route: '/operativa/montajes',   icon: Wrench,         roles: ['ADMIN', 'LOGISTICA', 'COORDINADOR'] },
      { label: 'Asignación equipos',  route: '/operativa/equipos',    icon: Users,          roles: ['ADMIN', 'SUPERVISOR', 'COORDINADOR'] },
    ],
  },
  {
    separator: false,
    icon:  BarChart2,
    label: 'Reportes',
    roles: ['ADMIN', 'SUPERVISOR', 'FINANCIERO'],
    children: [
      { label: 'Resumen general', route: '/reportes/general',     icon: PieChart,    roles: ['ADMIN', 'SUPERVISOR', 'FINANCIERO'] },
      { label: 'Financiero',      route: '/reportes/financiero',  icon: DollarSign,  roles: ['ADMIN', 'SUPERVISOR', 'FINANCIERO'] },
      { label: 'Operacional',     route: '/reportes/operacional', icon: Activity,    roles: ['ADMIN', 'SUPERVISOR'] },
    ],
  },

  // ── Grupo: Admin ──────────────────────────────────────
  {
    separator: true,
    icon:  UserCog,
    label: 'Usuarios',
    roles: ['ADMIN', 'COMERCIAL'],
    children: [
      { label: 'Gestión de usuarios',     route: '/users/list',              icon: Users,              roles: ['ADMIN'] },
      { label: 'Usuarios',               route: '/admin/usuarios',          icon: UserCog,            roles: ['ADMIN', 'COMERCIAL'] },
      { label: 'Tareas',                 route: '/admin/tareas',            icon: CheckSquare,        roles: ['ADMIN', 'COMERCIAL'] },
      { label: 'Parámetros cotización',  route: '/admin/quotation-params',  icon: SlidersHorizontal,  roles: ['ADMIN'] },
    ],
  },
  {
    separator: false,
    icon:  Settings,
    label: 'Configuración',
    route: '/configuracion',
    roles: ['ADMIN'],
  },
]

/**
 * Menú filtrado por rol del usuario.
 * Solo muestra ítems donde el usuario tiene acceso,
 * y filtra los hijos sin acceso.
 */
const visibleMenuItems = computed(() =>
  ALL_MENU_ITEMS
    .filter(item => canSee(item.roles))
    .map(item => ({
      ...item,
      children: item.children
        ?.filter(child => canSee(child.roles))
        ?? [],
    }))
    // Omitir ítems de grupo vacío (parent sin hijos visibles y sin ruta)
    .filter(item => item.route || item.children?.length > 0)
)
</script>

<style scoped>
/* ── Backdrop mobile ─────────────────────────────────── */
.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 26, 46, 0.35);
  backdrop-filter: blur(2px);
  z-index: 30;
}

/* ── Aside base ──────────────────────────────────────── */
.sidebar {
  /* Collapsed: 64px */
  width: 64px;
  flex-shrink: 0;

  background: #FFFFFF;
  border-radius: 0 20px 20px 0;
  padding: 20px 10px;

  display: flex;
  flex-direction: column;
  gap: 0;

  box-shadow: 0 1px 4px rgba(5, 78, 175, .06), 0 4px 16px rgba(5, 78, 175, .08);
  height: 100vh;
  position: sticky;
  top: 0;
  overflow: hidden;

  transition: width 0.25s ease;
  z-index: 40;
}

.sidebar--expanded {
  width: 220px;
}

/* ── Logo ────────────────────────────────────────────── */
.sidebar-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 2px;
  margin-bottom: 20px;
  min-height: 36px;
}

.logo-full {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 0 4px;
}

.logo-img {
  max-width: 100px;
  max-height: 32px;
  object-fit: contain;
}

.logo-iso {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #054EAF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif;
  flex-shrink: 0;
}

/* ── Perfil usuario ──────────────────────────────────── */
.user-section {
  margin-bottom: 4px;
  min-height: 52px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 2px;
  padding: 10px 10px;
  background: #EBF3FC;
  border-radius: 12px;
  overflow: hidden;
}

.user-avatar-center {
  display: flex;
  justify-content: center;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  color: #0F172A;
  font-family: 'Inter', sans-serif;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 1px 7px;
  border-radius: 99px;
  white-space: nowrap;
}

/* ── Separadores ─────────────────────────────────────── */
.nav-sep {
  height: 1px;
  background: #EBF3FC;
  margin: 8px 4px;
}

.nav-sep--group {
  margin: 10px 4px;
}

/* ── Navegación ──────────────────────────────────────── */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
  /* Scroll suave sin scrollbar visible */
  scrollbar-width: none;
}

.sidebar-nav::-webkit-scrollbar { display: none; }

/* ── Footer: logout ──────────────────────────────────── */
.sidebar-footer {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #EBF3FC;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #EF4444;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition: background 0.15s ease;
}

.logout-btn:hover {
  background: #FEE2E2;
}

.logout-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.logout-label {
  font-size: 13px;
}

/* ── Transición label-fade ───────────────────────────── */
.label-fade-enter-active { transition: opacity 0.15s ease 0.08s; }
.label-fade-leave-active  { transition: opacity 0.08s ease; }
.label-fade-enter-from,
.label-fade-leave-to      { opacity: 0; }

/* ── Transición logo-switch ──────────────────────────── */
.logo-switch-enter-active { transition: opacity 0.15s ease 0.05s; }
.logo-switch-leave-active  { transition: opacity 0.1s ease; }
.logo-switch-enter-from,
.logo-switch-leave-to      { opacity: 0; }

/* ── Transición profile ──────────────────────────────── */
.profile-expand-enter-active { transition: opacity 0.15s ease 0.05s; }
.profile-expand-leave-active  { transition: opacity 0.1s ease; }
.profile-expand-enter-from,
.profile-expand-leave-to      { opacity: 0; }

/* ── Transición backdrop ─────────────────────────────── */
.backdrop-fade-enter-active { transition: opacity 0.2s ease; }
.backdrop-fade-leave-active  { transition: opacity 0.2s ease; }
.backdrop-fade-enter-from,
.backdrop-fade-leave-to      { opacity: 0; }

/* ── Mobile ──────────────────────────────────────────── */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    left: -230px;
    top: 0;
    bottom: 0;
    height: 100dvh;
    width: 220px !important; /* siempre ancho completo en mobile */
    border-radius: 0 20px 20px 0;
    transition: left 0.25s ease;
  }

  .sidebar--mobile-open {
    left: 0;
  }
}
</style>
