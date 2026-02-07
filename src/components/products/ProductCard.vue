<template>
  <div @click="disponible && handleSelect()" :class="[
    'relative rounded-xl border shadow-sm transition',
    disponible
      ? 'bg-white cursor-pointer hover:shadow-lg'
      : 'bg-gray-100 opacity-40 cursor-not-allowed pointer-events-none'
  ]">
    <!-- Overlay no disponible -->
    <div v-if="!disponible"
      class="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl text-sm font-semibold text-gray-600 z-10">
      No disponible
    </div>

    <!-- Imagen -->
    <div class="w-full bg-gray-100 rounded-t-xl">
      <img :src="placeholder" class="h-36 w-full object-cover rounded-t-xl" alt="producto" />
    </div>

    <!-- Contenido -->
    <div class="p-3 space-y-2">
      <h3 class="font-semibold text-gray-800 text-sm truncate">
        {{ producto.dispositivo }}
      </h3>

      <p class="text-xs text-gray-500 line-clamp-2">
        {{ producto.descripcion }}
      </p>

      <!-- Badges -->
      <div class="flex flex-wrap gap-2 mt-2">
        <Badge :estado="producto.availabilityStatus" />
        <ConditionBadge :condition="producto.conditionStatus" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Badge from '@/components/badge/Badge.vue'
import ConditionBadge from '@/components/badge/ConditionBadge.vue'

const props = defineProps({
  producto: Object
})

const emit = defineEmits(['select'])

const placeholder = '/assets/be-one-logo.webp'

const disponible = computed(() => {
  return props.producto.isAvailable
})

const handleSelect = () => {
  if (!disponible.value) return
  emit('select', props.producto)
}
</script>