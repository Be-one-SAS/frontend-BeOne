import api from './api'

const BASE = '/sedes'

export const getSedes            = () => api.get(BASE)
export const getSede             = (id) => api.get(`${BASE}/${id}`)
export const createSede          = (dto) => api.post(BASE, dto)
export const updateSede          = (id, dto) => api.patch(`${BASE}/${id}`, dto)
export const deleteSede          = (id) => api.delete(`${BASE}/${id}`)

export const asignarUsuario      = (sedeId, userId) => api.post(`${BASE}/${sedeId}/usuarios/${userId}`)
export const desasignarUsuario   = (sedeId, userId) => api.delete(`${BASE}/${sedeId}/usuarios/${userId}`)

export const getUnidadesEjecucion = () => api.get(`${BASE}/unidades-ejecucion`)
export const getUsuariosSinSede  = () => api.get(`${BASE}/usuarios/sin-sede`)
export const getAllUsuarios       = () => api.get(`${BASE}/usuarios/todos`)
