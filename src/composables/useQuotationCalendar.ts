import { computed, watch } from 'vue'

export function useQuotationCalendar(cotizacion: any, items: any, modalCalendarioIncompleto: any) {
  const calendarioCompleto = computed(() => {
    const {
      fechaInicioEvento,
      fechaFinEvento,
      horarioInicio,
      horarioFin,
      fechaInicioMontaje,
      fechaFinMontaje,
      horarioInicioMontaje,
      horarioFinMontaje
    } = cotizacion

    return (
   cotizacion.fechaInicioMontaje &&
    cotizacion.fechaFinMontaje
    )
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