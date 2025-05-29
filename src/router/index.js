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
        path: "admin/precios",
        name: "ListaPrecios",
        component: () => import("@/views/admin/ListaPrecios.vue"),
      },
      {
        path: "admin/cotizar",
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

  console.log('AUTH',to.meta.requiresAuth, isAuthenticated.value)
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next("/login");
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return next("/");
  }

  return next();
});

export default router;