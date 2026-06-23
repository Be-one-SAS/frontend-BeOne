import api from './api'

const base = (id) => `/checklist-evento/public/${id}`

export const getChecklistEvento = (quotationId) =>
  api.get(base(quotationId)).then(r => r.data)

export const toggleChecklistItem = (quotationId, juegoId, aspectoId, completado) =>
  api.post(`${base(quotationId)}/check`, { juegoId, aspectoId, completado }).then(r => r.data)

export const submitChecklistCheckin = (quotationId, payload, files = [], onProgress = null) => {
  const form = new FormData()
  for (const [k, v] of Object.entries(payload)) {
    if (v != null && v !== '') form.append(k, String(v))
  }
  for (const f of files) form.append('foto', f)
  return api.post(`${base(quotationId)}/submit`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  }).then(r => r.data)
}
