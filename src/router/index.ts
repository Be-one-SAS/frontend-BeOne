// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout       from '../components/layout/MainLayout.vue'
import LoginPage        from '../views/authentication/LoginPage.vue'
import { useAuth }      from '../composables/useAuth'
import NotFound         from '../views/NotFound.vue'
import MaintenancePage  from '../views/MaintenancePage.vue'

const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

// ─────────────────────────────────────────────────────────
// Imports estáticos (rutas principales — siempre cargadas)
// ─────────────────────────────────────────────────────────
import DashboardPage    from '../views/dashboard/DashboardPage.vue'
import Cotizar          from '../views/admin/Cotizar.vue'
import Reporte          from '../views/operativa/Reporte.vue'
import List             from '../views/users/List.vue'
import VerCotizaciones  from '../views/admin/VerCotizaciones.vue'
import Customer         from '../views/customer/Customer.vue'
import Suppliers        from '../views/suppliers/Suppliers.vue'
import PriceList        from '../views/customer/PriceList.vue'
import Products         from '../views/products/Products.vue'
import ProductsNoPropios from '../views/products/ProductsNoPropios.vue'
import Usuarios         from '../views/admin/Usuarios.vue'
import Tareas           from '../views/admin/Tareas.vue'
import Unauthorized     from '../views/Unauthorized.vue'

const routes = [

  // ── Mantenimiento (pública, intercepta todo cuando está activo) ──
  {
    path: '/maintenance',
    name: 'Maintenance',
    component: MaintenancePage,
    meta: { public: true },
  },

  // ── Sin autorización ──────────────────────────────────
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: Unauthorized,
  },

  // ── Sesión de escaneo (pública, sin auth) ────────────
  {
    path: '/scan/:token',
    name: 'ScanPage',
    component: () => import('../views/inventory/ScanPage.vue'),
    meta: { public: true },
  },

  // ── Encuesta de satisfacción (pública, sin auth) ──────
  {
    path: '/encuesta/:token',
    name: 'EncuestaPublica',
    component: () => import('../views/encuesta/EncuestaPublica.vue'),
    meta: { public: true },
  },

  // ── Registro de turno (pública, sin auth) ─────────────
  {
    path: '/turno/:token',
    name: 'TurnoPublico',
    component: () => import('../views/operativa/TurnoPublico.vue'),
    meta: { public: true },
  },

  // ── Checklist de evento (pública, sin auth) ───────────
  {
    path: '/checklist/evento/:id',
    name: 'ChecklistPublico',
    component: () => import('../views/operativa/ChecklistPublico.vue'),
    meta: { public: true },
  },

  // ── Auth (solo invitados) ─────────────────────────────
  {
    path: '/',
    name: 'Auth',
    component: LoginPage,
    meta: { guestOnly: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { guestOnly: true },
  },

  // ── App protegida ─────────────────────────────────────
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [

      // ── Dashboard ──────────────────────────────────────
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: DashboardPage,
        meta: {
          requiresAuth: true,
          roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR'],
        },
      },

      // ── Comercial ──────────────────────────────────────
      {
        path: 'admin/cotizar/:id?',
        name: 'Cotizar',
        component: Cotizar,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'LIDER', 'COORDINADOR'] },
      },
      {
        path: 'admin/ver-cotizaciones',
        name: 'VerCotizaciones',
        component: VerCotizaciones,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR'] },
      },
      {
        path: 'customer/customer',
        name: 'Clientes',
        component: Customer,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'COORDINADOR'] },
      },
      {
        path: 'suppliers/suppliers',
        name: 'Suppliers',
        component: Suppliers,
        meta: { roles: ['ADMIN'] },
      },
      {
        path: 'customer/price',
        name: 'ListPrice',
        component: PriceList,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'LIDER', 'COORDINADOR'] },
      },

      // ── Productos ──────────────────────────────────────
      {
        path: 'products',
        name: 'Productos',
        component: Products,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR'] },
      },
      {
        path: 'products/no-propios',
        name: 'ProductosNoPropios',
        component: ProductsNoPropios,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR'] },
      },

      // ── Control Operativo ──────────────────────────────
      {
        path: 'admin/control',
        name: 'Control',
        component: () => import('../views/admin/Control.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'LOGISTICO', 'OPERATIVO'] },
      },

      // ── Operativo ──────────────────────────────────────
      {
        path: 'operativa/reporte',
        name: 'Reporte',
        component: Reporte,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'LOGISTICO', 'OPERATIVO'] },
      },
      {
        path: 'operativa/turnos',
        name: 'RegistroTurno',
        component: () => import('../views/operativa/RegistroTurno.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'LOGISTICO', 'OPERATIVO'] },
      },
      {
        path: 'operativa/checkins',
        name: 'CheckIns',
        component: () => import('../views/operativa/CheckIns.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'LOGISTICO', 'OPERATIVO'] },
      },
      {
        path: 'operativa/checkins/admin',
        redirect: '/operativa/checkins',
      },
      {
        path: 'operativa/inventario',
        name: 'Inventario',
        component: () => import('../views/operativa/Inventario.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'SUPERVISOR'] },
      },
      {
        path: 'inventory',
        name: 'InventoryList',
        component: () => import('../views/inventory/List.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'SUPERVISOR'] },
      },
      {
        path: 'inventory/:id',
        name: 'InventoryDetail',
        component: () => import('../views/inventory/Detail.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'SUPERVISOR'] },
      },
      {
        path: 'operativa/montajes',
        name: 'Montajes',
        component: () => import('../views/operativa/Montajes.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'LOGISTICO', 'OPERATIVO'] },
      },
      {
        path: 'operativa/ordenes-compra',
        name: 'OrdenesCompra',
        component: () => import('../views/operativa/OrdenesCompra.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'LOGISTICO', 'LIDER', 'OPERATIVO'] },
      },
      {
        path: 'operativa/equipos',
        redirect: '/admin/control',
      },

      // ── Reportes ───────────────────────────────────────
      {
        path: 'reportes/general',
        name: 'ReporteGeneral',
        component: () => import('../views/reportes/ReporteGeneral.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      },
      {
        path: 'reportes/financiero',
        name: 'ReporteFinanciero',
        component: () => import('../views/reportes/ReporteFinanciero.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      },
      {
        path: 'reportes/operacional',
        name: 'ReporteOperacional',
        component: () => import('../views/reportes/ReporteOperacional.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      },

      // ── Administración ─────────────────────────────────
      {
        path: 'administracion/cotizaciones',
        name: 'AdminCotizaciones',
        component: () => import('../views/administracion/AdminCotizaciones.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      },
      {
        path: 'administracion/dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/administracion/AdminDashboard.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      },
      {
        path: 'administracion/reportes',
        name: 'AdminReportes',
        component: () => import('../views/administracion/AdminReportes.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      },
      {
        path: 'administracion/ordenes-compra',
        name: 'AdminOrdenesCompra',
        component: () => import('../views/administracion/AdminOrdenesCompra.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      },
      {
        path: 'administracion/movimientos',
        name: 'AdminMovimientos',
        component: () => import('../views/administracion/AdminMovimientos.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'] },
      },

      // ── Usuarios ───────────────────────────────────────
      {
        path: 'users/list',
        name: 'UsersList',
        component: List,
        meta: { roles: ['ADMIN'] },
      },
      {
        path: 'admin/usuarios',
        name: 'Usuarios',
        component: Usuarios,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },
      {
        path: 'admin/tareas',
        name: 'Tareas',
        component: Tareas,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR'] },
      },
      {
        path: 'admin/quotation-params',
        name: 'QuotationParams',
        component: () => import('../views/admin/QuotationParams.vue'),
        meta: { roles: ['ADMIN'] },
      },
      // NOTA: /users/roles eliminado — módulo consolidado en /users/list

      // ── Configuración ──────────────────────────────────
      {
        path: 'configuracion',
        name: 'Configuracion',
        component: () => import('../views/configuracion/Configuracion.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },
      {
        path: 'configuracion/unidades-ejecucion',
        name: 'UnidadesEjecucion',
        component: () => import('../views/configuracion/Sedes.vue'),
        meta: { roles: ['ADMIN', 'DIRECCION', 'ADMINISTRADOR'] },
      },
      {
        path: 'materiales',
        name: 'Materiales',
        component: () => import('../views/materiales/Materiales.vue'),
        meta: { roles: ['ADMIN', 'SUPERVISOR', 'COORDINADOR'] },
      },

      // ── Perfil del usuario ──────────────────────────────
      {
        path: 'admin/perfil',
        name: 'Perfil',
        component: () => import('../views/admin/Perfil.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },

  // ── 404 — debe ir al final para capturar cualquier ruta no definida ──
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ─────────────────────────────────────────────────────────
// 🔐 Guard global — Auth + Roles
// useAuth() debe llamarse FUERA del beforeEach para evitar
// que lifecycle hooks internos se registren sin instancia activa
// ─────────────────────────────────────────────────────────
const { isAuthenticated, user } = useAuth()

router.beforeEach((to, _from, next) => {
  // 0a. Modo mantenimiento — redirige todo excepto /maintenance y rutas públicas de operación
  if (MAINTENANCE_MODE && to.name !== 'Maintenance') {
    return next('/maintenance')
  }

  // 0b. Ruta pública (ej: /scan/:token, /checklist/:id) — pasa siempre
  if (to.meta.public) return next()

  // 1. Ruta protegida sin sesión → redirige al login
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next('/login')
  }

  // 2. Ruta de invitado con sesión activa → validar si el token es válido
  if (to.meta.guestOnly && isAuthenticated.value) {
    // Si hay token pero no hay usuario, el token es inválido → limpiar
    if (!user.value) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      return next()
    }
    return next('/dashboard')
  }

  // 3. Validación de roles por ruta
  if (to.meta.roles) {
    const allowedRoles = to.meta.roles as string[]
    const userRole     = user.value?.roles?.[0]

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn(`[Router] Acceso denegado. Roles requeridos: ${allowedRoles.join(', ')}`)
      return next('/unauthorized')
    }
  }

  return next()
})

export default router
