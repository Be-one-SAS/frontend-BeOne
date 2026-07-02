<template>
  <div class="ecp-wrap">
    <div class="ecp-header">
      <Receipt :size="14" class="ecp-header-icon" />
      <span class="ecp-header-title">Cuadro de costos</span>
      <span v-if="costos.length" class="ecp-count">{{ costos.length }}</span>
      <span v-if="totalCostos" class="ecp-total">−{{ formatCOP(totalCostos) }}</span>
    </div>
    <p class="ecp-hint">Gastos imprevistos del evento. Solo restan de la utilidad interna — no cambian el precio del cliente.</p>

    <!-- Lista -->
    <div v-if="cargando" class="ecp-empty">Cargando…</div>

    <div v-else-if="costos.length" class="ecp-list">
      <div v-for="costo in costos" :key="costo.id" class="ecp-item">
        <div class="ecp-item-top">
          <span class="ecp-cat-badge" :data-cat="costo.categoria">{{ CATEGORIA_LABELS[costo.categoria] }}</span>
          <span class="ecp-fecha">{{ fmtDate(costo.fecha) }}</span>
          <span class="ecp-monto">{{ formatCOP(costo.monto) }}</span>
          <button class="ecp-del" title="Eliminar" @click="eliminar(costo.id)">
            <X :size="12" />
          </button>
        </div>
        <p class="ecp-desc">{{ costo.descripcion }}</p>
        <div class="ecp-item-foot">
          <span class="ecp-registrador">{{ costo.registradoPor?.fullName ?? '—' }}</span>
          <a v-if="costo.soporteUrl" :href="costo.soporteUrl" target="_blank" class="ecp-soporte-link">
            <Paperclip :size="11" /> Ver soporte
          </a>
          <label v-else class="ecp-soporte-upload">
            <Paperclip :size="11" />
            {{ uploadingId === costo.id ? 'Subiendo…' : 'Adjuntar soporte' }}
            <input type="file" accept="image/*,application/pdf" class="ecp-file-input" :disabled="uploadingId === costo.id" @change="onFileChange($event, costo.id)" />
          </label>
        </div>
      </div>
    </div>

    <div v-else class="ecp-empty">Sin costos adicionales registrados</div>

    <!-- Formulario -->
    <div class="ecp-form" :class="{ open: formOpen }">
      <template v-if="formOpen">
        <div class="ecp-form-fields">
          <select v-model="form.categoria" class="ecp-select">
            <option value="" disabled>Categoría…</option>
            <option v-for="(label, key) in CATEGORIA_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
          <input v-model="form.fecha" type="date" class="ecp-input" />
          <input v-model.number="form.monto" type="number" min="0" placeholder="Monto (COP)" class="ecp-input" />
          <textarea v-model="form.descripcion" class="ecp-textarea" placeholder="Descripción del gasto…" rows="2" />
        </div>
        <span v-if="error" class="ecp-error">{{ error }}</span>
        <div class="ecp-form-actions">
          <button class="ecp-btn-cancel" @click="formOpen = false">Cancelar</button>
          <button class="ecp-btn-add" :disabled="!canSave || guardando" @click="guardar">
            {{ guardando ? 'Guardando…' : 'Agregar' }}
          </button>
        </div>
      </template>
      <button v-else class="ecp-btn-open" @click="abrirForm">
        <Plus :size="13" /> Agregar costo
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Receipt, Plus, X, Paperclip } from 'lucide-vue-next'
import { formatCOP } from '@/utils/currency.js'
import {
  getExtraCosts,
  createExtraCost,
  deleteExtraCost,
  uploadExtraCostSoporte,
} from '@/services/quotation.service'

const props = defineProps({
  quotationId: { type: [Number, String], default: null },
})

const CATEGORIA_LABELS = {
  TRANSPORTE: 'Transporte extra',
  PERSONAL:   'Personal adicional',
  DANOS:      'Daños',
  ALQUILER:   'Alquiler adicional',
  OTROS:      'Otros',
}

const costos    = ref([])
const cargando  = ref(false)
const guardando = ref(false)
const formOpen  = ref(false)
const error     = ref('')
const uploadingId = ref(null)

const todayISO = () => new Date().toISOString().slice(0, 10)
const initialForm = () => ({ categoria: '', fecha: todayISO(), monto: null, descripcion: '' })
const form = ref(initialForm())

const totalCostos = computed(() => costos.value.reduce((a, c) => a + (c.monto ?? 0), 0))
const canSave = computed(() =>
  form.value.categoria && form.value.fecha && form.value.monto > 0 && form.value.descripcion.trim().length >= 3
)

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const cargar = async () => {
  if (!props.quotationId) return
  cargando.value = true
  try {
    const { data } = await getExtraCosts(props.quotationId)
    costos.value = data
  } catch (e) {
    console.error('[ExtraCostsPanel] Error cargando:', e)
  } finally {
    cargando.value = false
  }
}

const abrirForm = () => {
  form.value = initialForm()
  error.value = ''
  formOpen.value = true
}

const guardar = async () => {
  if (!canSave.value) return
  guardando.value = true
  error.value = ''
  try {
    const { data } = await createExtraCost(props.quotationId, {
      categoria: form.value.categoria,
      fecha: form.value.fecha,
      monto: form.value.monto,
      descripcion: form.value.descripcion.trim(),
    })
    costos.value.unshift(data)
    formOpen.value = false
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al guardar el costo'
  } finally {
    guardando.value = false
  }
}

const eliminar = async (id) => {
  if (!confirm('¿Eliminar este costo adicional?')) return
  try {
    await deleteExtraCost(props.quotationId, id)
    costos.value = costos.value.filter((c) => c.id !== id)
  } catch (e) {
    console.error('[ExtraCostsPanel] Error eliminando:', e)
  }
}

const onFileChange = async (event, costId) => {
  const file = event.target.files?.[0]
  if (!file) return
  uploadingId.value = costId
  try {
    const { data } = await uploadExtraCostSoporte(props.quotationId, costId, file)
    const idx = costos.value.findIndex((c) => c.id === costId)
    if (idx !== -1) costos.value[idx] = { ...costos.value[idx], soporteUrl: data.soporteUrl }
  } catch (e) {
    console.error('[ExtraCostsPanel] Error subiendo soporte:', e)
  } finally {
    uploadingId.value = null
    event.target.value = ''
  }
}

watch(() => props.quotationId, (val) => { if (val) cargar() }, { immediate: true })
</script>

<style scoped>
.ecp-wrap {
  margin-top: 16px;
  background: #FEF2F2;
  border: 1.5px solid #FECACA;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ecp-header {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ecp-header-icon { color: #B91C1C; flex-shrink: 0; }
.ecp-header-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #7F1D1D;
  font-family: 'Inter', sans-serif;
}
.ecp-count {
  font-size: 10px;
  font-weight: 700;
  background: #FECACA;
  color: #7F1D1D;
  border-radius: 99px;
  padding: 1px 7px;
  font-family: 'Inter', sans-serif;
}
.ecp-total {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: #B91C1C;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.ecp-hint {
  font-size: 11px;
  color: #991B1B;
  opacity: 0.75;
  font-family: 'Inter', sans-serif;
  margin: -4px 0 0;
}

/* Lista */
.ecp-list { display: flex; flex-direction: column; gap: 8px; }
.ecp-item {
  background: white;
  border-radius: 9px;
  padding: 8px 10px;
  border-left: 3px solid #EF4444;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
}
.ecp-item-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ecp-cat-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 7px;
  border-radius: 99px;
  font-family: 'Inter', sans-serif;
  background: #FEE2E2;
  color: #B91C1C;
  white-space: nowrap;
}
.ecp-fecha {
  font-size: 10px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}
.ecp-monto {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.ecp-del {
  background: none;
  border: none;
  cursor: pointer;
  color: #CBD5E1;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.ecp-del:hover { color: #B91C1C; background: #FEE2E2; }
.ecp-desc {
  font-size: 12px;
  color: #374151;
  font-family: 'Inter', sans-serif;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.ecp-item-foot {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ecp-registrador {
  font-size: 10px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}
.ecp-soporte-link,
.ecp-soporte-upload {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  text-decoration: none;
  margin-left: auto;
}
.ecp-soporte-link:hover,
.ecp-soporte-upload:hover { text-decoration: underline; }
.ecp-file-input { display: none; }

.ecp-empty {
  font-size: 12px;
  color: #7F1D1D;
  font-family: 'Inter', sans-serif;
  opacity: 0.6;
  text-align: center;
  padding: 4px 0;
}

/* Formulario */
.ecp-form { display: flex; flex-direction: column; gap: 8px; }
.ecp-btn-open {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #B91C1C;
  background: none;
  border: 1px dashed #FCA5A5;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: 'Inter', sans-serif;
  width: 100%;
  justify-content: center;
}
.ecp-btn-open:hover { background: #FEE2E2; }
.ecp-form-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ecp-select,
.ecp-input,
.ecp-textarea {
  width: 100%;
  background: white;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  box-sizing: border-box;
}
.ecp-select { appearance: none; cursor: pointer; }
.ecp-textarea { resize: none; line-height: 1.5; }
.ecp-select:focus,
.ecp-input:focus,
.ecp-textarea:focus { border-color: #B91C1C; box-shadow: 0 0 0 2px rgba(185,28,28,.15); }
.ecp-textarea::placeholder,
.ecp-input::placeholder { color: #94A3B8; }

.ecp-error {
  font-size: 11px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
}

.ecp-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.ecp-btn-cancel {
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid #E5EAF0;
  background: #F1F5F9;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
}
.ecp-btn-cancel:hover { background: #E2E8F0; }
.ecp-btn-add {
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 5px 14px;
  border-radius: 7px;
  border: none;
  background: #B91C1C;
  color: white;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.ecp-btn-add:hover:not(:disabled) { background: #991B1B; }
.ecp-btn-add:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
