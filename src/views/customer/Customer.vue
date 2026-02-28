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
      <h1 class="text-[22px] font-bold text-text-1 font-['Plus_Jakarta_Sans',sans-serif]">Listado de Clientes</h1>

      <div class="flex items-center gap-3">
        <!-- Buscador -->
        <div class="relative w-80">
          <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-2.5 h-4 w-4 text-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Buscar cliente..."
            class="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-border rounded-full text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" />
        </div>
      </div>
    </div>

    <!-- Si no hay resultados -->
    <div v-if="!loading && filteredData.length === 0" class="p-6 text-center border border-border rounded-[var(--r-md)] bg-[#F8FAFC] mb-3">
      <p class="text-lg text-gray-600 mb-3">No se encontraron resultados para "{{ searchQuery }}".</p>

      <div class="flex justify-between items-center mb-6">
        <div class="flex flex-col items-center gap-3">
          <!--  Buscador -->

          <!-- Formulario nuevo cliente -->
          <div class="space-y-2 mb-4">
            <input v-model="nuevoCliente.name" placeholder="Nombre" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            <input type="number" v-model="nuevoCliente.nit" placeholder="Número de identificación tributaria"
              class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            <input type="email" v-model="nuevoCliente.email" placeholder="Correo electrónico"
              class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            <input v-model="nuevoCliente.phone" placeholder="Contacto" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            <input v-model="nuevoCliente.contactName" placeholder="Teléfono de referencia"
              class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            <input v-model="nuevoCliente.document" placeholder="Documento" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            <input type="text" v-model="nuevoCliente.reference" placeholder="Nota"
              class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />

            <input v-model="nuevoCliente.phone" placeholder="País" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            <input v-model="nuevoCliente.contactName" placeholder="Ciudad" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            <input v-model="nuevoCliente.document" placeholder="Dirección" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>


          <div class="flex w-full items-center gap-3">
            <button @click="openNewCustomerModal"
              class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-primary-dark transition">
              Crear nuevo cliente
            </button>

            <!-- SELECT DIRECTO / INDIRECTO -->
            <select v-model="nuevoCliente.type" class="bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary">
              <option disabled value="">Seleccione tipo</option>
              <option value="DIRECTO">DIRECTO</option>
              <option value="INDIRECTO">INDIRECTO</option>
            </select>
          </div>

        </div>
      </div>


    </div>

    <!-- Skeleton Loader -->
    <div v-if="loading" class="space-y-2 animate-pulse">
      <div v-for="i in 8" :key="i" class="flex justify-between items-center p-3 border border-border rounded-[var(--r-md)] bg-[#F8FAFC]">
        <div class="h-4 bg-[#F1F5FA] rounded-[var(--r-md)] w-10"></div>
        <div class="h-4 bg-[#F1F5FA] rounded-[var(--r-md)] w-32"></div>
        <div class="h-4 bg-[#F1F5FA] rounded-[var(--r-md)] w-24"></div>
        <div class="h-4 bg-[#F1F5FA] rounded-[var(--r-md)] w-40"></div>
        <div class="h-4 bg-[#F1F5FA] rounded-[var(--r-md)] w-28"></div>
        <div class="h-4 bg-[#F1F5FA] rounded-[var(--r-md)] w-20"></div>
        <div class="h-4 bg-[#F1F5FA] rounded-[var(--r-md)] w-16"></div>
      </div>
    </div>

    <!--  Tabla -->
    <div v-else>
      <TableDinamic :data="filteredData" :columns="columns" @row-click="openCustomerModal" />
    </div>

    <!-- MODAL REUTILIZABLE -->
    <ModalReutilizable :show="showModal" @close="closeModal">

      <div>
        <h2 class="text-[16px] font-semibold text-text-1 mb-4 font-['Plus_Jakarta_Sans',sans-serif]">Editar Cliente</h2>

        <div class="space-y-2 mb-3">
          <input v-model="nuevoCliente.name" placeholder="Nombre" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          <input v-model="nuevoCliente.nit" placeholder="NIT" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          <input v-model="nuevoCliente.email" placeholder="Correo electrónico"
            class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          <input v-model="nuevoCliente.phone" placeholder="Contacto" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          <input v-model="nuevoCliente.document" placeholder="Documento" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          <input v-model="nuevoCliente.contactName" placeholder="Contacto de referencia"
            class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          <input v-model="nuevoCliente.reference" placeholder="Referencia" class="w-full bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
        </div>

        <spam>{{ nuevoCliente.type }}
        </spam>




        <div class="mt-4 text-right">
          <button class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition" @click="actualizarCliente"
            :disabled="!nuevoCliente.name">
            Guardar cambios
          </button>
        </div>
      </div>

    </ModalReutilizable>

  </div>
</template>