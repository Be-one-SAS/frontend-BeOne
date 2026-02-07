<template>
    <div>
        <label class="block text-gray-800 font-sm text-sm mb-1">Lista de precios</label>
        <div class="relative flex items-center gap-2">
            <input v-model="search" @focus="abrirModalClientes" placeholder="Buscar grupo..."
                class="w-full border border-gray-300 rounded-full px-3 py-2 text-gray-800 cursor-pointer" readonly />
        </div>

        <!-- Modal de búsqueda -->
        <ModalReutilizable :show="openModal" @close="openModal = false">
            <div>
                <h2 class="text-lg font-semibold text-gray-800 mb-2">Seleccionar Grupo</h2>

                <input v-model="search" placeholder="Buscar boxName..."
                    class="w-full border border-gray-300 rounded-full px-3 py-2 mb-4" />

                <ul class="max-h-60 overflow-auto space-y-1" v-if="filteredClientes.length">
                    <li v-for="cliente in filteredClientes" :key="cliente.id"
                        class="p-2 border rounded-full hover:bg-gray-100 cursor-pointer"
                        @click="seleccionarCliente(cliente)">
                        {{ cliente.name }}
                    </li>
                </ul>

                <div v-else class="text-gray-500 italic mb-4">
                    No hay coincidencias.
                </div>
            </div>
        </ModalReutilizable>

        <!-- Modal de edición (sin cambios) -->
        <ModalReutilizable :show="modalEditar" @close="modalEditar = false">
            <div>
                <h2 class="text-lg font-semibold text-gray-800 mb-4">Editar Cliente</h2>

                <div class="space-y-2">
                    <input v-model="nuevoCliente.name" placeholder="Nombre" class="w-full border px-3 py-2 rounded" />
                    <input v-model="nuevoCliente.nit" placeholder="NIT" class="w-full border px-3 py-2 rounded" />
                    <input v-model="nuevoCliente.email" placeholder="Correo electrónico"
                        class="w-full border px-3 py-2 rounded" />
                    <input v-model="nuevoCliente.phone" placeholder="Contacto"
                        class="w-full border px-3 py-2 rounded" />
                    <input v-model="nuevoCliente.document" placeholder="Documento"
                        class="w-full border px-3 py-2 rounded" />
                    <input v-model="nuevoCliente.contactName" placeholder="Contacto de referencia"
                        class="w-full border px-3 py-2 rounded" />
                    <input v-model="nuevoCliente.reference" placeholder="Referencia"
                        class="w-full border px-3 py-2 rounded" />
                </div>

                <div class="flex items-center gap-4 mt-3">
                    <label class="flex items-center gap-1">
                        <input type="radio" value="INDIRECTO" v-model="nuevoCliente.type" />
                        INDIRECTO
                    </label>
                    <label class="flex items-center gap-1">
                        <input type="radio" value="DIRECTO" v-model="nuevoCliente.type" />
                        DIRECTO
                    </label>
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

// Filtro
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
</script>