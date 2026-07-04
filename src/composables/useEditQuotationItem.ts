import { reactive, ref } from 'vue'

export function useEditQuotationItem(items: any) {
  const modalEditarProducto = ref(false)

  const productoEditado = reactive({
    id: null,
    dispositivo: '',
    descripcion: '',
    descuento: 0,
    nota: '',
    fechaInicioReserva: '',
    fechaFinReserva: '',
    cantidadJornada: 0,
    cantidadProducto: 0,
    unitPrice: 0,
    incluyeTransporte: ''
  })

  // Referencia al objeto original del ítem que se está editando. Los ítems
  // recién agregados (aún no guardados) no tienen `id`, así que no se puede
  // buscar por id — se guarda la referencia directa, igual que `eliminarItem`.
  let itemOriginal: any = null

  const abrirModalEdicion = (item: any) => {
    itemOriginal = item
    Object.assign(productoEditado, item)
    modalEditarProducto.value = true
  }

  const cerrarModalEdicion = () => {
    modalEditarProducto.value = false
  }

  const guardarEdicionProducto = () => {
    const index = items.value.indexOf(itemOriginal)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...productoEditado }
    }
    cerrarModalEdicion()
  }

  return {
    modalEditarProducto,
    productoEditado,
    abrirModalEdicion,
    cerrarModalEdicion,
    guardarEdicionProducto
  }
}