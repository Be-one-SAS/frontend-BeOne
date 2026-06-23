<template>
  <div class="coc-wrap">
    <div class="coc-header-row">
      <h2 class="coc-title">Campos de Observaciones y Anclajes</h2>
      <button class="coc-save-btn" :disabled="saving" @click="save">
        <span v-if="saving" class="coc-spinner" />
        <span v-else>Guardar</span>
      </button>
    </div>
    <p class="coc-desc">Activa o desactiva los campos que aparecerán en la sección "Observaciones y anclajes" del formulario público de checklist. También puedes personalizar la etiqueta de cada campo.</p>

    <div v-if="loading" class="coc-state">
      <div class="coc-spinner" /> Cargando configuración…
    </div>

    <div v-else class="coc-fields">
      <div v-for="(campo, key) in config" :key="key" class="coc-field-row">
        <label class="coc-toggle">
          <input type="checkbox" v-model="campo.activo" class="coc-toggle-input" />
          <span class="coc-toggle-track" :class="{ active: campo.activo }" />
        </label>
        <input
          v-model="campo.label"
          class="coc-label-input"
          :class="{ disabled: !campo.activo }"
          :disabled="!campo.activo"
          placeholder="Etiqueta del campo"
        />
        <span class="coc-key-hint">{{ KEY_HINTS[key] || key }}</span>
      </div>
    </div>

    <div v-if="saved" class="coc-success">✓ Configuración guardada</div>
    <div v-if="saveError" class="coc-error">{{ saveError }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../services/api'

const KEY_HINTS = {
  puntosAnclajeTotal:      'puntos de anclaje total',
  puntosAnclajeSinAnclar:  'puntos sin anclar',
  cremalleras:             'cremalleras',
  observacionesDinamizador:'observaciones dinamizador',
  observacionesCliente:    'observaciones cliente',
}

const FIELD_ORDER = [
  'puntosAnclajeTotal',
  'puntosAnclajeSinAnclar',
  'cremalleras',
  'observacionesDinamizador',
  'observacionesCliente',
]

const loading   = ref(true)
const saving    = ref(false)
const saved     = ref(false)
const saveError = ref(null)

const config = reactive({})

onMounted(async () => {
  try {
    const res = await api.get('/app-config/checklist-obs')
    const data = res.data
    for (const key of FIELD_ORDER) {
      config[key] = { activo: data[key]?.activo ?? true, label: data[key]?.label ?? key }
    }
  } catch {
    for (const key of FIELD_ORDER) {
      config[key] = { activo: true, label: key }
    }
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value    = true
  saved.value     = false
  saveError.value = null
  try {
    await api.patch('/app-config/checklist-obs', config)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e) {
    saveError.value = e?.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.coc-wrap {
  padding: 4px 0 16px;
}
.coc-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.coc-title {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin: 0;
}
.coc-desc {
  font-size: 13px;
  color: #64748B;
  margin-bottom: 20px;
  line-height: 1.5;
}
.coc-save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  background: #0F172A;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.coc-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.coc-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748B;
  font-size: 14px;
  padding: 16px 0;
}
.coc-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.coc-field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
}
.coc-toggle { display: flex; align-items: center; cursor: pointer; flex-shrink: 0; }
.coc-toggle-input { display: none; }
.coc-toggle-track {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: #CBD5E1;
  position: relative;
  transition: background 0.2s;
}
.coc-toggle-track::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.2s;
}
.coc-toggle-track.active { background: #16A34A; }
.coc-toggle-track.active::after { left: 18px; }
.coc-label-input {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  font-size: 13px;
  color: #0F172A;
  background: #fff;
  outline: none;
  font-family: 'Inter', sans-serif;
}
.coc-label-input:focus { border-color: #94A3B8; }
.coc-label-input.disabled { background: #F1F5F9; color: #94A3B8; }
.coc-key-hint {
  font-size: 11px;
  color: #94A3B8;
  flex-shrink: 0;
  min-width: 120px;
  text-align: right;
  font-family: 'Inter', sans-serif;
}
.coc-success {
  margin-top: 12px;
  padding: 8px 14px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  color: #15803D;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}
.coc-error {
  margin-top: 12px;
  padding: 8px 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #DC2626;
  border-radius: 8px;
  font-size: 13px;
}
.coc-spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
