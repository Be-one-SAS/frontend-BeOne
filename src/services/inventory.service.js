import api from './api'

/** GET /inventory — lista paginada con filtros */
export const getInventory = async (params = {}) => {
  const res = await api.get('/inventory', { params })
  return res.data
}

/** GET /inventory/:id — detalle completo */
export const getInventoryItem = async (id) => {
  const res = await api.get(`/inventory/${id}`)
  return res.data
}

/** POST /inventory/scan — registrar escaneo QR / NFC / MANUAL */
export const scanInventoryItem = async ({ code, method }) => {
  const res = await api.post('/inventory/scan', { code, method })
  return res.data
}

/** PATCH /inventory/:id/status — cambiar availabilityStatus */
export const updateItemStatus = async (id, { status, notes, method }) => {
  const res = await api.patch(`/inventory/${id}/status`, { status, notes, method })
  return res.data
}

/** PATCH /inventory/:id/condition — cambiar conditionStatus */
export const updateItemCondition = async (id, { condition, notes }) => {
  const res = await api.patch(`/inventory/${id}/condition`, { condition, notes })
  return res.data
}

/** PATCH /inventory/:id/location — actualizar ubicación */
export const updateItemLocation = async (id, { ubicacion }) => {
  const res = await api.patch(`/inventory/${id}/location`, { ubicacion })
  return res.data
}

/** POST /inventory/:id/generate-qr — generar y asignar código QR */
export const generateQR = async (id) => {
  const res = await api.post(`/inventory/${id}/generate-qr`)
  return res.data
}

/** GET /inventory/:id/reservations — reservas activas y próximas */
export const getItemReservations = async (id) => {
  const res = await api.get(`/inventory/${id}/reservations`)
  return res.data
}

/** GET /inventory/:id/history — últimos movimientos */
export const getItemHistory = async (id) => {
  const res = await api.get(`/inventory/${id}/history`)
  return res.data
}
