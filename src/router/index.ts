// router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../components/layout/MainLayout.vue";
import LoginPage from "../views/authentication/LoginPage.vue";
import { useAuth } from "../composables/useAuth";
import DashboardPage from "../views/dashboard/DashboardPage.vue";
import Cotizar from "../views/admin/Cotizar.vue";
import Reporte from "../views/operativa/Reporte.vue";
import List from "../views/users/List.vue";
import VerCotizaciones from "../views/admin/VerCotizaciones.vue";
import Customer from "../views/customer/Customer.vue";
import Suppliers from "../views/suppliers/Suppliers.vue";
import PriceList from "../views/customer/PriceList.vue";
import Products from "../views/products/Products.vue";
import ProductsNoPropios from "../views/products/ProductsNoPropios.vue";

const routes = [

  { path: "/", name: "Auth", component: LoginPage, meta: { guestOnly: true } },

  {
    path: "/",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "/dashboard",
        name: "Dashboard",
        component: DashboardPage,
        meta: { requiresAuth: true, roles: ["ADMIN", "COMERCIAL", "SUPERVISOR", "LOGISTICA"] }
      },
      {
        path: "admin/cotizar/:id?",
        name: "Cotizar",
        component: Cotizar,
        meta: { roles: ["ADMIN", "COMERCIAL"] }
      },
      {
        path: "operativa/reporte",
        name: "Reporte",
        component: Reporte,
        meta: { roles: ["ADMIN", "SUPERVISOR", "LOGISTICA"] }
      },
      {
        path: "users/list",
        name: "UsersList",
        component: List,
        meta: { roles: ["ADMIN"] }
      },
      {
        path: "admin/ver-cotizaciones",
        name: "VerCotizaciones",
        component: VerCotizaciones,
        meta: { roles: ["ADMIN", "SUPERVISOR"] }
      },
      {
        path: "customer/customer",
        name: "Clientes",
        component: Customer,
        meta: { roles: ["ADMIN", "COMERCIAL"] }
      },
      {
        path: "suppliers/suppliers",
        name: "Suppliers",
        component: Suppliers,
        meta: { roles: ["ADMIN"] }
      },
      {
        path: "customer/price",
        name: "List price",
        component: PriceList,
        meta: { roles: ["ADMIN", "COMERCIAL"] }
      },
      {
        path: "products",
        name: "Productos",
        component: Products,
        meta: { roles: ["ADMIN", "LOGISTICA"] }
      },
      {
        path: "products/no-propios",
        name: "no-propios",
        component: ProductsNoPropios,
        meta: { roles: ["ADMIN", "LOGISTICA"] }
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { guestOnly: true }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});


// 🔐 Guard global con control por roles
router.beforeEach((to, from, next) => {
  const { isAuthenticated, user } = useAuth();

  // 1️ Si requiere auth y no está autenticado
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next("/login");
  }

  // 2️ Si es solo para invitados y ya está logueado
  if (to.meta.guestOnly && isAuthenticated.value) {
    return next("/");
  }

  // 3️ Validación de roles
  if (to.meta.roles) {
    const allowedRoles = to.meta.roles as string[];
    const userRole = user.value?.roles[0]

      if (!userRole || !allowedRoles.includes(userRole)) {

        console.warn(`Acceso denegado. Se requieren roles: ${allowedRoles.join(", ")}`);
        return next("/");
      }
  }

  return next();
});

export default router;