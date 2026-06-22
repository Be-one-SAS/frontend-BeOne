import api from './api'

// GET /ordenes-compra → { data: ocs[] }
export const getOrdenesCompra = async (params = {}) => {
  const res = await api.get('/ordenes-compra', { params })
  return res.data
}

// POST /ordenes-compra → { data: oc }
// Required: quotationId, proveedorNombre, descripcion, cantidad, precioUnitario
export const createOrdenCompra = async (data) => {
  const res = await api.post('/ordenes-compra', data)
  return res.data
}

// PATCH /ordenes-compra/:id/estado → { data: oc }
// estado: 'EMITIDA' | 'APROBADA' | 'RECIBIDA' | 'CANCELADA'
export const updateEstadoOC = async (id, estado) => {
  const res = await api.patch(`/ordenes-compra/${id}/estado`, { estado })
  return res.data
}
