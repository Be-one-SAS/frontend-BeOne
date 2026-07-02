import api from './api'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3003/api'

export const getRegistrosByQuotation = (quotationId) =>
  api.get(`/registros-turno/quotation/${quotationId}`).then(r => r.data)

export const createRegistro = (dto) =>
  api.post('/registros-turno', dto).then(r => r.data)

export const updateRegistro = (id, dto) =>
  api.patch(`/registros-turno/${id}`, dto).then(r => r.data)

export const deleteRegistro = (id) =>
  api.delete(`/registros-turno/${id}`).then(r => r.data)

export const getTurnoToken = (quotationId) =>
  api.post(`/registros-turno/quotation/${quotationId}/token`).then(r => r.data)

export const getReportePersonal = (quotationId) => {
  const params = quotationId ? `?quotationId=${quotationId}` : ''
  return api.get(`/registros-turno/reporte/personal${params}`).then(r => r.data)
}

export const enviarReportePersonalCorreo = (registroIds, destinatario) =>
  api.post('/registros-turno/reporte/personal/enviar-correo', { registroIds, destinatario }).then(r => r.data)

// Public — no auth
export const getTurnoPublico = (token) =>
  axios.get(`${BASE}/registros-turno/turno/${token}`).then(r => r.data)

export const registrarTurnoPublico = (token, dto) =>
  axios.post(`${BASE}/registros-turno/turno/${token}/registrar`, dto).then(r => r.data)

export const registrarTurnoExternoPublico = (token, dto) =>
  axios.post(`${BASE}/registros-turno/turno/${token}/registrar-externo`, dto).then(r => r.data)

export const marcarCumplidoTurnoPublico = (token, registroId, cumplido) =>
  axios.patch(`${BASE}/registros-turno/turno/${token}/registro/${registroId}/cumplido`, { cumplido }).then(r => r.data)
