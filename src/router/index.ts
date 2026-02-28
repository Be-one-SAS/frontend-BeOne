// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout    from '../components/layout/MainLayout.vue'
import LoginPage     from '../views/authentication/LoginPage.vue'
import { useAuth }   from '../composables/useAuth'

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

const routes = [

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
          roles: ['ADMIN', 'COMERCIAL', 'SUPERVISOR', 'LOGISTICA', 'COORDINADOR', 'FINANCIERO', 'SOPORTE'],
        },
      },

      // ── Comercial ──────────────────────────────────────
      {
        path: 'admin/cotizar/:id?',
        name: 'Cotizar',
        component: Cotizar,
        meta: { roles: ['ADMIN', 'COMERCIAL'] },
      },
      {
        path: 'admin/ver-cotizaciones',
        name: 'VerCotizaciones',
        component: VerCotizaciones,
        meta: { roles: ['ADMIN', 'COMERCIAL', 'SUPERVISOR'] },
      },
      {
        path: 'customer/customer',
        name: 'Clientes',
        component: Customer,
        meta: { roles: ['ADMIN', 'COMERCIAL'] },
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
        meta: { roles: ['ADMIN', 'COMERCIAL'] },
      },

      // ── Productos ──────────────────────────────────────
      {
        path: 'products',
        name: 'Productos',
        component: Products,
        meta: { roles: ['ADMIN', 'LOGISTICA'] },
      },
      {
        path: 'products/no-propios',
        name: 'ProductosNoPropios',
        component: ProductsNoPropios,
        meta: { roles: ['ADMIN', 'LOGISTICA'] },
      },

      // ── Operativo ──────────────────────────────────────
      {
        path: 'operativa/reporte',
        name: 'Reporte',
        component: Reporte,
        meta: { roles: ['ADMIN', 'SUPERVISOR', 'LOGISTICA'] },
      },
      {
        path: 'operativa/checkins',
        name: 'CheckIns',
        component: () => import('../views/operativa/CheckIns.vue'),
        meta: { roles: ['ADMIN', 'LOGISTICA', 'COORDINADOR'] },
      },
      {
        path: 'operativa/inventario',
        name: 'Inventario',
        component: () => import('../views/operativa/Inventario.vue'),
        meta: { roles: ['ADMIN', 'LOGISTICA'] },
      },
      {
        path: 'operativa/montajes',
        name: 'Montajes',
        component: () => import('../views/operativa/Montajes.vue'),
        meta: { roles: ['ADMIN', 'LOGISTICA', 'COORDINADOR'] },
      },
      {
        path: 'operativa/equipos',
        name: 'AsignacionEquipos',
        component: () => import('../views/operativa/AsignacionEquipos.vue'),
        meta: { roles: ['ADMIN', 'SUPERVISOR', 'COORDINADOR'] },
      },

      // ── Reportes ───────────────────────────────────────
      {
        path: 'reportes/general',
        name: 'ReporteGeneral',
        component: () => import('../views/reportes/ReporteGeneral.vue'),
        meta: { roles: ['ADMIN', 'SUPERVISOR', 'FINANCIERO'] },
      },
      {
        path: 'reportes/financiero',
        name: 'ReporteFinanciero',
        component: () => import('../views/reportes/ReporteFinanciero.vue'),
        meta: { roles: ['ADMIN', 'FINANCIERO'] },
      },
      {
        path: 'reportes/operacional',
        name: 'ReporteOperacional',
        component: () => import('../views/reportes/ReporteOperacional.vue'),
        meta: { roles: ['ADMIN', 'SUPERVISOR'] },
      },

      // ── Usuarios ───────────────────────────────────────
      {
        path: 'users/list',
        name: 'UsersList',
        component: List,
        meta: { roles: ['ADMIN'] },
      },
      // NOTA: /users/roles eliminado — módulo consolidado en /users/list

      // ── Configuración ──────────────────────────────────
      {
        path: 'configuracion',
        name: 'Configuracion',
        component: () => import('../views/configuracion/Configuracion.vue'),
        meta: { roles: ['ADMIN'] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ─────────────────────────────────────────────────────────
// 🔐 Guard global — Auth + Roles
// ─────────────────────────────────────────────────────────
router.beforeEach((to, _from, next) => {
  const { isAuthenticated, user } = useAuth()

  // 1. Ruta protegida sin sesión → redirige al login
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next('/login')
  }

  // 2. Ruta de invitado con sesión activa → redirige al dashboard
  if (to.meta.guestOnly && isAuthenticated.value) {
    return next('/dashboard')
  }

  // 3. Validación de roles por ruta
  if (to.meta.roles) {
    const allowedRoles = to.meta.roles as string[]
    const userRole     = user.value?.roles?.[0]

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn(`[Router] Acceso denegado. Roles requeridos: ${allowedRoles.join(', ')}`)
      return next('/dashboard')
    }
  }

  return next()
})

export default router
