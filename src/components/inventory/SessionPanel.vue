<template>
  <Teleport to="body">
    <Transition name="sp-fade">
      <div v-if="show" class="sp-overlay" @click.self="tryClose">
        <div class="sp-card">

          <!-- Header -->
          <div class="sp-header">
            <div class="sp-header-icon"><Smartphone :size="18" /></div>
            <div class="sp-header-text">
              <h3 class="sp-title">Sesión de escaneo</h3>
              <p class="sp-subtitle" v-if="session">
                Token: <code class="sp-token">{{ session.token.slice(0,8) }}…</code>
                <span class="sp-dot" :class="session ? 'sp-dot--on' : 'sp-dot--off'" />
                {{ session ? 'Activa' : 'Inactiva' }}
              </p>
            </div>
            <button class="sp-close" @click="tryClose"><X :size="18" /></button>
          </div>

          <!-- Tabs -->
          <div class="sp-tabs" v-if="!session">
            <button class="sp-tab" :class="{ 'sp-tab--active': tab === 'rapido' }" @click="tab = 'rapido'">
              <Zap :size="13" /> Escaneo rápido
            </button>
            <button class="sp-tab" :class="{ 'sp-tab--active': tab === 'conteo' }" @click="tab = 'conteo'">
              <ClipboardList :size="13" /> Conteo completo
            </button>
          </div>

          <div class="sp-body">

            <!-- ── Sin sesión: pantalla de inicio ── -->
            <template v-if="!session">
              <div class="sp-start">
                <div class="sp-start-icon">
                  <Zap v-if="tab === 'rapido'" :size="28" />
                  <ClipboardList v-else :size="28" />
                </div>
                <h4 class="sp-start-title">
                  {{ tab === 'rapido' ? 'Escaneo rápido' : 'Conteo completo' }}
                </h4>
                <p class="sp-start-desc">
                  {{ tab === 'rapido'
                    ? 'Escanea ítems individualmente. Ideal para verificar o actualizar elementos específicos.'
                    : 'Recorre todo el inventario ítem por ítem y actualiza el stock al final.' }}
                </p>
                <button class="sp-btn-primary" :disabled="creating" @click="startSession">
                  <Loader2 v-if="creating" :size="15" class="spin" />
                  <Smartphone v-else :size="15" />
                  {{ creating ? 'Creando sesión…' : 'Iniciar sesión' }}
                </button>
              </div>
            </template>

            <!-- ── Sesión activa ── -->
            <template v-else>

              <!-- QR de la URL de sesión -->
              <div class="sp-qr-block">
                <p class="sp-qr-hint">Escanea con el móvil para abrir la interfaz de escaneo</p>
                <div class="sp-qr-wrap">
                  <canvas ref="qrCanvas" class="sp-qr-canvas" />
                </div>
                <div class="sp-url-row">
                  <span class="sp-url-text">{{ session.url }}</span>
                  <button class="sp-copy-btn" @click="copyUrl" :title="copied ? 'Copiado' : 'Copiar URL'">
                    <Check v-if="copied" :size="13" />
                    <Copy v-else :size="13" />
                  </button>
                </div>
              </div>

              <!-- Tab conteo: progress -->
              <div v-if="session.tipo === 'CONTEO_COMPLETO'" class="sp-progress-block">
                <div class="sp-progress-header">
                  <span>Progreso del conteo</span>
                  <span class="sp-progress-count">{{ scannedIds.size }} / {{ totalItems }} ítems</span>
                </div>
                <div class="sp-progress-track">
                  <div class="sp-progress-fill" :style="{ width: countPct + '%' }" />
                </div>
              </div>

              <!-- Feed de eventos -->
              <div class="sp-feed">
                <div class="sp-feed-title">
                  <Activity :size="13" />
                  Últimos escaneos
                  <span class="sp-feed-count">{{ events.length }}</span>
                </div>
                <div v-if="events.length === 0" class="sp-feed-empty">
                  Esperando escaneos desde el móvil…
                </div>
                <div v-for="ev in events" :key="ev.id" class="sp-feed-row">
                  <div class="sp-feed-icon" :class="ev.metodo === 'QR' ? 'feed-qr' : 'feed-manual'">
                    <QrCode v-if="ev.metodo === 'QR'" :size="11" />
                    <Keyboard v-else :size="11" />
                  </div>
                  <div class="sp-feed-info">
                    <span class="sp-feed-name">{{ ev.product?.dispositivo ?? ev.product?.nombre ?? ev.codigoEscaneado }}</span>
                    <span class="sp-feed-code">{{ ev.codigoEscaneado }}</span>
                  </div>
                  <div class="sp-feed-qty" v-if="ev.cantidadNueva != null">
                    <span class="sp-qty-val">{{ ev.cantidadNueva }}</span>
                  </div>
                  <span class="sp-feed-time">{{ fmtTime(ev.escanadoEn) }}</span>
                </div>
              </div>

              <!-- Cerrar sesión -->
              <div class="sp-footer">
                <button class="sp-btn-close-session" :disabled="closing" @click="closeSession">
                  <Loader2 v-if="closing" :size="14" class="spin" />
                  <span v-else>Cerrar sesión</span>
                </button>
              </div>

            </template>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, nextTick, onUnmounted } from 'vue'
import { X, Smartphone, Zap, ClipboardList, Loader2, Activity, QrCode, Keyboard, Copy, Check } from 'lucide-vue-next'
import QRCode from 'qrcode'
import { createScanSession, getScanEvents, closeScanSession } from '@/services/inventory.service'

const props = defineProps({
  show:       Boolean,
  totalItems: { type: Number, default: 0 },
})
const emit = defineEmits(['close', 'session-closed'])

const tab      = ref('rapido')
const session  = ref(null)
const events   = ref([])
const creating = ref(false)
const closing  = ref(false)
const copied   = ref(false)
const qrCanvas = ref(null)

let pollTimer = null

// ── Computed ─────────────────────────────────────────────
const scannedIds = computed(() => new Set(events.value.map(e => e.product?.id)))
const countPct   = computed(() => {
  if (!props.totalItems) return 0
  return Math.round((scannedIds.value.size / props.totalItems) * 100)
})

// ── Start session ─────────────────────────────────────────
async function startSession() {
  creating.value = true
  try {
    session.value = await createScanSession(tab.value === 'rapido' ? 'RAPIDO' : 'CONTEO_COMPLETO')
    await nextTick()
    renderQR()
    startPolling()
  } catch (e) {
    console.error('[SessionPanel] Error creando sesión:', e)
  } finally {
    creating.value = false
  }
}

// ── QR render ─────────────────────────────────────────────
async function renderQR() {
  if (!qrCanvas.value || !session.value?.url) return
  await QRCode.toCanvas(qrCanvas.value, session.value.url, {
    width: 180, margin: 1,
    color: { dark: '#0F1A2E', light: '#FFFFFF' },
  })
}

// ── Polling ───────────────────────────────────────────────
function startPolling() {
  pollTimer = setInterval(async () => {
    if (!session.value) return
    try {
      events.value = await getScanEvents(session.value.token)
    } catch {}
  }, 3000)
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

// ── Close session ──────────────────────────────────────────
async function closeSession() {
  closing.value = true
  try {
    const result = await closeScanSession(session.value.token)
    stopPolling()
    emit('session-closed', result)
    session.value = null
    events.value  = []
    emit('close')
  } catch (e) {
    console.error('[SessionPanel] Error cerrando sesión:', e)
  } finally {
    closing.value = false
  }
}

function tryClose() {
  if (session.value) return  // no cerrar overlay accidentalmente con sesión activa
  emit('close')
}

// ── Copy URL ──────────────────────────────────────────────
async function copyUrl() {
  if (!session.value?.url) return
  await navigator.clipboard.writeText(session.value.url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''

watch(() => props.show, (val) => {
  if (!val) { stopPolling(); session.value = null; events.value = [] }
})

onUnmounted(stopPolling)
</script>

<style scoped>
.sp-overlay {
  position: fixed; inset: 0;
  background: rgba(15,26,46,.45); backdrop-filter: blur(6px);
  z-index: 1200;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}

.sp-card {
  background: #fff; border-radius: 20px;
  width: 100%; max-width: 480px; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(15,26,46,.22); overflow: hidden;
}

/* Header */
.sp-header { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid #F1F5F9; flex-shrink: 0; }
.sp-header-icon { width: 36px; height: 36px; background: #EBF3FC; color: #054EAF; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sp-header-text { flex: 1; }
.sp-title { font-family: 'Plus Jakarta Sans',sans-serif; font-size: 15px; font-weight: 700; color: #0F1A2E; margin: 0; }
.sp-subtitle { font-size: 11px; color: #94A3B8; margin: 2px 0 0; display: flex; align-items: center; gap: 5px; }
.sp-token { font-family: 'JetBrains Mono',monospace; font-size: 11px; background: #F1F5F9; padding: 1px 4px; border-radius: 4px; }
.sp-dot { width: 7px; height: 7px; border-radius: 50%; }
.sp-dot--on  { background: #22C55E; }
.sp-dot--off { background: #94A3B8; }
.sp-close { background: none; border: none; color: #94A3B8; cursor: pointer; padding: 4px; border-radius: 50%; transition: all .2s; }
.sp-close:hover { background: #F1F5F9; color: #0F1A2E; }

/* Tabs */
.sp-tabs { display: flex; gap: 4px; padding: 12px 20px 0; flex-shrink: 0; }
.sp-tab { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; border: none; font-size: 12px; font-weight: 600; font-family: 'Inter',sans-serif; color: #64748B; background: #F1F5F9; cursor: pointer; transition: all .15s; }
.sp-tab:hover { color: #0F1A2E; }
.sp-tab--active { background: #EBF3FC; color: #054EAF; }

/* Body */
.sp-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }

/* Start screen */
.sp-start { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px 0; text-align: center; }
.sp-start-icon { width: 56px; height: 56px; background: #EBF3FC; color: #054EAF; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.sp-start-title { font-family: 'Plus Jakarta Sans',sans-serif; font-size: 16px; font-weight: 700; color: #0F1A2E; margin: 0; }
.sp-start-desc { font-size: 13px; color: #64748B; font-family: 'Inter',sans-serif; margin: 0; max-width: 300px; line-height: 1.6; }
.sp-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background: #054EAF; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; font-family: 'Inter',sans-serif; cursor: pointer; transition: background .15s; }
.sp-btn-primary:hover:not(:disabled) { background: #0342A0; }
.sp-btn-primary:disabled { opacity: .6; cursor: not-allowed; }

/* QR block */
.sp-qr-block { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.sp-qr-hint { font-size: 12px; color: #64748B; font-family: 'Inter',sans-serif; text-align: center; margin: 0; }
.sp-qr-wrap { padding: 12px; background: #F8FAFC; border-radius: 12px; border: 1px solid #E2EBF6; }
.sp-qr-canvas { display: block; }
.sp-url-row { display: flex; align-items: center; gap: 8px; background: #F1F5F9; border-radius: 8px; padding: 6px 10px; width: 100%; max-width: 320px; }
.sp-url-text { flex: 1; font-size: 10px; color: #64748B; font-family: 'JetBrains Mono',monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-copy-btn { background: none; border: none; color: #054EAF; cursor: pointer; padding: 2px; }

/* Progress */
.sp-progress-block { display: flex; flex-direction: column; gap: 6px; }
.sp-progress-header { display: flex; justify-content: space-between; font-size: 12px; font-family: 'Inter',sans-serif; color: #64748B; }
.sp-progress-count { font-weight: 700; color: #054EAF; }
.sp-progress-track { height: 6px; background: #F1F5F9; border-radius: 999px; overflow: hidden; }
.sp-progress-fill { height: 100%; background: #054EAF; border-radius: 999px; transition: width .4s ease; }

/* Feed */
.sp-feed { display: flex; flex-direction: column; gap: 6px; }
.sp-feed-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94A3B8; }
.sp-feed-count { background: #EBF3FC; color: #054EAF; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 999px; }
.sp-feed-empty { font-size: 12px; color: #94A3B8; font-style: italic; padding: 8px 0; }
.sp-feed-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #F8FAFC; border-radius: 8px; }
.sp-feed-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.feed-qr     { background: #EBF3FC; color: #054EAF; }
.feed-manual { background: #F0FDF4; color: #16A34A; }
.sp-feed-info { flex: 1; min-width: 0; }
.sp-feed-name { display: block; font-size: 12px; font-weight: 600; color: #0F1A2E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-feed-code { display: block; font-size: 10px; color: #94A3B8; font-family: 'JetBrains Mono',monospace; }
.sp-feed-qty { flex-shrink: 0; }
.sp-qty-val { font-family: 'JetBrains Mono',monospace; font-size: 13px; font-weight: 800; color: #054EAF; }
.sp-feed-time { font-size: 10px; color: #94A3B8; flex-shrink: 0; white-space: nowrap; }

/* Footer */
.sp-footer { display: flex; justify-content: flex-end; padding-top: 4px; }
.sp-btn-close-session { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; background: #FEE2E2; color: #B91C1C; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: 'Inter',sans-serif; cursor: pointer; transition: all .15s; }
.sp-btn-close-session:hover:not(:disabled) { background: #B91C1C; color: #fff; }
.sp-btn-close-session:disabled { opacity: .6; cursor: not-allowed; }

/* Spin */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .7s linear infinite; }

/* Transition */
.sp-fade-enter-active, .sp-fade-leave-active { transition: opacity .2s ease, transform .2s ease; }
.sp-fade-enter-from, .sp-fade-leave-to { opacity: 0; transform: scale(.97); }
</style>
