<script setup>
import { ref, onMounted } from 'vue'
import TableDinamic from '../../components/tables/TableDinamic.vue'
import { getProducts } from '../../services/products.service'

const data = ref([])
const columns = ref([])

onMounted(async () => {
  try {
    const productos = await getProducts()
    data.value = productos.data

    columns.value = [
      { label: 'Nombre', field: 'nombre' },
      { label: 'Categoría', field: 'categoria' },
      { label: 'Dispositivo', field: 'dispositivo' },
      { label: 'COP', field: 'cop', formatFn: val => `$${val?.toLocaleString()}` },
      { label: 'Bodega', field: 'bodega' },
      { label: 'Estado', field: 'estado' },
      { label: 'Total', field: 'total', formatFn: val => `$${val?.toLocaleString()}` },
      { label: 'Utilidad Neta', field: 'utilidadNeta', formatFn: val => `$${val?.toLocaleString()}` },
      {
        label: 'Foto',
        field: 'linkFotoDispositivo',
        slot: 'foto', // se usará el slot con nombre "foto"
      },
    ]
  } catch (error) {
    console.error('Error al cargar productos:', error)
  }
})
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-semibold mb-4">Listado de Clientes</h1>
     
 <TableDinamic :data="data" :columns="columns">
      <template #foto="{ value }">
        <img
          v-if="value"
          :src="value"
          alt="Foto del dispositivo"
          class="w-12 h-12 object-cover rounded border"
        />
        <span v-else class="text-gray-400">N/A</span>
      </template>
    </TableDinamic>
    

  </div>
</template>