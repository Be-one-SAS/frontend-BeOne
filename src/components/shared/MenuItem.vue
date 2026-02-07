<template>
  <div>
    <!-- ITEM SIMPLE -->
    <router-link
      v-if="route"
      :to="route"
      :class="[
        'flex items-center gap-3 cursor-pointer select-none mt-1 px-2 py-2 rounded-lg transition',
        isActive
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : 'hover:bg-blue-50 hover:text-blue-700'
      ]"
    >
      <component
        :is="iconComponent"
        class="w-5 h-5"
      />
      <span>{{ label }}</span>
    </router-link>

    <!-- ITEM CON SUBMENU -->
    <div v-else>
      <div
        :class="[
          'flex items-center gap-3 cursor-pointer select-none mt-1 px-2 py-2 rounded-lg transition',
          isParentActive
            ? 'bg-blue-100 text-blue-700 font-semibold'
            : 'hover:bg-blue-50'
        ]"
        @click="$emit('toggle')"
      >
        <component
          :is="iconComponent"
          class="w-5 h-5"
        />

        <span>{{ label }}</span>

        <ChevronRight
          class="w-4 h-4 ml-auto transition-transform duration-300"
          :class="{ 'rotate-90': isOpen }"
        />
      </div>

      <transition name="fade">
        <div
          v-show="isOpen"
          class="ml-8 mt-2 space-y-2 text-sm text-gray-600"
        >
          <router-link
            v-for="item in items"
            :key="item.route"
            :to="item.route"
            :class="[
              'block px-2 py-1 rounded-md transition',
              routeIsActive(item.route)
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'hover:text-blue-700'
            ]"
          >
            {{ item.name }}
          </router-link>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Home,
  Briefcase,
  ClipboardList,
  Users,
  User,
  Boxes,
  Truck,
  Building2,
  ChevronRight
} from 'lucide-vue-next'

const props = defineProps({
  label: String,
  icon: String,
  items: Array,
  route: String,
  isOpen: Boolean,
})

const currentRoute = useRoute()

/* ======================
   ICONOS
====================== */
const iconMap = {
  Home,
  Comercial: Briefcase,
  Operativo: ClipboardList,
  Personal: Users,
  Usuario: User,
  Productos: Boxes,
  Proveedores: Truck,
  Clientes: Building2,
}

const iconComponent = iconMap[props.icon] || Home

/* ======================
   ACTIVE LOGIC
====================== */

// item simple activo
const isActive = computed(() => {
  if (!props.route) return false
  return currentRoute.path === props.route
})

// subitem activo
const routeIsActive = (path) => {
  return currentRoute.path === path
}

// padre activo si algún hijo está activo
const isParentActive = computed(() => {
  if (!props.items) return false
  return props.items.some(item => currentRoute.path === item.route)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>