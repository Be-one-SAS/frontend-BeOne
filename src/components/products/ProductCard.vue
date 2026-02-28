<template>
  <div @click="disponible && handleSelect()" :class="[
    'relative rounded-[var(--r-xl)] overflow-hidden border transition',
    disponible
      ? 'bg-card border-border shadow-[0_2px_10px_rgba(5,78,175,.08)] cursor-pointer hover:shadow-[var(--shadow-card)]'
      : 'bg-[#F8FAFC] border-border opacity-40 cursor-not-allowed pointer-events-none'
  ]">
    <!-- Overlay no disponible -->
    <div v-if="!disponible"
      class="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl text-sm font-semibold text-gray-600 z-10">
      No disponible
    </div>

    <!-- Imagen -->
    <div class="w-full aspect-[4/3]">
      <img :src="placeholder" class="w-full h-full object-cover" alt="producto" />
    </div>

    <!-- Contenido -->
    <div class="p-[10px_14px] space-y-2">
      <h3 class="text-[13px] font-semibold text-text-1 truncate">
        {{ producto.dispositivo }}
      </h3>

      <p class="text-[12px] text-text-2 line-clamp-2">
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