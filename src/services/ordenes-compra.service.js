import api from './api'

export const createOrdenCompra = async (dto) => {
  const res = await api.post('/ordenes-compra', dto)
  return res.data
}

export const getOrdenesCompra = async (params = {}) => {
  const res = await api.get('/ordenes-compra', { params })
  return res.data
}

export const getOrdenCompra = async (id) => {
  const res = await api.get(`/ordenes-compra/${id}`)
  return res.data
}

// Selector de eventos (cotizaciones Aprobadas) para el formulario de nueva OC.
export const getQuotationsDisponiblesOC = async () => {
  const res = await api.get('/ordenes-compra/cotizaciones-disponibles')
  return res.data
}

export const updateOrdenCompraEstado = async (id, estado) => {
  const res = await api.patch(`/ordenes-compra/${id}/estado`, { estado })
  return res.data
}
