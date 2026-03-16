<template>
  <div
    class="relative rounded-[var(--r-lg)] overflow-hidden border border-border bg-card transition-all duration-200 hover:shadow-[var(--shadow-card)] hover:scale-[1.02] hover:-translate-y-0.5"
    :class="disponible ? 'cursor-pointer' : 'cursor-not-allowed'"
    @click="disponible && handleSelect()"
  >
    <!-- Overlay no disponible -->
    <div
      v-if="!disponible"
      class="absolute inset-0 bg-white/70 flex items-center justify-center z-10"
    >
      <span class="text-[12px] font-semibold text-text-2 bg-white/90 px-3 py-1 rounded-full border border-border shadow-sm">
        No disponible
      </span>
    </div>

    <!-- Imagen -->
    <div class="w-full aspect-[4/3] overflow-hidden bg-border-light">
      <img
        :src="imageUrl"
        @error="onImageError"
        class="w-full h-full object-cover"
        alt="producto"
      />
    </div>

    <!-- Contenido -->
    <div class="p-3 space-y-2">
      <h3 class="text-[13px] font-semibold text-text-1 leading-tight line-clamp-2">
        {{ producto.nombre || producto.dispositivo || 'Sin nombre' }}
      </h3>

      <p class="text-[11px] text-text-2 line-clamp-2 leading-relaxed">
        {{ producto.descripcion || 'Sin descripción' }}
      </p>

      <!-- Badges -->
      <div class="flex flex-wrap gap-1.5 pt-1">
        <span :class="['rounded-full px-2.5 py-[3px] text-[10px] font-semibold', availabilityClass]">
          {{ availabilityLabel }}
        </span>
        <ConditionBadge :condition="producto.conditionStatus" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ConditionBadge from '@/components/badge/ConditionBadge.vue'

const props = defineProps({
  producto: Object
})

const emit = defineEmits(['select'])

const fallback = '/assets/be-one-logo.webp'
const imageUrl = ref(props.producto?.linkFotoDispositivo || fallback)

const onImageError = () => {
  imageUrl.value = fallback
}

const disponible = computed(() => props.producto.availabilityStatus === 'DISPONIBLE')

const availabilityClass = computed(() => {
  switch (props.producto.availabilityStatus) {
    case 'DISPONIBLE':    return 'bg-[#DCFCE7] text-[#16A34A]'
    case 'EN_RESERVA':    return 'bg-[#FEF3C7] text-[#B45309]'
    case 'NO_DISPONIBLE': return 'bg-[#FEE2E2] text-[#B91C1C]'
    default:              return 'bg-[#F1F5F9] text-[#475569]'
  }
})

const availabilityLabel = computed(() => {
  switch (props.producto.availabilityStatus) {
    case 'DISPONIBLE':    return 'Disponible'
    case 'EN_RESERVA':    return 'En reserva'
    case 'NO_DISPONIBLE': return 'No disponible'
    default:              return props.producto.availabilityStatus || '—'
  }
})

const handleSelect = () => {
  if (!disponible.value) return
  emit('select', props.producto)
}
</script>
