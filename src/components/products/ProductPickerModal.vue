<template>
  <ModalReutilizable :show="show" @close="$emit('close')">
    <div class="flex flex-col max-h-[80vh]">
      <!-- Header -->
      <h2 class="text-xl font-bold text-blue-800 mb-4">
        Seleccionar producto
      </h2>

      <!-- Grid de tarjetas -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-y-auto pr-2">
        <ProductCard v-for="producto in productos"  :key="producto.id"
          :producto="producto" @select="onSelect"  />
      </div>
    </div>
  </ModalReutilizable>
</template>

<script setup>
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import ProductCard from './ProductCard.vue'

const props = defineProps({
  show: Boolean,
  productos: Array
})


console.log("Productos en el modal:", props.productos)

const emit = defineEmits(['close', 'select'])

const onSelect = (producto) => {
  emit('select', producto)
  emit('close')
}
</script>