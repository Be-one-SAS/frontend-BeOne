<template>
  <header class="h-16 shrink-0 bg-card rounded-[var(--r-xl)] px-6 flex items-center justify-between shadow-[var(--shadow-card)]">
    <div class="flex items-center gap-1">
      <button
        v-for="item in items"
        :key="item.label"
        @click="go(item)"
        class="topbar-item"
        :class="{ 'topbar-item--active': isActive(item) }"
      >
        <component :is="item.icon" :size="14" />
        {{ item.label }}
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
</style>
