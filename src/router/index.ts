// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout       from '../components/layout/MainLayout.vue'
import LoginPage        from '../views/authentication/LoginPage.vue'
import { useAuth }      from '../composables/useAuth'
import { useViewAccess } from '../composables/useViewAccess'
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
          roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'],
        },
      },

      // ── Comercial ──────────────────────────────────────
      {
        path: 'admin/cotizar/:id?',
        name: 'Cotizar',
        component: Cotizar,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'LIDER', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      },
      {
        path: 'admin/ver-cotizaciones',
        name: 'VerCotizaciones',
        component: VerCotizaciones,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      },
      {
        path: 'customer/customer',
        name: 'Clientes',
        component: Customer,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
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
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'LIDER', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      },

      // ── Productos ──────────────────────────────────────
      {
        path: 'products',
        name: 'Productos',
        component: Products,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      },
      {
        path: 'products/no-propios',
        name: 'ProductosNoPropios',
        component: ProductsNoPropios,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
      },

      // ── Control Operativo ──────────────────────────────
      {
        path: 'admin/control',
        name: 'Control',
        component: () => import('../views/admin/Control.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'] },
      },

      // ── Operativo ──────────────────────────────────────
      {
        path: 'operativa/reporte',
        name: 'Reporte',
        component: Reporte,
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'] },
      },
      {
        path: 'operativa/turnos',
        name: 'RegistroTurno',
        component: () => import('../views/operativa/RegistroTurno.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'] },
      },
      {
        path: 'operativa/checkins',
        name: 'CheckIns',
        component: () => import('../views/operativa/CheckIns.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'] },
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
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'OPERATIVO'] },
      },
      {
        path: 'operativa/ordenes-compra',
        name: 'OrdenesCompra',
        component: () => import('../views/operativa/OrdenesCompra.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'LIDER', 'OPERATIVO'] },
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
      {
        path: 'administracion/desafios-comerciales',
        name: 'DesafiosComerciales',
        component: () => import('../views/administracion/DesafiosComerciales.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR'] },
      },
      {
        path: 'administracion/ejecutivos-cuenta',
        name: 'EjecutivosCuenta',
        component: () => import('../views/administracion/EjecutivosCuenta.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
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
        meta: { roles: ['ADMIN', 'DIRECCION', 'ADMINISTRADOR', 'LIDER', 'SUPERVISOR'] },
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
        path: 'configuracion/comisiones',
        name: 'ComisionesReporte',
        component: () => import('../views/configuracion/Comisiones.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR'] },
      },
      {
        path: 'configuracion/documentacion',
        name: 'Documentacion',
        component: () => import('../views/configuracion/Documentacion.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR'] },
      },
      {
        path: 'configuracion/equipo',
        name: 'Equipo',
        component: () => import('../views/configuracion/Equipo.vue'),
        meta: { roles: ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR'] },
      },
      {
        path: 'materiales',
        name: 'Materiales',
        component: () => import('../views/materiales/Materiales.vue'),
        meta: { roles: ['ADMIN', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA'] },
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
const { isAuthenticated, ensureAuthLoaded } = useAuth()
const { ensureLoaded: ensureViewAccessLoaded, canAccess } = useViewAccess()

router.beforeEach(async (to, _from, next) => {
  // 0a. Modo mantenimiento — redirige todo excepto /maintenance y rutas públicas de operación
  if (MAINTENANCE_MODE && to.name !== 'Maintenance') {
    return next('/maintenance')
  }

  // 0b. Ruta pública (ej: /scan/:token, /checklist/:id) — pasa siempre
  if (to.meta.public) return next()

  // La sesión vive en una cookie httpOnly — no hay forma síncrona de saber si
  // sigue siendo válida en la primera carga de la app, así que se confirma
  // contra /auth/me antes de decidir acceso. Memoizado: solo pega al backend
  // una vez por carga (ver ensureAuthLoaded en useAuth.ts).
  if (to.meta.requiresAuth || to.meta.guestOnly) {
    await ensureAuthLoaded()
  }

  // 1. Ruta protegida sin sesión → redirige al login
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next('/login')
  }

  // 2. Ruta de invitado con sesión activa → ir directo al dashboard
  if (to.meta.guestOnly && isAuthenticated.value) {
    return next('/dashboard')
  }

  // 3. Validación de roles por ruta — usa la config dinámica editable desde
  // /configuracion (ADMIN/ADMINISTRADOR) cuando existe para esta vista, y
  // cae de vuelta a `meta.roles` si la vista no está gestionada ahí o la
  // config no cargó (backend caído). Solo se pide una vez — el composable
  // cachea el resultado en estado global.
  if (to.meta.roles) {
    await ensureViewAccessLoaded()

    if (!canAccess(to.name, to.meta.roles as string[])) {
      console.warn(`[Router] Acceso denegado a "${String(to.name)}"`)
      return next('/unauthorized')
    }
  }

  return next()
})

export default router
