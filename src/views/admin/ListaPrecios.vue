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
   console.log(productos.data)
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
    <h1 class="text-2xl text-blue-700 font-semibold mb-4">Listado de Productos</h1>
    <TableDinamic :headers="['id','nombre', 'dispositivo', 'categoria', 'total'] " :rows="data" />
  </div>
</template>