<template>
  <div>
    <label class="text-[13px] font-medium text-[#374151] mb-1 block">Clientes indirectos o finales</label>
    <div class="relative flex items-center gap-2">
      <div class="relative w-full">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input v-model="search" @focus="openModal = true" placeholder="Buscar cliente..."
          class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full pl-9 pr-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] cursor-pointer transition-colors" readonly />
      </div>
      <button v-if="props.dataClient && props.dataClient.name" @click="abrirModalEdicion"
        class="h-[37px] w-[37px] flex-shrink-0 bg-[#EEF4FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#054EAF] flex items-center justify-center rounded-full transition-colors"
        title="Editar cliente">
        <IconEdit class="w-[18px] h-[18px]" />
      </button>
    </div>

    <!-- Modal de búsqueda/creación -->
    <ModalReutilizable :show="openModal" @close="openModal = false">
      <div class="p-1">
        <h2 class="text-[16px] font-bold text-[#0F1A2E] mb-4 font-['Plus_Jakarta_Sans',sans-serif]">Seleccionar Cliente Final</h2>

        <div class="relative mb-4">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input v-model="search" placeholder="Buscar cliente por nombre..."
            class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full pl-9 pr-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
        </div>

        <ul class="max-h-[240px] overflow-auto pr-2 space-y-1 mb-4 custom-scrollbar" v-if="filteredClientes.length">
          <li v-for="cliente in filteredClientes" :key="cliente.id"
            class="px-4 py-3 border border-transparent rounded-[12px] hover:bg-[#F8FAFC] hover:border-[#E5EAF0] cursor-pointer transition-all flex items-center gap-3" @click="seleccionarCliente(cliente)">
            <div class="w-8 h-8 rounded-full bg-[#EEF4FF] text-[#054EAF] flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                {{ cliente.name ? cliente.name.charAt(0).toUpperCase() : 'C' }}
            </div>
            <div class="flex flex-col">
                <span class="text-[13px] font-medium text-[#0F1A2E]">{{ cliente.name }}</span>
                <span v-if="cliente.nit || cliente.document" class="text-[11px] text-[#64748B]">{{ cliente.nit || cliente.document }}</span>
            </div>
          </li>
        </ul>

        <div v-else class="text-center py-6 mb-4 bg-[#F8FAFC] rounded-[12px] border border-dashed border-[#E5EAF0]">
            <div class="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <p class="text-[13px] text-[#0F1A2E] font-medium mb-1">No se encontró el cliente</p>
            <p class="text-[12px] text-[#64748B]">Completa los datos abajo para crearlo.</p>
        </div>

        <!-- Formulario nuevo cliente -->
        <div class="space-y-3 mb-5" v-if="!filteredClientes.length">
          <h3 class="text-[14px] font-semibold text-[#0F1A2E] mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#054EAF]"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Nuevo Cliente Final
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <input v-model="nuevoCliente.name" placeholder="Nombre completo *" class="w-full bg-white border border-[#E5EAF0] rounded-[8px] px-3 py-[8px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
            </div>
            <div>
              <input v-model="nuevoCliente.nit" placeholder="NIT" class="w-full bg-white border border-[#E5EAF0] rounded-[8px] px-3 py-[8px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
            </div>
            <div>
              <input v-model="nuevoCliente.email" placeholder="Correo electrónico" class="w-full bg-white border border-[#E5EAF0] rounded-[8px] px-3 py-[8px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
            </div>
            <div>
              <input v-model="nuevoCliente.phone" placeholder="Contacto (Teléfono)" class="w-full bg-white border border-[#E5EAF0] rounded-[8px] px-3 py-[8px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
            </div>
            <div>
              <input v-model="nuevoCliente.document" placeholder="Documento" class="w-full bg-white border border-[#E5EAF0] rounded-[8px] px-3 py-[8px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
            </div>
            <div class="col-span-2">
              <input v-model="nuevoCliente.contactName" placeholder="Contacto de referencia" class="w-full bg-white border border-[#E5EAF0] rounded-[8px] px-3 py-[8px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
            </div>
            <div class="col-span-2">
              <input v-model="nuevoCliente.reference" placeholder="Referencia" class="w-full bg-white border border-[#E5EAF0] rounded-[8px] px-3 py-[8px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
            </div>
          </div>
          <div class="mt-2">
            <span class="text-[11px] font-medium text-[#054EAF] bg-[#EEF4FF] px-2 py-0.5 rounded border border-[#BFDBFE]">TIPO: {{ nuevoCliente.type }}</span>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-[#F1F5F9]">
          <button class="px-[16px] py-[9px] text-[13px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E5EAF0] rounded-full hover:bg-[#EEF4FF] hover:text-[#054EAF] hover:border-[#BFDBFE] transition-colors" @click="openModal = false">
            Cancelar
          </button>
          <button v-if="!filteredClientes.length" class="px-[16px] py-[9px] text-[13px] font-semibold bg-[#054EAF] text-white rounded-full hover:bg-[#03368A] shadow-[0_2px_8px_rgba(5,78,175,0.18)] transition-all disabled:opacity-50 disabled:cursor-not-allowed" @click="agregarNuevoCliente"
            :disabled="!nuevoCliente.name">
            Agregar nuevo cliente
          </button>
        </div>
      </div>
    </ModalReutilizable>

    <!-- Modal de edición -->
    <ModalReutilizable :show="modalEditar" @close="modalEditar = false">
      <div class="p-1">
        <h2 class="text-[16px] font-bold text-[#0F1A2E] mb-4 font-['Plus_Jakarta_Sans',sans-serif]">Editar Cliente</h2>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="col-span-2">
            <label class="text-[12px] text-[#64748B] mb-1 block">Nombre</label>
            <input v-model="nuevoCliente.name" placeholder="Nombre completo" class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full px-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
          </div>
          <div>
            <label class="text-[12px] text-[#64748B] mb-1 block">NIT</label>
            <input v-model="nuevoCliente.nit" placeholder="NIT" class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full px-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
          </div>
          <div>
            <label class="text-[12px] text-[#64748B] mb-1 block">Correo electrónico</label>
            <input v-model="nuevoCliente.email" placeholder="Correo electrónico" class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full px-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
          </div>
          <div>
            <label class="text-[12px] text-[#64748B] mb-1 block">Contacto</label>
            <input v-model="nuevoCliente.phone" placeholder="Contacto (Teléfono)" class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full px-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
          </div>
          <div>
            <label class="text-[12px] text-[#64748B] mb-1 block">Documento</label>
            <input v-model="nuevoCliente.document" placeholder="Documento" class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full px-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
          </div>
          <div>
            <label class="text-[12px] text-[#64748B] mb-1 block">Contacto de ref.</label>
            <input v-model="nuevoCliente.contactName" placeholder="Contacto de referencia" class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full px-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
          </div>
          <div>
            <label class="text-[12px] text-[#64748B] mb-1 block">Referencia</label>
            <input v-model="nuevoCliente.reference" placeholder="Referencia" class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full px-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
          </div>
        </div>
        
        <div class="mb-2">
          <span class="text-[11px] font-medium text-[#054EAF] bg-[#EEF4FF] px-2 py-0.5 rounded border border-[#BFDBFE]">TIPO: {{ nuevoCliente.type }}</span>
        </div>

        <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-[#F1F5F9]">
          <button class="px-[16px] py-[9px] text-[13px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E5EAF0] rounded-full hover:bg-[#EEF4FF] hover:text-[#054EAF] hover:border-[#BFDBFE] transition-colors" @click="modalEditar = false">
            Cancelar
          </button>
          <button class="px-[16px] py-[9px] text-[13px] font-semibold bg-[#16A34A] text-white rounded-full hover:bg-[#15803D] shadow-[0_2px_8px_rgba(22,163,74,0.18)] transition-all disabled:opacity-50 disabled:cursor-not-allowed" @click="actualizarCliente"
            :disabled="!nuevoCliente.name">
            Guardar cambios
          </button>
        </div>
      </div>
    </ModalReutilizable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import { createClient, getSuppliers, updateClient } from '../../services/suppliers.service'
import IconEdit from '../../Icons/IconEdit.vue'

const props = defineProps({
  modelValue: String,
  dataClient: Object
})

const emit = defineEmits(['update:modelValue', 'update:dataClient'])

const openModal = ref(false)
const modalEditar = ref(false)
const clientes = ref([])
const search = ref('')

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

// Obtener lista de clientes
onMounted(async () => {
  try {
    const suppliers = await getSuppliers()

    clientes.value = suppliers.data
  } catch (error) {
    console.error('Error al obtener clientes:', error)
  }
})

// Sincronizar input con valor recibido
watch(
  () => props.modelValue,
  newVal => {
    search.value = newVal || ''
  },
  { immediate: true }
)

// Si se recibe dataClient (modo edición), prellenamos
watch(
  () => props.dataClient,
  (cliente) => {
    if (cliente && cliente.name) {
      search.value = cliente.name
    }
  },
  { immediate: true }
)

// Filtro de clientes
const filteredClientes = computed(() =>
  clientes.value.filter(c =>
    c.name?.toLowerCase().includes(search.value.toLowerCase())
  )
)

// Seleccionar cliente
function seleccionarCliente(cliente) {
  emit('update:modelValue', cliente.name)
  emit('update:dataClient', cliente)
  search.value = cliente.name
  openModal.value = false
}

// Crear nuevo cliente
async function agregarNuevoCliente() {
  if (nuevoCliente.value.name.trim()) {
    try {
      const response = await createClient(nuevoCliente.value)
      const clienteCreado = response.data

      emit('update:modelValue', clienteCreado.name)
      emit('update:dataClient', clienteCreado)
      search.value = clienteCreado.name
      openModal.value = false

      clientes.value.push(clienteCreado)
    } catch (error) {
      console.error('Error al crear nuevo cliente:', error)
    }
  }
}

// Abrir modal de edición
function abrirModalEdicion() {
  if (props.dataClient) {
    nuevoCliente.value = { ...props.dataClient }
    modalEditar.value = true
  }
}

// Actualizar cliente
async function actualizarCliente() {
  try {
    const response = await updateClient(nuevoCliente.value.id, {
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

    // Actualizar lista
    const index = clientes.value.findIndex(c => c.id === clienteActualizado.id)
    if (index !== -1) {
      clientes.value[index] = clienteActualizado
    }

    emit('update:modelValue', clienteActualizado.name)
    emit('update:dataClient', clienteActualizado)
    search.value = clienteActualizado.name
    modalEditar.value = false
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
  }
}
</script>