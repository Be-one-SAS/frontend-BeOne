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
    @click="onClick"
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
            <img v-if="user?.avatar" :src="user.avatar" alt="Avatar" class="user-avatar-img" />
            <template v-else>{{ userInitials }}</template>
          </div>
          <div class="user-info">
            <p class="user-name">{{ displayName }}</p>
            <span v-if="isOrgAdmin" class="sede-chip sede-chip--org" title="Nivel organización">🏢 Organización</span>
            <span v-else-if="sedeName" class="sede-chip sede-chip--sede" title="Unidad de Ejecución">📍 {{ sedeName }}</span>
          </div>
        </div>

        <!-- Colapsado: solo avatar centrado -->
        <div v-else key="mini" class="user-avatar-center">
          <div
            class="user-avatar"
            :style="{ background: avatarColor }"
            :title="displayName"
          >
            <img v-if="user?.avatar" :src="user.avatar" alt="Avatar" class="user-avatar-img" />
            <template v-else>{{ userInitials }}</template>
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

    <!-- ── Pin toggle ──────────────────────────────────── -->
    <button
      v-if="sidebarExpanded"
      class="sidebar-pin-btn"
      :class="{ 'sidebar-pin-btn--locked': isLocked }"
      :title="isLocked ? 'Desbloquear menú' : 'Bloquear menú abierto'"
      @click="toggleLock"
    >
      <component :is="isLocked ? Pin : PinOff" :size="13" class="pin-icon" />
      <span class="pin-label">{{ isLocked ? 'Desfijar menú' : 'Fijar menú' }}</span>
    </button>

    <!-- ── Footer: Perfil + Logout ──────────────────────── -->
    <div class="sidebar-footer">
      <button
        class="footer-btn"
        :title="!sidebarExpanded ? 'Mi perfil' : undefined"
        @click="router.push('/admin/perfil')"
      >
        <UserCircle2 class="footer-icon" />
        <Transition name="label-fade">
          <span v-if="sidebarExpanded" class="footer-label">Mi perfil</span>
        </Transition>
      </button>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  LayoutDashboard, TrendingUp, FilePlus, FileText,
  Building2, UserCheck, Handshake, Boxes, Package,
  PackageSearch, Truck, ClipboardList, MapPin,
  Archive, Wrench, Users, BarChart2, Receipt,
  DollarSign, Activity, UserCog, Settings,
  LogOut, CheckSquare, ClipboardCheck, SlidersHorizontal,
  Landmark, TableProperties, FileBarChart, ShoppingCart,
  Clock as ClockIcon, UserCircle2, ListOrdered, Target,
  Pin, PinOff, BookOpen, Gauge, GitBranch,
} from 'lucide-vue-next'
import { useAuth }               from '@/composables/useAuth'
import { useSidebarPermissions, useMobileSidebar } from '@/composables/useSidebarPermissions'
import { useViewAccess }         from '@/composables/useViewAccess'
import MenuItem                  from './MenuItem.vue'

// ── Auth & logout ──────────────────────────────────────
const { user, setLogout }  = useAuth()
const router         = useRouter()

const logoutClearStorange = () => {
  setLogout()
  router.push('/login')
}

// ── Permisos & perfil ──────────────────────────────────
const {
  userRole, canSee, roleBadgeStyle,
  userInitials, avatarColor, displayName,
  sedeName, isOrgAdmin,
} = useSidebarPermissions()

// ── Mobile sidebar state ───────────────────────────────
const { showMobile, close: closeMobile } = useMobileSidebar()

// ── Collapse hover (desktop) ───────────────────────────
const isExpanded = ref(false)
const isLocked = ref(localStorage.getItem('sidebar_locked') === 'true')

const toggleLock = () => {
  isLocked.value = !isLocked.value
  localStorage.setItem('sidebar_locked', isLocked.value)
  if (isLocked.value) isExpanded.value = true
}

const onMouseEnter = () => { isExpanded.value = true }
const onMouseLeave = () => {
  if (!isLocked.value) isExpanded.value = false
}
const onClick = () => {
  if (window.innerWidth >= 768 && window.innerWidth < 1024) {
    isExpanded.value = !isExpanded.value
  } else if (window.innerWidth < 768) {
    closeMobile()
  }
}

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
    viewKey: 'Dashboard',
    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'],
  },

  // ── Grupo: Comercial ──────────────────────────────────
  {
    separator: true,
    icon:  TrendingUp,
    label: 'Dpto Comercial',
    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'],
    children: [
      { label: 'Nueva cotización',  route: '/admin/cotizar',            viewKey: 'Cotizar',            icon: FilePlus,   roles: ['ADMIN', 'ADMINISTRADOR', 'LIDER', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      { label: 'Cotizaciones',      route: '/admin/ver-cotizaciones',   viewKey: 'VerCotizaciones',    icon: FileText,   roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      { label: 'Clientes',          route: '/customer/customer',        viewKey: 'Clientes',           icon: Building2,  roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      { label: 'Clientes directos', route: '/customer/price',           viewKey: 'ListPrice',          icon: UserCheck,  roles: ['ADMIN', 'ADMINISTRADOR', 'LIDER', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      { label: 'Proveedores',       route: '/suppliers/suppliers',      viewKey: 'Suppliers',          icon: Handshake,  roles: ['ADMIN'] },
    ],
  },
  {
    separator: false,
    icon:  Boxes,
    label: 'Productos',
    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'],
    children: [
      { label: 'Productos propios',   route: '/products',            viewKey: 'Productos',          icon: Package,       roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      { label: 'Productos externos',  route: '/products/no-propios', viewKey: 'ProductosNoPropios', icon: PackageSearch, roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
    ],
  },

  // ── Grupo: Operativo ──────────────────────────────────
  {
    separator: true,
    icon:  Truck,
    label: 'Dpto Operativo',
    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'],
    children: [
      { label: 'Control',             route: '/admin/control',        viewKey: 'Control',        icon: ClipboardCheck, roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'] },
      { label: 'Reporte diario',      route: '/operativa/reporte',    viewKey: 'Reporte',         icon: ClipboardList,  roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'] },
      { label: 'Registro de turno',   route: '/operativa/turnos',     viewKey: 'RegistroTurno',   icon: ClockIcon,      roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICA', 'LOGISTICO', 'OPERATIVO'] },
      { label: 'Check-ins',           route: '/operativa/checkins',        viewKey: 'CheckIns',   icon: MapPin,    roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'] },
      { label: 'Inventario',          route: '/inventory',            viewKey: 'InventoryList',   icon: Archive,        roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'SUPERVISOR'] },
      { label: 'Montajes',            route: '/operativa/montajes',        viewKey: 'Montajes',   icon: Wrench,        roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'] },
      { label: 'Órdenes de Compra',   route: '/operativa/ordenes-compra',  viewKey: 'OrdenesCompra', icon: ShoppingCart,  roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO', 'LIDER'] },
    ],
  },
  {
    separator: false,
    icon:  BarChart2,
    label: 'Reportes',
    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'],
    children: [
      { label: 'Cuadro de costos', route: '/reportes/general',     viewKey: 'ReporteGeneral',     icon: Receipt,     roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      { label: 'Financiero',      route: '/reportes/financiero',  viewKey: 'ReporteFinanciero',  icon: DollarSign,  roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      { label: 'Operacional',     route: '/reportes/operacional', viewKey: 'ReporteOperacional', icon: Activity,    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
    ],
  },

  // ── Grupo: Administración ─────────────────────────────
  {
    separator: true,
    icon:  Landmark,
    label: 'Administración',
    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'],
    children: [
      { label: 'Eventos',              route: '/administracion/cotizaciones',   viewKey: 'AdminCotizaciones',  icon: TableProperties, roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      { label: 'Dashboard Financiero', route: '/administracion/dashboard',     viewKey: 'AdminDashboard',      icon: BarChart2,       roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      { label: 'Movimientos',          route: '/administracion/movimientos',   viewKey: 'AdminMovimientos',    icon: ListOrdered,     roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      { label: 'Reportes',             route: '/administracion/reportes',      viewKey: 'AdminReportes',       icon: FileBarChart,    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      { label: 'Órdenes de Compra',    route: '/administracion/ordenes-compra', viewKey: 'AdminOrdenesCompra', icon: ShoppingCart,    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
    ],
  },

  // ── Desafíos comerciales — visible también para LIDER/SUPERVISOR,
  // por eso va como grupo aparte y no dentro de "Administración" ──
  {
    separator: false,
    icon:  Target,
    label: 'Desafíos Comerciales',
    route: '/administracion/desafios-comerciales',
    viewKey: 'DesafiosComerciales',
    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR'],
  },

  // ── Ejecutivos de cuenta — visible también para LIDER, por eso va
  // como grupo aparte y no dentro de "Administración" ──
  {
    separator: false,
    icon:  Gauge,
    label: 'Ejecutivos de Cuenta',
    route: '/administracion/ejecutivos-cuenta',
    viewKey: 'EjecutivosCuenta',
    roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'EJECUTIVO', 'EJECUTIVO_CUENTA'],
  },

  // ── Grupo: Admin ──────────────────────────────────────
  {
    separator: true,
    icon:  Users,
    label: 'Usuarios',
    route: '/users/list',
    viewKey: 'UsersList',
    roles: ['ADMIN'],
  },
  {
    separator: false,
    icon:  Settings,
    label: 'Configuración',
    roles: ['ADMIN', 'ADMINISTRADOR'],
    children: [
      { label: 'General',               route: '/configuracion',          viewKey: 'Configuracion',   icon: Settings,          roles: ['ADMIN', 'ADMINISTRADOR'] },
      { label: 'Parámetros cotización', route: '/admin/quotation-params', viewKey: 'QuotationParams', icon: SlidersHorizontal, roles: ['ADMIN'] },
      { label: 'Comisiones',            route: '/configuracion/comisiones', viewKey: 'ComisionesReporte', icon: DollarSign,     roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR'] },
      { label: 'Documentación',         route: '/configuracion/documentacion', viewKey: 'Documentacion', icon: BookOpen,        roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR'] },
      { label: 'Equipo',                route: '/configuracion/equipo',     viewKey: 'Equipo',           icon: GitBranch,       roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR'] },
    ],
  },
]

/**
 * Menú filtrado por rol del usuario.
 * Solo muestra ítems donde el usuario tiene acceso,
 * y filtra los hijos sin acceso.
 *
 * Los ítems hoja (con `viewKey`) resuelven sus roles contra la config
 * dinámica editable desde /configuracion (getViewRoles) cuando existe,
 * y caen de vuelta a `roles` estático si no está gestionada ahí o la
 * config no cargó todavía. Los headers de grupo (sin `viewKey`) siempre
 * usan su `roles` estático — son solo agrupación visual, no vistas propias.
 */
const { getViewRoles, ensureLoaded: ensureViewAccessLoaded } = useViewAccess()
onMounted(ensureViewAccessLoaded) // defensivo — el router guard ya la carga antes de esto en el flujo normal
const effectiveRoles = (item) => (item.viewKey && getViewRoles(item.viewKey)) || item.roles

const visibleMenuItems = computed(() =>
  ALL_MENU_ITEMS
    .filter(item => canSee(effectiveRoles(item)))
    .map(item => ({
      ...item,
      children: item.children
        ?.filter(child => canSee(effectiveRoles(child)))
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

  box-shadow: 0 1px 4px rgba(39,200,216, .06), 0 4px 16px rgba(39,200,216, .08);
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
  background: #27C8D8;
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
  background: #F0FAFB;
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
  overflow: hidden;
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  background: #F0FAFB;
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

/* ── Pin toggle ──────────────────────────────────────── */
.sidebar-pin-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #94A3B8;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition: background 0.15s ease, color 0.15s ease;
  margin-bottom: 4px;
}
.sidebar-pin-btn:hover {
  background: #F0FAFB;
  color: #27C8D8;
}
.sidebar-pin-btn--locked {
  color: #27C8D8;
}
.sidebar-pin-btn--locked:hover {
  color: #B91C1C;
}
.pin-icon {
  flex-shrink: 0;
}
.pin-label {
  font-size: 12px;
}

/* ── Footer: logout ──────────────────────────────────── */
.sidebar-footer {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #F0FAFB;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition: background 0.15s ease, color 0.15s ease;
}
.footer-btn:hover {
  background: #E0F9FA;
  color: #27C8D8;
}
.footer-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.footer-label { font-size: 13px; }

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

/* ── Sede chip ───────────────────────────────────────── */
.sede-chip {
  display: inline-block;
  font-size: 9px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 2px 7px;
  border-radius: 99px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
  line-height: 1.5;
}
.sede-chip--sede { background: #E0F9FA; color: #27C8D8; }
.sede-chip--org  { background: #EDE9FE; color: #7C3AED; }

/* ── Tablet touch toggle hint ────────────────────────── */
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar { cursor: pointer; }
}

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
