import api from './api'

const BASE = '/encuestas'

// ── Encuesta CRUD ──────────────────────────────────────────────────
export const getEncuestas     = () => api.get(BASE)
export const getEncuesta      = (id) => api.get(`${BASE}/${id}`)
export const createEncuesta   = (quotationId, titulo) => api.post(BASE, { quotationId, titulo })
export const updateEncuesta   = (id, data) => api.patch(`${BASE}/${id}`, data)
export const toggleEncuesta   = (id) => api.patch(`${BASE}/${id}/toggle`)
export const deleteEncuesta   = (id) => api.delete(`${BASE}/${id}`)

// ── Items ──────────────────────────────────────────────────────────
export const addItem          = (encuestaId, data) => api.post(`${BASE}/${encuestaId}/items`, data)
export const updateItem       = (encuestaId, itemId, data) => api.patch(`${BASE}/${encuestaId}/items/${itemId}`, data)
export const deleteItem       = (encuestaId, itemId) => api.delete(`${BASE}/${encuestaId}/items/${itemId}`)
export const reorderItems     = (encuestaId, orderedIds) => api.patch(`${BASE}/${encuestaId}/items/reorder`, { orderedIds })

// ── Imagen portada ─────────────────────────────────────────────────
export const uploadImagen = (encuestaId, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post(`${BASE}/${encuestaId}/imagen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// ── Públicos (sin auth) ────────────────────────────────────────────
export const getEncuestaPublic  = (token) => api.get(`${BASE}/public/${token}`)
export const responderEncuesta  = (token, data) => api.post(`${BASE}/public/${token}/responder`, data)
