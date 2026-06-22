import api from './api'

export const getAdminCotizaciones = async (params = {}) => {
  const res = await api.get('/administracion/cotizaciones', { params })
  return res.data
}

export const getAdminDashboard = async () => {
  const res = await api.get('/administracion/dashboard')
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
