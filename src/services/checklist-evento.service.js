import api from './api'

const base = (id) => `/checklist-evento/public/${id}`

export const getChecklistEvento = (quotationId) =>
  api.get(base(quotationId)).then(r => r.data)

export const toggleChecklistItem = (quotationId, juegoId, aspectoId, completado) =>
  api.post(`${base(quotationId)}/check`, { juegoId, aspectoId, completado }).then(r => r.data)

export const submitChecklistCheckin = (quotationId, payload, juegoPhotos = {}, onProgress = null) => {
  const form = new FormData()
  for (const [k, v] of Object.entries(payload)) {
    if (v != null && v !== '') form.append(k, String(v))
  }
  // Per-juego photos: fieldname = foto_<juegoId>
  for (const [juegoId, photoList] of Object.entries(juegoPhotos)) {
    for (const f of photoList) form.append(`foto_${juegoId}`, f)
  }
  return api.post(`${base(quotationId)}/submit`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  }).then(r => r.data)
}
