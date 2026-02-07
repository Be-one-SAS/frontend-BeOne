<template>
  <span :class="[
    'px-3 py-1 text-xs font-medium rounded-full max-h-[24px]',
    colorClass
  ]">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  estado: {
    type: String,
    required: true
  }
})

const normalized = computed(() =>
  props.estado?.toUpperCase().trim()
)

const colorClass = computed(() => {
  switch (normalized.value) {
    // -------------------
    // DISPONIBILIDAD
    // -------------------
    case 'EN_RESERVA':
    case 'PENDIENTE':
    case 'EN_PROCESO':
      return 'bg-yellow-100 text-yellow-800'

    case 'DISPONIBLE':
    case 'APROBADA':
    case 'COTIZADO':
      return 'bg-green-100 text-green-800'

    case 'NO_DISPONIBLE':
    case 'RECHAZADA':
    case 'CANCELADO':
      return 'bg-red-100 text-red-800'

    case 'PRODUCTO PROPIO':
      return 'bg-cyan-300 text-cyan-800'

    case 'PRODUCTO NO PROPIO':
      return 'bg-gray-300 text-gray-800'

    case 'VENCIDO':
      return 'bg-gray-200 text-gray-700'

    default:
      return 'bg-gray-100 text-gray-800'
  }
})

const label = computed(() => {
  switch (normalized.value) {
    // -------------------
    // DISPONIBILIDAD
    // -------------------
    case 'EN_RESERVA':
      return 'En reserva'
    case 'DISPONIBLE':
      return 'Disponible'
    case 'NO_DISPONIBLE':
      return 'No disponible'

    // -------------------
    // COTIZACIONES
    // -------------------
    case 'PENDIENTE':
    case 'EN_PROCESO':
      return 'Pendiente'

    case 'APROBADA':
    case 'COTIZADO':
      return 'Aprobada'

    case 'RECHAZADA':
    case 'CANCELADO':
      return 'Rechazada'

    case 'VENCIDO':
      return 'Vencida'

    default:
      return props.estado
  }
})
</script>