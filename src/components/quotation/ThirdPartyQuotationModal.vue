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

            <!-- Formulario -->
            <div class="tq-form-grid">

              <!-- Producto del catálogo -->
              <div class="tq-field tq-field--full">
                <label class="tq-label">Producto del catálogo <span class="tq-req">*</span></label>
                <select v-model="form.catalogItemId" class="tq-select" :disabled="loadingCalc">
                  <option :value="null" disabled>Seleccionar producto…</option>
                  <option v-for="item in catalog" :key="item.id" :value="item.id">
                    {{ item.dispositivo || item.nombre || item.descripcion || `Producto #${item.id}` }}
                  </option>
                </select>
                <span v-if="errors.catalogItemId" class="tq-err">{{ errors.catalogItemId }}</span>
              </div>

              <!-- Cantidad -->
              <div class="tq-field">
                <label class="tq-label">Cantidad <span class="tq-req">*</span></label>
                <input
                  v-model.number="form.cantidad"
                  type="number"
                  min="1"
                  step="1"
                  class="tq-input"
                  :disabled="loadingCalc"
                  placeholder="1"
                />
                <span v-if="errors.cantidad" class="tq-err">{{ errors.cantidad }}</span>
              </div>

              <!-- Costo -->
              <div class="tq-field">
                <label class="tq-label">Costo (COP) <span class="tq-req">*</span></label>
                <input
                  v-model.number="form.costo"
                  type="number"
                  min="1"
                  step="100"
                  class="tq-input"
                  :disabled="loadingCalc"
                  placeholder="0"
                />
                <span v-if="errors.costo" class="tq-err">{{ errors.costo }}</span>
              </div>

              <!-- Margen -->
              <div class="tq-field">
                <label class="tq-label">Margen % <span class="tq-req">*</span></label>
                <input
                  v-model.number="form.margen"
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  class="tq-input"
                  :disabled="loadingCalc"
                  placeholder="0"
                />
                <span v-if="errors.margen" class="tq-err">{{ errors.margen }}</span>
              </div>

            </div>

            <!-- Botón calcular -->
            <div class="tq-calc-row">
              <button
                type="button"
                class="tq-btn-calc"
                :disabled="!canCalculate || loadingCalc"
                @click="calcular"
              >
                <Loader2 v-if="loadingCalc" :size="15" class="tq-spin" />
                <Calculator v-else :size="15" />
                {{ loadingCalc ? 'Calculando…' : 'Calcular' }}
              </button>
              <span v-if="calcError" class="tq-calc-err">{{ calcError }}</span>
            </div>

            <!-- Desglose del backend -->
            <Transition name="tq-slide">
              <div v-if="desglose" class="tq-desglose">
                <div class="tq-desglose-header">
                  <BarChart2 :size="15" class="tq-icon-sm" />
                  <span>Desglose de cálculo</span>
                </div>
                <div class="tq-desglose-grid">
                  <div
                    v-for="(val, key) in desgloseVisible"
                    :key="key"
                    class="tq-desglose-item"
                  >
                    <span class="tq-desglose-label">{{ fieldLabel(key) }}</span>
                    <span class="tq-desglose-val">{{ formatVal(key, val) }}</span>
                  </div>
                </div>
              </div>
            </Transition>

          </div>

          <!-- Footer -->
          <div class="tq-footer">
            <button type="button" class="tq-btn-cancel" @click="$emit('close')">
              Cancelar
            </button>
            <button
              type="button"
              class="tq-btn-add"
              :disabled="!desglose"
              @click="agregar"
            >
              <Plus :size="14" />
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
import { Truck, X, Calculator, Loader2, Plus, BarChart2 } from 'lucide-vue-next'
import { calculateThirdPartyItem } from '@/services/quotation.service'

const props = defineProps({
  show: { type: Boolean, default: false },
  catalog: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'add'])

// ── Form state ──────────────────────────────────────────────────────────────
const form = ref({ catalogItemId: null, cantidad: 1, costo: null, margen: null })
const errors = ref({})
const loadingCalc = ref(false)
const calcError = ref('')
const desglose = ref(null)

// Reset when modal opens
watch(() => props.show, (val) => {
  if (val) {
    form.value = { catalogItemId: null, cantidad: 1, costo: null, margen: null }
    errors.value = {}
    calcError.value = ''
    desglose.value = null
  }
})

// ── Validation ──────────────────────────────────────────────────────────────
const validate = () => {
  const e = {}
  if (!form.value.catalogItemId) e.catalogItemId = 'Selecciona un producto'
  if (!form.value.cantidad || form.value.cantidad < 1 || !Number.isInteger(form.value.cantidad))
    e.cantidad = 'Cantidad debe ser un entero ≥ 1'
  if (!form.value.costo || form.value.costo <= 0)
    e.costo = 'Costo debe ser mayor a 0'
  if (form.value.margen == null || form.value.margen < 0 || form.value.margen > 99)
    e.margen = 'Margen debe estar entre 0 y 99'
  errors.value = e
  return Object.keys(e).length === 0
}

const canCalculate = computed(() =>
  form.value.catalogItemId &&
  form.value.cantidad >= 1 &&
  form.value.costo > 0 &&
  form.value.margen >= 0 && form.value.margen <= 99
)

// Reset desglose when form changes
watch(form, () => { desglose.value = null }, { deep: true })

// ── Calculate ───────────────────────────────────────────────────────────────
const calcular = async () => {
  if (!validate()) return
  loadingCalc.value = true
  calcError.value = ''
  desglose.value = null
  try {
    const { data } = await calculateThirdPartyItem({
      catalogItemId: form.value.catalogItemId,
      cantidad: form.value.cantidad,
      costo: form.value.costo,
      margen: form.value.margen,
    })
    desglose.value = data
  } catch (e) {
    calcError.value = e?.response?.data?.message || 'Error al calcular. Verifica los datos.'
  } finally {
    loadingCalc.value = false
  }
}

// ── Display helpers ─────────────────────────────────────────────────────────
const SKIP_KEYS = new Set(['id', 'catalogItemId', 'createdAt', 'updatedAt'])
const desgloseVisible = computed(() => {
  if (!desglose.value) return {}
  return Object.fromEntries(
    Object.entries(desglose.value).filter(([k]) => !SKIP_KEYS.has(k))
  )
})

const FIELD_LABELS = {
  cantidad: 'Cantidad',
  costo: 'Costo base',
  costoBase: 'Costo base',
  margen: 'Margen %',
  factorMultiplicador: 'Factor multiplicador',
  precioSinIva: 'Precio sin IVA',
  precioConIva: 'Precio con IVA',
  precioUnitario: 'Precio unitario',
  precioUnitarioSinIva: 'Precio unitario (sin IVA)',
  precioUnitarioConIva: 'Precio unitario (con IVA)',
  iva: 'IVA',
  valorIva: 'Valor IVA',
  totalFactura: 'Total factura',
  subtotal: 'Subtotal',
  costoOperacion: 'Costo operación',
  costoTotal: 'Costo total',
  utilidadBruta: 'Utilidad bruta',
  utilidadNeta: 'Utilidad neta',
  utilidadFinal: 'Utilidad final',
  rentabilidad: 'Rentabilidad %',
  descuento: 'Descuento',
  descuentoAplicado: 'Descuento aplicado',
  precioFinal: 'Precio final',
  transporte: 'Transporte',
}

const COP_KEYS = new Set([
  'costo', 'costoBase', 'precioSinIva', 'precioConIva', 'precioUnitario',
  'precioUnitarioSinIva', 'precioUnitarioConIva', 'iva', 'valorIva',
  'totalFactura', 'subtotal', 'costoOperacion', 'costoTotal',
  'utilidadBruta', 'utilidadNeta', 'utilidadFinal', 'descuento',
  'descuentoAplicado', 'precioFinal', 'transporte',
])

const PCT_KEYS = new Set(['margen', 'rentabilidad'])

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

const fieldLabel = (key) => FIELD_LABELS[key] || key

const formatVal = (key, val) => {
  if (val == null) return '—'
  if (COP_KEYS.has(key) && typeof val === 'number') return formatCOP(val)
  if (PCT_KEYS.has(key) && typeof val === 'number') return `${val}%`
  return val
}

// ── Agregar ─────────────────────────────────────────────────────────────────
const agregar = () => {
  if (!desglose.value) return

  const catalogItem = props.catalog.find(c => c.id === form.value.catalogItemId)

  emit('add', {
    catalogItemId: form.value.catalogItemId,
    nombre: catalogItem?.dispositivo || catalogItem?.nombre || catalogItem?.descripcion || `Producto #${form.value.catalogItemId}`,
    cantidad: form.value.cantidad,
    costo: form.value.costo,
    margen: form.value.margen,
    ...desglose.value,
  })

  emit('close')
}
</script>

<style scoped>
/* Overlay */
.tq-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 26, 46, 0.45);
  backdrop-filter: blur(3px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Modal */
.tq-modal {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 48px rgba(5, 78, 175, 0.16);
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.tq-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #EEF1F7;
  flex-shrink: 0;
}
.tq-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tq-icon { color: #054EAF; }
.tq-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}
.tq-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748B;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}
.tq-close:hover { background: #F1F5F9; color: #0F1A2E; }

/* Body */
.tq-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Form grid */
.tq-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.tq-field--full { grid-column: 1 / -1; }

.tq-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  font-family: 'Inter', sans-serif;
  margin-bottom: 5px;
}
.tq-req { color: #EF4444; }

.tq-input,
.tq-select {
  width: 100%;
  padding: 8px 11px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  border: 1px solid #D1DAE6;
  border-radius: 8px;
  background: #F8FAFC;
  transition: border 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.tq-input:focus,
.tq-select:focus {
  outline: none;
  border-color: #054EAF;
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.10);
  background: #fff;
}
.tq-input:disabled,
.tq-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.tq-err {
  display: block;
  font-size: 11px;
  color: #EF4444;
  font-family: 'Inter', sans-serif;
  margin-top: 3px;
}

/* Calc row */
.tq-calc-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tq-btn-calc {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  background: #054EAF;
  color: white;
  border: none;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  box-shadow: 0 2px 8px rgba(5, 78, 175, 0.20);
}
.tq-btn-calc:hover:not(:disabled) { background: #03368A; }
.tq-btn-calc:disabled { opacity: 0.55; cursor: not-allowed; }
.tq-spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.tq-calc-err {
  font-size: 12px;
  color: #EF4444;
  font-family: 'Inter', sans-serif;
}

/* Desglose */
.tq-desglose {
  background: #F0F6FF;
  border: 1px solid #BFD4F5;
  border-radius: 12px;
  padding: 14px 16px;
}
.tq-desglose-header {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  color: #054EAF;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin-bottom: 12px;
}
.tq-icon-sm { color: #054EAF; }
.tq-desglose-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
.tq-desglose-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tq-desglose-label {
  font-size: 10px;
  font-weight: 600;
  color: #5B7BA4;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tq-desglose-val {
  font-size: 13px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}

/* Footer */
.tq-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #EEF1F7;
  flex-shrink: 0;
}
.tq-btn-cancel {
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #E5EAF0;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.15s;
}
.tq-btn-cancel:hover { background: #E5EAF0; }
.tq-btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  background: #16A34A;
  color: white;
  border: none;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.22);
}
.tq-btn-add:hover:not(:disabled) { background: #15803D; }
.tq-btn-add:disabled { opacity: 0.45; cursor: not-allowed; }

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
