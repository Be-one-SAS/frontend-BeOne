import api from './api'

const base = (id) => `/checklist-evento/public/${id}`

export const getChecklistEvento = (quotationId) =>
  api.get(base(quotationId)).then(r => r.data)

export const toggleChecklistItem = (quotationId, juegoId, aspectoId, completado) =>
  api.post(`${base(quotationId)}/check`, { juegoId, aspectoId, completado }).then(r => r.data)
