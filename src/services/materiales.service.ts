import api from './api'

export const getMaterialCategorias = (): Promise<any[]> =>
  api.get('/materiales/categorias').then(r => r.data)

export const getMaterialesBase = (params?: {
  categoriaId?: number
  search?: string
  activo?: boolean
}): Promise<any[]> =>
  api.get('/materiales/base', { params }).then(r => r.data)

export const getCotizacionMateriales = (cotizacionId: number): Promise<any[]> =>
  api.get(`/cotizaciones/${cotizacionId}/materiales`).then(r => r.data)

export const createCotizacionMaterial = (cotizacionId: number, dto: {
  materialBaseId?: number
  nombre: string
  descripcion?: string
  cantidad: number
  unidad: string
  categoriaId: number
  atributos?: Record<string, unknown>
  esExtra?: boolean
}): Promise<any> =>
  api.post(`/cotizaciones/${cotizacionId}/materiales`, dto).then(r => r.data)

export const updateCotizacionMaterial = (
  cotizacionId: number,
  materialId: number,
  dto: { cantidad?: number; atributos?: Record<string, unknown>; validado?: boolean; eliminado?: boolean },
): Promise<any> =>
  api.patch(`/cotizaciones/${cotizacionId}/materiales/${materialId}`, dto).then(r => r.data)

export const deleteCotizacionMaterial = (
  cotizacionId: number,
  materialId: number,
): Promise<any> =>
  api.delete(`/cotizaciones/${cotizacionId}/materiales/${materialId}`).then(r => r.data)

export const validarTodosMateriales = (cotizacionId: number): Promise<any> =>
  api.patch(`/cotizaciones/${cotizacionId}/materiales/validar-todos`).then(r => r.data)

export const syncProductosMateriales = (): Promise<{ synced: number; skipped: number; productos: number }> =>
  api.post('/materiales/sync-productos').then(r => r.data)
