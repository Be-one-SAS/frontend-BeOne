<template>
  <span
    :class="[
      'px-3 py-1 text-xs font-medium rounded-full max-h-[24px]',
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
      return 'bg-green-100 text-green-800'
    case 'OPERATIVO_70':
      return 'bg-yellow-100 text-yellow-800'
    case 'OPERATIVO_50':
      return 'bg-orange-100 text-orange-800'
    case 'EN_MANTENIMIENTO':
      return 'bg-blue-100 text-blue-800'
    case 'DEFECTUOSO':
      return 'bg-red-100 text-red-800'
    case 'NO_ACTIVO':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-200 text-gray-900'
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