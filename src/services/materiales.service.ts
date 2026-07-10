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

// ── Faltantes de retorno (Montajes) ───────────────────────────────────────
export const getMaterialesFaltantes = (page = 1, limit = 20): Promise<{
  data: Array<{
    id: number; materialNombre: string; unidad: string; cantidad: number
    nota: string | null; evento: { id: number; numero: number; empresa: string | null } | null
    fecha: string
  }>
  total: number; page: number; limit: number; totalPages: number
}> =>
  api.get('/materiales/faltantes', { params: { page, limit } }).then(r => r.data)

// ── Catálogo MaterialBase ─────────────────────────────────────────────────

export const createMaterialBase = (dto: {
  nombre: string; categoriaId: number; unidad?: string; descripcion?: string
}): Promise<any> =>
  api.post('/materiales/base', dto).then(r => r.data)

export const updateMaterialBase = (id: number, dto: {
  nombre?: string; descripcion?: string; unidad?: string; activo?: boolean
}): Promise<any> =>
  api.patch(`/materiales/base/${id}`, dto).then(r => r.data)

export const deactivateMaterialBase = (id: number): Promise<any> =>
  api.delete(`/materiales/base/${id}`).then(r => r.data)

// ── Materiales de un producto ─────────────────────────────────────────────

export const getMaterialesByProducto = (productoId: number): Promise<any[]> =>
  api.get(`/materiales/producto/${productoId}`).then(r => r.data)

export const addMaterialToProducto = (productoId: number, dto: {
  materialBaseId: number; cantidad: number; esOpcional?: boolean
}): Promise<any> =>
  api.post(`/materiales/producto/${productoId}`, dto).then(r => r.data)

export const updateMaterialOfProducto = (pmId: number, dto: {
  cantidad?: number; esOpcional?: boolean
}): Promise<any> =>
  api.patch(`/materiales/producto-material/${pmId}`, dto).then(r => r.data)

export const removeMaterialFromProducto = (pmId: number): Promise<any> =>
  api.delete(`/materiales/producto-material/${pmId}`).then(r => r.data)

export const parseTextoMateriales = (texto: string): Promise<Array<{ cantidad: number; nombre: string }>> =>
  api.post('/materiales/parse', { texto }).then(r => r.data)

export const bulkAssignMateriales = (productoId: number, items: Array<{
  nombre: string; cantidad: number; categoriaId?: number
}>): Promise<{ created: number; updated: number; materials: any[] }> =>
  api.post(`/materiales/producto/${productoId}/bulk`, { items }).then(r => r.data)

export const migrateFromAccesorios = (): Promise<{
  migrated: number; skipped: number; materialesCreados: number
}> =>
  api.post('/materiales/migrate-accesorios').then(r => r.data)
