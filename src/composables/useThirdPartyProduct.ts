import { reactive, ref } from 'vue'
import { thirdPartyCatalog } from '../services/products.service'


export function useThirdPartyProduct(items: any, cotizacion: any) {
  const modalNuevoProducto = ref(false)

  const productoTercero = reactive({
    dispositivo: '',
    descripcion: '',
    precios: 0,
    categoria: '',
    incluyeTransporte: false,
    medidas: ''
  })

  const abrirModal = () => (modalNuevoProducto.value = true)
  const cerrarModal = () => (modalNuevoProducto.value = false)

  const guardarProducto = async () => {
    const payload = {
      dispositivo: productoTercero.dispositivo,
      descripcion: productoTercero.descripcion,
      valorBase: Number(productoTercero.precios),
      categoria: productoTercero.categoria,
      incluyeTransporteBogMde: productoTercero.incluyeTransporte ? 'SI' : 'NO',
      medidas: productoTercero.medidas
    }

    const { data } = await thirdPartyCatalog(payload)

    items.value.push({
      isThirdParty: true,
      thirdPartyCatalogProductId: data.id,
      category: data.categoria,
      dispositivo: data.dispositivo,
      descripcion: data.descripcion,
      incluyeTransporte: data.incluyeTransporteBogMde,
      medidas: data.medidas,
      estado: 'PRODUCTO EXTERNO',
      cantidadJornada: cotizacion.cantidadJornada,
      cantidadProducto: cotizacion.cantidadProducto,
      unitPrice: data.valorBase
    })

    cerrarModal()
  }

  return {
    modalNuevoProducto,
    productoTercero,
    abrirModal,
    cerrarModal,
    guardarProducto
  }
}