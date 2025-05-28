import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'dashboard/home',
        component: () => import('@/views/dashboard/DashboardPage.vue'),
      },
      {
        path: 'admin/precios',
        component: () => import('@/views/admin/ListaPrecios.vue'),
      },
      {
        path: 'admin/cotizar',
        component: () => import('@/views/admin/Cotizar.vue'),
      },
      {
        path: 'operativa/reporte',
        component: () => import('@/views/operativa/Reporte.vue'),
      },
      {
        path: 'users/list',
        component: () => import('@/views/users/List.vue'),
      },
    ],
  },
  {
    path: '/login',
    component: () => import('@/views/authentication/LoginPage.vue'),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});