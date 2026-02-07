<script setup>
import { ref, computed, onMounted } from 'vue'
import TableDinamic from '../../components/tables/TableDinamic.vue'
import { getCustomer } from '../../services/customer.service'
import ModalReutilizable from '../../components/modal/ModalReutilizable.vue'
import { updateClient, createClient } from '../../services/suppliers.service'

const data = ref([])
const columns = ref([])
const searchQuery = ref('')
const loading = ref(true)
const clientes = ref([])
const showModal = ref(false)
const selectedCustomer = ref(null)
const isNew = ref(false)

const nuevoCliente = ref({
  name: undefined,
  nit: undefined,
  email: undefined,
  phone: undefined,
  document: undefined,
  contactName: undefined,
  reference: undefined,
  type: 'INDIRECTO'
})


//  Filtro dinámico
const filteredData = computed(() => {


  if (!searchQuery.value) return data.value
  const query = searchQuery.value.toLowerCase().trim()
  return data.value.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(query)
    )
  )
})

const openNewCustomerModal = async () => {
  try {

    const response = await createClient({
      name: nuevoCliente.value.name,
      nit: nuevoCliente.value.nit,
      email: nuevoCliente.value.email,
      phone: nuevoCliente.value.phone,
      document: nuevoCliente.value.document,
      contactName: nuevoCliente.value.contactName,
      reference: nuevoCliente.value.reference,
      type: nuevoCliente.value.type
    })
    const clienteActualizado = response.data
    console.log('Cliente creado:', clienteActualizado)


  } catch (error) {
    console.error('Error al crear el cliente:', error)
  }

}

const openCustomerModal = (row) => {
  isNew.value = false

  selectedCustomer.value = { ...row }
  showModal.value = true

  nuevoCliente.value.name = row.name || ''
  nuevoCliente.value.nit = row.nit || ''
  nuevoCliente.value.email = row.email || ''
  nuevoCliente.value.phone = row.phoneOne || ''
  nuevoCliente.value.document = row.document || ''
  nuevoCliente.value.contactName = row.contactName || ''
  nuevoCliente.value.reference = row.reference || ''
  nuevoCliente.value.type = row.type
}

const closeModal = () => {
  showModal.value = false
  selectedCustomer.value = null
}

onMounted(async () => {
  try {
    const customer = await getCustomer()
    data.value = customer.data
    columns.value = [
      { label: 'ID', field: 'id' },
      { label: 'Nombre', field: 'name' },
      { label: 'Tipo', field: 'type' },
      { label: 'Correo', field: 'email' },
      { label: 'Teléfono 1', field: 'phoneOne' },
      { label: 'Teléfono 2', field: 'phoneTwo' },
      { label: 'Dirección', field: 'address' },
      { label: 'Ciudad', field: 'city' },
      { label: 'NIT / Identificación', field: 'nit' },
      { label: 'Referencia', field: 'reference' },
    ]
  } catch (error) {
    console.error('Error al cargar clientes:', error)
  } finally {
    loading.value = false
  }
})

// Actualizar cliente
async function actualizarCliente() {
  try {
    const response = await updateClient(selectedCustomer.value.id, {
      name: nuevoCliente.value.name,
      nit: nuevoCliente.value.nit,
      email: nuevoCliente.value.email,
      phone: nuevoCliente.value.phone,
      document: nuevoCliente.value.document,
      contactName: nuevoCliente.value.contactName,
      reference: nuevoCliente.value.reference,
      type: nuevoCliente.value.type
    })
    const clienteActualizado = response.data
    console.log('Cliente actualizado:', clienteActualizado)

    // Actualizar lista
    const index = clientes.value.findIndex(c => c.id === clienteActualizado.id)
    if (index !== -1) {
      clientes.value[index] = clienteActualizado
    }

    closeModal()

  } catch (error) {
    console.error('Error al actualizar cliente:', error)
  }
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Listado de Clientes</h1>

      <div class="flex items-center gap-3">
        <!--  Buscador -->
        <div class="relative w-80">
          <input v-model="searchQuery" type="text" placeholder="Buscar cliente..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
        </div>
      </div>
    </div>

    <!-- Si no hay resultados -->
    <div v-if="!loading && filteredData.length === 0" class="p-6 text-center border rounded-lg bg-gray-50 mb-3">
      <p class="text-lg text-gray-600 mb-3">No se encontraron resultados para "{{ searchQuery }}".</p>

      <div class="flex justify-between items-center mb-6">
        <div class="flex flex-col items-center gap-3">
          <!--  Buscador -->

          <!-- Formulario nuevo cliente -->
          <div class="space-y-2 mb-4">
            <input v-model="nuevoCliente.name" placeholder="Nombre" class="w-full border px-3 py-2 rounded" />
            <input type="number" v-model="nuevoCliente.nit" placeholder="Número de identificación tributaria"
              class="w-full border px-3 py-2 rounded" />
            <input type="email" v-model="nuevoCliente.email" placeholder="Correo electrónico"
              class="w-full border px-3 py-2 rounded" />
            <input v-model="nuevoCliente.phone" placeholder="Contacto" class="w-full border px-3 py-2 rounded" />
            <input v-model="nuevoCliente.contactName" placeholder="Teléfono de referencia"
              class="w-full border px-3 py-2 rounded" />
            <input v-model="nuevoCliente.document" placeholder="Documento" class="w-full border px-3 py-2 rounded" />
            <input type="text" v-model="nuevoCliente.reference" placeholder="Nota"
              class="w-full border px-3 py-2 rounded" />


            <input v-model="nuevoCliente.phone" placeholder="País" class="w-full border px-3 py-2 rounded" />
            <input v-model="nuevoCliente.contactName" placeholder="Ciudad" class="w-full border px-3 py-2 rounded" />
            <input v-model="nuevoCliente.document" placeholder="Dirección" class="w-full border px-3 py-2 rounded" />
          </div>


          <div class="flex w-full items-center gap-3">
            <button @click="openNewCustomerModal"
              class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition">
              Crear nuevo cliente
            </button>

            <!-- SELECT DIRECTO / INDIRECTO -->
            <select v-model="nuevoCliente.type" class="border px-3 py-2 rounded-lg">
              <option disabled value="">Seleccione tipo</option>
              <option value="DIRECTO">DIRECTO</option>
              <option value="INDIRECTO">INDIRECTO</option>
            </select>
          </div>

        </div>
      </div>


    </div>

    <!--  Skeleton Loader -->
    <div v-if="loading" class="space-y-2 animate-pulse">
      <div v-for="i in 8" :key="i" class="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
        <div class="h-4 bg-gray-200 rounded w-10"></div>
        <div class="h-4 bg-gray-200 rounded w-32"></div>
        <div class="h-4 bg-gray-200 rounded w-24"></div>
        <div class="h-4 bg-gray-200 rounded w-40"></div>
        <div class="h-4 bg-gray-200 rounded w-28"></div>
        <div class="h-4 bg-gray-200 rounded w-20"></div>
        <div class="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>

    <!--  Tabla -->
    <div v-else>
      <TableDinamic :data="filteredData" :columns="columns" @row-click="openCustomerModal" />
    </div>

    <!-- MODAL REUTILIZABLE -->
    <ModalReutilizable :show="showModal" @close="closeModal">

      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Editar Cliente</h2>

        <div class="space-y-2 mb-3">
          <input v-model="nuevoCliente.name" placeholder="Nombre" class="w-full border px-3 py-2 rounded" />
          <input v-model="nuevoCliente.nit" placeholder="NIT" class="w-full border px-3 py-2 rounded" />
          <input v-model="nuevoCliente.email" placeholder="Correo electrónico"
            class="w-full border px-3 py-2 rounded" />
          <input v-model="nuevoCliente.phone" placeholder="Contacto" class="w-full border px-3 py-2 rounded" />
          <input v-model="nuevoCliente.document" placeholder="Documento" class="w-full border px-3 py-2 rounded" />
          <input v-model="nuevoCliente.contactName" placeholder="Contacto de referencia"
            class="w-full border px-3 py-2 rounded" />
          <input v-model="nuevoCliente.reference" placeholder="Referencia" class="w-full border px-3 py-2 rounded" />
        </div>

        <spam>{{ nuevoCliente.type }}
        </spam>




        <div class="mt-4 text-right">
          <button class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" @click="actualizarCliente"
            :disabled="!nuevoCliente.name">
            Guardar cambios
          </button>
        </div>
      </div>

    </ModalReutilizable>

  </div>
</template>