<template>
  <!-- El padding/gap los gestiona el main-wrapper en MainLayout; el topbar no necesita márgenes propios -->
  <header class="h-16 shrink-0 bg-card rounded-[var(--r-xl)] px-6 flex items-center justify-between shadow-[var(--shadow-card)]">
    <div class="flex items-center gap-2">
      <button
        v-for="item in items"
        :key="item.label"
        @click="go(item)"
        class="rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer"
        :class="isActive(item)
          ? 'bg-primary text-white font-semibold'
          : 'bg-transparent text-text-2 font-medium hover:text-primary'"
      >
        {{ item.label }}
      </button>
    </div>

    <ProfileHeader />
  </header>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import ProfileHeader from '@/components/shared/ProfileHeader.vue'

const router = useRouter()
const route = useRoute()

const items = [
  { label: 'Listado', path: '/dashboard/listado' },
  { label: 'Dashboard', path: '/dashboard/analytics' },
  { label: 'Datos', path: '/dashboard/datos' },
  { label: 'Pendientes', path: '/dashboard/pendientes' },
  { label: 'Otros', path: '/dashboard/otros' },
]

const go = (item) => {
  router.push(item.path)
}

const isActive = (item) => {
  return route.path === item.path
}
</script>