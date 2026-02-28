<template>
  <div>
    <!-- ITEM SIMPLE -->
    <router-link
      v-if="route"
      :to="route"
      :class="[
        'flex items-center gap-3 cursor-pointer select-none px-[14px] py-[9px] rounded-[10px] text-[13px] font-medium transition',
        isActive
          ? 'bg-primary-light text-primary font-semibold'
          : 'text-text-2 hover:bg-primary-light hover:text-primary'
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
          'flex items-center gap-3 cursor-pointer select-none px-[14px] py-[9px] rounded-[10px] text-[13px] font-medium transition',
          isParentActive
            ? 'bg-primary-light text-primary font-semibold'
            : 'text-text-2 hover:bg-primary-light hover:text-primary'
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
          class="ml-6 mt-1 space-y-1"
        >
          <router-link
            v-for="item in items"
            :key="item.route"
            :to="item.route"
            :class="[
              'block px-[14px] py-[7px] rounded-[10px] text-[12px] font-medium transition',
              routeIsActive(item.route)
                ? 'bg-primary-light text-primary font-semibold'
                : 'text-text-2 hover:bg-primary-light hover:text-primary'
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