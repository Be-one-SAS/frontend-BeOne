<script setup>
import { ref, computed, onMounted } from 'vue'
import TableDinamic from '../../components/tables/TableDinamic.vue'
import { getSuppliers } from '../../services/suppliers.service'

const data = ref([])
const columns = ref([])
const searchQuery = ref('')
const loading = ref(true)

// 🔍 Filtro dinámico
const filteredData = computed(() => {
  if (!searchQuery.value) return data.value

  const query = searchQuery.value.toLowerCase().trim()

  return data.value.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(query)
    )
  )
})

onMounted(async () => {
  try {
    const suppliers = await getSuppliers()
    data.value = suppliers.data

    columns.value = [
      { label: 'Id', field: 'id' },
      { label: 'Nombre', field: 'name' },
      { label: 'Nit', field: 'nit' },
      { label: 'Email', field: 'email' },
      { label: 'Phone 1', field: 'phoneOne' },
      { label: 'Phone 2', field: 'phoneTwo' },
      { label: 'Referencia', field: 'reference' },
      { label: 'Zona de Operación', field: 'zoneOperation' },
    ]
  } catch (error) {
    console.error('Error al cargar proveedores:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Listado de Proveedores</h1>

      <!-- Buscador moderno -->
      <div class="relative w-80">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar proveedor..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
        </svg>
      </div>
    </div>

    <!-- 🧾 Skeleton Loader -->
    <div v-if="loading" class="space-y-2 animate-pulse">
      <div
        v-for="i in 8"
        :key="i"
        class="flex justify-between items-center p-3 border rounded-lg bg-gray-50"
      >
        <div class="h-4 bg-gray-200 rounded w-10"></div>
        <div class="h-4 bg-gray-200 rounded w-32"></div>
        <div class="h-4 bg-gray-200 rounded w-24"></div>
        <div class="h-4 bg-gray-200 rounded w-40"></div>
        <div class="h-4 bg-gray-200 rounded w-28"></div>
        <div class="h-4 bg-gray-200 rounded w-20"></div>
        <div class="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>

    <!-- ✅ Tabla real -->
    <div v-else>
      <TableDinamic :data="filteredData" :columns="columns">
        <template #foto="{ value }">
          <img
            v-if="value"
            :src="value"
            alt="Foto del proveedor"
            class="w-12 h-12 object-cover rounded border"
          />
          <span v-else class="text-gray-400">N/A</span>
        </template>
      </TableDinamic>
    </div>
  </div>
</template>