import { computed, watch } from 'vue'

export function useQuotationCalendar(cotizacion: any, items: any, modalCalendarioIncompleto: any) {
  // El primer tramo son los campos planos de cotizacion; cada tramo
  // adicional (evento con huecos) debe estar completo también — uno a
  // medio llenar no debería dejar pasar la validación silenciosamente.
  const calendarioCompleto = computed(() => {
    const tramo1Completo = !!(
      cotizacion.fechaInicioEvento && cotizacion.fechaFinEvento &&
      cotizacion.fechaInicioMontaje && cotizacion.fechaFinMontaje
    )
    const adicionalesCompletos = (cotizacion.tramosAdicionales || []).every(
      (t: any) => t.fechaInicioMontaje && t.fechaFinMontaje && t.fechaInicioEvento && t.fechaFinEvento,
    )
    return tramo1Completo && adicionalesCompletos
  })

  const validarCalendario = () => {
    if (!calendarioCompleto.value) {
      modalCalendarioIncompleto.value = true
      return false
    }
    return true
  }

  // Mantiene coherencia entre fechas
  watch(
    () => [cotizacion.fechaInicioEvento, cotizacion.fechaFinEvento],
    ([inicio, fin]) => {
      if (inicio && fin && new Date(inicio) > new Date(fin)) {
        cotizacion.fechaFinEvento = inicio
      }

      items.value.forEach((item: any) => {
        if (item.fechaInicioReserva && new Date(item.fechaInicioReserva) < new Date(inicio)) {
          item.fechaInicioReserva = inicio
        }
        if (item.fechaFinReserva && new Date(item.fechaFinReserva) > new Date(fin)) {
          item.fechaFinReserva = fin
        }
      })
    }
  )

  return {
    calendarioCompleto,
    validarCalendario
  }
}