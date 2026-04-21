<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QRCode from 'qrcode'
import {
  getInventoryItem, getItemReservations, getItemHistory,
  updateItemStatus, updateItemCondition, updateItemLocation, generateQR,
} from '@/services/inventory.service'
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import {
  ArrowLeft, RefreshCw, QrCode, Download, Wifi,
  Package, MapPin, Clock, AlertTriangle, CheckCircle,
  Wrench, Edit, ChevronRight, Tag,
} from 'lucide-vue-next'

const route  = useRoute()
const router = useRouter()
const id     = route.params.id

/* ─── state ──────────────────────────────────────────────── */
const item        = ref(null)
const reservations = ref([])
const history     = ref([])
const loading     = ref(false)
const error       = ref(null)
const qrDataUrl   = ref(null)
const qrLoading   = ref(false)

/* ─── modals ─────────────────────────────────────────────── */
const statusModal   = ref(false)
const condModal     = ref(false)
const locationModal = ref(false)
const saving        = ref(false)

const statusForm = ref({ status: '', notes: '', method: 'MANUAL' })
const condForm   = ref({ condition: '', notes: '' })
const locForm    = ref({ ubicacion: '' })

/* ─── options ────────────────────────────────────────────── */
const statusOptions = [
  { value: 'DISPONIBLE',    label: 'Disponible'    },
  { value: 'EN_RESERVA',    label: 'En reserva'    },
  { value: 'NO_DISPONIBLE', label: 'No disponible' },
]
const condOptions = [
  { value: 'OPERATIVO_OK',     label: 'Operativo OK'     },
  { value: 'OPERATIVO_70',     label: 'Operativo 70%'    },
  { value: 'OPERATIVO_50',     label: 'Operativo 50%'    },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'DEFECTUOSO',       label: 'Defectuoso'       },
  { value: 'NO_ACTIVO',        label: 'No activo'        },
]

/* ─── badge helpers ──────────────────────────────────────── */
const availClass = (val) => ({
  DISPONIBLE:    'badge badge--green',
  EN_RESERVA:    'badge badge--yellow',
  NO_DISPONIBLE: 'badge badge--red',
}[val] || 'badge badge--slate')

const availLabel = (val) => ({
  DISPONIBLE:    'Disponible',
  EN_RESERVA:    'En reserva',
  NO_DISPONIBLE: 'No disponible',
}[val] || val || '—')

const condClass = (val) => ({
  OPERATIVO_OK:     'badge badge--green',
  OPERATIVO_70:     'badge badge--yellow',
  OPERATIVO_50:     'badge badge--orange',
  EN_MANTENIMIENTO: 'badge badge--blue',
  DEFECTUOSO:       'badge badge--red',
  NO_ACTIVO:        'badge badge--slate',
}[val] || 'badge badge--slate')

const condLabel = (val) => ({
  OPERATIVO_OK:     'Operativo OK',
  OPERATIVO_70:     'Operativo 70%',
  OPERATIVO_50:     'Operativo 50%',
  EN_MANTENIMIENTO: 'En mantenimiento',
  DEFECTUOSO:       'Defectuoso',
  NO_ACTIVO:        'No activo',
}[val] || val || '—')

const reservationStatusClass = (val) => ({
  ACTIVA:    'badge badge--green',
  PENDIENTE: 'badge badge--yellow',
  CANCELADA: 'badge badge--slate',
  FINALIZADA:'badge badge--blue',
}[val] || 'badge badge--slate')

const historyIcon = (type) => ({
  SCAN:      QrCode,
  STATUS:    CheckCircle,
  CONDITION: Wrench,
  LOCATION:  MapPin,
  RESERVATION: Tag,
}[type] || ChevronRight)

const historyIconColor = (type) => ({
  SCAN:      '#054EAF',
  STATUS:    '#16A34A',
  CONDITION: '#C2410C',
  LOCATION:  '#7C3AED',
  RESERVATION: '#B45309',
}[type] || '#64748B')

const methodLabel = (m) => ({ QR: 'QR', NFC: 'NFC', MANUAL: 'Manual' }[m] || m || '')
const methodClass = (m) => ({ QR: 'inv-method--qr', NFC: 'inv-method--nfc', MANUAL: 'inv-method--manual' }[m] || '')

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const formatShortDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ─── QR code generation ─────────────────────────────────── */
const buildQrDataUrl = async (code) => {
  try {
    qrDataUrl.value = await QRCode.toDataURL(code, {
      width: 200, margin: 2, color: { dark: '#0F1A2E', light: '#FFFFFF' },
    })
  } catch (e) {
    console.error('QR gen error', e)
  }
}

const downloadQr = () => {
  if (!qrDataUrl.value) return
  const a = document.createElement('a')
  a.href = qrDataUrl.value
  a.download = `qr-${item.value?.nombre || id}.png`
  a.click()
}

const handleGenerateQR = async () => {
  qrLoading.value = true
  try {
    const res = await generateQR(id)
    item.value.qrCode = res.qrCode || res.data?.qrCode
    if (item.value.qrCode) await buildQrDataUrl(item.value.qrCode)
  } catch (e) {
    console.error(e)
  } finally {
    qrLoading.value = false
  }
}

/* ─── fetch ──────────────────────────────────────────────── */
const fetchAll = async () => {
  loading.value = true
  error.value   = null
  try {
    const [itemRes, resRes, histRes] = await Promise.all([
      getInventoryItem(id),
      getItemReservations(id),
      getItemHistory(id),
    ])
    item.value        = itemRes.data || itemRes
    reservations.value = resRes.data  || resRes  || []
    history.value     = histRes.data  || histRes || []

    if (item.value?.qrCode) {
      await buildQrDataUrl(item.value.qrCode)
    }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo cargar el equipo'
  } finally {
    loading.value = false
  }
}

/* ─── save actions ───────────────────────────────────────── */
const saveStatus = async () => {
  saving.value = true
  try {
    await updateItemStatus(id, statusForm.value)
    item.value.availabilityStatus = statusForm.value.status
    statusModal.value = false
    await fetchAll()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const saveCond = async () => {
  saving.value = true
  try {
    await updateItemCondition(id, condForm.value)
    item.value.conditionStatus = condForm.value.condition
    condModal.value = false
    await fetchAll()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const saveLocation = async () => {
  saving.value = true
  try {
    await updateItemLocation(id, locForm.value)
    item.value.ubicacion = locForm.value.ubicacion
    locationModal.value = false
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const openStatusModal = () => {
  statusForm.value = { status: item.value?.availabilityStatus || '', notes: '', method: 'MANUAL' }
  statusModal.value = true
}
const openCondModal = () => {
  condForm.value = { condition: item.value?.conditionStatus || '', notes: '' }
  condModal.value = true
}
const openLocationModal = () => {
  locForm.value = { ubicacion: item.value?.ubicacion || '' }
  locationModal.value = true
}

onMounted(fetchAll)
</script>

<template>
  <div class="inv-page">

    <!-- ── Header ─────────────────────────────────────────────── -->
    <div class="inv-head">
      <div class="inv-head-left">
        <button class="inv-back-btn" @click="router.push('/inventory')">
          <ArrowLeft :size="16" />
        </button>
        <div>
          <h2 class="inv-title">{{ item?.nombre || 'Detalle del equipo' }}</h2>
          <p class="inv-subtitle">
            <span v-if="item?.categoria">{{ item.categoria }}</span>
            <span v-if="item?.categoria && item?.serialNumber"> · </span>
            <span v-if="item?.serialNumber">S/N: {{ item.serialNumber }}</span>
          </p>
        </div>
      </div>
      <button class="inv-btn-reload" @click="fetchAll">
        <RefreshCw :size="13" /> Recargar
      </button>
    </div>

    <!-- ── Error ──────────────────────────────────────────────── -->
    <div v-if="error" class="inv-error-card">
      <AlertTriangle :size="18" />
      <span>{{ error }}</span>
      <button class="inv-btn-reload" @click="fetchAll">Reintentar</button>
    </div>

    <!-- ── Loading skeleton ───────────────────────────────────── -->
    <div v-if="loading" class="inv-detail-grid">
      <div class="inv-skel inv-skel--tall" />
      <div class="inv-skel inv-skel--tall" />
      <div style="grid-column: 1/-1" class="inv-skel" />
      <div style="grid-column: 1/-1" class="inv-skel inv-skel--tall" />
    </div>

    <template v-else-if="item">
      <div class="inv-detail-grid">

        <!-- ── Product info card ─────────────────────────────── -->
        <div class="inv-card">
          <div class="inv-card-head">
            <Package :size="16" class="inv-card-ico" />
            <h3 class="inv-card-title">Información del equipo</h3>
          </div>

          <div class="inv-info-body">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.nombre"
              class="inv-info-img"
            />
            <div v-else class="inv-info-img-placeholder">
              <Package :size="32" />
            </div>

            <div class="inv-info-grid">
              <div class="inv-info-row">
                <span class="inv-info-lbl">Nombre</span>
                <span class="inv-info-val">{{ item.nombre || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Categoría</span>
                <span class="inv-info-val">{{ item.categoria || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Disponibilidad</span>
                <span :class="availClass(item.availabilityStatus)">{{ availLabel(item.availabilityStatus) }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Condición</span>
                <span :class="condClass(item.conditionStatus)">{{ condLabel(item.conditionStatus) }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Bodega</span>
                <span class="inv-info-val">{{ item.bodega || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Ubicación</span>
                <span class="inv-info-val">{{ item.ubicacion || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">N/S</span>
                <span class="inv-info-val inv-info-val--mono">{{ item.serialNumber || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Último escaneo</span>
                <span class="inv-info-val">{{ formatDate(item.lastScanAt) }}</span>
              </div>
              <div v-if="item.qrCode" class="inv-info-row">
                <span class="inv-info-lbl">Código QR</span>
                <span class="inv-info-val inv-info-val--mono">{{ item.qrCode }}</span>
              </div>
              <div v-if="item.nfcTag" class="inv-info-row">
                <span class="inv-info-lbl">Tag NFC</span>
                <span class="inv-info-val inv-info-val--mono">{{ item.nfcTag }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Right column: Quick actions + QR ─────────────── -->
        <div class="inv-col-right">

          <!-- Quick Actions -->
          <div class="inv-card">
            <div class="inv-card-head">
              <Edit :size="16" class="inv-card-ico" />
              <h3 class="inv-card-title">Acciones rápidas</h3>
            </div>
            <div class="inv-actions-list">
              <button class="inv-action-btn" @click="openStatusModal">
                <CheckCircle :size="15" class="inv-action-ico inv-action-ico--green" />
                <span>Cambiar estado</span>
                <ChevronRight :size="14" class="inv-action-arrow" />
              </button>
              <button class="inv-action-btn" @click="openCondModal">
                <Wrench :size="15" class="inv-action-ico inv-action-ico--orange" />
                <span>Cambiar condición</span>
                <ChevronRight :size="14" class="inv-action-arrow" />
              </button>
              <button class="inv-action-btn" @click="openLocationModal">
                <MapPin :size="15" class="inv-action-ico inv-action-ico--purple" />
                <span>Actualizar ubicación</span>
                <ChevronRight :size="14" class="inv-action-arrow" />
              </button>
            </div>
          </div>

          <!-- QR Code -->
          <div class="inv-card">
            <div class="inv-card-head">
              <QrCode :size="16" class="inv-card-ico" />
              <h3 class="inv-card-title">Código QR</h3>
            </div>

            <div v-if="item.qrCode" class="inv-qr-section">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" class="inv-qr-img" />
              <div v-else class="inv-qr-loading">Generando QR…</div>
              <p class="inv-qr-code-txt">{{ item.qrCode }}</p>
              <button class="inv-btn-download" @click="downloadQr" :disabled="!qrDataUrl">
                <Download :size="13" /> Descargar PNG
              </button>
            </div>

            <div v-else class="inv-qr-empty">
              <QrCode :size="36" class="inv-qr-empty-ico" />
              <p class="inv-qr-empty-txt">Este equipo no tiene código QR asignado</p>
              <button class="inv-btn-generate" @click="handleGenerateQR" :disabled="qrLoading">
                {{ qrLoading ? 'Generando…' : 'Generar código QR' }}
              </button>
            </div>
          </div>

        </div>

        <!-- ── Reservations table ────────────────────────────── -->
        <div class="inv-card inv-card--full">
          <div class="inv-card-head">
            <Tag :size="16" class="inv-card-ico" />
            <h3 class="inv-card-title">Reservas activas y próximas</h3>
          </div>

          <div v-if="reservations.length" class="inv-table-scroll">
            <table class="inv-table">
              <thead>
                <tr>
                  <th>Cotización</th>
                  <th>Cliente</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in reservations" :key="r.id">
                  <td class="inv-td-mono">#{{ r.quotationId || r.id }}</td>
                  <td>{{ r.clientName || r.client?.nombre || '—' }}</td>
                  <td>{{ formatShortDate(r.startDate || r.desde) }}</td>
                  <td>{{ formatShortDate(r.endDate   || r.hasta) }}</td>
                  <td><span :class="reservationStatusClass(r.status)">{{ r.status || '—' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="inv-empty-state">
            <Tag :size="28" class="inv-empty-ico" />
            <p>Sin reservas activas ni próximas</p>
          </div>
        </div>

        <!-- ── Movement history ──────────────────────────────── -->
        <div class="inv-card inv-card--full">
          <div class="inv-card-head">
            <Clock :size="16" class="inv-card-ico" />
            <h3 class="inv-card-title">Historial de movimientos</h3>
          </div>

          <div v-if="history.length" class="inv-timeline">
            <div v-for="(h, idx) in history" :key="h.id || idx" class="inv-timeline-item">
              <div
                class="inv-timeline-dot"
                :style="{ background: historyIconColor(h.type) + '22', color: historyIconColor(h.type) }"
              >
                <component :is="historyIcon(h.type)" :size="14" />
              </div>
              <div class="inv-timeline-line" v-if="idx < history.length - 1" />
              <div class="inv-timeline-content">
                <p class="inv-tl-desc">{{ h.description || h.nota || '—' }}</p>
                <div class="inv-tl-meta">
                  <span v-if="h.user || h.userName" class="inv-tl-user">{{ h.user || h.userName }}</span>
                  <span class="inv-tl-date">{{ formatDate(h.createdAt || h.fecha) }}</span>
                  <span v-if="h.method" :class="['inv-method', methodClass(h.method)]">{{ methodLabel(h.method) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="inv-empty-state">
            <Clock :size="28" class="inv-empty-ico" />
            <p>Sin movimientos registrados</p>
          </div>
        </div>

      </div>
    </template>

    <!-- ── Status change modal ────────────────────────────────── -->
    <ModalReutilizable :show="statusModal" @close="statusModal = false">
      <div class="inv-modal-body">
        <h2 class="inv-modal-title">Cambiar estado de disponibilidad</h2>
        <div class="inv-form-group">
          <label class="inv-form-lbl">Nuevo estado</label>
          <select v-model="statusForm.status" class="inv-form-input">
            <option value="">Seleccionar…</option>
            <option v-for="o in statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="inv-form-group">
          <label class="inv-form-lbl">Notas (opcional)</label>
          <textarea v-model="statusForm.notes" class="inv-form-input inv-form-textarea" rows="3" placeholder="Motivo del cambio…" />
        </div>
        <div class="inv-form-group">
          <label class="inv-form-lbl">Método de registro</label>
          <select v-model="statusForm.method" class="inv-form-input">
            <option value="MANUAL">Manual</option>
            <option value="QR">QR</option>
            <option value="NFC">NFC</option>
          </select>
        </div>
        <div class="inv-modal-footer">
          <button class="inv-btn-cancel" @click="statusModal = false">Cancelar</button>
          <button class="inv-btn-save" @click="saveStatus" :disabled="!statusForm.status || saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </ModalReutilizable>

    <!-- ── Condition change modal ─────────────────────────────── -->
    <ModalReutilizable :show="condModal" @close="condModal = false">
      <div class="inv-modal-body">
        <h2 class="inv-modal-title">Cambiar condición</h2>
        <div class="inv-form-group">
          <label class="inv-form-lbl">Nueva condición</label>
          <select v-model="condForm.condition" class="inv-form-input">
            <option value="">Seleccionar…</option>
            <option v-for="o in condOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="inv-form-group">
          <label class="inv-form-lbl">Notas (opcional)</label>
          <textarea v-model="condForm.notes" class="inv-form-input inv-form-textarea" rows="3" placeholder="Descripción del estado…" />
        </div>
        <div class="inv-modal-footer">
          <button class="inv-btn-cancel" @click="condModal = false">Cancelar</button>
          <button class="inv-btn-save" @click="saveCond" :disabled="!condForm.condition || saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </ModalReutilizable>

    <!-- ── Location modal ────────────────────────────────────── -->
    <ModalReutilizable :show="locationModal" @close="locationModal = false">
      <div class="inv-modal-body">
        <h2 class="inv-modal-title">Actualizar ubicación</h2>
        <div class="inv-form-group">
          <label class="inv-form-lbl">Ubicación</label>
          <input v-model="locForm.ubicacion" class="inv-form-input" placeholder="Ej: Bodega A, Estante 3" />
        </div>
        <div class="inv-modal-footer">
          <button class="inv-btn-cancel" @click="locationModal = false">Cancelar</button>
          <button class="inv-btn-save" @click="saveLocation" :disabled="!locForm.ubicacion || saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </ModalReutilizable>

  </div>
</template>

<style scoped>
/* ─── Page ────────────────────────────────────────────────── */
.inv-page { width: 100%; display: flex; flex-direction: column; gap: 20px; }

/* ─── Header ──────────────────────────────────────────────── */
.inv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.inv-head-left { display: flex; align-items: center; gap: 12px; }
.inv-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #E5EAF0;
  background: #F8FAFC;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.inv-back-btn:hover { background: #E5EAF0; }
.inv-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 4px;
}
.inv-subtitle { font-size: 13px; color: #94A3B8; font-family: 'Inter', sans-serif; margin: 0; }
.inv-btn-reload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #E5EAF0;
  background: #F8FAFC;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
}
.inv-btn-reload:hover { background: #E5EAF0; }

/* ─── Error / Loading ─────────────────────────────────────── */
.inv-error-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF1F2;
  border: 1px solid #FECDD3;
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 13px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
}
.inv-skel {
  height: 80px;
  background: linear-gradient(90deg, #F1F5FA 25%, #E8EFF8 50%, #F1F5FA 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: var(--r-xl, 16px);
}
.inv-skel--tall { height: 320px; }
@keyframes shimmer {
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

/* ─── Detail grid ─────────────────────────────────────────── */
.inv-detail-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
}
@media (max-width: 900px) { .inv-detail-grid { grid-template-columns: 1fr; } }

/* ─── Card ────────────────────────────────────────────────── */
.inv-card {
  background: #fff;
  border-radius: var(--r-xl, 16px);
  box-shadow: var(--shadow-card);
  padding: 20px;
}
.inv-card--full { grid-column: 1 / -1; }
.inv-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F1F5FA;
}
.inv-card-ico   { color: #054EAF; flex-shrink: 0; }
.inv-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin: 0;
}
.inv-col-right { display: flex; flex-direction: column; gap: 20px; }

/* ─── Info body ───────────────────────────────────────────── */
.inv-info-body { display: flex; gap: 20px; flex-wrap: wrap; }
.inv-info-img {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #E2EBF6;
  flex-shrink: 0;
}
.inv-info-img-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  background: #F1F5FA;
  border: 1px solid #E2EBF6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #CBD5E1;
  flex-shrink: 0;
}
.inv-info-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
@media (max-width: 600px) { .inv-info-grid { grid-template-columns: 1fr; } }
.inv-info-row { display: flex; flex-direction: column; gap: 3px; }
.inv-info-lbl {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}
.inv-info-val {
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}
.inv-info-val--mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12px; }

/* ─── Quick actions ───────────────────────────────────────── */
.inv-actions-list { display: flex; flex-direction: column; gap: 8px; }
.inv-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 14px;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s, border-color 0.15s;
}
.inv-action-btn:hover { background: #EFF6FF; border-color: #BFDBFE; }
.inv-action-btn > span { flex: 1; }
.inv-action-ico--green  { color: #16A34A; }
.inv-action-ico--orange { color: #C2410C; }
.inv-action-ico--purple { color: #7C3AED; }
.inv-action-arrow { color: #CBD5E1; }

/* ─── QR section ──────────────────────────────────────────── */
.inv-qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.inv-qr-img {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  border: 1px solid #E2EBF6;
}
.inv-qr-loading {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  background: #F1F5FA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #94A3B8;
}
.inv-qr-code-txt {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #64748B;
  text-align: center;
  margin: 0;
  word-break: break-all;
}
.inv-btn-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #BFDBFE;
  background: #EFF6FF;
  color: #054EAF;
  cursor: pointer;
  transition: background 0.15s;
}
.inv-btn-download:hover:not(:disabled) { background: #DBEAFE; }
.inv-btn-download:disabled { opacity: 0.5; cursor: not-allowed; }

.inv-qr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
}
.inv-qr-empty-ico { color: #CBD5E1; }
.inv-qr-empty-txt { font-size: 13px; color: #94A3B8; font-family: 'Inter', sans-serif; text-align: center; margin: 0; }
.inv-btn-generate {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #054EAF;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}
.inv-btn-generate:hover:not(:disabled) { background: #03368A; }
.inv-btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }

/* ─── Reservations table ──────────────────────────────────── */
.inv-table-scroll { overflow-x: auto; }
.inv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}
.inv-table th {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748B;
  text-align: left;
  background: #F8FAFC;
  border-bottom: 1px solid #F1F5FA;
  white-space: nowrap;
}
.inv-table td {
  padding: 12px 14px;
  color: #0F1A2E;
  border-bottom: 1px solid #F8FAFC;
}
.inv-table tr:last-child td { border-bottom: none; }
.inv-table tr:hover td { background: #FAFCFF; }
.inv-td-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

/* ─── Timeline ────────────────────────────────────────────── */
.inv-timeline { display: flex; flex-direction: column; gap: 0; }
.inv-timeline-item {
  display: grid;
  grid-template-columns: 32px 1px 1fr;
  column-gap: 12px;
  align-items: start;
  padding-bottom: 16px;
}
.inv-timeline-item:last-child { padding-bottom: 0; }
.inv-timeline-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.inv-timeline-line {
  width: 1px;
  background: #E2EBF6;
  align-self: stretch;
  margin-top: 32px;
}
.inv-timeline-content { padding-top: 6px; }
.inv-tl-desc {
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  margin: 0 0 4px;
}
.inv-tl-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.inv-tl-user, .inv-tl-date {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}
.inv-method {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}
.inv-method--qr     { background: #EFF6FF; color: #054EAF; }
.inv-method--nfc    { background: #F3E8FF; color: #7C3AED; }
.inv-method--manual { background: #F1F5F9; color: #64748B; }

/* ─── Empty state ─────────────────────────────────────────── */
.inv-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: #94A3B8;
}
.inv-empty-ico { opacity: 0.4; }
.inv-empty-state p { font-size: 13px; font-family: 'Inter', sans-serif; margin: 0; }

/* ─── Modal ───────────────────────────────────────────────── */
.inv-modal-body { display: flex; flex-direction: column; gap: 16px; }
.inv-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin: 0 0 4px;
}
.inv-form-group { display: flex; flex-direction: column; gap: 6px; }
.inv-form-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  font-family: 'Inter', sans-serif;
}
.inv-form-input {
  width: 100%;
  padding: 9px 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  background: #F8FAFC;
  color: #0F1A2E;
  outline: none;
  transition: border-color 0.15s;
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
}
.inv-form-input:focus { border-color: #054EAF; box-shadow: 0 0 0 3px rgba(5,78,175,0.1); }
.inv-form-textarea { resize: vertical; min-height: 80px; }
.inv-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
.inv-btn-cancel {
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #E5EAF0;
  background: #F8FAFC;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
}
.inv-btn-cancel:hover { background: #E5EAF0; }
.inv-btn-save {
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #054EAF;
  color: #fff;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  transition: background 0.15s;
}
.inv-btn-save:hover:not(:disabled) { background: #03368A; }
.inv-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ─── Badges ──────────────────────────────────────────────── */
:deep(.badge) {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
:deep(.badge--green)  { background: #DCFCE7; color: #16A34A; }
:deep(.badge--yellow) { background: #FEF9C3; color: #B45309; }
:deep(.badge--orange) { background: #FFEDD5; color: #C2410C; }
:deep(.badge--blue)   { background: #DBEAFE; color: #1D4ED8; }
:deep(.badge--red)    { background: #FEE2E2; color: #B91C1C; }
:deep(.badge--slate)  { background: #F1F5F9; color: #64748B; }
</style>
