import api from './api'

export const getAdminCotizaciones = async (params = {}) => {
  const res = await api.get('/administracion/cotizaciones', { params })
  return res.data
}

export const getAdminDashboard = async (sedeId) => {
  const res = await api.get('/administracion/dashboard', { params: sedeId ? { sedeId } : {} })
  return res.data
}

export const getMovimientos = async ({ sedeId, fechaInicio, fechaFin } = {}) => {
  const params = {}
  if (sedeId)       params.sedeId = sedeId
  if (fechaInicio)  params.fechaInicio = fechaInicio
  if (fechaFin)      params.fechaFin = fechaFin
  const res = await api.get('/administracion/movimientos', { params })
  return res.data
}

export const updateEstadoAdmin = async (id, estadoAdministrativo) => {
  const res = await api.patch(`/administracion/cotizaciones/${id}/estado-admin`, { estadoAdministrativo })
  return res.data
}

export const getReporteCuentasPorCobrar = async (params = {}) => {
  const res = await api.get('/administracion/reportes/cuentas-por-cobrar', { params })
  return res.data
}

export const getReportePorEjecutivo = async (params = {}) => {
  const res = await api.get('/administracion/reportes/por-ejecutivo', { params })
  return res.data
}

export const getReportePorCliente = async (params = {}) => {
  const res = await api.get('/administracion/reportes/por-cliente', { params })
  return res.data
}

export const updateResponsables = async (id, dto) => {
  const res = await api.patch(`/administracion/cotizaciones/${id}/responsables`, dto)
  return res.data
}

export const toggleValidacionAdmin = async (id) => {
  const res = await api.patch(`/administracion/cotizaciones/${id}/validar-admin`)
  return res.data
}

export const updateDatosFinancieros = async (id, dto) => {
  const res = await api.patch(`/administracion/cotizaciones/${id}/datos-financieros`, dto)
  return res.data
}

export const updateInfoGeneral = async (id, dto) => {
  const res = await api.patch(`/administracion/cotizaciones/${id}/info-general`, dto)
  return res.data
}

export const getAdminCotizacionDetail = async (id) => {
  const res = await api.get(`/administracion/cotizaciones/${id}`)
  return res.data
}

export const uploadPlanimetria = async (id, file) => {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post(`/administracion/cotizaciones/${id}/planimetria`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const deletePlanimetria = async (id) => {
  const res = await api.delete(`/administracion/cotizaciones/${id}/planimetria`)
  return res.data
}

export const getDocumentos = async (id) => {
  const res = await api.get(`/administracion/cotizaciones/${id}/documentos`)
  return res.data
}

export const downloadDocumentosZip = async (id, filename) => {
  const res = await api.get(`/administracion/cotizaciones/${id}/documentos/zip`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `documentos-${id}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
