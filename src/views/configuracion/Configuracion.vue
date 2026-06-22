<template>
  <div class="cfg-page">

    <div class="cfg-header">
      <h1 class="cfg-title">Configuración</h1>
      <p class="cfg-subtitle">Importación masiva de datos desde Excel</p>
    </div>

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
  { col: 'ID de artículo / CATALOGO', req: false },
  { col: 'Seleccione Dispositivo',    req: false },
  { col: 'Valor Cuadro Cotizador',    req: false },
  { col: 'C.O.P.',                    req: false },
  { col: 'Categoría',                 req: false },
  { col: 'Dispositivo',               req: false },
  { col: 'Descripción',               req: false },
  { col: 'Medidas',                   req: false },
  { col: 'Valor Lista CAFAM',         req: false, note: 'Caja de precio' },
  { col: 'Valor Lista Colsubsidio',   req: false, note: 'Caja de precio' },
  { col: 'Valor Lista Comfama',       req: false, note: 'Caja de precio' },
  { col: 'Valor Lista Compensar',     req: false, note: 'Caja de precio' },
  { col: 'Valor Lista Confenalco',    req: false, note: 'Caja de precio' },
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
.cfg-page    { padding: 20px 24px; max-width: 1200px; font-family: 'Inter', sans-serif; }
.cfg-header  { margin-bottom: 24px; }
.cfg-title   { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
.cfg-subtitle{ font-size: 13px; color: #64748B; margin: 3px 0 0; }
.cfg-grid    { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
</style>
