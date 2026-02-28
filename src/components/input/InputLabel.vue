<template>
  <div>
    <label class="text-[13px] font-medium text-text-1 mb-1 block">{{ label }}</label>
    <input
      :type="type"
      v-model="inputValue"
      class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  label: string
  modelValue: string | number | null
  type?: 'text' | 'date' | 'time'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const inputValue = ref<string>('')

// Función para formatear valores entrantes
const formatValue = (val: string | number | null) => {
  if (!val) return ''

  if (props.type === 'date') {
    // Formato de la DB: "2025-10-17T00:00:00.000Z"
    const date = new Date(val as string)
    return date.toISOString().split('T')[0] // => "2025-10-17"
  }

  if (props.type === 'time') {
    // Si llega algo como "12:00" o "12:00:00"
    return (val as string).slice(0, 5)
  }

  return String(val)
}

// Inicializar
inputValue.value = formatValue(props.modelValue)

// Actualizar cuando cambie el valor desde el padre
watch(
  () => props.modelValue,
  val => {
    inputValue.value = formatValue(val)
  }
)

// Emitir cambios hacia el padre
watch(inputValue, val => {
  emit('update:modelValue', val)
})
</script>