<template>
  <span :class="[
    'rounded-full px-[10px] py-[3px] text-[11px] font-medium',
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
      return 'bg-[#DBEAFE] text-[#1D4ED8]'

    case 'DISPONIBLE':
    case 'APROBADA':
    case 'COTIZADO':
      return 'bg-[#DCFCE7] text-[#16A34A]'

    case 'NO_DISPONIBLE':
    case 'RECHAZADA':
    case 'CANCELADO':
      return 'bg-[#FEE2E2] text-[#B91C1C]'

    case 'PRODUCTO PROPIO':
      return 'bg-primary-light text-primary'

    case 'PRODUCTO NO PROPIO':
      return 'bg-[#F1F5F9] text-[#475569]'

    case 'VENCIDO':
      return 'bg-[#FEF3C7] text-[#B45309]'

    default:
      return 'bg-[#F1F5F9] text-[#475569]'
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