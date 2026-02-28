<script setup>
import { ref, computed, onMounted } from 'vue'
import TableDinamic from '../../components/tables/TableDinamic.vue'
import { getSuppliers } from '../../services/suppliers.service'
import { Search } from 'lucide-vue-next'

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
  <div class="w-full">

    <!-- ══════════════════════════════════════════ -->
    <!-- HEADER                                     -->
    <!-- ══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-[22px] font-bold text-text-1 font-['Plus_Jakarta_Sans',sans-serif] leading-tight m-0">
          Listado de Proveedores
        </h1>
        <p class="text-[13px] text-text-3 font-['Inter',sans-serif] mt-1 m-0">
          {{ filteredData.length }} proveedores registrados
        </p>
      </div>

      <!-- Buscador con ícono lucide -->
      <div class="relative w-72">
        <Search class="absolute left-3 top-2.5 w-4 h-4 text-text-3 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar proveedor..."
          class="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2EBF6]
                 rounded-full text-[13px] text-text-1
                 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
        />
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- SKELETON LOADER                            -->
    <!-- ══════════════════════════════════════════ -->
    <div
      v-if="loading"
      class="bg-white rounded-[18px] overflow-hidden
             shadow-[0_1px_4px_rgba(5,78,175,.06),_0_4px_16px_rgba(5,78,175,.08)]"
    >
      <!-- Header falso -->
      <div class="bg-[#EBF3FC] px-4 py-3 flex gap-6">
        <div
          v-for="i in 6"
          :key="i"
          class="h-3 bg-[#D8E8F8] rounded-full animate-pulse"
          :style="{ width: ['80px','120px','100px','160px','100px','80px'][i - 1] }"
        ></div>
      </div>

      <!-- Filas falsas -->
      <div
        v-for="i in 8"
        :key="i"
        class="flex gap-6 px-4 py-4 border-b border-[#EBF3FC] animate-pulse"
      >
        <div class="h-3 bg-[#F1F5FA] rounded-full w-10"></div>
        <div class="h-3 bg-[#F1F5FA] rounded-full w-32"></div>
        <div class="h-3 bg-[#F1F5FA] rounded-full w-24"></div>
        <div class="h-3 bg-[#F1F5FA] rounded-full w-40"></div>
        <div class="h-3 bg-[#F1F5FA] rounded-full w-28"></div>
        <div class="h-3 bg-[#F1F5FA] rounded-full w-20"></div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA REAL                                 -->
    <!-- ══════════════════════════════════════════ -->
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
