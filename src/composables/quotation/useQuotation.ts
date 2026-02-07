import { reactive, computed, ref } from 'vue'

import {
  createQuotation,
  getQuotationById,
  updateQuotation
} from '../../services/quotation.service'


export function useQuotation() {

  /* =========================
   * STATE
   ========================= */

  const loading = ref(false)
  const quotationId = ref<number | null>(null)
  const modalCotizacionExitosa = ref(false)

  const cotizacion = reactive({
    numero: 2,
    fechaCotizacion: '',
    description: '',
    agenteComercial: '',
    cliente: '',
    empresa: '',
    contacto: '',
    correo: '',
    celular: '',
    ubicacion: '',
    linkMaps: '',
    fechaInicioEvento: '',
    fechaFinEvento: '',
    fechaInicioMontaje: '',
    fechaFinMontaje: '',
    horarioInicioMontaje: '00:00',
    horarioFinMontaje: '00:00',
    horarioInicio: '00:00',
    horarioFin: '00:00',
    asistentes: 10,
    vigencia: '15 días',
    unidadEjecucion: 'Nivel Nacional',
    tipoSuelo: '',
    cantidadJornada: 1,
    cantidadProducto: 1,
    quotationStatusId: 1
  })

  const items = ref<any[]>([])

  /* =========================
   * COMPUTEDS
   ========================= */

  const subtotal = computed(() =>
    items.value.reduce(
      (sum, item) =>
        sum + item.unitPrice * item.cantidadProducto * item.cantidadJornada,
      0
    )
  )

  const totalDescuentos = computed(() =>
    items.value.reduce((sum, item) => sum + (item.descuento || 0), 0)
  )

  const total = computed(() => subtotal.value - totalDescuentos.value)

  /* =========================
   * ACTIONS
   ========================= */

  const startQuote = () => {
    quotationId.value = null
    items.value = []
  }

  const loadQuotation = async (id: number) => {
    loading.value = true
    try {
      const { data } = await getQuotationById(id)
      Object.assign(cotizacion, data)
      items.value = data.items || []
      quotationId.value = id
    } finally {
      loading.value = false
    }
  }

const saveQuotation = async () => {
  loading.value = true

  try {
    //  1. Sacamos las fechas y horarios FUERA del root
    const {
      fechaInicioEvento,
      fechaFinEvento,
      fechaInicioMontaje,
      fechaFinMontaje,
      horarioInicio,
      horarioFin,
      horarioInicioMontaje,
      horarioFinMontaje,
      ...safeCotizacion
    } = cotizacion

    //  2. Payload limpio y válido para backend
    const payload = {
      ...safeCotizacion, //  ya NO incluye fechas del calendario

      items: items.value,
      //subtotal: subtotal.value,
      total: total.value,

      operationWindow: {
        fechaInicioEvento: fechaInicioEvento,
        fechaFinEvento: fechaFinEvento,
        fechaInicioMontaje: fechaInicioMontaje,
        fechaFinMontaje: fechaFinMontaje,
        horarioInicio,
        horarioFin,
        horarioInicioMontaje,
        horarioFinMontaje,
      }
    }

    if (quotationId.value) {
      await updateQuotation(quotationId.value, payload)
    } else {
      const { data } = await createQuotation(payload)
      quotationId.value = data.id
      modalCotizacionExitosa.value = true
    }

  } finally {
    loading.value = false
  }
}

  const changeStatus = (statusId: number) => {
    cotizacion.quotationStatusId = statusId
  }

  /* =========================
   * EXPORT
   ========================= */

  return {
    // state
    cotizacion,
    items,
    quotationId,
    loading,
    modalCotizacionExitosa,

    // computed
    subtotal,
    totalDescuentos,
    total,

    // actions
    startQuote,
    loadQuotation,
    saveQuotation,
    changeStatus
  }
}