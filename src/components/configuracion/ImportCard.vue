<template>
  <div class="ic-card">
    <div class="ic-head">
      <div class="ic-icon"><FileSpreadsheet :size="18" color="#27C8D8" /></div>
      <div>
        <h3 class="ic-title">{{ title }}</h3>
        <p class="ic-desc">{{ description }}</p>
      </div>
    </div>

    <!-- Resultado exitoso -->
    <template v-if="result">
      <div class="ic-result">
        <div class="ic-result-row ic-ok">
          <CheckCircle :size="15" />
          <span>{{ result.insertados }} de {{ result.total }} registros importados</span>
        </div>
        <div v-if="result.errores?.length" class="ic-errors-wrap">
          <div class="ic-errors-header" @click="showErrors = !showErrors">
            <XCircle :size="13" color="#DC2626" />
            <span>{{ result.errores.length }} fila{{ result.errores.length !== 1 ? 's' : '' }} con error</span>
            <ChevronDown v-if="!showErrors" :size="13" />
            <ChevronUp   v-else              :size="13" />
          </div>
          <div v-if="showErrors" class="ic-errors-list">
            <div v-for="e in result.errores" :key="e.fila" class="ic-error-row">
              <span class="ic-fila">Fila {{ e.fila }}</span>
              <span class="ic-motivo">{{ e.motivo }}</span>
            </div>
          </div>
        </div>
      </div>
      <button class="ic-btn-reset" @click="emit('reset')">
        <RotateCcw :size="13" /> Nueva importación
      </button>
    </template>

    <!-- Error global -->
    <template v-else-if="error">
      <div class="ic-global-error"><AlertCircle :size="14" /> {{ error }}</div>
      <button class="ic-btn-reset" @click="emit('reset')">
        <RotateCcw :size="13" /> Reintentar
      </button>
    </template>

    <!-- Upload -->
    <template v-else>
      <div
        class="ic-drop"
        :class="{ 'ic-drop-over': dragging }"
        @click="pickFile"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
      >
        <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onFileChange" />
        <Upload :size="22" class="ic-upload-icon" />
        <span v-if="selectedFile" class="ic-filename">{{ selectedFile.name }}</span>
        <span v-else class="ic-drop-hint">Arrastra un .xlsx o haz clic para seleccionar</span>
      </div>

      <div v-if="selectedFile && !isXlsx" class="ic-warn">
        <AlertCircle :size="13" /> Solo se aceptan archivos .xlsx o .xls
      </div>

      <button class="ic-btn-import" :disabled="!selectedFile || !isXlsx || loading" @click="doImport">
        <span v-if="loading" class="ic-spinner" />
        <Upload v-else :size="14" />
        {{ loading ? 'Importando…' : 'Importar' }}
      </button>

      <div class="ic-cols-toggle" @click="showCols = !showCols">
        <span>Ver columnas esperadas</span>
        <ChevronDown v-if="!showCols" :size="13" />
        <ChevronUp   v-else            :size="13" />
      </div>
      <div v-if="showCols" class="ic-cols-table">
        <div class="ic-col-row ic-col-head">
          <span>Columna</span><span>Req.</span><span>Nota</span>
        </div>
        <div v-for="c in columns" :key="c.col" class="ic-col-row">
          <span class="ic-col-name">{{ c.col }}</span>
          <span :class="c.req ? 'ic-req-yes' : 'ic-req-no'">{{ c.req ? 'Sí' : '—' }}</span>
          <span class="ic-col-note">{{ c.note || '' }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Upload, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, RotateCcw, FileSpreadsheet,
} from 'lucide-vue-next'

const props = defineProps({
  title:       String,
  description: String,
  columns:     Array,
  loading:     Boolean,
  result:      Object,
  error:       String,
})
const emit = defineEmits(['import', 'reset'])

const fileInput    = ref(null)
const dragging     = ref(false)
const showCols     = ref(false)
const showErrors   = ref(false)
const selectedFile = ref(null)

const isXlsx = computed(() =>
  selectedFile.value ? /\.(xlsx|xls)$/i.test(selectedFile.value.name) : true
)

function pickFile() { fileInput.value?.click() }

function onFileChange(e) {
  const f = e.target.files?.[0]
  if (f) { selectedFile.value = f; e.target.value = '' }
}

function onDrop(e) {
  dragging.value = false
  const f = e.dataTransfer.files?.[0]
  if (f) selectedFile.value = f
}

function doImport() {
  if (selectedFile.value) emit('import', selectedFile.value)
}
</script>

<style scoped>
.ic-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ic-head { display: flex; gap: 12px; align-items: flex-start; }
.ic-icon {
  width: 40px; height: 40px; flex-shrink: 0;
  background: #F0FAFB; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.ic-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: #0F172A; margin: 0 0 3px; }
.ic-desc  { font-size: 12px; color: #64748B; margin: 0; line-height: 1.5; }

.ic-drop {
  border: 2px dashed #CBD5E1; border-radius: 12px;
  padding: 24px 16px; display: flex; flex-direction: column;
  align-items: center; gap: 8px; cursor: pointer;
  transition: border-color 0.15s, background 0.15s; text-align: center;
}
.ic-drop:hover, .ic-drop-over { border-color: #27C8D8; background: #F0F7FF; }
.ic-upload-icon { color: #94A3B8; }
.ic-drop:hover .ic-upload-icon, .ic-drop-over .ic-upload-icon { color: #27C8D8; }
.ic-drop-hint { font-size: 12px; color: #94A3B8; }
.ic-filename  { font-size: 12px; color: #27C8D8; font-weight: 600; word-break: break-all; }

.ic-warn { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #DC2626; }

.ic-btn-import {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 9px 16px; border-radius: 10px; border: none;
  background: #27C8D8; color: #fff;
  font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif;
  cursor: pointer; transition: background 0.15s;
}
.ic-btn-import:hover:not(:disabled) { background: #1BAEBB; }
.ic-btn-import:disabled { background: #CBD5E1; cursor: not-allowed; }

.ic-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  animation: spin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.ic-btn-reset {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px;
  border: 1.5px solid #E2E8F0; background: #F8FAFC;
  font-size: 12px; font-weight: 500; color: #374151;
  cursor: pointer; transition: all 0.15s; align-self: flex-start;
}
.ic-btn-reset:hover { border-color: #27C8D8; color: #27C8D8; background: #E0F9FA; }

.ic-result { display: flex; flex-direction: column; gap: 8px; }
.ic-result-row { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; }
.ic-ok { color: #166534; }

.ic-errors-wrap { background: #FFF8F8; border: 1.5px solid #FECACA; border-radius: 10px; overflow: hidden; }
.ic-errors-header {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; cursor: pointer;
  font-size: 12px; font-weight: 600; color: #DC2626;
}
.ic-errors-header:hover { background: #FEF2F2; }
.ic-errors-list { border-top: 1px solid #FECACA; max-height: 180px; overflow-y: auto; }
.ic-error-row {
  display: flex; gap: 10px; padding: 6px 12px;
  border-bottom: 1px solid #FEE2E2; font-size: 11px;
}
.ic-error-row:last-child { border-bottom: none; }
.ic-fila   { font-weight: 600; color: #991B1B; white-space: nowrap; min-width: 48px; }
.ic-motivo { color: #374151; }

.ic-global-error {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px; background: #FEF2F2; border-radius: 8px;
  font-size: 12px; color: #DC2626; border: 1.5px solid #FECACA;
}

.ic-cols-toggle {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #64748B; cursor: pointer;
  user-select: none; width: fit-content;
}
.ic-cols-toggle:hover { color: #27C8D8; }

.ic-cols-table { border: 1.5px solid #E2E8F0; border-radius: 10px; overflow: hidden; }
.ic-col-row {
  display: grid; grid-template-columns: 1fr 50px 100px;
  padding: 6px 10px; font-size: 11px; border-bottom: 1px solid #F1F5F9;
}
.ic-col-row:last-child { border-bottom: none; }
.ic-col-head { background: #F8FAFC; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.4px; }
.ic-col-name { font-weight: 500; color: #0F172A; }
.ic-req-yes  { color: #166534; font-weight: 600; }
.ic-req-no   { color: #CBD5E1; }
.ic-col-note { color: #64748B; font-size: 10px; }
</style>
