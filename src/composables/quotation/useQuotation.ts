import { reactive, computed, ref } from 'vue'

import {
  createQuotation,
  getQuotationById,
  updateQuotation,
  addQuotationItems,
  addThirdPartyQuotationItems,
} from '../../services/quotation.service'

import { useAuth } from '../../composables/useAuth' // ✅ CHANGED — para obtener createdById

export function useQuotation() {

  const { user } = useAuth() // ✅ CHANGED — instancia global del usuario autenticado

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
    clienteId: null as number | null, // ✅ CHANGED — campo correcto para relacionar con cliente (FK numérica)
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
    quotationStatusId: 1,
    descuentoPct: 0,
  })

  const items = ref<any[]>([])
  const itemsTerceros = ref<any[]>([])

  /* =========================
   * COMPUTEDS
   ========================= */

  const subtotal = computed(() =>
    items.value.reduce(
      (sum, item) =>
        sum + (item.unitPrice || 0) * (item.cantidadProducto || 0) * (item.cantidadJornada || 0),
      0
    )
  )

  const totalDescuentos = computed(() =>
    items.value.reduce((sum, item) => sum + (item.descuento || 0), 0)
  )

  const total = computed(() => subtotal.value - totalDescuentos.value)

  // ── Resumen financiero ────────────────────────────────────────
  const subtotalPropios = computed(() => subtotal.value)

  const subtotalTerceros = computed(() =>
    itemsTerceros.value.reduce((sum, item) => sum + (item.totalFactura || 0), 0)
  )

  const subtotalGeneral = computed(() => subtotalPropios.value + subtotalTerceros.value)

  const descuentoValor = computed(() =>
    subtotalGeneral.value * ((cotizacion.descuentoPct || 0) / 100)
  )

  const totalGeneral = computed(() => subtotalGeneral.value - descuentoValor.value)

  /* =========================
   * ACTIONS
   ========================= */

  const startQuote = () => {
    quotationId.value = null
    items.value = []
    itemsTerceros.value = []
  }

  const loadQuotation = async (id: number) => {
    loading.value = true
    try {
      const { data } = await getQuotationById(id)
      Object.assign(cotizacion, data)

      // Map operationWindow → flat date/time fields used by the form
      cotizacion.fechaInicioEvento    = data.operationWindow?.eventStartAt?.split('T')[0]        ?? ''
      cotizacion.horarioInicio        = data.operationWindow?.eventStartAt?.split('T')[1]?.slice(0, 5) ?? '00:00'
      cotizacion.fechaFinEvento       = data.operationWindow?.eventEndAt?.split('T')[0]          ?? ''
      cotizacion.horarioFin           = data.operationWindow?.eventEndAt?.split('T')[1]?.slice(0, 5)   ?? '00:00'
      cotizacion.fechaInicioMontaje   = data.operationWindow?.setupStartAt?.split('T')[0]        ?? ''
      cotizacion.horarioInicioMontaje = data.operationWindow?.setupStartAt?.split('T')[1]?.slice(0, 5) ?? '00:00'
      cotizacion.fechaFinMontaje      = data.operationWindow?.teardownEndAt?.split('T')[0]       ?? ''
      cotizacion.horarioFinMontaje    = data.operationWindow?.teardownEndAt?.split('T')[1]?.slice(0, 5) ?? '00:00'

      // Map items — API returns quantity but the form uses cantidadJornada/cantidadProducto
      items.value = (data.items || []).map((it: any) => ({
        ...it,
        cantidadJornada:  it.cantidadJornada  ?? it.quantity ?? 1,
        cantidadProducto: it.cantidadProducto ?? 1,
      }))

      quotationId.value = id
    } finally {
      loading.value = false
    }
  }

  const saveQuotation = async () => {
    loading.value = true

    try {
      // ✅ CHANGED — payload construido explícitamente, sin spread de cotizacion completo.
      // Se eliminan: operationWindow (❌ REMOVED), cliente string (❌ REMOVED),
      // numero (❌ REMOVED, backend lo genera), items en root (❌ REMOVED, se envían por separado).
      const payload: Record<string, any> = {
        // ── Campos requeridos ─────────────────────────────────────
        quotationStatusId: cotizacion.quotationStatusId,
        createdById:       user.value!.id,              // ✅ CHANGED — obtenido de useAuth()

        // ── Fecha en ISO 8601 ─────────────────────────────────────
        fechaCotizacion:   new Date().toISOString(),    // ✅ CHANGED — formato correcto, no string vacío

        // ── Datos del cliente ─────────────────────────────────────
        clienteId:         cotizacion.clienteId   ?? undefined, // ✅ CHANGED — número, no string "cliente"
        empresa:           cotizacion.empresa      || undefined,

        // ── Datos del agente/comercial ────────────────────────────
        agenteComercial:   cotizacion.agenteComercial || undefined,
        description:       cotizacion.description     || undefined,

        // ── Datos de contacto ─────────────────────────────────────
        contacto:          cotizacion.contacto || undefined,
        correo:            cotizacion.correo   || undefined,
        celular:           cotizacion.celular  || undefined,

        // ── Ubicación ─────────────────────────────────────────────
        ubicacion:         cotizacion.ubicacion  || undefined,
        linkMaps:          cotizacion.linkMaps   || undefined,

        // ── Evento ────────────────────────────────────────────────
        asistentes:        cotizacion.asistentes    || undefined,
        vigencia:          cotizacion.vigencia      || undefined,
        unidadEjecucion:   cotizacion.unidadEjecucion || undefined,
        tipoSuelo:         cotizacion.tipoSuelo     || undefined,

        // ── Cantidades ────────────────────────────────────────────
        cantidadJornada:  cotizacion.cantidadJornada  || undefined,
        cantidadProducto: cotizacion.cantidadProducto || undefined,

        // ── Totales ───────────────────────────────────────────────
        subtotal:     subtotalGeneral.value  || undefined,
        descuentoPct: cotizacion.descuentoPct || undefined,
        descuento:    descuentoValor.value   || undefined,
        total:        totalGeneral.value     || undefined,

        // ── Ventana operativa ─────────────────────────────────────
        // Construida como objeto anidado combinando fecha + hora
        ...(cotizacion.fechaInicioEvento && cotizacion.fechaFinEvento &&
            cotizacion.fechaInicioMontaje && cotizacion.fechaFinMontaje && {
          operationWindow: {
            setupStartAt:  `${cotizacion.fechaInicioMontaje}T${cotizacion.horarioInicioMontaje}:00.000Z`,
            eventStartAt:  `${cotizacion.fechaInicioEvento}T${cotizacion.horarioInicio}:00.000Z`,
            eventEndAt:    `${cotizacion.fechaFinEvento}T${cotizacion.horarioFin}:00.000Z`,
            teardownEndAt: `${cotizacion.fechaFinMontaje}T${cotizacion.horarioFinMontaje}:00.000Z`,
          },
        }),
      }

      if (quotationId.value) {
        await updateQuotation(quotationId.value, payload)

        if (items.value.length > 0) {
          await addQuotationItems(quotationId.value, items.value)
        }
        if (itemsTerceros.value.length > 0) {
          await addThirdPartyQuotationItems(quotationId.value, itemsTerceros.value)
        }
      } else {
        const { data } = await createQuotation(payload)
        quotationId.value = data.id

        if (items.value.length > 0) {
          await addQuotationItems(data.id, items.value)
        }
        if (itemsTerceros.value.length > 0) {
          await addThirdPartyQuotationItems(data.id, itemsTerceros.value)
        }

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
    itemsTerceros,
    quotationId,
    loading,
    modalCotizacionExitosa,

    // computed
    subtotal,
    totalDescuentos,
    total,
    subtotalPropios,
    subtotalTerceros,
    subtotalGeneral,
    descuentoValor,
    totalGeneral,

    // actions
    startQuote,
    loadQuotation,
    saveQuotation,
    changeStatus
  }
}
