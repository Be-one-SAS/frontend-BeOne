import api from './api'

/**
 * GET /reports/financial
 * Devuelve KPIs, gráficas, sedes y últimas cotizaciones del período.
 * @param {{ year?: number, month?: number, sede?: string }} params
 */
export const getFinancialReport = async ({ year, month, sede } = {}) => {
  const params = {}
  if (year)  params.year  = year
  if (month) params.month = month
  if (sede)  params.sede  = sede

  const res = await api.get('/reports/financial', { params })
  return res.data
}
