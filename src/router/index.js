// router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/components/layout/MainLayout.vue";
import LoginPage from "@/views/authentication/LoginPage.vue";
import { useAuth } from "@/composables/useAuth";

const routes = [
  {
    path: "/",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "/",
        name: "Dashboard",
        component: () => import("@/views/dashboard/DashboardPage.vue"),
      },
      {
        path: "admin/cotizar/:id?",
        name: "Cotizar",
        component: () => import("@/views/admin/Cotizar.vue"),
      },
      {
        path: "operativa/reporte",
        name: "Reporte",
        component: () => import("@/views/operativa/Reporte.vue"),
      },
      {
        path: "users/list",
        name: "UsersList",
        component: () => import("@/views/users/List.vue"),
      },
          {
        path: "/admin/ver-cotizaciones",
        name: "VerCotizaciones",
        component: () => import("@/views/admin/VerCotizaciones.vue"),
      },
      {
        path: "customer/customer",
        name: "Clientes",
        component: () => import("@/views/customer/Customer.vue"),
      },
       {
        path: "suppliers/suppliers",
        name: "Suppliers",
        component: () => import("@/views/suppliers/Suppliers.vue"),
      },
           {
        path: "customer/price",
        name: "List price",
        component: () => import("@/views/customer/PriceList.vue"),
      },
                 {
        path: "products",
        name: "Productos",
        component: () => import("@/views/products/Products.vue"),
      },
                             {
        path: "products/no-propios",
        name: "no-propios",
        component: () => import("@/views/products/ProductsNoPropios.vue"),
      },
                
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Validación global de acceso
router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useAuth();
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next("/login");
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return next("/");
  }

  return next();
});

export default router;