<template>
  <Teleport to="body">
    <Transition name="tq-fade">
      <div v-if="show" class="tq-overlay" @click.self="$emit('close')">
        <div class="tq-modal" role="dialog" aria-modal="true">

          <!-- Header -->
          <div class="tq-header">
            <div class="tq-header-left">
              <Truck :size="20" class="tq-icon" />
              <h2 class="tq-title">Agregar Producto de Tercero</h2>
            </div>
            <button class="tq-close" @click="$emit('close')">
              <X :size="18" />
            </button>
          </div>

          <!-- Body -->
          <div class="tq-body">

            <!-- 1. Información del Producto -->
            <div class="tq-form-section">
              <div class="tq-section-hdr">
                <Package :size="16" class="tq-ico-blue" />
                <span>Información del Producto</span>
              </div>
              
              <div class="tq-field tq-field--full">
                <label class="tq-label">Producto del catálogo <span class="tq-req">*</span></label>
                <select v-model="form.catalogItemId" class="tq-select" :disabled="loadingCalc">
                  <option :value="null" disabled>Selecciona un producto del catálogo…</option>
                  <option v-for="item in catalog" :key="item.id" :value="item.id">
                    {{ item.dispositivo || item.nombre || item.descripcion || `Producto #${item.id}` }}
                  </option>
                </select>
                <span v-if="errors.catalogItemId" class="tq-err">{{ errors.catalogItemId }}</span>
              </div>

              <div class="tq-grid-3">
                <div class="tq-field">
                  <label class="tq-label">Dispositivo <span class="tq-req">*</span></label>
                  <input v-model="form.dispositivo" type="text" class="tq-input" placeholder="Nombre" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Categoría</label>
                  <input v-model="form.categoria" type="text" class="tq-input" placeholder="Ej: Sonido" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Bodega</label>
                  <input v-model="form.bodega" type="text" class="tq-input" placeholder="Ubicación" />
                </div>
              </div>

              <div class="tq-field tq-field--full">
                <label class="tq-label">Descripción <span class="tq-req">*</span></label>
                <input v-model="form.descripcion" type="text" class="tq-input" placeholder="Descripción breve del producto" />
              </div>
            </div>

            <!-- 2. Especificaciones Técnicas -->
            <div class="tq-form-section">
              <div class="tq-section-hdr">
                <Cpu :size="16" class="tq-ico-blue" />
                <span>Especificaciones Técnicas</span>
              </div>
              <div class="tq-grid-3">
                <div class="tq-field">
                  <label class="tq-label">Amperios</label>
                  <input v-model.number="form.amperios" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Medidas</label>
                  <input v-model="form.medidas" type="text" class="tq-input" placeholder="Ej: 2x3m" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Motores</label>
                  <input v-model.number="form.motores" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Operarios</label>
                  <input v-model.number="form.operarios" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Metros Ext.</label>
                  <input v-model.number="form.metrosExt" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">m² Disp.</label>
                  <input v-model.number="form.m2Disp" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Pesos Estacas</label>
                  <input v-model.number="form.pesosEstacas" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Extintores</label>
                  <input v-model.number="form.extintores" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Peso (kg)</label>
                  <input v-model.number="form.peso" type="number" class="tq-input" placeholder="0" />
                </div>
              </div>
            </div>

            <!-- 3. Logística y Operación -->
            <div class="tq-form-section">
              <div class="tq-section-hdr">
                <Truck :size="16" class="tq-ico-blue" />
                <span>Logística y Operación</span>
              </div>
              <div class="tq-grid-3">
                <div class="tq-field">
                  <label class="tq-label">m³ Transporte</label>
                  <input v-model.number="form.m3Transporte" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Horas Op.</label>
                  <input v-model.number="form.horasOperacion" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Horas Montaje</label>
                  <input v-model.number="form.horasMontaje" type="number" class="tq-input" placeholder="0" />
                </div>
                <div class="tq-field">
                  <label class="tq-label">Personal Montaje</label>
                  <input v-model.number="form.personalMontaje" type="number" class="tq-input" placeholder="0" />
                </div>
                
                <div class="tq-field tq-field--span-2">
                  <label class="tq-label">Opciones</label>
                  <div class="tq-toggles-inline">
                    <label class="tq-toggle-lbl">
                      <input v-model="form.incluyeTransporte" type="checkbox" class="tq-chk" />
                      <span>Trans. Bog-Mde</span>
                    </label>
                    <label class="tq-toggle-lbl">
                      <input v-model="form.montacarga" type="checkbox" class="tq-chk" />
                      <span>Montacarga</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Cálculo Financiero (Los 3 Inputs Core) -->
            <div class="tq-form-section tq-form-section--financial">
              <div class="tq-section-hdr">
                <Calculator :size="16" class="tq-ico-blue" />
                <span>Cálculo de Cotización</span>
              </div>

              <div class="tq-financial-grid">
                <!-- Cantidad -->
                <div class="tq-field">
                  <label class="tq-label">Cantidad <span class="tq-req">*</span></label>
                  <input
                    v-model.number="form.cantidad"
                    type="number"
                    min="1"
                    class="tq-input"
                    :disabled="loadingCalc"
                  />
                  <span v-if="errors.cantidad" class="tq-err">{{ errors.cantidad }}</span>
                </div>

                <!-- Costo unitario -->
                <div class="tq-field">
                  <label class="tq-label">Costo unitario (COP) <span class="tq-req">*</span></label>
                  <input
                    v-model.number="form.costoUnitario"
                    type="number"
                    min="1"
                    class="tq-input tq-input--money"
                    :disabled="loadingCalc"
                    placeholder="$ 0"
                  />
                  <span v-if="errors.costoUnitario" class="tq-err">{{ errors.costoUnitario }}</span>
                </div>

                <!-- Margen variable -->
                <div class="tq-field">
                  <label class="tq-label">Margen variable % <span class="tq-req">*</span></label>
                  <div class="tq-input-p-wrap">
                    <input
                      v-model.number="form.margenVariable"
                      type="number"
                      min="0"
                      max="79"
                      class="tq-input"
                      :disabled="loadingCalc"
                      placeholder="0"
                    />
                    <span class="tq-input-p-icon">%</span>
                  </div>
                  <span v-if="errors.margenVariable" class="tq-err">{{ errors.margenVariable }}</span>
                </div>
              </div>
            </div>

            <!-- Resultados (Los 7 campos) -->
            <Transition name="tq-slide">
              <div v-if="desglose" class="tq-results-card">
                <div class="tq-results-hdr">
                  <BarChart2 :size="16" />
                  <span>Resultado del Cálculo</span>
                  <div v-if="loadingCalc" class="tq-loading-inline">
                    <Loader2 :size="14" class="tq-spin" />
                    Actualizando...
                  </div>
                </div>
                
                <div class="tq-results-grid">
                  <div
                    v-for="(val, key) in desgloseVisible"
                    :key="key"
                    class="tq-result-item"
                    :class="{ 'tq-result-item--highlight': key === 'total' || key === 'utilidadFinal' }"
                  >
                    <span class="tq-result-label">{{ fieldLabel(key) }}</span>
                    <span class="tq-result-val">{{ formatVal(key, val) }}</span>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- 5. Notas -->
            <div class="tq-form-section">
              <div class="tq-section-hdr">
                <FileText :size="16" class="tq-ico-blue" />
                <span>Notas</span>
              </div>
              <div class="tq-field tq-field--full">
                <textarea
                  v-model="form.notas"
                  class="tq-input tq-textarea"
                  rows="2"
                  placeholder="Observaciones adicionales..."
                ></textarea>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="tq-footer">
            <button type="button" class="tq-btn-cancel" @click="$emit('close')">
              Cancelar
            </button>
            <button
              type="button"
              class="tq-btn-add"
              :disabled="!desglose || loadingCalc"
              @click="agregar"
            >
              <Plus :size="15" />
              Agregar a cotización
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { Package, Truck, X, Calculator, Loader2, Plus, BarChart2, Cpu, FileText } from 'lucide-vue-next'
import { calculateFromCost } from '@/services/quotation.service'

const props = defineProps({
  show: { type: Boolean, default: false },
  catalog: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'add'])

// ── Form state ───────────────────────────────────────────────────────────────
const initialForm = {
  catalogItemId: null,
  cantidad: 1,
  costoUnitario: null,
  margenVariable: null,
  // Technical & Logistics
  dispositivo: '',
  descripcion: '',
  categoria: '',
  bodega: '',
  amperios: null,
  medidas: '',
  motores: null,
  operarios: null,
  metrosExt: null,
  m2Disp: null,
  pesosEstacas: null,
  extintores: null,
  peso: null,
  m3Transporte: null,
  incluyeTransporte: false,
  montacarga: false,
  horasOperacion: null,
  horasMontaje: null,
  personalMontaje: null,
  notas: ''
}

const form = ref({ ...initialForm })
const errors = ref({})
const loadingCalc = ref(false)
const calcError = ref('')
const desglose = ref(null)

// Reset when modal opens
watch(() => props.show, (val) => {
  if (val) {
    form.value = { ...initialForm }
    errors.value = {}
    calcError.value = ''
    desglose.value = null
  }
})

// Auto-fill form when product is selected from catalog
watch(() => form.value.catalogItemId, (newId) => {
  if (!newId) return
  const selected = props.catalog.find(c => c.id === newId)
  if (selected) {
    // Fill technical fields from catalog item
    form.value.dispositivo       = selected.dispositivo || ''
    form.value.descripcion       = selected.descripcion || ''
    form.value.categoria         = selected.categoria   || ''
    form.value.bodega            = selected.bodega      || ''
    form.value.amperios          = selected.amperios
    form.value.medidas           = selected.medidas     || ''
    form.value.motores           = selected.motores
    form.value.operarios         = selected.operarios
    form.value.metrosExt         = selected.metrosExt
    form.value.m2Disp            = selected.m2Disp
    form.value.pesosEstacas      = selected.pesosEstacas
    form.value.extintores        = selected.extintores
    form.value.peso              = selected.peso
    form.value.m3Transporte      = selected.m3Transporte
    form.value.incluyeTransporte = selected.incluyeTransporteBogMde === 'SI'
    form.value.montacarga        = selected.montacarga === 'SI'
    form.value.horasOperacion    = selected.horasOperacion
    form.value.horasMontaje      = selected.horasMontaje
    form.value.personalMontaje   = selected.personalMontaje
    form.value.notas             = selected.notas       || ''
    
    // Also pre-fill cost if available in catalog
    if (selected.valorBase && !form.value.costoUnitario) {
      form.value.costoUnitario = selected.valorBase
    }
  }
})

// ── Validation ───────────────────────────────────────────────────────────────
const validate = () => {
  const e = {}
  if (!form.value.catalogItemId)
    e.catalogItemId = 'Selecciona un producto'
  if (!form.value.cantidad || form.value.cantidad < 1 || !Number.isInteger(form.value.cantidad))
    e.cantidad = 'Cantidad debe ser un entero ≥ 1'
  if (!form.value.costoUnitario || form.value.costoUnitario <= 0)
    e.costoUnitario = 'El costo unitario debe ser mayor a 0'
  if (form.value.margenVariable == null || form.value.margenVariable < 0 || form.value.margenVariable > 79)
    e.margenVariable = 'El margen variable debe estar entre 0 y 79'
  errors.value = e
  return Object.keys(e).length === 0
}

const canCalculate = computed(() =>
  form.value.catalogItemId &&
  form.value.cantidad >= 1 &&
  form.value.costoUnitario > 0 &&
  form.value.margenVariable >= 0 && form.value.margenVariable <= 79
)


// Recalcula automáticamente al cambiar cualquier campo (debounced)
watchDebounced(
  form,
  () => {
    desglose.value = null
    if (canCalculate.value) calcular()
  },
  { deep: true, debounce: 600 }
)

// ── Calculate ────────────────────────────────────────────────────────────────
const calcular = async () => {
  if (!validate()) return
  loadingCalc.value = true
  calcError.value = ''
  desglose.value = null
  try {
    const { data } = await calculateFromCost({
      costoUnitario: form.value.costoUnitario,
      cantidad: form.value.cantidad,
      margenVariable: form.value.margenVariable,
    })
    desglose.value = data
  } catch (e) {
    calcError.value = e?.response?.data?.message || 'Error al calcular. Verifica los datos.'
  } finally {
    loadingCalc.value = false
  }
}

// ── Display helpers ───────────────────────────────────────────────────────────
const RESULT_KEYS = ['precioUnitario', 'subtotalVenta', 'costoTotal', 'iva', 'total', 'utilidadProyectada', 'utilidadFinal']

const desgloseVisible = computed(() => {
  if (!desglose.value) return {}
  return Object.fromEntries(RESULT_KEYS.map(k => [k, desglose.value[k]]))
})

const FIELD_LABELS = {
  precioUnitario:     'Precio unitario',
  subtotalVenta:      'Subtotal venta',
  costoTotal:         'Costo total',
  iva:                'IVA (19%)',
  total:              'Total con IVA',
  utilidadProyectada: 'Utilidad proyectada',
  utilidadFinal:      'Utilidad final',
}

const COP_KEYS = new Set(['precioUnitario', 'subtotalVenta', 'costoTotal', 'iva', 'total', 'utilidadProyectada', 'utilidadFinal'])

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

const fieldLabel = (key) => FIELD_LABELS[key] || key

const formatVal = (key, val) => {
  if (val == null) return '—'
  if (COP_KEYS.has(key) && typeof val === 'number') return formatCOP(val)
  return val
}

// ── Agregar ───────────────────────────────────────────────────────────────────
const agregar = () => {
  if (!desglose.value) return

  const catalogItem = props.catalog.find(c => c.id === form.value.catalogItemId)

  emit('add', {
    ...catalogItem, // Base catalog item
    ...form.value,  // Technical fields from form
    ...desglose.value, // Calculation results
    incluyeTransporteBogMde: form.value.incluyeTransporte ? 'SI' : 'NO',
    montacarga:              form.value.montacarga ? 'SI' : 'NO',
    // Fallback names
    nombre: form.value.dispositivo || catalogItem?.nombre || catalogItem?.descripcion || `Producto #${form.value.catalogItemId}`,
  })

  emit('close')
}
</script>

<style scoped>
.tq-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.tq-modal {
  width: 100%;
  max-width: 580px;
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 95vh;
}

/* Header */
.tq-header {
  padding: 18px 24px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tq-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tq-icon { color: #054EAF; }
.tq-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}
.tq-close {
  background: none;
  border: none;
  color: #64748B;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s;
}
.tq-close:hover { background: #F1F5F9; color: #1E293B; }

/* Body */
.tq-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tq-form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tq-section-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-family: 'Inter', sans-serif;
}
.tq-ico-blue { color: #054EAF; }

.tq-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tq-field--span-2 {
  grid-column: span 2;
}
.tq-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}
.tq-req { color: #EF4444; }

.tq-select, .tq-input {
  width: 100%;
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 14px;
  color: #1E293B;
  transition: all 0.2s;
  outline: none;
}
.tq-select:focus, .tq-input:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 4px rgba(5, 78, 175, 0.08);
}

.tq-input--money {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  color: #054EAF;
}

.tq-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 20px;
}

.tq-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 20px;
}

.tq-toggles-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 8px 14px;
  height: 38px;
}
.tq-toggle-lbl {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}
.tq-chk {
  width: 16px;
  height: 16px;
  accent-color: #054EAF;
  cursor: pointer;
}

.tq-textarea {
  resize: vertical;
  min-height: 80px;
}

.tq-financial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 20px;
}

.tq-input-p-wrap {
  position: relative;
}
.tq-input-p-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  font-weight: 600;
  color: #94A3B8;
}

/* Results Card */
.tq-results-card {
  background: #F0F9FF;
  border: 1.5px solid #BAE6FD;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: tq-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes tq-slide-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.tq-results-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #0369A1;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.tq-loading-inline {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #0369A1;
  font-weight: 600;
}

.tq-results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
}

.tq-result-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tq-result-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tq-result-val {
  font-size: 14px;
  font-weight: 700;
  color: #1E293B;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.tq-result-item--highlight .tq-result-val {
  color: #054EAF;
  font-size: 16px;
}

/* Footer */
.tq-footer {
  padding: 18px 24px;
  background: #F8FAFC;
  border-top: 1px solid #E2E8F0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.tq-btn-cancel {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #64748B;
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.tq-btn-cancel:hover { background: #F1F5F9; border-color: #CBD5E1; }

.tq-btn-add {
  padding: 10px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: white;
  background: #054EAF;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(5, 78, 175, 0.2);
}
.tq-btn-add:hover { background: #03368A; transform: translateY(-1px); }
.tq-btn-add:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

/* Transitions */
.tq-fade-enter-active,
.tq-fade-leave-active { transition: opacity 0.2s ease; }
.tq-fade-enter-from,
.tq-fade-leave-to { opacity: 0; }

.tq-slide-enter-active { transition: all 0.25s ease-out; }
.tq-slide-leave-active { transition: all 0.18s ease-in; }
.tq-slide-enter-from { opacity: 0; transform: translateY(-8px); }
.tq-slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
