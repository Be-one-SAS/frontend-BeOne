import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import LoginPage from '@/views/authentication/LoginPage.vue'
import DashboardPage from '@/views/dashboad/DashboardPage.vue'


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router