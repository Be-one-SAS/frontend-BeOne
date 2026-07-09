<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QRCode from 'qrcode'
import {
  getInventoryItem, getItemReservations, getItemHistory,
  updateItemStatus, updateItemCondition, updateItemLocation, generateQR,
  uploadProductImage, updateInventoryDetails,
} from '@/services/inventory.service'
import { getMaterialesByProducto } from '@/services/materiales.service'
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import SelectLabel from '@/components/input/SelectLabel.vue'
import { useActionAccess } from '@/composables/useActionAccess'
import {
  ArrowLeft, RefreshCw, QrCode, Download, Wifi,
  Package, MapPin, Clock, AlertTriangle, CheckCircle,
  Wrench, Edit, ChevronRight, Tag, Layers,
} from 'lucide-vue-next'

const { canDo } = useActionAccess()

const route  = useRoute()
const router = useRouter()
const id     = route.params.id

/* ─── state ──────────────────────────────────────────────── */
const item        = ref(null)
const reservations = ref([])
const history     = ref([])
const materiales  = ref([])
const materialesLoading = ref(false)
const loading     = ref(false)
const error       = ref(null)
const qrDataUrl   = ref(null)
const qrLoading   = ref(false)

/* ─── imagen ─────────────────────────────────────────────── */
const imgPreview    = ref(null)
const imgFile       = ref(null)
const imgUploading  = ref(false)
const imgProgress   = ref(0)
const imgError      = ref('')
const imgSuccess    = ref(false)
const fileInputRef  = ref(null)

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  if (!allowed.includes(file.type)) {
    imgError.value = 'Formato no permitido. Usa JPG, PNG, WebP o AVIF.'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    imgError.value = 'El archivo supera el límite de 10 MB.'
    return
  }
  imgError.value  = ''
  imgSuccess.value = false
  imgFile.value   = file
  imgPreview.value = URL.createObjectURL(file)
}

function cancelPreview() {
  imgPreview.value = null
  imgFile.value    = null
  imgError.value   = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function confirmUpload() {
  if (!imgFile.value) return
  imgUploading.value = true
  imgProgress.value  = 0
  imgError.value     = ''
  try {
    const res = await uploadProductImage(id, imgFile.value, (p) => { imgProgress.value = p })
    item.value.imageUrl = res.imageUrl
    imgSuccess.value    = true
    cancelPreview()
  } catch (e) {
    imgError.value = e?.response?.data?.message || 'Error al subir la imagen.'
  } finally {
    imgUploading.value = false
  }
}

/* ─── edición inline ─────────────────────────────────────── */
const editMode    = ref(false)
const editSaving  = ref(false)
const editError   = ref('')
const editSuccess = ref(false)
const editForm    = ref({})

// Nota: 'availabilityStatus', 'conditionStatus' y 'location' NO están aquí a
// propósito — se editan únicamente vía los modales de acción rápida
// (saveStatus/saveCondition/saveLocation), que sí registran el cambio en
// InventoryLog con el valor anterior/nuevo. Editarlos también desde este
// formulario genérico duplicaba el flujo y dejaba esos cambios sin auditoría
// específica (quedaban como "Edición de campos del producto" genérica).
const EDITABLE_FIELDS = [
  'nombre', 'dispositivo', 'categoria', 'bodega',
  'serialNumber', 'nfcTag', 'notas', 'descripcion', 'medidas',
  'montacarga', 'incluyeTransporteBogMde',
  'amperios', 'm2Dispositivo', 'pesoAproxDisp', 'm3Transporte',
  'qHorasOperacion', 'qHorasMontaje',
  'qMotores', 'qOperarios', 'qPersonalMontaje', 'anioDispositivo',
  'qPesosEstacas', 'qExtintores',
]

function startEdit() {
  editForm.value = {}
  EDITABLE_FIELDS.forEach(k => {
    editForm.value[k] = item.value[k] ?? null
  })
  editError.value   = ''
  editSuccess.value = false
  editMode.value    = true
}

function cancelEdit() {
  editMode.value = false
  editError.value = ''
}

const hasUnsavedChanges = computed(() => {
  if (!editMode.value) return false
  return EDITABLE_FIELDS.some(k => editForm.value[k] !== (item.value[k] ?? null))
})

async function saveEdit() {
  editSaving.value  = true
  editError.value   = ''
  editSuccess.value = false
  try {
    const payload = {}
    EDITABLE_FIELDS.forEach(k => {
      if (editForm.value[k] !== null && editForm.value[k] !== '') {
        payload[k] = editForm.value[k]
      } else if (editForm.value[k] === null || editForm.value[k] === '') {
        payload[k] = null
      }
    })
    const res = await updateInventoryDetails(id, payload)
    const updated = res.data
    Object.assign(item.value, updated)
    editSuccess.value = true
    editMode.value    = false
    setTimeout(() => { editSuccess.value = false }, 3000)
  } catch (e) {
    editError.value = e?.response?.data?.message || 'Error al guardar los cambios.'
  } finally {
    editSaving.value = false
  }
}

// Advertencia al salir con cambios sin guardar
const beforeUnloadHandler = (e) => {
  if (hasUnsavedChanges.value) { e.preventDefault(); e.returnValue = '' }
}
window.addEventListener('beforeunload', beforeUnloadHandler)
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler))

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
// El % en "Operativo 70/50" es el rendimiento/capacidad estimada del equipo
// respecto a su estado óptimo (ej. un inflable con un motor de 2 fallando
// pero que aún opera) — no es porcentaje de piezas ni de desgaste físico.
const condOptions = [
  { value: 'OPERATIVO_OK',     label: 'Operativo OK',     hint: 'Funciona al 100% de su capacidad' },
  { value: 'OPERATIVO_70',     label: 'Operativo 70%',    hint: 'Funciona con limitaciones menores, sigue siendo usable' },
  { value: 'OPERATIVO_50',     label: 'Operativo 50%',    hint: 'Funciona con limitaciones importantes' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento', hint: 'Fuera de servicio temporalmente para reparación' },
  { value: 'DEFECTUOSO',       label: 'Defectuoso',       hint: 'No funciona, requiere reparación' },
  { value: 'NO_ACTIVO',        label: 'No activo',        hint: 'Dado de baja, no se usa ni se repara' },
]
const condHint = computed(() => condOptions.find(o => o.value === condForm.value.condition)?.hint || '')
const methodOptions = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'QR',     label: 'QR'     },
  { value: 'NFC',    label: 'NFC'    },
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
  SCAN:      '#27C8D8',
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

  // Independiente del resto — si falla no debe tumbar el detalle del equipo
  materialesLoading.value = true
  try {
    materiales.value = await getMaterialesByProducto(id)
  } catch (e) {
    console.error(e)
  } finally {
    materialesLoading.value = false
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
            <div class="inv-edit-head-actions">
              <transition name="fade">
                <span v-if="editSuccess" class="inv-edit-saved">✓ Guardado</span>
              </transition>
              <template v-if="!editMode">
                <button v-if="canDo('InventarioDetalles', ['ADMINISTRADOR', 'SUPERVISOR', 'LOGISTICO'])" class="inv-btn-edit" @click="startEdit">
                  <Edit :size="13" /> Editar
                </button>
              </template>
              <template v-else>
                <button class="inv-btn-cancel-edit" @click="cancelEdit" :disabled="editSaving">Cancelar</button>
                <button class="inv-btn-save-edit" @click="saveEdit" :disabled="editSaving">
                  <span v-if="editSaving" class="inv-spinner" />
                  {{ editSaving ? 'Guardando…' : 'Guardar cambios' }}
                </button>
              </template>
            </div>
          </div>

          <!-- Error edición -->
          <div v-if="editError" class="inv-edit-error">{{ editError }}</div>

          <div class="inv-info-body">
            <!-- Zona de imagen con upload -->
            <div class="inv-img-wrap">
              <input ref="fileInputRef" type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="inv-img-input" @change="onFileChange" />
              <template v-if="imgPreview">
                <img :src="imgPreview" alt="Preview" class="inv-info-img inv-info-img--preview" />
                <div class="inv-img-preview-actions">
                  <button class="inv-img-btn inv-img-btn--cancel" @click="cancelPreview" :disabled="imgUploading">Cancelar</button>
                  <button class="inv-img-btn inv-img-btn--confirm" @click="confirmUpload" :disabled="imgUploading">
                    <span v-if="imgUploading" class="inv-spinner" />
                    {{ imgUploading ? `${imgProgress}%` : 'Confirmar' }}
                  </button>
                </div>
                <div v-if="imgUploading" class="inv-progress-bar"><div class="inv-progress-fill" :style="{ width: imgProgress + '%' }" /></div>
              </template>
              <template v-else>
                <div class="inv-img-inner">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.nombre" class="inv-info-img" />
                  <div v-else class="inv-info-img-placeholder"><Package :size="32" /></div>
                  <button class="inv-img-upload-btn" @click="fileInputRef.click()" title="Subir imagen"><Edit :size="12" /></button>
                </div>
              </template>
              <p v-if="imgError" class="inv-img-error">{{ imgError }}</p>
              <p v-if="imgSuccess" class="inv-img-success">Imagen actualizada</p>
            </div>

            <!-- Grid de campos -->
            <div class="inv-info-grid inv-info-grid--wide">

              <!-- ── Sección: Identificación ── -->
              <div class="inv-section-label" style="grid-column:1/-1">Identificación</div>

              <div class="inv-info-row">
                <span class="inv-info-lbl">Nombre</span>
                <input v-if="editMode" v-model="editForm.nombre" class="inv-edit-input" placeholder="Nombre" />
                <span v-else class="inv-info-val">{{ item.nombre || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Dispositivo</span>
                <input v-if="editMode" v-model="editForm.dispositivo" class="inv-edit-input" placeholder="Dispositivo" />
                <span v-else class="inv-info-val">{{ item.dispositivo || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Categoría</span>
                <input v-if="editMode" v-model="editForm.categoria" class="inv-edit-input" placeholder="Categoría" />
                <span v-else class="inv-info-val">{{ item.categoria || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">N/S</span>
                <input v-if="editMode" v-model="editForm.serialNumber" class="inv-edit-input inv-edit-input--mono" placeholder="Serial" />
                <span v-else class="inv-info-val inv-info-val--mono">{{ item.serialNumber || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Tag NFC</span>
                <input v-if="editMode" v-model="editForm.nfcTag" class="inv-edit-input inv-edit-input--mono" placeholder="NFC tag" />
                <span v-else class="inv-info-val inv-info-val--mono">{{ item.nfcTag || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Año</span>
                <input v-if="editMode" v-model.number="editForm.anioDispositivo" type="number" class="inv-edit-input" placeholder="Ej: 2020" />
                <span v-else class="inv-info-val">{{ item.anioDispositivo ?? '—' }}</span>
              </div>

              <!-- ── Sección: Estado y ubicación ── -->
              <div class="inv-section-label" style="grid-column:1/-1">Estado y ubicación</div>

              <div class="inv-info-row">
                <span class="inv-info-lbl">Disponibilidad</span>
                <span class="inv-info-val-with-action">
                  <span :class="availClass(item.availabilityStatus)">{{ availLabel(item.availabilityStatus) }}</span>
                  <button v-if="canDo('InventarioEstado', ['ADMINISTRADOR', 'SUPERVISOR', 'LOGISTICO'])" type="button" class="inv-btn-change" @click="openStatusModal">Cambiar</button>
                </span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Condición</span>
                <span class="inv-info-val-with-action">
                  <span :class="condClass(item.conditionStatus)">{{ condLabel(item.conditionStatus) }}</span>
                  <button v-if="canDo('InventarioCondicion', ['ADMINISTRADOR', 'SUPERVISOR', 'LOGISTICO'])" type="button" class="inv-btn-change" @click="openCondModal">Cambiar</button>
                </span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Bodega</span>
                <input v-if="editMode" v-model="editForm.bodega" class="inv-edit-input" placeholder="Bodega" />
                <span v-else class="inv-info-val">{{ item.bodega || '—' }}</span>
                <span v-if="editMode" class="inv-info-hint">Instalación o sede física (ej. "Bodega Medellín")</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Ubicación</span>
                <span class="inv-info-val-with-action">
                  <span class="inv-info-val">{{ item.ubicacion || '—' }}</span>
                  <button v-if="canDo('InventarioUbicacion', ['ADMINISTRADOR', 'SUPERVISOR', 'LOGISTICO'])" type="button" class="inv-btn-change" @click="openLocationModal">Cambiar</button>
                </span>
                <span class="inv-info-hint">Punto exacto dentro de la bodega (ej. "Estante 3, nivel B")</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Último escaneo</span>
                <span class="inv-info-val">{{ formatDate(item.lastScanAt) }}</span>
              </div>
              <div v-if="item.qrCode" class="inv-info-row">
                <span class="inv-info-lbl">Código QR</span>
                <span class="inv-info-val inv-info-val--mono">{{ item.qrCode }}</span>
              </div>

              <!-- ── Sección: Especificaciones técnicas ── -->
              <div class="inv-section-label" style="grid-column:1/-1">Especificaciones técnicas</div>

              <div class="inv-info-row">
                <span class="inv-info-lbl">Amperios</span>
                <input v-if="editMode" v-model.number="editForm.amperios" type="number" class="inv-edit-input" placeholder="A" />
                <span v-else class="inv-info-val">{{ item.amperios ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Medidas</span>
                <input v-if="editMode" v-model="editForm.medidas" class="inv-edit-input" placeholder="Ej: 2x1x1 m" />
                <span v-else class="inv-info-val">{{ item.medidas || '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Motores</span>
                <input v-if="editMode" v-model.number="editForm.qMotores" type="number" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.qMotores ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Operarios</span>
                <input v-if="editMode" v-model.number="editForm.qOperarios" type="number" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.qOperarios ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">m²</span>
                <input v-if="editMode" v-model.number="editForm.m2Dispositivo" type="number" step="0.01" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.m2Dispositivo ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Peso (kg)</span>
                <input v-if="editMode" v-model.number="editForm.pesoAproxDisp" type="number" step="0.1" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.pesoAproxDisp ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">m³ Transporte</span>
                <input v-if="editMode" v-model.number="editForm.m3Transporte" type="number" step="0.01" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.m3Transporte ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Pesos/Estacas</span>
                <input v-if="editMode" v-model.number="editForm.qPesosEstacas" type="number" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.qPesosEstacas ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Extintores</span>
                <input v-if="editMode" v-model.number="editForm.qExtintores" type="number" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.qExtintores ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Montacarga</span>
                <input v-if="editMode" v-model="editForm.montacarga" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.montacarga || '—' }}</span>
              </div>

              <!-- ── Sección: Operación y montaje ── -->
              <div class="inv-section-label" style="grid-column:1/-1">Operación y montaje</div>

              <div class="inv-info-row">
                <span class="inv-info-lbl">Hrs operación</span>
                <input v-if="editMode" v-model.number="editForm.qHorasOperacion" type="number" step="0.5" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.qHorasOperacion ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Hrs montaje</span>
                <input v-if="editMode" v-model.number="editForm.qHorasMontaje" type="number" step="0.5" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.qHorasMontaje ?? '—' }}</span>
              </div>
              <div class="inv-info-row">
                <span class="inv-info-lbl">Personal montaje</span>
                <input v-if="editMode" v-model.number="editForm.qPersonalMontaje" type="number" class="inv-edit-input" />
                <span v-else class="inv-info-val">{{ item.qPersonalMontaje ?? '—' }}</span>
              </div>
              <div class="inv-info-row" style="grid-column: span 2">
                <span class="inv-info-lbl">Incluye transporte BOG/MDE</span>
                <input v-if="editMode" v-model="editForm.incluyeTransporteBogMde" class="inv-edit-input" placeholder="Sí / No / Consultar" />
                <span v-else class="inv-info-val">{{ item.incluyeTransporteBogMde || '—' }}</span>
              </div>

              <!-- ── Sección: Textos ── -->
              <div class="inv-section-label" style="grid-column:1/-1">Descripción y notas</div>

              <div class="inv-info-row" style="grid-column:1/-1">
                <span class="inv-info-lbl">Descripción</span>
                <textarea v-if="editMode" v-model="editForm.descripcion" class="inv-edit-input inv-edit-textarea" rows="3" placeholder="Descripción del producto…"></textarea>
                <span v-else class="inv-info-val" style="white-space:pre-wrap">{{ item.descripcion || '—' }}</span>
              </div>
              <div class="inv-info-row" style="grid-column:1/-1">
                <span class="inv-info-lbl">Notas</span>
                <textarea v-if="editMode" v-model="editForm.notas" class="inv-edit-input inv-edit-textarea" rows="2" placeholder="Notas internas…"></textarea>
                <span v-else class="inv-info-val" style="white-space:pre-wrap">{{ item.notas || '—' }}</span>
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
              <button v-if="canDo('InventarioQR', ['ADMINISTRADOR', 'SUPERVISOR', 'LOGISTICO'])" class="inv-btn-generate" @click="handleGenerateQR" :disabled="qrLoading">
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

        <!-- ── Materiales del catálogo ──────────────────────────── -->
        <div class="inv-card inv-card--full">
          <div class="inv-card-head">
            <Layers :size="16" class="inv-card-ico" />
            <h3 class="inv-card-title">
              Materiales del catálogo
              <span class="inv-count-badge">{{ materiales.length }}</span>
            </h3>
            <button
              type="button"
              class="inv-btn-materiales-link"
              @click="router.push({ name: 'Materiales', query: { productoId: id } })"
            >
              Gestionar materiales
            </button>
          </div>

          <div v-if="materialesLoading" class="inv-empty-state">
            <p>Cargando materiales…</p>
          </div>
          <ul v-else-if="materiales.length" class="mat-summary-list">
            <li v-for="pm in materiales" :key="pm.id" class="mat-summary-item">
              <span class="mat-nombre">{{ pm.materialBase?.nombre }}</span>
              <span class="mat-summary-meta">{{ pm.cantidad }} {{ pm.materialBase?.unidad || '' }}</span>
              <span :class="pm.esOpcional ? 'mat-badge-opt' : 'mat-badge-req'">
                {{ pm.esOpcional ? 'Opcional' : 'Requerido' }}
              </span>
            </li>
          </ul>
          <div v-else class="inv-empty-state">
            <Layers :size="28" class="inv-empty-ico" />
            <p>Este producto no tiene materiales asignados desde el catálogo</p>
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
          <SelectLabel v-model="statusForm.status" :options="statusOptions" placeholder="Seleccionar…" />
        </div>
        <div class="inv-form-group">
          <label class="inv-form-lbl">Notas (opcional)</label>
          <textarea v-model="statusForm.notes" class="inv-form-input inv-form-textarea" rows="3" placeholder="Motivo del cambio…" />
        </div>
        <div class="inv-form-group">
          <label class="inv-form-lbl">Método de registro</label>
          <SelectLabel v-model="statusForm.method" :options="methodOptions" />
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
          <SelectLabel v-model="condForm.condition" :options="condOptions" placeholder="Seleccionar…" />
          <p v-if="condHint" class="inv-form-hint">{{ condHint }}</p>
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
.inv-card-ico   { color: #27C8D8; flex-shrink: 0; }
.inv-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin: 0;
}
.inv-col-right { display: flex; flex-direction: column; gap: 20px; }

.inv-count-badge {
  display: inline-flex; align-items: center; justify-content: center;
  background: #CCEFF2; color: #27C8D8;
  border-radius: 9999px; font-size: 11px; font-weight: 600;
  min-width: 18px; height: 18px; padding: 0 5px; margin-left: 6px;
}
.inv-btn-materiales-link {
  margin-left: auto;
  border: 1px solid #CBD5E1; background: #fff; cursor: pointer;
  padding: 5px 12px; border-radius: 6px;
  font-size: 12px; font-weight: 600; color: #475569;
  font-family: 'Inter', sans-serif; transition: background 0.15s;
}
.inv-btn-materiales-link:hover { background: #F1F5F9; }

.mat-summary-list { list-style: none; margin: 0; padding: 0; }
.mat-summary-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px;
}
.mat-summary-item:last-child { border-bottom: none; }
.mat-nombre { font-weight: 500; color: #0F172A; flex: 1; }
.mat-summary-meta { color: #64748B; font-size: 12px; }
.mat-badge-req {
  display: inline-block; padding: 2px 7px; border-radius: 9999px;
  font-size: 10px; font-weight: 600; background: #E0F9FA; color: #27C8D8;
}
.mat-badge-opt {
  display: inline-block; padding: 2px 7px; border-radius: 9999px;
  font-size: 10px; font-weight: 600; background: #FFF7ED; color: #C2410C;
}

/* ─── Info body ───────────────────────────────────────────── */
.inv-info-body { display: flex; gap: 20px; flex-wrap: wrap; }
.inv-info-img {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #E2EBF6;
  display: block;
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
.inv-info-val-with-action { display: flex; align-items: center; gap: 8px; }
.inv-btn-change {
  border: none; background: none; padding: 0;
  font-size: 11px; font-weight: 600; color: #27C8D8;
  cursor: pointer; text-decoration: underline;
  font-family: 'Inter', sans-serif;
}
.inv-btn-change:hover { color: #1BAEBB; }
.inv-info-hint { font-size: 11px; color: #94A3B8; font-family: 'Inter', sans-serif; }

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
.inv-action-btn:hover { background: #E0F9FA; border-color: #A7EEF5; }
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
  border: 1px solid #A7EEF5;
  background: #E0F9FA;
  color: #27C8D8;
  cursor: pointer;
  transition: background 0.15s;
}
.inv-btn-download:hover:not(:disabled) { background: #CCEFF2; }
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
  background: #27C8D8;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}
.inv-btn-generate:hover:not(:disabled) { background: #1BAEBB; }
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
.inv-method--qr     { background: #E0F9FA; color: #27C8D8; }
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
.inv-form-hint {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
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
.inv-form-input:focus { border-color: #27C8D8; box-shadow: 0 0 0 3px rgba(39,200,216,0.1); }
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
  background: #27C8D8;
  color: #fff;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  transition: background 0.15s;
}
.inv-btn-save:hover:not(:disabled) { background: #1BAEBB; }
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
:deep(.badge--blue)   { background: #CCEFF2; color: #27C8D8; }
:deep(.badge--red)    { background: #FEE2E2; color: #B91C1C; }
:deep(.badge--slate)  { background: #F1F5F9; color: #64748B; }

/* ─── Edit mode ───────────────────────────────────────────── */
.inv-info-grid--wide {
  grid-template-columns: repeat(3, 1fr);
}
@media (max-width: 900px) { .inv-info-grid--wide { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .inv-info-grid--wide { grid-template-columns: 1fr; } }

.inv-section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #27C8D8;
  font-family: 'Inter', sans-serif;
  padding: 10px 0 2px;
  border-bottom: 1px solid #F0FAFB;
  margin-bottom: 2px;
}

.inv-edit-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.inv-edit-saved {
  font-size: 12px;
  font-weight: 600;
  color: #16A34A;
  font-family: 'Inter', sans-serif;
}

.inv-btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #A7EEF5;
  background: #E0F9FA;
  color: #27C8D8;
  cursor: pointer;
  transition: background 0.15s;
}
.inv-btn-edit:hover { background: #CCEFF2; }

.inv-btn-cancel-edit {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: #F1F5F9;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
}
.inv-btn-cancel-edit:hover:not(:disabled) { background: #E2EBF6; }
.inv-btn-cancel-edit:disabled { opacity: 0.5; cursor: not-allowed; }

.inv-btn-save-edit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #27C8D8;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
  box-shadow: 0 1px 3px rgba(39,200,216,.2);
}
.inv-btn-save-edit:hover:not(:disabled) { background: #1BAEBB; }
.inv-btn-save-edit:disabled { opacity: 0.6; cursor: not-allowed; }

.inv-edit-error {
  background: #FEE2E2;
  color: #B91C1C;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  margin-bottom: 12px;
}

.inv-edit-input {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #A7EEF5;
  border-radius: 6px;
  padding: 5px 9px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: auto;
  box-sizing: border-box;
}
.inv-edit-input:focus {
  border-color: #27C8D8;
  box-shadow: 0 0 0 3px rgba(39,200,216,.1);
}
.inv-edit-input::placeholder { color: #94A3B8; }
.inv-edit-input--mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.inv-edit-textarea { resize: vertical; min-height: 60px; border-radius: 6px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── Image upload ────────────────────────────────────────── */
.inv-img-wrap {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.inv-img-inner {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.inv-img-input { display: none; }

.inv-info-img--preview { opacity: 0.85; }

.inv-img-upload-btn {
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #27C8D8;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,.2);
  transition: background 0.15s;
  padding: 0;
}
.inv-img-upload-btn:hover { background: #1BAEBB; }

.inv-img-preview-actions {
  display: flex;
  gap: 4px;
  width: 100%;
}

.inv-img-btn {
  flex: 1;
  padding: 5px 0;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: background 0.15s;
}
.inv-img-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.inv-img-btn--cancel  { background: #F1F5F9; color: #64748B; }
.inv-img-btn--cancel:hover:not(:disabled)  { background: #E2EBF6; }
.inv-img-btn--confirm { background: #27C8D8; color: #fff; }
.inv-img-btn--confirm:hover:not(:disabled) { background: #1BAEBB; }

.inv-progress-bar {
  width: 100%;
  height: 4px;
  background: #E2EBF6;
  border-radius: 999px;
  overflow: hidden;
}
.inv-progress-fill {
  height: 100%;
  background: #27C8D8;
  border-radius: 999px;
  transition: width 0.2s ease;
}

.inv-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.inv-img-error {
  font-size: 10px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
  text-align: center;
  margin: 0;
  line-height: 1.3;
}
.inv-img-success {
  font-size: 10px;
  color: #16A34A;
  font-family: 'Inter', sans-serif;
  text-align: center;
  margin: 0;
}
</style>
