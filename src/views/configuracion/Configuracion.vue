<template>
  <div class="cfg-page">

    <div class="cfg-header">
      <h1 class="cfg-title">Configuración</h1>
      <p class="cfg-subtitle">Gestión de la organización e importación masiva de datos</p>
    </div>

    <!-- Módulos de configuración -->
    <div class="cfg-modules">
      <RouterLink to="/configuracion/sedes" class="cfg-module-card">
        <div class="cfg-module-icon">🏢</div>
        <div>
          <p class="cfg-module-title">Sedes</p>
          <p class="cfg-module-desc">Unidades de ejecución, equipos y visibilidad financiera</p>
        </div>
        <span class="cfg-module-arrow">→</span>
      </RouterLink>
    </div>

    <div class="cfg-section-label">Importación masiva</div>
    <div class="cfg-grid">
      <ImportCard
        title="Clientes"
        description="Importa clientes directos e indirectos desde un archivo Excel."
        :columns="clientesCols"
        :loading="states.clientes.loading"
        :result="states.clientes.result"
        :error="states.clientes.error"
        @import="file => runImport('clientes', file)"
        @reset="resetState('clientes')"
      />

      <ImportCard
        title="Productos"
        description="Importa el catálogo de productos propios. Crea automáticamente las cajas de precios por lista."
        :columns="productosCols"
        :loading="states.productos.loading"
        :result="states.productos.result"
        :error="states.productos.error"
        @import="file => runImport('productos', file)"
        @reset="resetState('productos')"
      />

      <ImportCard
        title="Proveedores"
        description="Importa el directorio de proveedores externos."
        :columns="proveedoresCols"
        :loading="states.proveedores.loading"
        :result="states.proveedores.result"
        :error="states.proveedores.error"
        @import="file => runImport('proveedores', file)"
        @reset="resetState('proveedores')"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { RouterLink } from 'vue-router'
import ImportCard from '@/components/configuracion/ImportCard.vue'
import api from '@/services/api'

const ENDPOINTS = {
  clientes:    '/client/import',
  productos:   '/producto/import',
  proveedores: '/suppliers/import',
}

const clientesCols = [
  { col: 'Cliente',             req: true  },
  { col: 'Nit',                 req: false },
  { col: 'Email',               req: false },
  { col: 'Teléfono',            req: false },
  { col: 'Documento',           req: false },
  { col: 'Nombre de contacto',  req: false },
  { col: 'Referencia',          req: false },
  { col: 'Tipo',                req: false, note: 'DIRECTO / INDIRECTO' },
]

const productosCols = [
  { col: 'Dispositivo',                        req: true,  note: 'Nombre del producto' },
  { col: 'IdCatalogo',                         req: false },
  { col: 'DESCRIPCION',                        req: false },
  { col: 'CARACTERISTICA PRODUCTO',            req: false, note: 'Tipo de dispositivo' },
  { col: 'Categoría',                          req: false },
  { col: 'Estado',                             req: false, note: 'Operativo - Estado ok / ITEM NO ACTIVO' },
  { col: 'Bodega',                             req: false },
  { col: 'ValorCuadroCotizador',               req: false },
  { col: 'Cop',                                req: false },
  { col: 'CAFAM 2026',                         req: false, note: 'Precio lista' },
  { col: 'COMFAMA 2026',                       req: false, note: 'Precio lista' },
  { col: 'COMPENSAR 2026',                     req: false, note: 'Precio lista' },
  { col: 'COLSUBSIDIO 2026',                   req: false, note: 'Precio lista' },
  { col: 'OPERADORES 2026',                    req: false, note: 'Precio lista' },
  { col: 'Medidas',                            req: false },
  { col: 'AMPERIOS',                           req: false },
  { col: 'Q Motores',                          req: false },
  { col: 'Q Operarios',                        req: false },
  { col: 'Q Metros E0tensiones',               req: false },
  { col: 'M2 Dispositivo',                     req: false },
  { col: 'Q pesos o Estacas',                  req: false },
  { col: 'Q E0tintores',                       req: false },
  { col: 'Año Dispositivo',                    req: false },
  { col: 'Q hs - Montaje',                     req: false },
  { col: 'Q Personal Montaje',                 req: false },
  { col: 'Montacarga',                         req: false },
  { col: 'Accesorio 1 … Accesorio 8',          req: false, note: 'Lista de materiales' },
]

const proveedoresCols = [
  { col: 'Proveedor',       req: true  },
  { col: 'Mail',            req: false },
  { col: 'Teléfono 1',     req: false },
  { col: 'Teléfono 2',     req: false },
  { col: 'Categoría',      req: false },
  { col: 'Dirección',      req: false },
  { col: 'Zona - Operación', req: false },
  { col: 'Contacto',       req: false },
  { col: 'Ciudad',         req: false },
  { col: 'País',           req: false },
  { col: 'Sitio web',      req: false },
  { col: 'Link Portafolio', req: false },
]

const makeState = () => ({ loading: false, result: null, error: null })
const states = reactive({
  clientes:    makeState(),
  productos:   makeState(),
  proveedores: makeState(),
})

function resetState(mod) {
  states[mod].loading = false
  states[mod].result  = null
  states[mod].error   = null
}

async function runImport(mod, file) {
  states[mod].loading = true
  states[mod].result  = null
  states[mod].error   = null
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await api.post(ENDPOINTS[mod], form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    states[mod].result = res.data
  } catch (e) {
    states[mod].error = e?.response?.data?.message || 'Error al importar el archivo'
  } finally {
    states[mod].loading = false
  }
}
</script>

<style scoped>
.cfg-page     { padding: 20px 24px; width: 100%; box-sizing: border-box; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; gap: 20px; }
.cfg-header   { }
.cfg-title    { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
.cfg-subtitle { font-size: 13px; color: #64748B; margin: 3px 0 0; }
.cfg-grid     { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }

.cfg-section-label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: .06em; }

.cfg-modules { display: flex; flex-direction: column; gap: 10px; }
.cfg-module-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px; background: #fff;
  border: 1.5px solid #E2E8F0; border-radius: 14px;
  text-decoration: none; color: inherit;
  transition: border-color .15s, box-shadow .15s;
  max-width: 500px;
}
.cfg-module-card:hover { border-color: #054EAF; box-shadow: 0 2px 10px rgba(5,78,175,.1); }
.cfg-module-icon { font-size: 24px; flex-shrink: 0; }
.cfg-module-title { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 2px; }
.cfg-module-desc { font-size: 12px; color: #64748B; margin: 0; }
.cfg-module-arrow { font-size: 18px; color: #CBD5E1; margin-left: auto; }
.cfg-module-card:hover .cfg-module-arrow { color: #054EAF; }
</style>
