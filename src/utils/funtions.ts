

export function calcularResumenDesdeTotal(total: number, totalSummary: any, descuento: number = 0) {
  const IVA = 0.19

  // Total antes del descuento
  totalSummary.valorTotal = total

  // Cálculo base
  const subtotal = total / (1 + IVA)
  const iva = subtotal * IVA

  // Descuentos
  const descuentoValor = subtotal * (descuento / 100)
  const ivaDescuento = descuentoValor * IVA

  // Finales
  totalSummary.subtotal = +subtotal.toFixed(2)
  totalSummary.iva = +iva.toFixed(2)

  totalSummary.subtotalDescuento = +descuentoValor.toFixed(2)
  totalSummary.ivaDescuento = +ivaDescuento.toFixed(2)
  totalSummary.valorTotalDescuento = +(descuentoValor + ivaDescuento).toFixed(2)

  totalSummary.subtotalFinal = +(subtotal - descuentoValor).toFixed(2)
  totalSummary.ivaFinal = +(iva - ivaDescuento).toFixed(2)
  totalSummary.valorTotalFinal = +(total - totalSummary.valorTotalDescuento).toFixed(2)
}