import api from './api'

export const getMontajes = async () => {
  const res = await api.get('/montajes')
  return res.data
}

export const upsertCheck = async ({ quotationId, itemType, itemId, completado, nota }) => {
  const res = await api.post('/montajes/check', { quotationId, itemType, itemId, completado, nota })
  return res.data
}

export const getMontajePublic = async (quotationId) => {
  const res = await api.get(`/montajes/public/${quotationId}`)
  return res.data
}

export const upsertCheckPublic = async ({ quotationId, itemType, itemId, completado, nota }) => {
  const res = await api.post('/montajes/public/check', { quotationId, itemType, itemId, completado, nota })
  return res.data
}
