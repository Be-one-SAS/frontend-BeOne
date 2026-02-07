import { ref, computed, onMounted, watch, Ref } from 'vue'

export interface Cliente {
  id?: number | string
  name?: string
  nit?: string
  email?: string
  phone?: string
  document?: string
  contactName?: string
  reference?: string
  type?: 'DIRECTO' | 'INDIRECTO'
  [key: string]: any
}

export interface UseClientManagerOptions {
  getService: () => Promise<{ data: Cliente[] }>
  createService: (data: Cliente) => Promise<{ data: Cliente }>
  updateService: (id: string | number, data: Cliente) => Promise<{ data: Cliente }>
  modelValue: Ref<string | undefined>
  dataClient: Ref<Cliente | undefined>
  emit: (event: 'update:modelValue' | 'update:dataClient', value: any) => void
  defaultType?: 'DIRECTO' | 'INDIRECTO'   // 👈 nuevo
}

export function useClientManager({
  getService,
  createService,
  updateService,
  modelValue,
  dataClient,
  emit,
  defaultType = 'INDIRECTO' // 👈 valor por defecto
}: UseClientManagerOptions) {
  const openModal = ref(false)
  const modalEditar = ref(false)
  const clientes = ref<Cliente[]>([])
  const search = ref('')

  const nuevoCliente = ref<Cliente>({
    name: '',
    nit: '',
    email: '',
    phone: '',
    document: '',
    contactName: '',
    reference: '',
    type: defaultType // 👈 se inicializa según el tipo pasado
  })

  // Obtener lista de clientes
  onMounted(async () => {
    try {
      const { data } = await getService()
      clientes.value = data || []
    } catch (error) {
      console.error('Error al obtener clientes:', error)
    }
  })

  // Sincronizar input con modelValue
  watch(
    modelValue,
    (newVal) => {
      search.value = newVal || ''
    },
    { immediate: true }
  )

  // Sincronizar dataClient
  watch(
    dataClient,
    (cliente) => {
      if (cliente?.name) {
        search.value = cliente.name
      }
    },
    { immediate: true }
  )

  // Filtro de búsqueda
  const filteredClientes = computed(() =>
    clientes.value.filter((c) =>
      c.name?.toLowerCase().includes(search.value.toLowerCase())
    )
  )

  // Seleccionar cliente
  function seleccionarCliente(cliente: Cliente) {
    emit('update:modelValue', cliente.name)
    emit('update:dataClient', cliente)
    search.value = cliente.name || ''
    openModal.value = false
  }

  // Crear cliente nuevo
  async function agregarNuevoCliente() {
    if (!nuevoCliente.value.name?.trim()) return
    try {
      // 👇 asegúrate de mantener el tipo por defecto
      nuevoCliente.value.type = nuevoCliente.value.type || defaultType
      const { data: clienteCreado } = await createService(nuevoCliente.value)
      clientes.value.push(clienteCreado)
      seleccionarCliente(clienteCreado)
    } catch (error) {
      console.error('Error al crear cliente:', error)
    }
  }

  // Abrir modal de edición
  function abrirModalEdicion() {
    if (dataClient.value) {
      nuevoCliente.value = { ...dataClient.value }
      modalEditar.value = true
    }
  }

  // Actualizar cliente
  async function actualizarCliente() {
    try {
      if (!nuevoCliente.value.id) return
      const { data: clienteActualizado } = await updateService(
        nuevoCliente.value.id,
        nuevoCliente.value
      )

      const index = clientes.value.findIndex(
        (c) => c.id === clienteActualizado.id
      )
      if (index !== -1) clientes.value[index] = clienteActualizado

      seleccionarCliente(clienteActualizado)
      modalEditar.value = false
    } catch (error) {
      console.error('Error al actualizar cliente:', error)
    }
  }

  return {
    openModal,
    modalEditar,
    clientes,
    search,
    nuevoCliente,
    filteredClientes,
    seleccionarCliente,
    agregarNuevoCliente,
    abrirModalEdicion,
    actualizarCliente
  }
}