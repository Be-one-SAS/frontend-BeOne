<template>
  <div class="qp-page">

    <!-- Header -->
    <div class="qp-header">
      <div class="qp-header-left">
        <SlidersHorizontal :size="22" class="qp-header-icon" />
        <div>
          <h1 class="qp-title">Parámetros de Cotización</h1>
          <p class="qp-subtitle">Configura los parámetros utilizados en el cálculo de productos de terceros</p>
        </div>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="qp-card">
      <div v-for="n in 5" :key="n" class="qp-skeleton-row">
        <div class="qp-skel qp-skel--label"></div>
        <div class="qp-skel qp-skel--key"></div>
        <div class="qp-skel qp-skel--input"></div>
        <div class="qp-skel qp-skel--btn"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="qp-card qp-error">
      <AlertCircle :size="20" />
      <span>{{ loadError }}</span>
      <button class="qp-btn-retry" @click="fetchParams">Reintentar</button>
    </div>

    <!-- Table -->
    <div v-else class="qp-card">
      <div class="qp-table-wrap">
        <table class="qp-table">
          <thead>
            <tr>
              <th>Parámetro</th>
              <th>Clave</th>
              <th>Valor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in params" :key="param.key" :class="{ 'qp-row--saving': saving[param.key] }">
              <td class="qp-td-label">{{ param.label || param.key }}</td>
              <td class="qp-td-key">
                <code class="qp-code">{{ param.key }}</code>
              </td>
              <td class="qp-td-input">
                <input
                  v-model="edited[param.key]"
                  :type="isNumeric(param.value) ? 'number' : 'text'"
                  class="qp-input"
                  :disabled="saving[param.key]"
                  @keydown.enter="save(param)"
                />
              </td>
              <td class="qp-td-action">
                <div class="qp-action-row">
                  <button
                    class="qp-btn-save"
                    :disabled="saving[param.key] || String(edited[param.key]) === String(param.value)"
                    @click="save(param)"
                  >
                    <Loader2 v-if="saving[param.key]" :size="13" class="qp-spin" />
                    <Save v-else :size="13" />
                    Guardar
                  </button>
                  <span v-if="saved[param.key]" class="qp-saved-badge">
                    <CheckCircle2 :size="13" />
                    Guardado
                  </span>
                  <span v-if="errors[param.key]" class="qp-err-badge">
                    {{ errors[param.key] }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty -->
      <div v-if="!params.length" class="qp-empty">
        <SlidersHorizontal :size="36" class="qp-empty-ico" />
        <p>No se encontraron parámetros configurables</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { SlidersHorizontal, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { getParams, updateParam } from '@/services/quotation-params.service'

const params = ref([])
const edited = ref({})
const loading = ref(false)
const loadError = ref('')
const saving = ref({})
const saved = ref({})
const errors = ref({})

const fetchParams = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await getParams()
    const list = Array.isArray(data) ? data : Object.entries(data).map(([key, value]) => ({ key, value }))
    params.value = list
    list.forEach(p => { edited.value[p.key] = p.value })
  } catch (e) {
    loadError.value = e?.response?.data?.message || 'Error al cargar los parámetros'
  } finally {
    loading.value = false
  }
}

const save = async (param) => {
  saving.value[param.key] = true
  errors.value[param.key] = ''
  saved.value[param.key] = false
  try {
    await updateParam(param.key, edited.value[param.key])
    param.value = edited.value[param.key]
    saved.value[param.key] = true
    setTimeout(() => { saved.value[param.key] = false }, 2500)
  } catch (e) {
    errors.value[param.key] = e?.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value[param.key] = false
  }
}

const isNumeric = (val) => !isNaN(parseFloat(val)) && isFinite(val)

onMounted(async () => { await fetchParams() })
</script>

<style scoped>
.qp-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding-bottom: 40px;
}

/* Header */
.qp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.qp-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.qp-header-icon { color: #054EAF; flex-shrink: 0; }
.qp-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 2px;
}
.qp-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #64748B;
  margin: 0;
}

/* Card */
.qp-card {
  background: #fff;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06), 0 4px 16px rgba(5, 78, 175, .08);
  border: 1px solid #EEF1F7;
  overflow: hidden;
}

/* Skeleton */
.qp-skeleton-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  border-bottom: 1px solid #F1F5FA;
}
.qp-skel {
  background: #EEF1F7;
  border-radius: 6px;
  animation: shimmer 1.2s infinite ease-in-out;
  height: 16px;
}
.qp-skel--label { width: 160px; }
.qp-skel--key   { width: 100px; }
.qp-skel--input { flex: 1; }
.qp-skel--btn   { width: 80px; }
@keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

/* Error */
.qp-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  color: #B91C1C;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}
.qp-btn-retry {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid #FECACA;
  border-radius: 7px;
  cursor: pointer;
  margin-left: 8px;
}

/* Table */
.qp-table-wrap { overflow-x: auto; }
.qp-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}
.qp-table thead tr {
  background: #F8FAFC;
  border-bottom: 2px solid #EBF3FC;
}
.qp-table th {
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 10px 20px;
  white-space: nowrap;
}
.qp-table td {
  padding: 12px 20px;
  border-bottom: 1px solid #F1F5FA;
  color: #0F1A2E;
  vertical-align: middle;
}
.qp-table tr:last-child td { border-bottom: none; }
.qp-row--saving { opacity: 0.7; }

.qp-td-label { font-weight: 500; min-width: 160px; }
.qp-td-key   { min-width: 120px; }
.qp-td-input { min-width: 160px; }
.qp-td-action { min-width: 180px; }

.qp-code {
  font-size: 11px;
  background: #EEF1F7;
  color: #374151;
  padding: 2px 7px;
  border-radius: 5px;
  font-family: 'Fira Code', monospace;
}

.qp-input {
  width: 100%;
  padding: 7px 11px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  border: 1px solid #D1DAE6;
  border-radius: 8px;
  background: #F8FAFC;
  transition: border 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.qp-input:focus {
  outline: none;
  border-color: #054EAF;
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.10);
  background: #fff;
}
.qp-input:disabled { opacity: 0.6; cursor: not-allowed; }

.qp-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qp-btn-save {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 600;
  background: #054EAF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s, opacity 0.15s;
  box-shadow: 0 1px 4px rgba(5, 78, 175, 0.18);
}
.qp-btn-save:hover:not(:disabled) { background: #03368A; }
.qp-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
.qp-spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.qp-saved-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #16A34A;
  font-family: 'Inter', sans-serif;
}
.qp-err-badge {
  font-size: 11px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
}

/* Empty */
.qp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: #94A3B8;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}
.qp-empty-ico { color: #CBD5E1; }
</style>
