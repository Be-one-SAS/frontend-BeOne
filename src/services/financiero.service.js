import api from './api'

const base = (id) => `/financiero/cotizacion/${id}`

export const getResumenFinanciero = (id) =>
  api.get(base(id)).then(r => r.data)

// OC Clientes
export const createOc = (id, formData) =>
  api.post(`${base(id)}/oc`, formData).then(r => r.data)

export const updateOc = (ocId, formData) =>
  api.patch(`/financiero/oc/${ocId}`, formData).then(r => r.data)

export const deleteOc = (ocId) =>
  api.delete(`/financiero/oc/${ocId}`).then(r => r.data)

// Facturas BeOne
export const createFactura = (id, formData) =>
  api.post(`${base(id)}/factura`, formData).then(r => r.data)

export const updateFactura = (factId, formData) =>
  api.patch(`/financiero/factura/${factId}`, formData).then(r => r.data)

export const deleteFactura = (factId) =>
  api.delete(`/financiero/factura/${factId}`).then(r => r.data)

// Pagos
export const createPago = (id, formData) =>
  api.post(`${base(id)}/pago`, formData).then(r => r.data)

export const updatePago = (pagoId, formData) =>
  api.patch(`/financiero/pago/${pagoId}`, formData).then(r => r.data)

export const deletePago = (pagoId) =>
  api.delete(`/financiero/pago/${pagoId}`).then(r => r.data)
