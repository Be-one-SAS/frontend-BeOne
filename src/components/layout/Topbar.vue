<template>
  <header class="h-20 px-8 flex items-center justify-between mt-6">
    <div class="flex items-center gap-2">
      <button
        v-for="item in items"
        :key="item.label"
        @click="go(item)"
        class="text-sm font-medium rounded-full py-2 px-4 transition cursor-pointer"
        :class="isActive(item)
          ? 'bg-black text-white'
          : 'bg-white text-gray-400 hover:text-gray-600'"
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