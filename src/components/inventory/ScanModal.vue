<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { useRouter } from 'vue-router'
import { scanInventoryItem } from '@/services/inventory.service'
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import {
  QrCode, Wifi, Keyboard, Search,
  CheckCircle2, AlertCircle, Loader2,
} from 'lucide-vue-next'

const props  = defineProps({ show: Boolean })
const emit   = defineEmits(['close'])
const router = useRouter()

const TABS = [
  { key: 'camera', label: 'Cámara QR', icon: QrCode   },
  { key: 'nfc',    label: 'NFC',        icon: Wifi     },
  { key: 'manual', label: 'Manual',     icon: Keyboard },
]

// ── Tabs ──────────────────────────────────────────────────
const activeTab = ref('camera')

// ── Estados comunes ───────────────────────────────────────
const scanning  = ref(false)
const result    = ref(null)
const scanError = ref(null)

// ── NFC ───────────────────────────────────────────────────
const nfcStatus = ref('idle')  // idle | scanning | not-available | error
const nfcError  = ref(null)
let   nfcAbort  = null

// ── Manual ────────────────────────────────────────────────
const manualCode    = ref('')
const manualLoading = ref(false)

// ── Camera ────────────────────────────────────────────────
let qrScanner = null

const startCamera = async () => {
  await nextTick()
  const el = document.getElementById('inv-qr-reader')
  if (!el || qrScanner) return
  try {
    qrScanner = new Html5Qrcode('inv-qr-reader')
    await qrScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (text) => handleScan(text, 'QR'),
      () => {}
    )
  } catch {
    scanError.value = 'No se pudo acceder a la cámara. Verifica los permisos.'
  }
}

const stopCamera = async () => {
  if (qrScanner) {
    try { await qrScanner.stop() } catch {}
    qrScanner = null
  }
}

// ── NFC ───────────────────────────────────────────────────
const startNFC = async () => {
  if (!('NDEFReader' in window)) { nfcStatus.value = 'not-available'; return }
  nfcStatus.value = 'scanning'
  try {
    const ndef = new NDEFReader()
    nfcAbort   = new AbortController()
    await ndef.scan({ signal: nfcAbort.signal })
    ndef.addEventListener('reading', ({ serialNumber, message }) => {
      const code = message?.records?.[0]
        ? new TextDecoder().decode(message.records[0].data)
        : serialNumber
      handleScan(code, 'NFC')
    })
  } catch (e) {
    if (e.name !== 'AbortError') { nfcStatus.value = 'error'; nfcError.value = e.message }
  }
}

const stopNFC = () => {
  nfcAbort?.abort()
  nfcAbort = null
  if (nfcStatus.value === 'scanning') nfcStatus.value = 'idle'
}

// ── Escaneo común ─────────────────────────────────────────
const handleScan = async (code, method) => {
  if (scanning.value || result.value) return
  scanning.value  = true
  scanError.value = null
  try {
    result.value = await scanInventoryItem({ code, method })
    await stopCamera()
    stopNFC()
  } catch (e) {
    scanError.value = e?.response?.data?.message ?? `Código no encontrado: ${code}`
  } finally {
    scanning.value = false
  }
}

const submitManual = async () => {
  if (!manualCode.value.trim()) return
  manualLoading.value = true
  await handleScan(manualCode.value.trim(), 'MANUAL')
  manualLoading.value = false
}

const verDetalle = () => {
  emit('close')
  router.push(`/inventory/${result.value.id}`)
}

const resetScan = () => {
  result.value     = null
  scanError.value  = null
  manualCode.value = ''
  if (activeTab.value === 'camera') startCamera()
  if (activeTab.value === 'nfc')    startNFC()
}

// ── Ciclo de vida ─────────────────────────────────────────
watch(() => props.show, async (val) => {
  if (val) {
    result.value = null; scanError.value = null; activeTab.value = 'camera'
    await nextTick(); startCamera()
  } else {
    await stopCamera(); stopNFC()
  }
})

watch(activeTab, async (tab, prev) => {
  result.value = null; scanError.value = null
  if (prev === 'camera') await stopCamera()
  if (prev === 'nfc')    stopNFC()
  if (tab  === 'camera') startCamera()
  if (tab  === 'nfc')    startNFC()
})

const handleClose = async () => {
  await stopCamera(); stopNFC()
  result.value = null; scanError.value = null
  emit('close')
}

onUnmounted(async () => { await stopCamera(); stopNFC() })
</script>

<template>
  <ModalReutilizable :show="show" @close="handleClose">
    <div class="sm-wrap">

      <h2 class="sm-title">Escanear producto</h2>

      <!-- Tabs -->
      <div class="sm-tabs">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="sm-tab"
          :class="{ 'sm-tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" :size="14" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ══ CÁMARA QR ══ -->
      <div v-if="activeTab === 'camera'" class="sm-body">
        <template v-if="!result">
          <p class="sm-hint">Apunta la cámara al código QR del producto</p>
          <div class="sm-qr-frame">
            <div id="inv-qr-reader" />
          </div>
          <div v-if="scanning" class="sm-info">
            <Loader2 :size="14" class="sm-spin" /> Verificando código…
          </div>
          <div v-if="scanError" class="sm-error">
            <AlertCircle :size="14" /> {{ scanError }}
            <button class="sm-link" @click="resetScan">Reintentar</button>
          </div>
        </template>
        <!-- Resultado -->
        <div v-else class="sm-result">
          <div class="sm-result-top">
            <div class="sm-result-ico"><CheckCircle2 :size="22" style="color:#16A34A" /></div>
            <div>
              <p class="sm-result-name">{{ result.dispositivo || result.nombre || '—' }}</p>
              <p class="sm-result-sub">{{ result.categoria || '—' }} · {{ result.bodega || '—' }}</p>
            </div>
          </div>
          <div class="sm-result-actions">
            <button class="sm-btn-primary" @click="verDetalle">Ver detalle</button>
            <button class="sm-btn-ghost"   @click="resetScan">Escanear otro</button>
          </div>
        </div>
      </div>

      <!-- ══ NFC ══ -->
      <div v-if="activeTab === 'nfc'" class="sm-body">
        <template v-if="!result">
          <div class="sm-nfc-panel">
            <template v-if="nfcStatus === 'not-available'">
              <Wifi :size="36" class="sm-nfc-ico" />
              <p class="sm-nfc-msg">NFC no disponible en este dispositivo o navegador</p>
              <p class="sm-nfc-sub">Se requiere Chrome en Android con HTTPS</p>
            </template>
            <template v-else-if="nfcStatus === 'error'">
              <AlertCircle :size="36" style="color:#B91C1C" />
              <p class="sm-nfc-msg">{{ nfcError || 'Error al activar NFC' }}</p>
              <button class="sm-btn-primary" @click="startNFC">Reintentar</button>
            </template>
            <template v-else-if="nfcStatus === 'scanning'">
              <div class="sm-nfc-pulse"><Wifi :size="28" style="color:#054EAF" /></div>
              <p class="sm-nfc-msg">Acerca el tag NFC al dispositivo…</p>
              <button class="sm-btn-ghost" @click="stopNFC">Detener</button>
            </template>
            <template v-else>
              <Wifi :size="40" class="sm-nfc-ico" />
              <p class="sm-nfc-msg">Lectura NFC lista</p>
              <button class="sm-btn-primary" @click="startNFC">
                <Wifi :size="14" /> Activar lectura NFC
              </button>
            </template>
          </div>
          <div v-if="scanning" class="sm-info">
            <Loader2 :size="14" class="sm-spin" /> Verificando tag…
          </div>
          <div v-if="scanError" class="sm-error">
            <AlertCircle :size="14" /> {{ scanError }}
            <button class="sm-link" @click="resetScan">Reintentar</button>
          </div>
        </template>
        <div v-else class="sm-result">
          <div class="sm-result-top">
            <div class="sm-result-ico"><CheckCircle2 :size="22" style="color:#16A34A" /></div>
            <div>
              <p class="sm-result-name">{{ result.dispositivo || result.nombre || '—' }}</p>
              <p class="sm-result-sub">{{ result.categoria || '—' }} · {{ result.bodega || '—' }}</p>
            </div>
          </div>
          <div class="sm-result-actions">
            <button class="sm-btn-primary" @click="verDetalle">Ver detalle</button>
            <button class="sm-btn-ghost"   @click="resetScan">Escanear otro</button>
          </div>
        </div>
      </div>

      <!-- ══ MANUAL ══ -->
      <div v-if="activeTab === 'manual'" class="sm-body">
        <template v-if="!result">
          <p class="sm-hint">Ingresa el código del producto manualmente</p>
          <div class="sm-manual-row">
            <div class="sm-input-wrap">
              <Search :size="14" class="sm-input-ico" />
              <input
                v-model="manualCode"
                type="text"
                placeholder="Código QR, serial o NFC…"
                class="sm-input"
                @keyup.enter="submitManual"
              />
            </div>
            <button
              class="sm-btn-primary"
              :disabled="!manualCode.trim() || manualLoading"
              @click="submitManual"
            >
              <Loader2 v-if="manualLoading" :size="14" class="sm-spin" />
              <Search v-else :size="14" />
              Buscar
            </button>
          </div>
          <div v-if="scanError" class="sm-error">
            <AlertCircle :size="14" /> {{ scanError }}
          </div>
        </template>
        <div v-else class="sm-result">
          <div class="sm-result-top">
            <div class="sm-result-ico"><CheckCircle2 :size="22" style="color:#16A34A" /></div>
            <div>
              <p class="sm-result-name">{{ result.dispositivo || result.nombre || '—' }}</p>
              <p class="sm-result-sub">{{ result.categoria || '—' }} · {{ result.bodega || '—' }}</p>
            </div>
          </div>
          <div class="sm-result-actions">
            <button class="sm-btn-primary" @click="verDetalle">Ver detalle</button>
            <button class="sm-btn-ghost"   @click="resetScan">Escanear otro</button>
          </div>
        </div>
      </div>

    </div>
  </ModalReutilizable>
</template>

<style scoped>
.sm-wrap  { min-height: 380px; display: flex; flex-direction: column; gap: 16px; }
.sm-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #0F1A2E; margin: 0; }

/* Tabs */
.sm-tabs { display: flex; gap: 4px; background: #F1F5F9; padding: 4px; border-radius: 10px; }
.sm-tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.sm-tab--active { background: #fff; color: #054EAF; box-shadow: 0 1px 4px rgba(5,78,175,.12); }

.sm-body  { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.sm-hint  { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; margin: 0; }

/* Camera */
.sm-qr-frame {
  background: #0F1A2E;
  border-radius: 14px;
  overflow: hidden;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* NFC */
.sm-nfc-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  padding: 32px;
  background: #F8FAFC;
  border-radius: 14px;
  border: 1px solid #E2EBF6;
  min-height: 220px;
}
.sm-nfc-ico  { color: #94A3B8; }
.sm-nfc-msg  { font-size: 14px; font-weight: 500; color: #0F1A2E; font-family: 'Inter', sans-serif; margin: 0; }
.sm-nfc-sub  { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; margin: 0; }
.sm-nfc-pulse {
  width: 72px; height: 72px; border-radius: 50%;
  background: #EBF3FC;
  display: flex; align-items: center; justify-content: center;
  animation: nfc-pulse 1.6s ease-in-out infinite;
}

/* Manual */
.sm-manual-row { display: flex; gap: 8px; }
.sm-input-wrap { position: relative; flex: 1; }
.sm-input-ico  { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; pointer-events: none; }
.sm-input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  outline: none;
  transition: border-color 0.15s;
}
.sm-input:focus { border-color: #054EAF; box-shadow: 0 0 0 3px rgba(5,78,175,.1); }

/* Botones */
.sm-btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px;
  background: #054EAF; color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif;
  cursor: pointer; white-space: nowrap; transition: background 0.15s;
}
.sm-btn-primary:hover:not(:disabled) { background: #03368A; }
.sm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.sm-btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: transparent; color: #64748B;
  border: 1px solid #E2EBF6; border-radius: 8px;
  font-size: 12px; font-weight: 500; font-family: 'Inter', sans-serif; cursor: pointer;
}
.sm-btn-ghost:hover { background: #F1F5F9; }

/* Info/Error */
.sm-info  { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748B; font-family: 'Inter', sans-serif; }
.sm-error { display: flex; align-items: center; gap: 6px; padding: 10px 14px; background: #FEF2F2; color: #B91C1C; border-radius: 8px; font-size: 12px; font-family: 'Inter', sans-serif; }
.sm-link  { color: #054EAF; font-weight: 600; background: none; border: none; cursor: pointer; font-size: 12px; padding: 0; margin-left: 4px; }

/* Resultado */
.sm-result { background: #F0F7FF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.sm-result-top    { display: flex; align-items: center; gap: 12px; }
.sm-result-ico    { width: 44px; height: 44px; background: #DCFCE7; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sm-result-name   { font-size: 15px; font-weight: 700; color: #0F1A2E; font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
.sm-result-sub    { font-size: 12px; color: #64748B; font-family: 'Inter', sans-serif; margin: 0; }
.sm-result-actions { display: flex; gap: 8px; }

/* Spin */
.sm-spin { animation: sm-spin 0.9s linear infinite; flex-shrink: 0; }
@keyframes sm-spin  { to { transform: rotate(360deg); } }
@keyframes nfc-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(5,78,175,.35); } 50% { box-shadow: 0 0 0 16px rgba(5,78,175,0); } }

@media (max-width: 640px) {
  .sm-qr-frame  { min-height: 200px; }
  .sm-nfc-panel { min-height: 160px; padding: 20px; }
  .sm-manual-row { flex-wrap: wrap; }
}
</style>
