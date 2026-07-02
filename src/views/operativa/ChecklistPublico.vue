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

        <!-- ── Datos generales ─────────────────────────── -->
        <div class="cl-section">
          <button class="cl-section-header" @click="openSection = openSection === 'generales' ? null : 'generales'">
            <span class="cl-section-dot" :class="sectionFilled('generales') ? 'cl-dot-ok' : 'cl-dot-pending'" />
            <span class="cl-section-title">Datos generales</span>
            <span class="cl-section-badge" v-if="data.checkin && openSection !== 'generales'">Guardado</span>
            <svg class="cl-chevron" :class="{ open: openSection === 'generales' }" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M7.293 4.707a1 1 0 010 1.414L4.414 9H15a1 1 0 110 2H4.414l2.879 2.879a1 1 0 01-1.414 1.414l-4.586-4.586a1 1 0 010-1.414l4.586-4.586a1 1 0 011.414 0z" clip-rule="evenodd" transform="rotate(270, 10, 10)"/>
            </svg>
          </button>
          <div v-if="openSection === 'generales'" class="cl-section-body">
            <div class="cl-field">
              <label class="cl-label">Correo <span class="cl-req">*</span></label>
              <input v-model="form.correo" type="email" class="cl-input" placeholder="correo@ejemplo.com" />
            </div>
            <div class="cl-field">
              <label class="cl-label">Fecha <span class="cl-req">*</span></label>
              <input v-model="form.fecha" type="date" class="cl-input" />
            </div>
            <!-- Nombre y número del evento vienen de la cotización — solo lectura -->
            <div class="cl-field">
              <label class="cl-label">Nombre del evento</label>
              <div class="cl-input cl-input-readonly">{{ form.nombreEvento || '—' }}</div>
            </div>
            <div class="cl-field">
              <label class="cl-label">Número de evento</label>
              <div class="cl-input cl-input-readonly">{{ form.numeroEvento || '—' }}</div>
            </div>
            <!-- Coordinador: select si viene de la cotización, texto libre si no -->
            <div class="cl-field">
              <label class="cl-label">Coordinador <span class="cl-req">*</span></label>
              <select v-if="quotationCoords.length" v-model="form.nombreCoordinador" class="cl-input cl-select">
                <option value="" disabled>Selecciona un coordinador</option>
                <option v-for="c in quotationCoords" :key="c" :value="c">{{ c }}</option>
                <option value="__otro__">Otro…</option>
              </select>
              <input v-else v-model="form.nombreCoordinador" type="text" class="cl-input" placeholder="Nombre del coordinador" />
              <input
                v-if="form.nombreCoordinador === '__otro__'"
                v-model="form.otroCoordinador"
                type="text" class="cl-input" style="margin-top:6px"
                placeholder="Escribe el nombre del coordinador"
              />
            </div>
            <div class="cl-field">
              <label class="cl-label">Dinamizador <span class="cl-req">*</span></label>
              <input v-model="form.nombreDinamizador" type="text" class="cl-input" placeholder="Nombre del dinamizador" />
            </div>
            <!-- Dispositivo: select de los juegos de la cotización, o texto libre -->
            <div class="cl-field">
              <label class="cl-label">Dispositivo <span class="cl-req">*</span></label>
              <select v-if="quotationDevices.length" v-model="form.nombreDispositivo" class="cl-input cl-select">
                <option value="" disabled>Selecciona un dispositivo</option>
                <option v-for="d in quotationDevices" :key="d" :value="d">{{ d }}</option>
                <option value="__otro__">Otro…</option>
              </select>
              <input v-else v-model="form.nombreDispositivo" type="text" class="cl-input" placeholder="Nombre del dispositivo" />
              <input
                v-if="form.nombreDispositivo === '__otro__'"
                v-model="form.otroDispositivo"
                type="text" class="cl-input" style="margin-top:6px"
                placeholder="Escribe el nombre del dispositivo"
              />
            </div>
          </div>
        </div>

        <!-- ── Datos del cliente ───────────────────────── -->
        <div class="cl-section">
          <button class="cl-section-header" @click="openSection = openSection === 'cliente' ? null : 'cliente'">
            <span class="cl-section-dot" :class="sectionFilled('cliente') ? 'cl-dot-ok' : 'cl-dot-pending'" />
            <span class="cl-section-title">Datos del cliente</span>
            <span class="cl-section-badge" v-if="data.checkin && openSection !== 'cliente'">Guardado</span>
            <svg class="cl-chevron" :class="{ open: openSection === 'cliente' }" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M7.293 4.707a1 1 0 010 1.414L4.414 9H15a1 1 0 110 2H4.414l2.879 2.879a1 1 0 01-1.414 1.414l-4.586-4.586a1 1 0 010-1.414l4.586-4.586a1 1 0 011.414 0z" clip-rule="evenodd" transform="rotate(270, 10, 10)"/>
            </svg>
          </button>
          <div v-if="openSection === 'cliente'" class="cl-section-body">
            <div class="cl-field">
              <label class="cl-label">Representante del cliente <span class="cl-req">*</span></label>
              <input v-model="form.nombreRepresentanteCliente" type="text" class="cl-input" placeholder="Nombre del representante" />
            </div>
            <div class="cl-field">
              <label class="cl-label">Teléfono del cliente <span class="cl-req">*</span></label>
              <input v-model="form.telefonoCliente" type="tel" class="cl-input" placeholder="+57 300 000 0000" />
            </div>
            <div class="cl-field">
              <label class="cl-label">Empresa cliente</label>
              <div class="cl-input cl-input-readonly">{{ data.quotation.empresa || '—' }}</div>
            </div>
          </div>
        </div>

        <!-- ── Checklist por juego ─────────────────────── -->
        <div v-if="juegosList.length === 0" class="cl-empty">
          <p>Este evento no tiene dispositivos con lista de chequeo configurada.</p>
        </div>

        <div
          v-for="juego in juegosList"
          :key="juego.id"
          class="cl-juego"
        >
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

          <div class="cl-juego-bar-bg" v-if="juegoChecked(juego) > 0 && juegoPct(juego) < 100">
            <div class="cl-juego-bar-fill" :style="{ width: juegoPct(juego) + '%' }" />
          </div>

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

            <!-- Observaciones por juego -->
            <div class="cl-juego-obs">
              <label class="cl-label">Observaciones</label>
              <textarea
                v-model="juegoObs[juego.id]"
                class="cl-textarea"
                rows="3"
                placeholder="Observaciones de este dispositivo…"
              />
            </div>

            <!-- Fotos por juego -->
            <div class="cl-juego-obs">
              <label class="cl-label">Fotos de evidencia</label>
              <div v-if="getExistingJuegoPhotos(juego.id).length > 0" class="cl-photos-existing" style="margin-bottom:8px">
                <div class="cl-photos-grid">
                  <a
                    v-for="(url, i) in getExistingJuegoPhotos(juego.id)"
                    :key="i"
                    :href="url"
                    target="_blank"
                    class="cl-photo-thumb"
                  >
                    <img :src="url" :alt="`Foto ${i+1}`" />
                  </a>
                </div>
              </div>
              <div class="cl-photos-grid">
                <label
                  v-for="(photo, i) in (juegoPhotos[juego.id] ?? [])"
                  :key="i"
                  class="cl-photo-slot cl-photo-filled"
                >
                  <img :src="photo.preview" :alt="`Nueva foto ${i+1}`" />
                  <button class="cl-photo-remove" type="button" @click.prevent="removeJuegoPhoto(juego.id, i)">×</button>
                </label>
                <label v-if="(juegoPhotos[juego.id] ?? []).length < 10" class="cl-photo-slot cl-photo-empty">
                  <input type="file" accept="image/jpeg,image/png" class="cl-file-native" @change="addJuegoPhoto(juego.id, $event)" />
                  <span class="cl-photo-plus">+</span>
                  <span class="cl-photo-hint">JPG / PNG</span>
                </label>
              </div>
            </div>

            <!-- Anclajes y observaciones por juego -->
            <div v-if="obsConfigHasFields && juegoAnclajes[juego.id]" class="cl-anclajes-block">
              <div class="cl-anclajes-heading">Anclajes</div>

              <!-- Numéricos: grid de 3 columnas -->
              <div
                v-if="obsConfig.puntosAnclajeTotal?.activo || obsConfig.puntosAnclajeSinAnclar?.activo || obsConfig.cremalleras?.activo"
                class="cl-anclajes-grid"
              >
                <div v-if="obsConfig.puntosAnclajeTotal?.activo" class="cl-anclaje-field">
                  <span class="cl-anclaje-label">{{ obsConfig.puntosAnclajeTotal.label }}</span>
                  <input v-model="juegoAnclajes[juego.id].puntosAnclajeTotal" type="number" inputmode="numeric" class="cl-anclaje-input" placeholder="0" />
                </div>
                <div v-if="obsConfig.puntosAnclajeSinAnclar?.activo" class="cl-anclaje-field">
                  <span class="cl-anclaje-label">{{ obsConfig.puntosAnclajeSinAnclar.label }}</span>
                  <input v-model="juegoAnclajes[juego.id].puntosAnclajeSinAnclar" type="number" inputmode="numeric" class="cl-anclaje-input" placeholder="0" />
                </div>
                <div v-if="obsConfig.cremalleras?.activo" class="cl-anclaje-field">
                  <span class="cl-anclaje-label">{{ obsConfig.cremalleras.label }}</span>
                  <input v-model="juegoAnclajes[juego.id].cremalleras" type="number" inputmode="numeric" class="cl-anclaje-input" placeholder="0" />
                </div>
              </div>

              <!-- Textareas: full width -->
              <div v-if="obsConfig.observacionesDinamizador?.activo" class="cl-anclaje-field">
                <span class="cl-anclaje-label">{{ obsConfig.observacionesDinamizador.label }}</span>
                <textarea v-model="juegoAnclajes[juego.id].obsDinamizador" class="cl-textarea" rows="3" placeholder="Observaciones del dinamizador…" />
              </div>
              <div v-if="obsConfig.observacionesCliente?.activo" class="cl-anclaje-field">
                <span class="cl-anclaje-label">{{ obsConfig.observacionesCliente.label }}</span>
                <textarea v-model="juegoAnclajes[juego.id].obsCliente" class="cl-textarea" rows="3" placeholder="Observaciones del cliente…" />
              </div>
            </div>
          </div>
        </div>

        <!-- ── Botón Guardar ────────────────────────────── -->
        <button
          class="cl-submit-btn"
          :disabled="submitting || !canSubmit"
          @click="submitCheckin"
        >
          <span v-if="submitting" class="cl-spin-sm cl-spin-white" />
          <span v-else>Guardar información</span>
        </button>
        <p v-if="!canSubmit && submitAttempted" class="cl-submit-hint">
          Completa correo, fecha, coordinador, dinamizador, dispositivo, representante y teléfono del cliente.
        </p>

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
    <div v-if="submitOk" class="cl-toast cl-toast-ok">
      ✓ Información guardada correctamente
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getChecklistEvento, toggleChecklistItem, submitChecklistCheckin } from '@/services/checklist-evento.service.js'

const route = useRoute()

const loading   = ref(true)
const error     = ref(null)
const data      = ref(null)
const state     = ref({})
const saving    = ref({})
const saveError = ref(false)
const lastSaved = ref(false)
const openJuego = ref(null)

// ── Secciones colapsables ──────────────────────────────────────────────────────
const openSection = ref(null)

// ── Formulario de datos ────────────────────────────────────────────────────────
const form = ref({
  correo:                     '',
  fecha:                      '',
  nombreEvento:               '',
  numeroEvento:               '',
  nombreCoordinador:          '',
  otroCoordinador:            '',
  nombreDinamizador:          '',
  nombreDispositivo:          '',
  otroDispositivo:            '',
  nombreRepresentanteCliente: '',
  telefonoCliente:            '',
})

const obsConfig          = computed(() => data.value?.obsConfig ?? {})
const obsConfigHasFields = computed(() =>
  Object.values(obsConfig.value).some((f) => f?.activo)
)

// Coordinadores y dispositivos disponibles desde la cotización
const quotationCoords   = computed(() => data.value?.quotation?.coordinadores ?? [])
const quotationDevices  = computed(() =>
  (data.value?.juegos ?? []).map(j => j.nombre).filter(Boolean)
)

// ── Fotos, observaciones y anclajes por juego ─────────────────────────────────
const juegoObs     = ref({})  // { [juegoId]: string }
const juegoPhotos  = ref({})  // { [juegoId]: { file: File, preview: string }[] }
const juegoAnclajes = ref({}) // { [juegoId]: { puntosAnclajeTotal, puntosAnclajeSinAnclar, cremalleras, obsDinamizador, obsCliente } }

function getExistingJuegoPhotos(juegoId) {
  const juego = data.value?.juegos?.find(j => j.id === juegoId)
  if (!juego?.obsData?.fotosUrl) return []
  return Array.isArray(juego.obsData.fotosUrl) ? juego.obsData.fotosUrl : []
}

function addJuegoPhoto(juegoId, e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!juegoPhotos.value[juegoId]) juegoPhotos.value[juegoId] = []
  if (juegoPhotos.value[juegoId].length >= 10) return
  const preview = URL.createObjectURL(file)
  juegoPhotos.value[juegoId].push({ file, preview })
  e.target.value = ''
}

function removeJuegoPhoto(juegoId, i) {
  URL.revokeObjectURL(juegoPhotos.value[juegoId][i].preview)
  juegoPhotos.value[juegoId].splice(i, 1)
}

// ── Submit ─────────────────────────────────────────────────────────────────────
const submitting     = ref(false)
const submitAttempted = ref(false)
const submitOk       = ref(false)

const canSubmit = computed(() => {
  const coord = form.value.nombreCoordinador === '__otro__'
    ? form.value.otroCoordinador?.trim()
    : form.value.nombreCoordinador?.trim()
  const disp = form.value.nombreDispositivo === '__otro__'
    ? form.value.otroDispositivo?.trim()
    : form.value.nombreDispositivo?.trim()
  return !!(
    form.value.correo.trim() &&
    form.value.fecha &&
    coord &&
    form.value.nombreDinamizador.trim() &&
    disp &&
    form.value.nombreRepresentanteCliente.trim() &&
    form.value.telefonoCliente.trim()
  )
})

function sectionFilled(key) {
  if (key === 'generales') return !!(form.value.correo && form.value.fecha && form.value.nombreCoordinador)
  if (key === 'cliente')   return !!(form.value.nombreRepresentanteCliente && form.value.telefonoCliente)
  return false
}

async function submitCheckin() {
  submitAttempted.value = true
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    const quotationId = Number(route.params.id)
    const coordFinal = form.value.nombreCoordinador === '__otro__'
      ? form.value.otroCoordinador
      : form.value.nombreCoordinador
    const dispositivoFinal = form.value.nombreDispositivo === '__otro__'
      ? form.value.otroDispositivo
      : form.value.nombreDispositivo

    const payload = {
      correo:                     form.value.correo,
      fecha:                      form.value.fecha,
      nombreCoordinador:          coordFinal,
      nombreDinamizador:          form.value.nombreDinamizador,
      nombreEvento:               form.value.nombreEvento || data.value?.quotation?.empresa || '',
      numeroEvento:               form.value.numeroEvento || data.value?.quotation?.numero || 0,
      nombreDispositivo:          dispositivoFinal,
      nombreRepresentanteCliente: form.value.nombreRepresentanteCliente,
      telefonoCliente:            form.value.telefonoCliente,
      // Per-juego observations as obs_<juegoId>
      ...Object.fromEntries(
        Object.entries(juegoObs.value)
          .filter(([, v]) => v?.trim())
          .map(([juegoId, obs]) => [`obs_${juegoId}`, obs.trim()])
      ),
      // Per-juego anclaje fields
      ...Object.fromEntries(
        Object.entries(juegoAnclajes.value).flatMap(([juegoId, fields]) => {
          const entries = []
          if (fields.puntosAnclajeTotal !== '' && fields.puntosAnclajeTotal != null)
            entries.push([`puntosAnclajeTotal_${juegoId}`, fields.puntosAnclajeTotal])
          if (fields.puntosAnclajeSinAnclar !== '' && fields.puntosAnclajeSinAnclar != null)
            entries.push([`puntosAnclajeSinAnclar_${juegoId}`, fields.puntosAnclajeSinAnclar])
          if (fields.cremalleras !== '' && fields.cremalleras != null)
            entries.push([`cremalleras_${juegoId}`, fields.cremalleras])
          if (fields.obsDinamizador?.trim())
            entries.push([`obsDinamizador_${juegoId}`, fields.obsDinamizador.trim()])
          if (fields.obsCliente?.trim())
            entries.push([`obsCliente_${juegoId}`, fields.obsCliente.trim()])
          return entries
        })
      ),
    }
    // Per-juego photos: { juegoId: File[] }
    const juegoPhotosFiles = Object.fromEntries(
      Object.entries(juegoPhotos.value)
        .filter(([, list]) => list.length > 0)
        .map(([juegoId, list]) => [juegoId, list.map(p => p.file)])
    )
    const result = await submitChecklistCheckin(quotationId, payload, juegoPhotosFiles)
    // Update local data with the saved checkin
    data.value = { ...data.value, checkin: result }
    submitOk.value = true
    setTimeout(() => { submitOk.value = false }, 3000)
  } catch {
    saveError.value = true
    setTimeout(() => { saveError.value = false }, 3000)
  } finally {
    submitting.value = false
  }
}

// ── Checklist state ────────────────────────────────────────────────────────────
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
  if (!state.value[juegoId]) state.value[juegoId] = {}
  state.value[juegoId][aspectoId] = newVal
  saving.value[key] = true
  try {
    await toggleChecklistItem(data.value.quotation.id, juegoId, aspectoId, newVal)
    lastSaved.value = true
    setTimeout(() => { lastSaved.value = false }, 2500)
  } catch {
    state.value[juegoId][aspectoId] = !newVal
    saveError.value = true
    setTimeout(() => { saveError.value = false }, 3000)
  } finally {
    saving.value[key] = false
  }
}

// ── Mount ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const id = Number(route.params.id)
    if (isNaN(id)) throw new Error('ID inválido')
    const res = await getChecklistEvento(id)
    data.value = res

    // Pre-fill form from existing checkin
    if (res.checkin) {
      const c = res.checkin
      form.value = {
        correo:                     c.correo ?? '',
        fecha:                      c.fecha ? c.fecha.slice(0, 10) : '',
        nombreEvento:               c.nombreEvento ?? '',
        numeroEvento:               c.numeroEvento ?? '',
        nombreCoordinador:          c.nombreCoordinador ?? '',
        otroCoordinador:            '',
        nombreDinamizador:          c.nombreDinamizador ?? '',
        nombreDispositivo:          c.nombreDispositivo ?? '',
        otroDispositivo:            '',
        nombreRepresentanteCliente: c.nombreRepresentanteCliente ?? '',
        telefonoCliente:            c.telefonoCliente ?? '',
      }
    } else {
      // Pre-fill from quotation data
      form.value.nombreEvento               = res.quotation?.description || res.quotation?.empresa || ''
      form.value.numeroEvento               = res.quotation?.numero ?? ''
      // Pre-select first coordinator if only one
      if (res.quotation?.coordinadores?.length === 1) {
        form.value.nombreCoordinador = res.quotation.coordinadores[0]
      }
      // Pre-fill client contact and phone from quotation's cliente
      if (res.quotation?.cliente) {
        form.value.nombreRepresentanteCliente = res.quotation.cliente.contacto || res.quotation.cliente.nombre || ''
        form.value.telefonoCliente            = res.quotation.cliente.telefono || ''
      }
    }

    // Pre-fill per-juego observations and anclajes
    for (const juego of res.juegos ?? []) {
      if (juego.obsData?.observaciones) {
        juegoObs.value[juego.id] = juego.obsData.observaciones
      }
      juegoAnclajes.value[juego.id] = {
        puntosAnclajeTotal:    juego.obsData?.puntosAnclajeTotal    ?? '',
        puntosAnclajeSinAnclar: juego.obsData?.puntosAnclajeSinAnclar ?? '',
        cremalleras:           juego.obsData?.cremalleras           ?? '',
        obsDinamizador:        juego.obsData?.observacionesDinamizador ?? '',
        obsCliente:            juego.obsData?.observacionesCliente  ?? '',
      }
    }

    // Build checklist state
    const initialState = {}
    for (const juego of res.juegos ?? []) {
      initialState[juego.id] = {}
      for (const [aspectoId, completado] of Object.entries(juego.state ?? {})) {
        initialState[juego.id][Number(aspectoId)] = completado
      }
    }
    state.value = initialState

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
  border: 3px solid #E2E8F0; border-top-color: #27C8D8;
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
  background: linear-gradient(160deg, #138E9C 0%, #27C8D8 100%);
  padding: 20px 20px 24px;
  color: #fff;
}
.cl-logo-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; }
.cl-logo     { font-size: 20px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
.cl-logo-sub { font-size: 10px; color: #8EEAF3; letter-spacing: 3px; text-transform: uppercase; }
.cl-event-num  { font-size: 11px; font-weight: 600; color: #8EEAF3; letter-spacing: 0.5px; margin-bottom: 4px; }
.cl-event-name { font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 6px; line-height: 1.3; }
.cl-event-meta { font-size: 12px; color: #A7EEF5; display: flex; flex-wrap: wrap; gap: 4px; }
.cl-meta-dot   { color: #5DD8E5; }

/* Progress */
.cl-progress-wrap { margin-top: 16px; }
.cl-progress-bar {
  height: 8px; background: rgba(255,255,255,0.2); border-radius: 99px; overflow: hidden; margin-bottom: 6px;
}
.cl-progress-fill {
  height: 100%; background: #5DD8E5; border-radius: 99px;
  transition: width 0.4s ease; min-width: 0;
}
.cl-progress-done { background: #34D399; }
.cl-progress-label { display: flex; justify-content: space-between; }
.cl-progress-count { font-size: 12px; color: #A7EEF5; }
.cl-progress-pct   { font-size: 13px; font-weight: 700; color: #5DD8E5; }
.cl-pct-done       { color: #34D399; }

/* Body */
.cl-body { padding: 16px; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }

/* Sección colapsable */
.cl-section {
  background: #fff; border-radius: 14px; border: 1.5px solid #E2E8F0;
  overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.cl-section-header {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 14px 14px; cursor: pointer; background: none; border: none;
  text-align: left; -webkit-tap-highlight-color: transparent;
}
.cl-section-header:active { background: #F8FAFC; }
.cl-section-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.cl-dot-ok      { background: #16A34A; }
.cl-dot-pending { background: #D1D5DB; }
.cl-section-title {
  flex: 1; font-size: 14px; font-weight: 600; color: #0F172A;
}
.cl-section-badge {
  font-size: 11px; font-weight: 600; color: #16A34A;
  background: #DCFCE7; padding: 2px 8px; border-radius: 99px;
}
.cl-chevron { color: #94A3B8; transition: transform 0.2s; flex-shrink: 0; }
.cl-chevron.open { transform: rotate(90deg); }

/* Formulario dentro de sección */
.cl-section-body {
  padding: 4px 14px 16px;
  display: flex; flex-direction: column; gap: 12px;
  border-top: 1px solid #F1F5F9;
}
.cl-field { display: flex; flex-direction: column; gap: 4px; }
.cl-label { font-size: 12px; font-weight: 500; color: #64748B; }
.cl-req   { color: #EF4444; }
.cl-input {
  padding: 10px 12px; border-radius: 8px;
  border: 1.5px solid #E2E8F0; font-size: 14px; color: #0F172A;
  background: #F8FAFC; outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}
.cl-input:focus { border-color: #27C8D8; background: #fff; }
.cl-textarea {
  padding: 10px 12px; border-radius: 8px;
  border: 1.5px solid #E2E8F0; font-size: 14px; color: #0F172A;
  background: #F8FAFC; outline: none; resize: vertical;
  transition: border-color 0.15s; font-family: inherit;
}
.cl-textarea:focus { border-color: #27C8D8; background: #fff; }
.cl-input-readonly {
  background: #F1F5F9; color: #64748B; cursor: default;
  user-select: text;
}
.cl-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='%2394A3B8'%3E%3Cpath d='M7 7l3 3 3-3'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }

/* Fotos */
.cl-photos-label { font-size: 12px; font-weight: 500; color: #64748B; margin: 0 0 8px; }
.cl-photos-existing { margin-bottom: 16px; }
.cl-photos-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.cl-photo-slot {
  aspect-ratio: 1; border-radius: 10px; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
}
.cl-photo-empty {
  border: 2px dashed #D1D5DB; background: #F8FAFC;
}
.cl-photo-empty:active { background: #F1F5F9; }
.cl-photo-filled { border: 2px solid #E2E8F0; }
.cl-photo-filled img { width: 100%; height: 100%; object-fit: cover; }
.cl-photo-thumb {
  aspect-ratio: 1; border-radius: 10px; overflow: hidden;
  display: block; border: 2px solid #E2E8F0;
}
.cl-photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
.cl-photo-plus { font-size: 28px; color: #94A3B8; line-height: 1; }
.cl-photo-hint { font-size: 10px; color: #CBD5E1; margin-top: 2px; }
.cl-file-native { position: absolute; opacity: 0; width: 0; height: 0; }
.cl-photo-remove {
  position: absolute; top: 4px; right: 4px;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(0,0,0,0.55); color: #fff;
  border: none; cursor: pointer; font-size: 14px; line-height: 1;
  display: flex; align-items: center; justify-content: center;
}

/* Botón guardar */
.cl-submit-btn {
  width: 100%; padding: 14px;
  background: #27C8D8; color: #fff;
  border: none; border-radius: 12px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.15s;
  margin-top: 4px;
}
.cl-submit-btn:hover:not(:disabled) { background: #138E9C; }
.cl-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.cl-submit-hint {
  font-size: 12px; color: #EF4444; text-align: center; margin: -4px 0 0;
}

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
.cl-jicon-pending { background: #E0F9FA; }
.cl-jicon-num     { font-size: 11px; font-weight: 700; color: #27C8D8; }

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
.cl-badge-blue  { background: #CCEFF2; color: #27C8D8; }

.cl-juego-chevron { color: #94A3B8; transition: transform 0.2s; }
.cl-juego-chevron.open { transform: rotate(90deg); }

.cl-juego-bar-bg  { height: 3px; background: #F1F5F9; margin: 0 14px 2px; }
.cl-juego-bar-fill { height: 100%; background: #5DD8E5; border-radius: 99px; transition: width 0.3s ease; }

.cl-aspectos { border-top: 1px solid #F1F5F9; padding: 8px 0; }
.cl-juego-obs {
  padding: 10px 14px 10px; border-top: 1px solid #F1F5F9;
  display: flex; flex-direction: column; gap: 6px;
}

/* Bloque anclajes por juego */
.cl-anclajes-block {
  padding: 12px 14px 14px;
  border-top: 2px solid #E0F9FA;
  background: #F8FAFC;
  display: flex; flex-direction: column; gap: 10px;
}
.cl-anclajes-heading {
  font-size: 10px; font-weight: 700; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.7px;
}
.cl-anclajes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.cl-anclaje-field {
  display: flex; flex-direction: column; gap: 4px;
}
.cl-anclaje-label {
  font-size: 10px; font-weight: 500; color: #64748B;
  line-height: 1.3; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.cl-anclaje-input {
  padding: 9px 10px; border-radius: 8px;
  border: 1.5px solid #E2E8F0; font-size: 15px; font-weight: 600;
  color: #0F172A; background: #fff; outline: none; width: 100%;
  text-align: center; font-family: inherit;
  -moz-appearance: textfield;
}
.cl-anclaje-input:focus { border-color: #27C8D8; background: #fff; }
.cl-anclaje-input::-webkit-inner-spin-button,
.cl-anclaje-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

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

.cl-asp-texto { font-size: 13px; color: #0F172A; line-height: 1.45; flex: 1; }
.cl-asp-texto-done { text-decoration: line-through; color: #94A3B8; }

/* Spinners */
.cl-spin-sm {
  display: inline-block;
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.15); border-top-color: #27C8D8;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
.cl-spin-white {
  border-color: rgba(255,255,255,0.3);
  border-top-color: #fff;
}

/* Empty */
.cl-empty { text-align: center; padding: 40px 16px; color: #94A3B8; font-size: 13px; }

/* Footer */
.cl-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 4px 8px; font-size: 11px; color: #94A3B8;
}
.cl-footer-brand { font-weight: 700; color: #27C8D8; }
.cl-footer-saved { color: #16A34A; font-weight: 600; }

/* Toasts */
.cl-toast {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 999;
  animation: slideUp 0.2s ease;
}
.cl-toast-err { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
.cl-toast-ok  { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
@keyframes slideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(10px) }
  to   { opacity: 1; transform: translateX(-50%) translateY(0) }
}
</style>
