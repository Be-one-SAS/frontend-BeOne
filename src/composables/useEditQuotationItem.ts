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

  const abrirModalEdicion = (item: any) => {
    Object.assign(productoEditado, item)
    modalEditarProducto.value = true
  }

  const cerrarModalEdicion = () => {
    modalEditarProducto.value = false
  }

  const guardarEdicionProducto = () => {
    const index = items.value.findIndex((i: any) => i.id === productoEditado.id)
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