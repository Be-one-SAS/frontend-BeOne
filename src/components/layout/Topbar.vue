<template>
  <header class="topbar-header">
    <div class="topbar-nav">
      <button
        v-for="item in items"
        :key="item.label"
        @click="go(item)"
        class="topbar-item"
        :class="{ 'topbar-item--active': isActive(item) }"
      >
        <component :is="item.icon" :size="14" />
        <span class="topbar-label">{{ item.label }}</span>
      </button>
    </div>

    <div class="flex items-center gap-2">
      <NotificationBell />
      <ProfileHeader />
    </div>
  </header>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { LayoutDashboard, FileText, BarChart2, Settings2, ShieldCheck } from 'lucide-vue-next'
import ProfileHeader    from '@/components/shared/ProfileHeader.vue'
import NotificationBell from '@/components/shared/NotificationBell.vue'

const router = useRouter()
const route  = useRoute()

const items = [
  { label: 'Inicio',         path: '/dashboard',                   icon: LayoutDashboard },
  { label: 'Cotizaciones',   path: '/admin/ver-cotizaciones',       icon: FileText },
  { label: 'Reportes',       path: '/reportes/general',             icon: BarChart2 },
  { label: 'Control',        path: '/admin/control',                icon: ShieldCheck },
  { label: 'Administración', path: '/administracion/dashboard',     icon: Settings2 },
]

const go = (item) => router.push(item.path)

const isActive = (item) => {
  if (item.path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(item.path)
}
</script>

<style scoped>
.topbar-header {
  height: 64px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 18px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
  border: 1px solid #E5EAF0;
  width: 100%;
  overflow: hidden;
}

.topbar-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex: 1;
  min-width: 0;
}

.topbar-nav::-webkit-scrollbar { display: none; }

.topbar-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 99px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  color: #64748B;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.topbar-item:hover {
  color: #27C8D8;
  background: #F0FAFB;
}

.topbar-item--active {
  background: #27C8D8;
  color: #FFFFFF;
  font-weight: 600;
}

.topbar-item--active:hover {
  background: #1BAEBB;
  color: #FFFFFF;
}

@media (max-width: 1024px) {
  .topbar-header { padding: 0 16px; }
}

@media (max-width: 768px) {
  .topbar-header { padding: 0 12px; }
}

@media (max-width: 640px) {
  .topbar-label { display: none; }
  .topbar-item { padding: 6px 10px; }
}

@media (max-width: 400px) {
  .topbar-item { padding: 6px 8px; }
  .topbar-header { padding: 0 8px; }
}
</style>
