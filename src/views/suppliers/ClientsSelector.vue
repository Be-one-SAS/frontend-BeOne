<template>
  <div>
    <label class="text-[13px] font-medium text-[#374151] mb-1 block">Lista de precios</label>
    <div class="relative flex items-center gap-2">
      <div class="relative w-full">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input v-model="search" @focus="abrirModalClientes" placeholder="Buscar grupo..."
            class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full pl-9 pr-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] cursor-pointer transition-colors" readonly />
      </div>
    </div>

    <!-- Modal de búsqueda -->
    <ModalReutilizable :show="openModal" @close="openModal = false">
      <div class="p-1">
        <h2 class="text-[16px] font-bold text-[#0F1A2E] mb-4 font-['Plus_Jakarta_Sans',sans-serif]">Seleccionar Grupo</h2>

        <div class="relative mb-4">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input v-model="search" placeholder="Buscar boxName..."
            class="w-full bg-[#F8FAFC] border border-[#E5EAF0] rounded-full pl-9 pr-4 py-[9px] text-[13px] text-[#0F1A2E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#054EAF]/20 focus:border-[#054EAF] transition-colors" />
        </div>

        <ul class="max-h-[240px] overflow-auto pr-2 space-y-1 mb-2 custom-scrollbar" v-if="filteredClientes.length">
          <li v-for="cliente in filteredClientes" :key="cliente.id"
            class="px-4 py-3 border border-transparent rounded-[12px] hover:bg-[#F8FAFC] hover:border-[#E5EAF0] cursor-pointer transition-all flex items-center gap-3"
            @click="seleccionarCliente(cliente)">
            <div class="w-8 h-8 rounded-full bg-[#EEF4FF] text-[#054EAF] flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                {{ cliente.name ? cliente.name.charAt(0).toUpperCase() : 'G' }}
            </div>
            <span class="text-[13px] font-medium text-[#0F1A2E]">{{ cliente.name }}</span>
          </li>
        </ul>

        <div v-else class="text-center py-8 bg-[#F8FAFC] rounded-[12px] border border-dashed border-[#E5EAF0] mb-2">
          <div class="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <p class="text-[13px] text-[#64748B]">No hay coincidencias.</p>
        </div>
      </div>
    </ModalReutilizable>

    <!-- Modal de edición (sin cambios lógicos, estilización aplicada) -->
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

        <div class="flex items-center gap-4 mt-1 mb-2">
          <label class="flex items-center gap-2 text-[13px] text-[#0F1A2E] cursor-pointer">
            <input type="radio" value="INDIRECTO" v-model="nuevoCliente.type" class="w-4 h-4 text-[#054EAF] border-gray-300 focus:ring-[#054EAF]" />
            INDIRECTO
          </label>
          <label class="flex items-center gap-2 text-[13px] text-[#0F1A2E] cursor-pointer">
            <input type="radio" value="DIRECTO" v-model="nuevoCliente.type" class="w-4 h-4 text-[#054EAF] border-gray-300 focus:ring-[#054EAF]" />
            DIRECTO
          </label>
        </div>

        <div class="flex justify-end mt-5 pt-4 border-t border-[#F1F5F9]">
          <button class="px-[16px] py-[9px] text-[13px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E5EAF0] rounded-full hover:bg-[#EEF4FF] hover:text-[#054EAF] hover:border-[#BFDBFE] transition-colors" @click="modalEditar = false">
            Cerrar
          </button>
        </div>
      </div>
    </ModalReutilizable>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import { getBox } from '../../services/suppliers.service'

const props = defineProps({
    modelValue: String,
    dataClient: Object
})
const emit = defineEmits(['update:modelValue', 'update:dataClient'])

const openModal = ref(false)
const modalEditar = ref(false)
const clientes = ref([]) // aquí guardamos los boxName
const clientesCargados = ref(false)
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

// Cargar solo el primer grupo de productBoxes
async function cargarClientes() {
    if (clientesCargados.value) return
    try {
        const response = await getBox()
        const data = response.data || []

        // ---  NUEVO: Tomamos solo el primer grupo ---
        const primerGrupo = data[1]

        // --- Transformamos a lista de nombres ---
        clientes.value = primerGrupo.map(box => ({
            id: box.id,
            name: box.boxName   // mostramos CAFAM, COLSUBSIDIO, etc.
        }))

        clientesCargados.value = true
    } catch (error) {
        console.error('Error al obtener grupos:', error)
    }
}

async function abrirModalClientes() {
    await cargarClientes()
    openModal.value = true
}

// Prellenar si se está editando
watch(
    () => props.dataClient,
    (cliente) => {
        if (cliente && cliente.name) {
            search.value = cliente.name
        }
    },
    { immediate: true }
)

const CLIENTE_DIRECTO = { id: 'cliente_directo', name: 'Cliente Directo' }

// Filtro — siempre muestra "Cliente Directo" primero si coincide con la búsqueda
const filteredClientes = computed(() => {
    const term = search.value.toLowerCase()
    const rest = clientes.value.filter(c =>
        c.name?.toLowerCase().includes(term)
    )
    const showDirecto = !term || 'cliente directo'.includes(term)
    return showDirecto ? [CLIENTE_DIRECTO, ...rest] : rest
})

// Seleccionar cliente
function seleccionarCliente(cliente) {
    emit('update:modelValue', cliente.name)
    emit('update:dataClient', cliente)
    search.value = cliente.name
    openModal.value = false
}
</script>