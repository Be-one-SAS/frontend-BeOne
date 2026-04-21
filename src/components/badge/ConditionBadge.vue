<template>
  <span
    :class="[
      'rounded-full px-[10px] py-[3px] text-[11px] font-medium',
      colorClass
    ]"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  condition: {
    type: String,
    required: true
  }
})

const colorClass = computed(() => {
  switch (props.condition) {
    case 'OPERATIVO_OK':
      return 'bg-[#DCFCE7] text-[#16A34A]'
    case 'OPERATIVO_70':
      return 'bg-[#FEF3C7] text-[#B45309]'
    case 'OPERATIVO_50':
      return 'bg-[#FEF3C7] text-[#B45309]'
    case 'EN_MANTENIMIENTO':
      return 'bg-[#DBEAFE] text-[#1D4ED8]'
    case 'DEFECTUOSO':
      return 'bg-[#FEE2E2] text-[#B91C1C]'
    case 'NO_ACTIVO':
      return 'bg-[#F1F5F9] text-[#475569]'
    default:
      return 'bg-[#F1F5F9] text-[#475569]'
  }
})

const label = computed(() => {
  switch (props.condition) {
    case 'OPERATIVO_OK':
      return 'Operativo'
    case 'OPERATIVO_70':
      return 'Operativo (70%)'
    case 'OPERATIVO_50':
      return 'Operativo (50%)'
    case 'EN_MANTENIMIENTO':
      return 'En mantenimiento'
    case 'DEFECTUOSO':
      return 'Defectuoso'
    case 'NO_ACTIVO':
      return 'No activo'
    default:
      return props.condition
  }
})
</script>