import api from './api'

// ─────────────────────────────────────────────────────────
// EJECUTIVOS DE CUENTA SERVICE
// Base endpoint: /ejecutivos
// ─────────────────────────────────────────────────────────

/**
 * GET /ejecutivos
 * Roster de subordinados del líder logueado (o de toda la organización para
 * ADMIN/DIRECCION), con KPIs resumidos: embudo de cotizaciones, tasa de
 * cierre, ganancias y pérdidas.
 */
export const getEjecutivos = async () => {
  try {
    const response = await api.get('/ejecutivos')
    return response.data
  } catch (error) {
    console.error('[ejecutivos.service] Error en getEjecutivos:', error)
    throw error
  }
}

/**
 * GET /ejecutivos/:id
 * Detalle de un ejecutivo: mismos KPIs + listado de sus cotizaciones.
 */
export const getEjecutivoDetalle = async (id) => {
  try {
    const response = await api.get(`/ejecutivos/${id}`)
    return response.data
  } catch (error) {
    console.error(`[ejecutivos.service] Error en getEjecutivoDetalle(${id}):`, error)
    throw error
  }
}

/**
 * GET /ejecutivos/:id/comentarios
 * Bitácora de comentarios de evaluación del líder sobre el ejecutivo.
 */
export const getComentarios = async (id) => {
  try {
    const response = await api.get(`/ejecutivos/${id}/comentarios`)
    return response.data
  } catch (error) {
    console.error(`[ejecutivos.service] Error en getComentarios(${id}):`, error)
    throw error
  }
}

/**
 * POST /ejecutivos/:id/comentarios
 * Agrega un comentario a la bitácora (no editable ni eliminable).
 */
export const crearComentario = async (id, contenido) => {
  try {
    const response = await api.post(`/ejecutivos/${id}/comentarios`, { contenido })
    return response.data
  } catch (error) {
    console.error(`[ejecutivos.service] Error en crearComentario(${id}):`, error)
    throw error
  }
}
