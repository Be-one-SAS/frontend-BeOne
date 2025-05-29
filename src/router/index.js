// router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/components/layout/MainLayout.vue";
import LoginPage from "@/views/authentication/LoginPage.vue";
import { useAuthStore } from "../stores/auth";


const routes = [
  {
    path: "/",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
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
    component: LoginPage,
    meta: { guestOnly: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ✅ Usa el store directamente aquí
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next("/login");
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return next("/");
  }

  return next();
});

export default router;