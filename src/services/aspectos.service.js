import api from './api'

export const getAspectos      = async ()         => (await api.get('/aspectos-inspeccion')).data
export const getAspectosAdmin = async ()         => (await api.get('/aspectos-inspeccion/admin')).data
export const createAspecto    = async (texto)    => (await api.post('/aspectos-inspeccion', { texto })).data
export const updateAspecto    = async (id, texto) => (await api.patch(`/aspectos-inspeccion/${id}`, { texto })).data
export const toggleAspecto    = async (id)       => (await api.patch(`/aspectos-inspeccion/${id}/toggle`)).data
export const deleteAspecto    = async (id)       => (await api.delete(`/aspectos-inspeccion/${id}`)).data
export const reorderAspectos  = async (ids)      => (await api.patch('/aspectos-inspeccion/reorder', { ids })).data
