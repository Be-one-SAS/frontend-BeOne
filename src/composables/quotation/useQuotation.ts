import { reactive, computed, ref } from 'vue'

import {
  createQuotation,
  getQuotationById,
  updateQuotation,
  addQuotationItems,
  addThirdPartyQuotationItems,
  addQuotationMember // ✅ ADDED
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
    clienteId: null as number | null,
    listaPrecio: '' as string,
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
    createdById: null as number | null,
    version: 1,
    members: [] as any[],
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

  // ── Resumen financiero ────────────────────────────────────────

  // Calcular subtotal de un item propio (sin descuento)
  const calcularSubtotalItem = (item: any) =>
    (item.unitPrice || 0) * (item.cantidadProducto || 0) * (item.cantidadJornada || 0)

  // Calcular total de un item propio (con descuento)
  const calcularTotalItem = (item: any) => {
    const subtotal = calcularSubtotalItem(item)
    const descuento = (item.descuentoPct || 0)
    return subtotal - (subtotal * descuento / 100)
  }

  // Calcular subtotal de un item tercero (sin descuento)
  // Usa subtotalVenta (precio venta × cantidad) calculado por el API.
  // Fallback a precioUnitario × cantidad para ítems sin desglose, y a costoUnitario para datos legacy.
  const calcularSubtotalTercero = (item: any) => {
    if (item.subtotalVenta != null) return item.subtotalVenta
    if (item.precioUnitario != null) return item.precioUnitario * (item.cantidad || 1)
    return (item.costoUnitario || 0) * (item.cantidad || 1)
  }

  // Calcular total de un item tercero (con descuento)
  const calcularTotalTercero = (item: any) => {
    const subtotal = calcularSubtotalTercero(item)
    const descuento = (item.descuentoPct || 0)
    return subtotal - (subtotal * descuento / 100)
  }

  // Subtotal SIN descuentos (propios)
  const subtotalPropiosSinDescuento = computed(() =>
    items.value.reduce((sum, item) => sum + calcularSubtotalItem(item), 0)
  )

  // Subtotal SIN descuentos (terceros)
  const subtotalTercerosSinDescuento = computed(() =>
    itemsTerceros.value.reduce((sum, item) => sum + calcularSubtotalTercero(item), 0)
  )

  // Subtotal total SIN descuentos
  const subtotalSinDescuento = computed(() =>
    subtotalPropiosSinDescuento.value + subtotalTercerosSinDescuento.value
  )

  // Total de descuentos aplicados en ambas tablas
  const totalDescuentos = computed(() => {
    const descuentosPropios = items.value.reduce(
      (sum, item) => sum + (calcularSubtotalItem(item) * (item.descuentoPct || 0) / 100), 0
    )
    const descuentosTerceros = itemsTerceros.value.reduce(
      (sum, item) => sum + (calcularSubtotalTercero(item) * (item.descuentoPct || 0) / 100), 0
    )
    return descuentosPropios + descuentosTerceros
  })

  // Subtotal CON descuentos (propios) - para mostrar
  const subtotalPropios = computed(() =>
    items.value.reduce((sum, item) => sum + calcularTotalItem(item), 0)
  )

  // Subtotal CON descuentos (terceros) - para mostrar
  const subtotalTerceros = computed(() =>
    itemsTerceros.value.reduce((sum, item) => sum + calcularTotalTercero(item), 0)
  )

  // Totales: suma de ambas tablas (con descuentos aplicados)
  const subtotalGeneral = computed(() => subtotalPropios.value + subtotalTerceros.value)

  // IVA: calculado sobre el total CON descuentos (19%)
  const ivaGeneral = computed(() => subtotalGeneral.value * 0.19)

  // Descuento global aplicado sobre el subtotal
  const descuentoValor = computed(() =>
    subtotalGeneral.value * ((cotizacion.descuentoPct || 0) / 100)
  )

  // Total general: Subtotal - Descuento Global + IVA
  const totalGeneral = computed(() =>
    subtotalGeneral.value - descuentoValor.value + ivaGeneral.value
  )

  // Alias para compatibilidad con importaciones existentes
  const total = computed(() => subtotalGeneral.value)

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
      cotizacion.createdById = data.createdById // ✅ ADDED

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
        descuentoPct:     typeof it.descuentoPct === 'number' ? it.descuentoPct : 0,
      }))

      cotizacion.members = data.members || [] // ✅ ADDED

      quotationId.value = id
    } finally {
      loading.value = false
    }
  }

  // Maps a third-party item to the fields expected by the backend DTO
  const mapThirdPartyItem = (it: any) => ({
    catalogItemId:   it.catalogItemId ?? it.id,
    cantidad:        it.cantidad        ?? 1,
    costoUnitario:   it.costoUnitario   ?? 0,
    margenVariable:  it.margenVariable  ?? 0,
    descuentoPct:    it.descuentoPct    ?? 0,
    dispositivo:     it.dispositivo     || undefined,
    descripcion:     it.descripcion     || undefined,
    categoria:       it.categoria       || undefined,
    bodega:          it.bodega          || undefined,
    nombre:          it.nombre          || undefined,
  })

  const saveQuotation = async () => {
    loading.value = true

    try {
      // ✅ CHANGED — payload construido explícitamente, sin spread de cotizacion completo.
      // Se eliminan: operationWindow (❌ REMOVED), cliente string (❌ REMOVED),
      // numero (❌ REMOVED, backend lo genera), items en root (❌ REMOVED, se envían por separado).
      const payload: Record<string, any> = {
        // ── Campos requeridos ─────────────────────────────────────
        quotationStatusId: cotizacion.quotationStatusId,
        // Si es edición, mantenemos el createdById original
        createdById:       cotizacion.createdById || user.value!.id,

        // ── Fecha ─────────────────────────────────────────────────
        // Usamos la fecha original si existe para no sobrescribirla al editar.
        fechaCotizacion:   cotizacion.fechaCotizacion 
          ? new Date(cotizacion.fechaCotizacion).toISOString()
          : new Date().toISOString(),

        // ── Datos del cliente ─────────────────────────────────────
        // clienteId se omite del payload cuando es null (Cliente Directo) para evitar
        // que @Type(() => Number) lo convierta en 0 antes de llegar al @IsOptional() del DTO.
        ...(cotizacion.clienteId != null && { clienteId: Number(cotizacion.clienteId) }),
        listaPrecio:       cotizacion.listaPrecio  || undefined,
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
        asistentes:        cotizacion.asistentes != null ? Number(cotizacion.asistentes) : undefined,
        vigencia:          cotizacion.vigencia      || undefined,
        unidadEjecucion:   cotizacion.unidadEjecucion || undefined,
        tipoSuelo:         cotizacion.tipoSuelo     || undefined,

        // ── Cantidades ────────────────────────────────────────────
        cantidadJornada:  cotizacion.cantidadJornada  || undefined,
        cantidadProducto: cotizacion.cantidadProducto || undefined,

        // ── Descuento ─────────────────────────────────────────────
        // subtotal / descuento / total are calculated server-side.
        // Only send the user-controlled discount percentage (0 is a valid value).
        descuentoPct: cotizacion.descuentoPct ?? undefined,

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

        const ownItems = items.value
          .filter(it => it.productId != null)
          .map(it => ({
            productId:        it.productId,
            unitPrice:        it.unitPrice        ?? 0,
            cantidadJornada:  it.cantidadJornada  ?? 1,
            cantidadProducto: it.cantidadProducto ?? 1,
          }))
        if (ownItems.length > 0) {
          await addQuotationItems(quotationId.value, ownItems)
        }
        if (itemsTerceros.value.length > 0) {
          try {
            await addThirdPartyQuotationItems(quotationId.value, itemsTerceros.value.map(mapThirdPartyItem))
          } catch (e: any) {
            console.warn('[useQuotation] third-party-items endpoint error (update):', e?.response?.data ?? e)
          }
        }
      } else {
        const { data } = await createQuotation(payload)
        quotationId.value = data.id

        const ownItems = items.value
          .filter(it => it.productId != null)
          .map(it => ({
            productId:        it.productId,
            unitPrice:        it.unitPrice        ?? 0,
            cantidadJornada:  it.cantidadJornada  ?? 1,
            cantidadProducto: it.cantidadProducto ?? 1,
          }))
        if (ownItems.length > 0) {
          await addQuotationItems(data.id, ownItems)
        }
        if (itemsTerceros.value.length > 0) {
          try {
            await addThirdPartyQuotationItems(data.id, itemsTerceros.value.map(mapThirdPartyItem))
          } catch (e: any) {
            console.warn('[useQuotation] third-party-items endpoint error (create):', e?.response?.data ?? e)
          }
        }

        if (cotizacion.members?.length > 0) {
           for (const m of cotizacion.members) {
             try { await addQuotationMember(data.id, m.userId ?? m.user.id); } catch(e) {}
           }
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
    subtotalSinDescuento,
    ivaGeneral,
    descuentoValor,
    totalGeneral,

    // actions
    startQuote,
    loadQuotation,
    saveQuotation,
    changeStatus
  }
}
