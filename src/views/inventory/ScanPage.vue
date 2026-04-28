<template>
  <div class="scan-root" :class="{ 'scan-root--dark': true }">

    <!-- Header -->
    <div class="scan-header">
      <div class="scan-logo">
        <img src="/assets/logo.png" alt="BeOne" class="scan-logo-img" @error="$event.target.style.display='none'" />
      </div>
      <div class="scan-header-info">
        <span class="scan-session-label">Sesión de escaneo</span>
        <span class="scan-status-dot" :class="sessionActive ? 'dot-on' : 'dot-off'" />
        <span class="scan-status-text">{{ sessionActive ? 'Activa' : 'Cerrada' }}</span>
      </div>
    </div>

    <!-- Loading / error / closed -->
    <div v-if="loadingSession" class="scan-state">
      <Loader2 :size="32" class="spin" />
      <p>Verificando sesión…</p>
    </div>

    <div v-else-if="sessionError" class="scan-state scan-state--error">
      <AlertCircle :size="40" />
      <p>{{ sessionError }}</p>
    </div>

    <div v-else-if="!sessionActive" class="scan-state scan-state--closed">
      <CheckCircle2 :size="40" />
      <p>Esta sesión ya fue cerrada</p>
      <span class="scan-state-sub">{{ eventCount }} ítems escaneados en esta sesión</span>
    </div>

    <!-- Scanner activo -->
    <template v-else>

      <!-- Mode toggle -->
      <div class="scan-mode-toggle">
        <button class="scan-mode-btn" :class="{ active: mode === 'camera' }" @click="setMode('camera')">
          <QrCode :size="16" /> Cámara
        </button>
        <button class="scan-mode-btn" :class="{ active: mode === 'manual' }" @click="setMode('manual')">
          <Keyboard :size="16" /> Manual
        </button>
      </div>

      <!-- ── Modo cámara ── -->
      <div v-if="mode === 'camera'" class="scan-camera-area">
        <div class="scan-viewfinder">
          <div id="scan-qr-reader" />
          <!-- Esquinas animadas -->
          <div class="vf-corner vf-tl" />
          <div class="vf-corner vf-tr" />
          <div class="vf-corner vf-bl" />
          <div class="vf-corner vf-br" />
        </div>
        <p class="scan-camera-hint">Apunta la cámara al código QR del ítem</p>
      </div>

      <!-- ── Modo manual ── -->
      <div v-if="mode === 'manual'" class="scan-manual-area">
        <div class="scan-search-wrap">
          <Search :size="16" class="scan-search-icon" />
          <input
            v-model="manualQuery"
            type="text"
            placeholder="Buscar por nombre o código…"
            class="scan-search-input"
            @input="doSearch"
            autofocus
          />
        </div>
        <div class="scan-search-results">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="scan-result-row"
            @click="selectItem(item)"
          >
            <div class="scan-result-info">
              <span class="scan-result-name">{{ item.dispositivo ?? item.nombre }}</span>
              <span class="scan-result-code">{{ item.qrCode ?? item.serialNumber ?? `ID-${item.id}` }}</span>
            </div>
            <ChevronRight :size="16" class="scan-result-arrow" />
          </div>
          <div v-if="manualQuery && !searchResults.length" class="scan-no-results">
            Sin resultados para "{{ manualQuery }}"
          </div>
        </div>
      </div>

      <!-- ── Card de confirmación ── -->
      <Transition name="card-slide">
        <div v-if="pendingItem" class="scan-confirm-card">
          <div class="scan-confirm-header">
            <div>
              <div class="scan-confirm-name">{{ pendingItem.dispositivo ?? pendingItem.nombre }}</div>
              <div class="scan-confirm-code">{{ pendingItem.qrCode ?? pendingItem.serialNumber }}</div>
            </div>
            <button class="scan-confirm-dismiss" @click="pendingItem = null"><X :size="16" /></button>
          </div>
          <div class="scan-confirm-qty">
            <label class="scan-qty-label">Cantidad contada</label>
            <div class="scan-qty-row">
              <button class="scan-qty-btn" @click="qty = Math.max(0, qty - 1)">−</button>
              <input v-model.number="qty" type="number" min="0" class="scan-qty-input" />
              <button class="scan-qty-btn" @click="qty++">+</button>
            </div>
          </div>
          <button class="scan-confirm-btn" :disabled="confirming" @click="confirmScan">
            <Loader2 v-if="confirming" :size="16" class="spin" />
            <Check v-else :size="16" />
            {{ confirming ? 'Guardando…' : 'Confirmar' }}
          </button>
        </div>
      </Transition>

      <!-- Historial bottom sheet -->
      <div class="scan-history" :class="{ 'scan-history--expanded': historyOpen }">
        <div class="scan-history-handle" @click="historyOpen = !historyOpen">
          <div class="handle-bar" />
          <span>Historial ({{ localEvents.length }})</span>
          <ChevronDown :size="14" :class="{ 'rotate-180': historyOpen }" />
        </div>
        <div class="scan-history-body">
          <div v-if="localEvents.length === 0" class="scan-history-empty">Aún no hay escaneos en esta sesión</div>
          <div v-for="ev in localEvents" :key="ev.id" class="scan-history-row">
            <span class="sh-name">{{ ev.product?.dispositivo ?? ev.product?.nombre ?? ev.codigoEscaneado }}</span>
            <span class="sh-qty" v-if="ev.cantidadNueva != null">{{ ev.cantidadNueva }}</span>
            <span class="sh-time">{{ fmtTime(ev.escanadoEn) }}</span>
          </div>
        </div>
      </div>

    </template>

    <!-- Toasts -->
    <div class="scan-toasts">
      <Transition v-for="t in toasts" :key="t.id" name="toast-slide">
        <div class="scan-toast" :class="`toast-${t.type}`">
          <CheckCircle2 v-if="t.type === 'ok'" :size="16" />
          <AlertCircle  v-else-if="t.type === 'warn'" :size="16" />
          <XCircle      v-else :size="16" />
          {{ t.msg }}
        </div>
      </Transition>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Loader2, AlertCircle, CheckCircle2, QrCode, Keyboard,
  Search, ChevronRight, ChevronDown, X, Check, XCircle,
} from 'lucide-vue-next'
import { getScanSession, getScanEvents, submitScan } from '@/services/inventory.service'
import api from '@/services/api'

const route = useRoute()
const token = route.params.token

// ── Session ───────────────────────────────────────────────
const loadingSession = ref(true)
const sessionError   = ref(null)
const sessionActive  = ref(false)
const sessionTipo    = ref(null)
const eventCount     = ref(0)

// ── Mode ──────────────────────────────────────────────────
const mode    = ref('camera')
let   scanner = null

// ── Confirm card ──────────────────────────────────────────
const pendingItem = ref(null)
const qty         = ref(1)
const confirming  = ref(false)

// ── Manual search ──────────────────────────────────────────
const manualQuery   = ref('')
const searchResults = ref([])
let   searchTimer   = null

// ── History ────────────────────────────────────────────────
const historyOpen  = ref(false)
const localEvents  = ref([])

// ── Toasts ────────────────────────────────────────────────
const toasts = ref([])
let toastId = 0

function toast(msg, type = 'ok') {
  const id = ++toastId
  toasts.value.push({ id, msg, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3500)
}

// ── Init ──────────────────────────────────────────────────
onMounted(async () => {
  try {
    const s = await getScanSession(token)
    sessionActive.value = s.estado === 'ACTIVA'
    sessionTipo.value   = s.tipo
    eventCount.value    = s._count?.eventos ?? 0
    if (sessionActive.value) {
      localEvents.value = await getScanEvents(token)
      if (mode.value === 'camera') startCamera()
    }
  } catch {
    sessionError.value = 'Sesión no encontrada o inválida'
  } finally {
    loadingSession.value = false
  }
})

onUnmounted(stopCamera)

// ── Camera ─────────────────────────────────────────────────
async function startCamera() {
  await new Promise(r => setTimeout(r, 100)) // wait for DOM
  const el = document.getElementById('scan-qr-reader')
  if (!el || scanner) return
  try {
    scanner = new Html5Qrcode('scan-qr-reader')
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 12, qrbox: { width: 220, height: 220 } },
      (code) => onCodeDetected(code, 'QR'),
      () => {},
    )
  } catch {
    toast('No se pudo acceder a la cámara', 'error')
  }
}

async function stopCamera() {
  if (scanner) {
    try { await scanner.stop() } catch {}
    scanner = null
  }
}

async function setMode(m) {
  if (m === mode.value) return
  mode.value    = m
  pendingItem.value = null
  if (m === 'camera') { await startCamera() }
  else { stopCamera() }
}

// ── Code detected ──────────────────────────────────────────
async function onCodeDetected(code, metodo) {
  if (pendingItem.value) return  // ya hay uno esperando confirmación
  try {
    // Busca el ítem por código
    const { data } = await api.get('/inventory', { params: { search: code, limit: 1 } })
    const items = data.data ?? data
    const item  = Array.isArray(items) ? items.find(i => i.qrCode === code || i.serialNumber === code || i.nfcTag === code) : null
    if (!item) { toast(`Código "${code}" no encontrado`, 'error'); return }

    // Vibración háptica
    if (navigator.vibrate) navigator.vibrate(100)

    const alreadyScanned = localEvents.value.some(e => e.product?.id === item.id)
    if (alreadyScanned) toast('⚠️ Ya escaneado en esta sesión', 'warn')

    pendingItem.value = item
    qty.value = 1
  } catch {
    toast('Error al buscar el código', 'error')
  }
}

function selectItem(item) {
  pendingItem.value = item
  qty.value = 1
  manualQuery.value = ''
  searchResults.value = []
}

// ── Confirm scan ───────────────────────────────────────────
async function confirmScan() {
  if (!pendingItem.value) return
  confirming.value = true
  const code = pendingItem.value.qrCode ?? pendingItem.value.serialNumber ?? `ID-${pendingItem.value.id}`
  const metodo = mode.value === 'camera' ? 'QR' : 'MANUAL'
  try {
    const ev = await submitScan(token, { code, cantidadNueva: qty.value, metodo })
    localEvents.value = [ev, ...localEvents.value]
    toast(`✓ ${pendingItem.value.dispositivo ?? pendingItem.value.nombre} — ${qty.value} uds`, 'ok')
    pendingItem.value = null
  } catch (e) {
    toast(e?.response?.data?.message ?? 'Error al guardar', 'error')
  } finally {
    confirming.value = false
  }
}

// ── Manual search ──────────────────────────────────────────
function doSearch() {
  clearTimeout(searchTimer)
  if (!manualQuery.value.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/inventory', { params: { search: manualQuery.value, limit: 8 } })
      searchResults.value = data.data ?? data
    } catch {}
  }, 300)
}

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
</script>

<style scoped>
/* ── Root ── */
.scan-root {
  min-height: 100dvh; width: 100%;
  background: #0F1A2E;
  display: flex; flex-direction: column;
  font-family: 'Inter', sans-serif;
  color: #F8FAFC;
  position: relative; overflow: hidden;
}

/* ── Header ── */
.scan-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  background: rgba(255,255,255,.04);
  border-bottom: 1px solid rgba(255,255,255,.08);
  flex-shrink: 0;
}
.scan-logo-img { height: 28px; filter: brightness(0) invert(1); }
.scan-header-info { display: flex; align-items: center; gap: 6px; }
.scan-session-label { font-size: 11px; color: rgba(255,255,255,.5); }
.scan-status-dot { width: 7px; height: 7px; border-radius: 50%; }
.dot-on  { background: #22C55E; box-shadow: 0 0 6px #22C55E; }
.dot-off { background: #94A3B8; }
.scan-status-text { font-size: 12px; font-weight: 600; }

/* ── State screens ── */
.scan-state {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; color: rgba(255,255,255,.6); padding: 40px 20px; text-align: center;
}
.scan-state p { font-size: 15px; margin: 0; }
.scan-state--error { color: #FCA5A5; }
.scan-state--closed { color: #86EFAC; }
.scan-state-sub { font-size: 13px; color: rgba(255,255,255,.4); }

/* ── Mode toggle ── */
.scan-mode-toggle {
  display: flex; gap: 8px; padding: 14px 18px 0; flex-shrink: 0;
}
.scan-mode-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06); color: rgba(255,255,255,.6);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s;
}
.scan-mode-btn.active { background: #054EAF; border-color: #054EAF; color: #fff; }

/* ── Camera area ── */
.scan-camera-area { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 16px; }
.scan-viewfinder { position: relative; width: 260px; height: 260px; }
#scan-qr-reader { width: 100%; height: 100%; border-radius: 12px; overflow: hidden; }

/* Viewfinder corners */
.vf-corner {
  position: absolute; width: 22px; height: 22px;
  border-color: #054EAF; border-style: solid;
  animation: corner-pulse 2s ease-in-out infinite;
}
.vf-tl { top: 0; left: 0; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
.vf-tr { top: 0; right: 0; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
.vf-bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
.vf-br { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
@keyframes corner-pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }

.scan-camera-hint { font-size: 12px; color: rgba(255,255,255,.45); text-align: center; }

/* ── Manual area ── */
.scan-manual-area { flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.scan-search-wrap { position: relative; }
.scan-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,.4); pointer-events: none; }
.scan-search-input {
  width: 100%; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px; padding: 12px 14px 12px 42px;
  font-size: 15px; color: #F8FAFC; font-family: 'Inter',sans-serif; outline: none;
}
.scan-search-input::placeholder { color: rgba(255,255,255,.3); }
.scan-search-input:focus { border-color: #054EAF; }

.scan-search-results { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; max-height: 300px; }
.scan-result-row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,.06); border-radius: 10px; cursor: pointer; transition: background .15s; }
.scan-result-row:hover { background: rgba(5,78,175,.3); }
.scan-result-info { flex: 1; }
.scan-result-name { display: block; font-size: 14px; font-weight: 600; }
.scan-result-code { display: block; font-size: 11px; color: rgba(255,255,255,.4); font-family: 'JetBrains Mono',monospace; }
.scan-result-arrow { color: rgba(255,255,255,.3); }
.scan-no-results { font-size: 13px; color: rgba(255,255,255,.35); padding: 16px 0; text-align: center; }

/* ── Confirm card ── */
.scan-confirm-card {
  position: fixed; bottom: 120px; left: 16px; right: 16px;
  background: #1E293B; border: 1px solid rgba(255,255,255,.12);
  border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
  z-index: 50;
}
.scan-confirm-header { display: flex; align-items: flex-start; justify-content: space-between; }
.scan-confirm-name { font-size: 16px; font-weight: 700; color: #F8FAFC; }
.scan-confirm-code { font-size: 11px; color: rgba(255,255,255,.4); font-family: 'JetBrains Mono',monospace; margin-top: 2px; }
.scan-confirm-dismiss { background: none; border: none; color: rgba(255,255,255,.4); cursor: pointer; padding: 2px; }

.scan-confirm-qty { display: flex; flex-direction: column; gap: 8px; }
.scan-qty-label { font-size: 12px; color: rgba(255,255,255,.5); }
.scan-qty-row { display: flex; align-items: center; gap: 10px; }
.scan-qty-btn { width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.08); color: #F8FAFC; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.scan-qty-input { flex: 1; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15); border-radius: 10px; padding: 10px; font-size: 20px; font-weight: 700; color: #F8FAFC; text-align: center; font-family: 'JetBrains Mono',monospace; outline: none; }

.scan-confirm-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; background: #054EAF; color: #fff;
  border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background .15s;
}
.scan-confirm-btn:hover:not(:disabled) { background: #0342A0; }
.scan-confirm-btn:disabled { opacity: .6; cursor: not-allowed; }

/* ── History bottom sheet ── */
.scan-history {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #1E293B; border-top: 1px solid rgba(255,255,255,.1);
  border-radius: 20px 20px 0 0;
  transition: transform .3s ease;
  z-index: 40; max-height: 60vh;
}
.scan-history:not(.scan-history--expanded) .scan-history-body { display: none; }

.scan-history-handle {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 18px; cursor: pointer; font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,.7);
}
.handle-bar { width: 36px; height: 4px; background: rgba(255,255,255,.2); border-radius: 999px; position: absolute; top: 8px; }
.rotate-180 { transform: rotate(180deg); transition: transform .25s; }

.scan-history-body { max-height: 240px; overflow-y: auto; padding: 0 16px 16px; display: flex; flex-direction: column; gap: 6px; }
.scan-history-empty { font-size: 12px; color: rgba(255,255,255,.35); padding: 8px 0; text-align: center; }
.scan-history-row { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
.sh-name { flex: 1; font-weight: 500; }
.sh-qty  { font-family: 'JetBrains Mono',monospace; font-weight: 700; color: #60A5FA; }
.sh-time { font-size: 11px; color: rgba(255,255,255,.35); }

/* ── Toasts ── */
.scan-toasts { position: fixed; bottom: 80px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 100; pointer-events: none; }
.scan-toast {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 12px;
  font-size: 13px; font-weight: 600; backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0,0,0,.4);
}
.toast-ok   { background: rgba(34,197,94,.9);  color: #fff; }
.toast-warn { background: rgba(234,179,8,.9);   color: #000; }
.toast-error { background: rgba(239,68,68,.9);  color: #fff; }

/* ── Transitions ── */
.card-slide-enter-active, .card-slide-leave-active { transition: opacity .2s, transform .2s; }
.card-slide-enter-from, .card-slide-leave-to { opacity: 0; transform: translateY(20px); }
.toast-slide-enter-active, .toast-slide-leave-active { transition: opacity .25s, transform .25s; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(10px); }

/* ── Utils ── */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .7s linear infinite; }
</style>
