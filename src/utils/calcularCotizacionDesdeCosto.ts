export interface CotizacionResultado {
  // UNITARIO
  costoUnitario: number
  precioBrutoUnitario: number
  subtotalSinIVAUnitario: number
  ivaUnitario: number
  totalConIVAUnitario: number
  precioFinalUnitario: number

  // TOTALES
  cantidad: number
  costoTotal: number
  precioBrutoTotal: number
  subtotalSinIVATotal: number
  ivaTotal: number
  totalConIVATotal: number
  precioFinalTotal: number

  // CONTROL
  margenTotal: number
  utilidadTotal: number
}


export function calcularCotizacionDesdeCosto(
  costoUnitario: number,
  cantidad: number,
  margenVariable: number,
) {
  const margenFijo = 20
  const margenTotal = margenFijo + margenVariable

  const precioUnitario = costoUnitario / (1 - margenTotal / 100)
  const subtotalVenta = precioUnitario * cantidad
  const costoTotal = costoUnitario * cantidad

  const ica = subtotalVenta * 0.00966
  const retefuente = subtotalVenta * 0.04
  const comision = subtotalVenta * 0.03
  const renta = subtotalVenta * 0.06
  const cuatroXMil = subtotalVenta * 0.00456
  const gastosFinancieros = subtotalVenta * 0.01
  const gastosAdm = costoTotal * 0.01

  const iva = subtotalVenta * 0.19
  const total = subtotalVenta + iva

  const utilidadProyectada =
    subtotalVenta
    - costoTotal
    - ica
    - retefuente
    - comision
    - renta
    - cuatroXMil
    - gastosFinancieros
    - gastosAdm

  const utilidadFinal = utilidadProyectada - comision

  return {
    precioUnitario,
    subtotalVenta,
    costoTotal,
    iva,
    total,
    utilidadProyectada,
    utilidadFinal,
  }
}