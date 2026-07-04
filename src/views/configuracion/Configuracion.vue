<template>
  <div class="cfg-page">

    <div class="cfg-header">
      <h1 class="cfg-title">Configuración</h1>
      <p class="cfg-subtitle">Gestión de la organización e importación masiva de datos</p>
    </div>

    <!-- Módulos de configuración -->
    <div class="cfg-modules">
      <RouterLink to="/configuracion/unidades-ejecucion" class="cfg-module-card">
        <div class="cfg-module-icon">🏢</div>
        <div>
          <p class="cfg-module-title">Unidades de Ejecución</p>
          <p class="cfg-module-desc">Gestión de equipos, visibilidad financiera y estructura organizacional</p>
        </div>
        <span class="cfg-module-arrow">→</span>
      </RouterLink>
      <RouterLink to="/admin/quotation-params" class="cfg-module-card">
        <div class="cfg-module-icon">⚙️</div>
        <div>
          <p class="cfg-module-title">Parámetros de cotización</p>
          <p class="cfg-module-desc">Configura los parámetros, variables y valores por defecto de cotizaciones</p>
        </div>
        <span class="cfg-module-arrow">→</span>
      </RouterLink>
    </div>

    <div class="cfg-section-label">Configuración general</div>
    <div class="cfg-card">
      <div class="cfg-field-row">
        <div>
          <p class="cfg-field-title">Número inicial de cotizaciones</p>
          <p class="cfg-field-desc">
            Define desde qué número deben iniciar las cotizaciones nuevas. Si ya existen cotizaciones
            este año con un número mayor, ese valor prevalece — este campo nunca genera números duplicados.
          </p>
        </div>
        <div class="cfg-field-control">
          <input
            v-model.number="startNumberEdited"
            type="number"
            min="1"
            class="cfg-input"
            :disabled="numberingLoading || numberingSaving"
          />
          <button
            class="cfg-btn-save"
            :disabled="numberingLoading || numberingSaving || startNumberEdited === startNumberSaved"
            @click="saveStartNumber"
          >
            {{ numberingSaving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
      <p v-if="numberingSaved" class="cfg-field-saved">Guardado — la próxima cotización usará este valor como referencia.</p>
      <p v-if="numberingError" class="cfg-field-error">{{ numberingError }}</p>
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

    <ConfirmModal
      :show="showConfirmModal"
      title="¿Cambiar número inicial de cotización?"
      :message="`Vas a cambiar el número inicial de cotización de ${startNumberSaved} a ${startNumberEdited}.`"
      confirm-label="Sí, cambiar"
      cancel-label="Cancelar"
      @confirm="confirmSaveStartNumber"
      @cancel="cancelSaveStartNumber"
    />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import ImportCard from '@/components/configuracion/ImportCard.vue'
import ConfirmModal from '@/components/modal/ConfirmModal.vue'
import api from '@/services/api'

// ── Configuración general — número inicial de cotizaciones ──
const startNumberSaved  = ref(null) // último valor confirmado por el backend
const startNumberEdited = ref(null) // valor en el input
const numberingLoading  = ref(false)
const numberingSaving   = ref(false)
const numberingSaved    = ref(false)
const numberingError    = ref('')

async function fetchQuotationNumbering() {
  numberingLoading.value = true
  numberingError.value   = ''
  try {
    const { data } = await api.get('/app-config/quotation-numbering')
    startNumberSaved.value  = data?.startNumber ?? 100
    startNumberEdited.value = startNumberSaved.value
  } catch (e) {
    numberingError.value = e?.response?.data?.message || 'Error al cargar la configuración'
  } finally {
    numberingLoading.value = false
  }
}

const showConfirmModal = ref(false)

function saveStartNumber() {
  const nuevo = startNumberEdited.value
  if (!Number.isInteger(nuevo) || nuevo < 1) {
    numberingError.value = 'El número inicial debe ser un entero mayor a 0'
    return
  }
  showConfirmModal.value = true
}

function cancelSaveStartNumber() {
  showConfirmModal.value = false
  startNumberEdited.value = startNumberSaved.value
}

async function confirmSaveStartNumber() {
  showConfirmModal.value = false
  const nuevo = startNumberEdited.value

  numberingSaving.value = true
  numberingError.value  = ''
  numberingSaved.value  = false
  try {
    await api.patch('/app-config/quotation-numbering', { startNumber: nuevo })
    startNumberSaved.value = nuevo
    numberingSaved.value = true
    setTimeout(() => { numberingSaved.value = false }, 2500)
  } catch (e) {
    numberingError.value = e?.response?.data?.message || 'Error al guardar la configuración'
  } finally {
    numberingSaving.value = false
  }
}

onMounted(fetchQuotationNumbering)

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
.cfg-module-card:hover { border-color: #27C8D8; box-shadow: 0 2px 10px rgba(39,200,216,.1); }
.cfg-module-icon { font-size: 24px; flex-shrink: 0; }
.cfg-module-title { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 2px; }
.cfg-module-desc { font-size: 12px; color: #64748B; margin: 0; }
.cfg-module-arrow { font-size: 18px; color: #CBD5E1; margin-left: auto; }
.cfg-module-card:hover .cfg-module-arrow { color: #27C8D8; }

.cfg-card {
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 14px;
  padding: 18px 20px;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cfg-field-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.cfg-field-title { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
.cfg-field-desc { font-size: 12px; color: #64748B; margin: 0; max-width: 380px; line-height: 1.5; }
.cfg-field-control { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.cfg-input {
  width: 100px;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  background: #F8FAFC;
  color: #0F1A2E;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cfg-input:focus { border-color: #27C8D8; box-shadow: 0 0 0 3px rgba(39,200,216,0.1); }
.cfg-input:disabled { opacity: 0.6; cursor: not-allowed; }
.cfg-btn-save {
  height: 36px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #27C8D8;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.cfg-btn-save:hover:not(:disabled) { background: #1BAEBB; }
.cfg-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
.cfg-field-saved { font-size: 12px; font-weight: 600; color: #16A34A; margin: 0; }
.cfg-field-error { font-size: 12px; color: #B91C1C; margin: 0; }
</style>
