<template>
  <div class="bg-card rounded-[var(--r-xl)] shadow-[var(--shadow-card)] p-6">

    <div class="grid grid-cols-3 gap-6 text-sm text-text-1">

      <!-- COLUMNA 1 · SUBTOTAL -->
      <div class="space-y-3">
        <div class="text-center text-[13px] font-semibold text-white bg-primary py-1 rounded-[var(--r-md)]">
          SUBTOTAL
        </div>

        <div class="flex justify-between">
          <span>Valor base</span>
          <span class="font-medium">{{ formato(subtotal) }}</span>
        </div>
      </div>

      <!-- COLUMNA 2 · DESCUENTO -->
      <div class="space-y-3">
        <div class="text-center text-[13px] font-semibold text-white bg-primary py-1 rounded-[var(--r-md)]">
          DESCUENTO
        </div>

        <div class="flex items-center justify-between gap-2">
          <span>Descuento (%)</span>

          <div class="flex items-center gap-1">
            <input
              v-model.number="descuentoPorcentaje"
              type="number"
              min="0"
              max="100"
              class="w-20 bg-[#F8FAFC] border border-border rounded-full px-2 py-1 text-right text-[13px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <span class="text-gray-500">%</span>
          </div>
        </div>

        <div class="flex justify-between text-red-500">
          <span>Valor descuento</span>
          <span>
            − {{ formato(valorDescuento) }}
          </span>
        </div>

        <div class="flex justify-between border-t pt-2">
          <span>Total sin IVA</span>
          <span class="font-medium">
            {{ formato(totalSinIva) }}
          </span>
        </div>
      </div>

      <!-- COLUMNA 3 · TOTAL -->
      <div class="space-y-3">
        <div class="text-center text-[13px] font-semibold text-white bg-primary-dark py-1 rounded-[var(--r-md)]">
          TOTAL
        </div>

        <div class="flex justify-between">
          <span>IVA ({{ ivaPorcentaje }}%)</span>
          <span class="font-medium">{{ formato(iva) }}</span>
        </div>

        <div class="flex justify-between border-t pt-2 text-base font-bold">
          <span>Total con IVA</span>
          <span class="text-primary font-bold">
            {{ formato(totalFinal) }}
          </span>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  subtotal: {
    type: Number,
    required: true,
  },
  descuentoInicial: {
    type: Number,
    default: 0, // porcentaje
  },
  ivaPorcentaje: {
    type: Number,
    default: 19,
  },
})

const emit = defineEmits(['update:descuento'])

const descuentoPorcentaje = ref(props.descuentoInicial)

// Emitir al padre
watch(descuentoPorcentaje, value => {
  const safeValue = Math.min(Math.max(value, 0), 100)
  descuentoPorcentaje.value = safeValue
  emit('update:descuento', safeValue)
})

const valorDescuento = computed(() => {
  return props.subtotal * (descuentoPorcentaje.value / 100)
})

const totalSinIva = computed(() => {
  return props.subtotal - valorDescuento.value
})

const iva = computed(() => {
  return totalSinIva.value * (props.ivaPorcentaje / 100)
})

const totalFinal = computed(() => {
  return totalSinIva.value + iva.value
})

function formato(valor) {
  return `$ ${Math.round(valor).toLocaleString('es-CO')}`
}
</script>