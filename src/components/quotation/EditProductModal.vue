<script setup>
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import InputLabel from '../input/InputLabel.vue';

defineProps({
  show: Boolean,
  producto: Object
})


const emit = defineEmits(['close', 'save'])
</script>

<template>
  <ModalReutilizable :show="show" @close="emit('close')">
    <h2 class="text-xl font-bold text-blue-800 mb-4">Editar producto</h2>

    <form @submit.prevent="emit('save')">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputLabel label="Dispositivo" v-model="producto.dispositivo" />
        <InputLabel label="Descripción" v-model="producto.descripcion" />
        <InputLabel label="Precio" type="number" v-model="producto.unitPrice" />
        <InputLabel label="Q Jornada" v-model="producto.cantidadJornada" />
        <InputLabel label="Q Producto" v-model="producto.cantidadProducto" />
      </div>

      <div class="flex justify-end mt-4">
        <button type="button" class="mr-2 px-4 py-2 bg-gray-200 rounded" @click="emit('close')">
          Cancelar
        </button>
        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">
          Guardar
        </button>
      </div>
    </form>
  </ModalReutilizable>
</template>