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
    <template v-else-if="evento">

      <!-- Header -->
      <div class="cl-header">
        <div class="cl-logo-row">
          <div class="cl-logo">BeOne</div>
          <div class="cl-logo-sub">Lista de chequeo</div>
        </div>
        <div class="cl-event-info">
          <div class="cl-event-num">COT-{{ evento.numero }}</div>
          <h1 class="cl-event-name">{{ evento.description || evento.empresa || 'Evento' }}</h1>
          <div class="cl-event-meta">
            <span v-if="evento.cliente?.name || evento.empresa">
              {{ evento.cliente?.name || evento.empresa }}
            </span>
            <span v-if="evento.operationWindow?.eventStartAt" class="cl-meta-dot">·</span>
            <span v-if="evento.operationWindow?.eventStartAt">
              {{ fmtDate(evento.operationWindow.eventStartAt) }}
            </span>
            <span v-if="evento.ubicacion" class="cl-meta-dot">·</span>
            <span v-if="evento.ubicacion">{{ evento.ubicacion }}</span>
          </div>
        </div>

        <!-- Progreso -->
        <div class="cl-progress-wrap">
          <div class="cl-progress-bar">
            <div
              class="cl-progress-fill"
              :style="{ width: progressPct + '%' }"
              :class="{ 'cl-progress-done': progressPct === 100 }"
            />
          </div>
          <div class="cl-progress-label">
            <span class="cl-progress-count">{{ completados }} de {{ totalItems }}</span>
            <span class="cl-progress-pct" :class="{ 'cl-pct-done': progressPct === 100 }">
              {{ progressPct }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="cl-body">

        <!-- ── Dispositivos ── -->
        <section v-if="evento.products?.length" class="cl-section">
          <div class="cl-sec-title">
            <span class="cl-sec-icon">📦</span>
            Dispositivos
            <span class="cl-sec-count">{{ evento.products.length }}</span>
          </div>
          <div class="cl-items">
            <button
              v-for="item in evento.products"
              :key="'p' + item.id"
              class="cl-item"
              :class="{ 'cl-item-done': item.check.completado, 'cl-item-saving': saving[itemKey('PRODUCT', item.id)] }"
              @click="toggleCheck(item, 'PRODUCT')"
              type="button"
            >
              <div class="cl-item-check">
                <div class="cl-check-circle" :class="{ 'cl-check-on': item.check.completado }">
                  <svg v-if="item.check.completado" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <div v-else-if="saving[itemKey('PRODUCT', item.id)]" class="cl-spin-sm" />
                </div>
              </div>
              <div class="cl-item-body">
                <span class="cl-item-name" :class="{ 'cl-name-done': item.check.completado }">
                  {{ item.dispositivo || item.nombre }}
                </span>
                <span v-if="item.cantidad > 1" class="cl-item-qty">× {{ item.cantidad }}</span>
              </div>
              <span v-if="item.categoria" class="cl-item-cat">{{ item.categoria }}</span>
            </button>
          </div>
        </section>

        <!-- ── Terceros ── -->
        <section v-if="evento.thirdPartyItems?.length" class="cl-section">
          <div class="cl-sec-title">
            <span class="cl-sec-icon">🔗</span>
            Terceros
            <span class="cl-sec-count">{{ evento.thirdPartyItems.length }}</span>
          </div>
          <div class="cl-items">
            <button
              v-for="item in evento.thirdPartyItems"
              :key="'tp' + item.id"
              class="cl-item"
              :class="{ 'cl-item-done': item.check.completado, 'cl-item-saving': saving[itemKey('THIRD_PARTY', item.id)] }"
              @click="toggleCheck(item, 'THIRD_PARTY')"
              type="button"
            >
              <div class="cl-item-check">
                <div class="cl-check-circle" :class="{ 'cl-check-on': item.check.completado }">
                  <svg v-if="item.check.completado" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <div v-else-if="saving[itemKey('THIRD_PARTY', item.id)]" class="cl-spin-sm" />
                </div>
              </div>
              <div class="cl-item-body">
                <span class="cl-item-name" :class="{ 'cl-name-done': item.check.completado }">{{ item.nombre }}</span>
                <span v-if="item.cantidad > 1" class="cl-item-qty">× {{ item.cantidad }}</span>
              </div>
              <span v-if="item.categoria" class="cl-item-cat">{{ item.categoria }}</span>
            </button>
          </div>
        </section>

        <!-- ── Materiales ── -->
        <section v-if="evento.materials?.length" class="cl-section">
          <div class="cl-sec-title">
            <span class="cl-sec-icon">🔧</span>
            Materiales
            <span class="cl-sec-count">{{ evento.materials.length }}</span>
          </div>
          <div class="cl-items">
            <button
              v-for="(item, idx) in evento.materials"
              :key="'m' + (item.id ?? idx)"
              class="cl-item"
              :class="{ 'cl-item-done': item.check.completado, 'cl-item-saving': saving[matKey(item, idx)] }"
              @click="item.id ? toggleCheck(item, 'MATERIAL') : null"
              :disabled="!item.id"
              type="button"
            >
              <div class="cl-item-check">
                <div class="cl-check-circle"
                  :class="{ 'cl-check-on': item.check.completado, 'cl-check-disabled': !item.id }">
                  <svg v-if="item.check.completado" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <div v-else-if="saving[matKey(item, idx)]" class="cl-spin-sm" />
                </div>
              </div>
              <div class="cl-item-body">
                <span class="cl-item-name" :class="{ 'cl-name-done': item.check.completado }">{{ item.nombre }}</span>
                <span class="cl-item-qty">{{ item.cantidad }} {{ item.unidad || '' }}</span>
              </div>
              <span v-if="item.categoria?.nombre" class="cl-item-cat">{{ item.categoria.nombre }}</span>
            </button>
          </div>
        </section>

        <!-- Sin items -->
        <div v-if="!evento.products?.length && !evento.thirdPartyItems?.length && !evento.materials?.length" class="cl-empty">
          <p>Este evento no tiene items en la lista de chequeo.</p>
        </div>

        <!-- Footer -->
        <div class="cl-footer">
          <div class="cl-footer-brand">BeOne Entretenimiento</div>
          <div v-if="lastSaved" class="cl-footer-saved">✓ Guardado</div>
        </div>

      </div>
    </template>

    <!-- Toast de error al guardar -->
    <div v-if="saveError" class="cl-toast cl-toast-err">
      Error al guardar — intenta de nuevo
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getMontajePublic, upsertCheckPublic } from '@/services/montajes.service.js'

const route = useRoute()

const loading   = ref(true)
const error     = ref(null)
const evento    = ref(null)
const saving    = ref({})
const saveError = ref(false)
const lastSaved = ref(false)

const itemKey = (type, id) => `${type}:${id}`
const matKey  = (item, idx) => item.id ? `MATERIAL:${item.id}` : `MATERIAL_d:${idx}`

const totalItems  = computed(() => {
  if (!evento.value) return 0
  return (evento.value.products?.length ?? 0) +
         (evento.value.thirdPartyItems?.length ?? 0) +
         (evento.value.materials?.length ?? 0)
})

const completados = computed(() => {
  if (!evento.value) return 0
  const all = [
    ...(evento.value.products ?? []),
    ...(evento.value.thirdPartyItems ?? []),
    ...(evento.value.materials ?? []),
  ]
  return all.filter(i => i.check.completado).length
})

const progressPct = computed(() =>
  totalItems.value === 0 ? 0 : Math.round((completados.value / totalItems.value) * 100)
)

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function toggleCheck(item, type) {
  const key = itemKey(type, item.id)
  if (saving.value[key]) return
  const newVal = !item.check.completado
  item.check.completado = newVal
  saving.value[key] = true
  try {
    await upsertCheckPublic({
      quotationId: evento.value.id,
      itemType:    type,
      itemId:      item.id,
      completado:  newVal,
    })
    lastSaved.value = true
    setTimeout(() => { lastSaved.value = false }, 3000)
  } catch {
    item.check.completado = !newVal
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
    evento.value = await getMontajePublic(id)
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
  line-height: 1.3; font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
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
.cl-body { padding: 16px; max-width: 600px; margin: 0 auto; }

/* Section */
.cl-section  { margin-bottom: 16px; }
.cl-sec-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: #475569;
  text-transform: uppercase; letter-spacing: 0.6px;
  margin-bottom: 8px; padding: 0 4px;
}
.cl-sec-icon  { font-size: 14px; }
.cl-sec-count {
  margin-left: auto; background: #E2E8F0; color: #64748B;
  font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 99px;
}

/* Items */
.cl-items { display: flex; flex-direction: column; gap: 6px; }
.cl-item {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 12px; padding: 12px 14px;
  border: 1.5px solid #E2E8F0; cursor: pointer; text-align: left; width: 100%;
  transition: all 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  -webkit-tap-highlight-color: transparent;
}
.cl-item:active { transform: scale(0.98); }
.cl-item-done { background: #F0FDF4; border-color: #BBF7D0; }
.cl-item:disabled { cursor: default; opacity: 0.6; }

/* Check circle */
.cl-item-check { flex-shrink: 0; }
.cl-check-circle {
  width: 26px; height: 26px; border-radius: 50%;
  border: 2px solid #CBD5E1; background: #F8FAFC;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.18s;
}
.cl-check-on { background: #16A34A; border-color: #16A34A; }
.cl-check-on svg { display: block; width: 14px; height: 14px; }
.cl-check-disabled { border-color: #E2E8F0; background: #F1F5F9; }

/* Item body */
.cl-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cl-item-name {
  font-size: 14px; font-weight: 500; color: #0F172A;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cl-name-done { text-decoration: line-through; color: #94A3B8; }
.cl-item-qty  { font-size: 11px; color: #64748B; }
.cl-item-cat  {
  font-size: 10px; font-weight: 600; color: #64748B;
  background: #F1F5F9; padding: 2px 7px; border-radius: 99px;
  white-space: nowrap; flex-shrink: 0;
}

/* Saving spinner */
.cl-spin-sm {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.15); border-top-color: #054EAF;
  animation: spin 0.7s linear infinite;
}

/* Empty */
.cl-empty { text-align: center; padding: 40px 16px; color: #94A3B8; font-size: 13px; }

/* Footer */
.cl-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 4px 8px; font-size: 11px; color: #94A3B8;
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
@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(10px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
</style>
