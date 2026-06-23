<template>
  <div class="cl-page">

    <!-- Loading -->
    <div v-if="loading" class="cl-loading">
      <div class="cl-spinner" />
      <p>Cargando lista de chequeo…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="cl-error-state">
      <div class="cl-error-icon">✗</div>
      <h2>{{ error }}</h2>
      <p>Verifica que el enlace sea correcto.</p>
    </div>

    <!-- Contenido -->
    <template v-else-if="data">

      <!-- Header -->
      <div class="cl-header">
        <div class="cl-logo-row">
          <div class="cl-logo">BeOne</div>
          <div class="cl-logo-sub">Lista de chequeo</div>
        </div>
        <div class="cl-event-info">
          <div class="cl-event-num">COT-{{ data.quotation.numero }}</div>
          <h1 class="cl-event-name">{{ data.quotation.description || data.quotation.empresa || 'Evento' }}</h1>
          <div class="cl-event-meta">
            <span v-if="data.quotation.empresa">{{ data.quotation.empresa }}</span>
            <span v-if="data.quotation.eventStartAt" class="cl-meta-dot">·</span>
            <span v-if="data.quotation.eventStartAt">{{ fmtDate(data.quotation.eventStartAt) }}</span>
            <span v-if="data.quotation.ubicacion" class="cl-meta-dot">·</span>
            <span v-if="data.quotation.ubicacion">{{ data.quotation.ubicacion }}</span>
          </div>
        </div>

        <!-- Progreso global -->
        <div class="cl-progress-wrap">
          <div class="cl-progress-bar">
            <div
              class="cl-progress-fill"
              :style="{ width: globalPct + '%' }"
              :class="{ 'cl-progress-done': globalPct === 100 }"
            />
          </div>
          <div class="cl-progress-label">
            <span class="cl-progress-count">{{ globalChecked }} de {{ globalTotal }} aspectos</span>
            <span class="cl-progress-pct" :class="{ 'cl-pct-done': globalPct === 100 }">{{ globalPct }}%</span>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="cl-body">

        <!-- Sin juegos con checklist -->
        <div v-if="juegosList.length === 0" class="cl-empty">
          <p>Este evento no tiene dispositivos con lista de chequeo configurada.</p>
        </div>

        <!-- Juegos con checklist -->
        <div
          v-for="juego in juegosList"
          :key="juego.id"
          class="cl-juego"
        >
          <!-- Cabecera del juego -->
          <div class="cl-juego-header" @click="toggleJuego(juego.id)">
            <div class="cl-juego-icon" :class="juegoPct(juego) === 100 ? 'cl-jicon-done' : 'cl-jicon-pending'">
              <svg v-if="juegoPct(juego) === 100" viewBox="0 0 14 14" fill="none" width="16" height="16">
                <path d="M2 7l3.5 3.5L12 3.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-else class="cl-jicon-num">{{ juegoChecked(juego) }}</span>
            </div>
            <div class="cl-juego-info">
              <span class="cl-juego-nombre">{{ juego.nombre }}</span>
              <span v-if="juego.qty > 1" class="cl-juego-qty">× {{ juego.qty }}</span>
            </div>
            <div class="cl-juego-right">
              <span class="cl-juego-badge" :class="juegoPct(juego) === 100 ? 'cl-badge-green' : 'cl-badge-blue'">
                {{ juegoPct(juego) === 100 ? 'Listo' : `${juegoChecked(juego)}/${data.aspectos.length}` }}
              </span>
              <svg class="cl-juego-chevron" :class="{ open: openJuego === juego.id }"
                viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fill-rule="evenodd" d="M7.293 4.707a1 1 0 010 1.414L4.414 9H15a1 1 0 110 2H4.414l2.879 2.879a1 1 0 01-1.414 1.414l-4.586-4.586a1 1 0 010-1.414l4.586-4.586a1 1 0 011.414 0z" clip-rule="evenodd" transform="rotate(270, 10, 10)"/>
              </svg>
            </div>
          </div>

          <!-- Mini barra -->
          <div class="cl-juego-bar-bg" v-if="juegoChecked(juego) > 0 && juegoPct(juego) < 100">
            <div class="cl-juego-bar-fill" :style="{ width: juegoPct(juego) + '%' }" />
          </div>

          <!-- Panel de aspectos -->
          <div v-if="openJuego === juego.id" class="cl-aspectos">
            <label
              v-for="asp in data.aspectos"
              :key="asp.id"
              class="cl-asp-row"
              :class="{ 'cl-asp-done': getState(juego.id, asp.id) }"
            >
              <span class="cl-asp-cb-wrap">
                <input
                  type="checkbox"
                  :checked="getState(juego.id, asp.id)"
                  @change="toggleAspecto(juego.id, asp.id, $event.target.checked)"
                  class="cl-asp-native"
                />
                <span class="cl-asp-cb">
                  <svg v-if="getState(juego.id, asp.id)" viewBox="0 0 14 14" fill="none" width="12" height="12">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span v-else-if="saving[`${juego.id}:${asp.id}`]" class="cl-spin-sm" />
                </span>
              </span>
              <span class="cl-asp-texto" :class="{ 'cl-asp-texto-done': getState(juego.id, asp.id) }">
                {{ asp.texto }}
              </span>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="cl-footer">
          <div class="cl-footer-brand">BeOne Entretenimiento</div>
          <div v-if="lastSaved" class="cl-footer-saved">✓ Guardado</div>
        </div>
      </div>
    </template>

    <!-- Toast de error -->
    <div v-if="saveError" class="cl-toast cl-toast-err">
      Error al guardar — intenta de nuevo
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getChecklistEvento, toggleChecklistItem } from '@/services/checklist-evento.service.js'

const route = useRoute()

const loading   = ref(true)
const error     = ref(null)
const data      = ref(null)        // { quotation, aspectos, juegos }
const state     = ref({})          // { [juegoId]: { [aspectoId]: boolean } }
const saving    = ref({})
const saveError = ref(false)
const lastSaved = ref(false)
const openJuego = ref(null)

const juegosList = computed(() =>
  (data.value?.juegos ?? []).filter(j => j.requiereChecklist)
)

const getState = (juegoId, aspectoId) =>
  !!(state.value[juegoId]?.[aspectoId])

const juegoChecked = (juego) => {
  if (!data.value?.aspectos) return 0
  return data.value.aspectos.filter(a => getState(juego.id, a.id)).length
}

const juegoPct = (juego) => {
  if (!data.value?.aspectos?.length) return 0
  return Math.round((juegoChecked(juego) / data.value.aspectos.length) * 100)
}

const globalTotal   = computed(() =>
  juegosList.value.length * (data.value?.aspectos?.length ?? 0)
)
const globalChecked = computed(() =>
  juegosList.value.reduce((acc, j) => acc + juegoChecked(j), 0)
)
const globalPct = computed(() =>
  globalTotal.value === 0 ? 0 : Math.round((globalChecked.value / globalTotal.value) * 100)
)

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

function toggleJuego(juegoId) {
  openJuego.value = openJuego.value === juegoId ? null : juegoId
}

async function toggleAspecto(juegoId, aspectoId, newVal) {
  const key = `${juegoId}:${aspectoId}`
  if (saving.value[key]) return

  // Optimistic update
  if (!state.value[juegoId]) state.value[juegoId] = {}
  state.value[juegoId][aspectoId] = newVal
  saving.value[key] = true

  try {
    await toggleChecklistItem(data.value.quotation.id, juegoId, aspectoId, newVal)
    lastSaved.value = true
    setTimeout(() => { lastSaved.value = false }, 2500)
  } catch {
    // Revert
    state.value[juegoId][aspectoId] = !newVal
    saveError.value = true
    setTimeout(() => { saveError.value = false }, 3000)
  } finally {
    saving.value[key] = false
  }
}

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    if (isNaN(id)) throw new Error('ID inválido')
    const res = await getChecklistEvento(id)
    data.value = res

    // Build reactive state from saved backend data
    const initialState = {}
    for (const juego of res.juegos ?? []) {
      initialState[juego.id] = {}
      for (const [aspectoId, completado] of Object.entries(juego.state ?? {})) {
        initialState[juego.id][Number(aspectoId)] = completado
      }
    }
    state.value = initialState

    // Auto-open first juego if only one
    if (juegosList.value.length === 1) {
      openJuego.value = juegosList.value[0].id
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Este evento no está disponible'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
* { box-sizing: border-box; }

.cl-page {
  min-height: 100vh;
  background: #F0F4F8;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Loading / Error */
.cl-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100vh; gap: 16px; color: #64748B;
}
.cl-spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid #E2E8F0; border-top-color: #054EAF;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.cl-error-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100vh; padding: 32px; text-align: center; gap: 12px;
}
.cl-error-icon {
  width: 64px; height: 64px; border-radius: 50%; background: #FEE2E2; color: #991B1B;
  display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900;
}
.cl-error-state h2 { font-size: 18px; font-weight: 700; color: #0F172A; margin: 0; }
.cl-error-state p  { font-size: 13px; color: #64748B; margin: 0; }

/* Header */
.cl-header {
  background: linear-gradient(160deg, #0a2d6e 0%, #054EAF 100%);
  padding: 20px 20px 24px;
  color: #fff;
}
.cl-logo-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; }
.cl-logo     { font-size: 20px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
.cl-logo-sub { font-size: 10px; color: #93C5FD; letter-spacing: 3px; text-transform: uppercase; }
.cl-event-num  { font-size: 11px; font-weight: 600; color: #93C5FD; letter-spacing: 0.5px; margin-bottom: 4px; }
.cl-event-name {
  font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 6px;
  line-height: 1.3;
}
.cl-event-meta { font-size: 12px; color: #BFDBFE; display: flex; flex-wrap: wrap; gap: 4px; }
.cl-meta-dot   { color: #60A5FA; }

/* Progress bar */
.cl-progress-wrap { margin-top: 16px; }
.cl-progress-bar {
  height: 8px; background: rgba(255,255,255,0.2); border-radius: 99px; overflow: hidden; margin-bottom: 6px;
}
.cl-progress-fill {
  height: 100%; background: #60A5FA; border-radius: 99px;
  transition: width 0.4s ease; min-width: 0;
}
.cl-progress-done { background: #34D399; }
.cl-progress-label { display: flex; justify-content: space-between; }
.cl-progress-count { font-size: 12px; color: #BFDBFE; }
.cl-progress-pct   { font-size: 13px; font-weight: 700; color: #60A5FA; }
.cl-pct-done       { color: #34D399; }

/* Body */
.cl-body { padding: 16px; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }

/* Juego card */
.cl-juego {
  background: #fff; border-radius: 14px; border: 1.5px solid #E2E8F0;
  overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.cl-juego-header {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 14px; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.cl-juego-header:active { background: #F8FAFC; }

.cl-jicon-done, .cl-jicon-pending {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.cl-jicon-done    { background: #16A34A; }
.cl-jicon-pending { background: #EFF6FF; }
.cl-jicon-num     { font-size: 11px; font-weight: 700; color: #054EAF; }

.cl-juego-info { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 6px; }
.cl-juego-nombre {
  font-size: 14px; font-weight: 600; color: #0F172A;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cl-juego-qty { font-size: 11px; color: #64748B; white-space: nowrap; }

.cl-juego-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.cl-juego-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px;
}
.cl-badge-green { background: #DCFCE7; color: #16A34A; }
.cl-badge-blue  { background: #DBEAFE; color: #1D4ED8; }

.cl-juego-chevron {
  color: #94A3B8; transition: transform 0.2s;
}
.cl-juego-chevron.open { transform: rotate(90deg); }

/* Mini progress bar */
.cl-juego-bar-bg {
  height: 3px; background: #F1F5F9; margin: 0 14px 2px;
}
.cl-juego-bar-fill {
  height: 100%; background: #60A5FA; border-radius: 99px;
  transition: width 0.3s ease;
}

/* Aspectos panel */
.cl-aspectos { border-top: 1px solid #F1F5F9; padding: 8px 0; }

.cl-asp-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 14px; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.cl-asp-row:active { background: #F8FAFC; }
.cl-asp-done { background: #F0FDF4; }

.cl-asp-cb-wrap { flex-shrink: 0; padding-top: 1px; }
.cl-asp-native  { position: absolute; opacity: 0; width: 0; height: 0; }
.cl-asp-cb {
  width: 22px; height: 22px; border-radius: 6px;
  border: 1.5px solid #CBD5E1; background: #F8FAFC;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.cl-asp-done .cl-asp-cb { background: #16A34A; border-color: #16A34A; }

.cl-asp-texto {
  font-size: 13px; color: #0F172A; line-height: 1.45; flex: 1;
}
.cl-asp-texto-done { text-decoration: line-through; color: #94A3B8; }

/* Save spinner */
.cl-spin-sm {
  width: 10px; height: 10px; border-radius: 50%;
  border: 1.5px solid rgba(0,0,0,0.15); border-top-color: #054EAF;
  animation: spin 0.7s linear infinite;
}

/* Empty */
.cl-empty { text-align: center; padding: 40px 16px; color: #94A3B8; font-size: 13px; }

/* Footer */
.cl-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 4px 8px; font-size: 11px; color: #94A3B8;
}
.cl-footer-brand { font-weight: 700; color: #054EAF; }
.cl-footer-saved { color: #16A34A; font-weight: 600; }

/* Toast */
.cl-toast {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 999;
  animation: slideUp 0.2s ease;
}
.cl-toast-err { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
@keyframes slideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(10px) }
  to   { opacity: 1; transform: translateX(-50%) translateY(0) }
}
</style>
