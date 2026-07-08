<template>
  <!-- ── TRIGGER CARDS ────────────────────────────────────────── -->
  <div class="edp-grid">
    <div
      v-for="field in triggerFields"
      :key="field.key"
      class="edp-trigger"
      :class="{ 
        'edp-trigger--error': field.hasError, 
        'edp-trigger--filled': !!field.value,
        'edp-trigger--active': field.isActive
      }"
      @click="openAt(field.step)"
      role="button"
      tabindex="0"
      @keydown.enter="openAt(field.step)"
      @keydown.space.prevent="openAt(field.step)"
    >
      <span class="edp-trigger-icon">{{ field.icon }}</span>
      <span class="edp-trigger-body">
        <span class="edp-trigger-label">{{ field.label }}</span>
        <span class="edp-trigger-value" :class="{ 'edp-trigger-value--ph': !field.value }">
          {{ field.value || field.placeholder }}
        </span>
        <span v-if="field.referencia" class="edp-trigger-referencia">
          <span class="edp-trigger-referencia-label">Evento:</span>
          {{ field.referencia }}
        </span>
      </span>
      <svg class="edp-trigger-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>

  <!-- ── MODAL ─────────────────────────────────────────────────── -->
  <teleport to="body">
    <transition name="edp-modal-fade">
      <div v-if="isOpen" class="edp-overlay">

        <div class="edp-modal">

          <!-- Header -->
          <div class="edp-modal-header">
            <div class="edp-modal-title">
              <span style="font-size:18px">📅</span>
              <span>{{ calendarType === 'montaje' ? 'Operación y Montaje' : 'Calendario del Evento' }}</span>
            </div>
            <button type="button" class="edp-close" @click="cancel" aria-label="Cerrar">×</button>
          </div>

          <!-- Progress bar -->
          <div class="edp-prog-track">
            <div class="edp-prog-fill" :style="{ width: `${(currentStep / 4) * 100}%` }" />
          </div>

          <!-- Steps tabs -->
          <div class="edp-tabs">
            <button
              v-for="(s, idx) in stepDefs"
              :key="s.step"
              type="button"
              class="edp-tab"
              :class="{
                'edp-tab--active': currentStep === s.step,
                'edp-tab--done':   isStepDone(s.step),
              }"
              @click="goTo(s.step)"
            >
              <span class="edp-tab-icon">{{ s.icon }}</span>
              <span class="edp-tab-label">{{ s.label }}</span>
              <span v-if="getReferencia(idx)" class="edp-tab-referencia">
                {{ getReferencia(idx) }}
              </span>
            </button>
          </div>

          <!-- Step body -->
          <div class="edp-body">
            <transition :name="slideDir === 'fwd' ? 'edp-slide-fwd' : 'edp-slide-bwd'" mode="out-in">

              <!-- Paso 1: Fecha inicio -->
              <div v-if="currentStep === 1" key="1" class="edp-step">
                <p class="edp-step-hint">
                  <span v-if="calendarType === 'montaje'">
                    Selecciona la <strong>fecha de inicio del montaje</strong>
                    <span v-if="fechaInicioEvento" class="edp-hint-ref">
                      · Evento: {{ readableDate(fechaInicioEvento) }}
                    </span>
                  </span>
                  <span v-else>Selecciona la <strong>fecha de inicio</strong> del evento</span>
                </p>
                <EventCalendarPicker
                  v-model="lFechaInicio"
                  :highlight-start="lFechaInicio"
                  :highlight-end="lFechaFin"
                  :disable-past="true"
                />
              </div>

              <!-- Paso 2: Hora inicio -->
              <div v-else-if="currentStep === 2" key="2" class="edp-step">
                <p class="edp-step-hint">
                  <span v-if="calendarType === 'montaje'">
                    Selecciona la <strong>hora de inicio del montaje</strong>
                    <span v-if="horaInicioEvento" class="edp-hint-ref">
                      · Evento: {{ readableTime(horaInicioEvento) }}
                    </span>
                  </span>
                  <span v-else>Selecciona la <strong>hora de inicio</strong> del evento</span>
                </p>
                <EventTimeDrum v-model="lHoraInicio" />
              </div>

              <!-- Paso 3: Fecha fin -->
              <div v-else-if="currentStep === 3" key="3" class="edp-step">
                <p class="edp-step-hint">
                  <span v-if="calendarType === 'montaje'">
                    Selecciona la <strong>fecha de fin del montaje</strong>
                    <span v-if="fechaFinEvento" class="edp-hint-ref">
                      · Evento: {{ readableDate(fechaFinEvento) }}
                    </span>
                  </span>
                  <span v-else>Selecciona la <strong>fecha de fin</strong> del evento</span>
                </p>
                <EventCalendarPicker
                  v-model="lFechaFin"
                  :highlight-start="lFechaInicio"
                  :highlight-end="lFechaFin"
                  :min-date="lFechaInicio"
                  :disable-past="true"
                />
              </div>

              <!-- Paso 4: Hora fin -->
              <div v-else-if="currentStep === 4" key="4" class="edp-step">
                <p class="edp-step-hint">
                  <span v-if="calendarType === 'montaje'">
                    Selecciona la <strong>hora de fin del montaje</strong>
                    <span v-if="horaFinEvento" class="edp-hint-ref">
                      · Evento: {{ readableTime(horaFinEvento) }}
                    </span>
                  </span>
                  <span v-else>Selecciona la <strong>hora de fin</strong> del evento</span>
                </p>
                <EventTimeDrum v-model="lHoraFin" />
              </div>

            </transition>
          </div>

          <!-- Validation feedback -->
          <div class="edp-feedback">
            <transition name="edp-fade">
              <div v-if="errors.length" class="edp-feedback-block edp-feedback-block--error">
                <p v-for="e in errors" :key="e" class="edp-feedback-line">❌ {{ e }}</p>
              </div>
            </transition>
            <transition name="edp-fade">
              <div v-if="!errors.length && warnings.length" class="edp-feedback-block edp-feedback-block--warn">
                <p v-for="w in warnings" :key="w" class="edp-feedback-line">⚠️ {{ w }}</p>
                <label class="edp-confirm-check">
                  <input type="checkbox" v-model="warningsOk" />
                  <span>Sí, estoy seguro</span>
                </label>
              </div>
            </transition>
            <transition name="edp-fade">
              <div v-if="!errors.length && !warnings.length && allFilled" class="edp-feedback-block edp-feedback-block--ok">
                ✅ Fechas válidas — Duración: {{ durationText }}
              </div>
            </transition>
          </div>

          <!-- Summary -->
          <transition name="edp-fade">
            <div v-if="allFilled" class="edp-summary">
              <div class="edp-summary-row">
                <span class="edp-summary-item">
                  <span class="edp-dot edp-dot--start" />
                  <span>{{ readableDate(lFechaInicio) }}</span>
                  <span class="edp-summary-time">{{ lHoraInicio || '—' }}</span>
                </span>
                <span class="edp-summary-arrow">→</span>
                <span class="edp-summary-item">
                  <span class="edp-dot edp-dot--end" />
                  <span>{{ readableDate(lFechaFin) }}</span>
                  <span class="edp-summary-time">{{ lHoraFin || '—' }}</span>
                </span>
              </div>
            </div>
          </transition>

          <!-- Footer -->
          <div class="edp-footer">
            <button type="button" class="edp-btn edp-btn--cancel" @click="cancel">
              Cancelar
            </button>
            <div class="edp-footer-nav">
              <button v-if="currentStep > 1" type="button" class="edp-btn edp-btn--prev" @click="prevStep">
                ← Anterior
              </button>
              <button v-if="currentStep < 4" type="button" class="edp-btn edp-btn--next" @click="nextStep">
                Siguiente →
              </button>
              <button
                v-if="currentStep === 4"
                type="button"
                class="edp-btn edp-btn--confirm"
                :disabled="!canConfirm"
                @click="confirm"
              >
                Confirmar ✓
              </button>
            </div>
          </div>

        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import EventCalendarPicker from './EventCalendarPicker.vue'
import EventTimeDrum       from './EventTimeDrum.vue'

const props = defineProps({
  fechaInicio: { type: String, default: '' },
  horaInicio:  { type: String, default: '' },
  fechaFin:    { type: String, default: '' },
  horaFin:     { type: String, default: '' },
  // Para modo Montaje: mostrar fechas del evento como referencia
  fechaInicioEvento: { type: String, default: '' },
  horaInicioEvento:  { type: String, default: '' },
  fechaFinEvento:    { type: String, default: '' },
  horaFinEvento:     { type: String, default: '' },
  // Tipo de calendario: 'evento' o 'montaje'
  calendarType: { type: String, default: 'evento' },
})

const emit = defineEmits([
  'update:fechaInicio',
  'update:horaInicio',
  'update:fechaFin',
  'update:horaFin',
])

// ── Local state ──────────────────────────────────────────────
const isOpen      = ref(false)
const currentStep = ref(1)
const slideDir    = ref('fwd')
const warningsOk  = ref(false)

// Working copies (only committed on confirm)
const lFechaInicio = ref('')
const lHoraInicio  = ref('09:00')
const lFechaFin    = ref('')
const lHoraFin     = ref('18:00')

// ── Step definitions ─────────────────────────────────────────
const stepDefs = computed(() => [
  { step: 1, icon: '🟢', label: props.calendarType === 'montaje' ? 'Fecha inicio montaje' : 'Fecha inicio' },
  { step: 2, icon: '⏰', label: props.calendarType === 'montaje' ? 'Hora inicio montaje' : 'Hora inicio' },
  { step: 3, icon: '🔴', label: props.calendarType === 'montaje' ? 'Fecha fin montaje' : 'Fecha fin' },
  { step: 4, icon: '⏰', label: props.calendarType === 'montaje' ? 'Hora fin montaje' : 'Hora fin' },
])

const isStepDone = (s) => {
  // Solo marca como "done" el paso actual si tiene valor
  if (s !== currentStep.value) return false
  if (s === 1) return !!lFechaInicio.value
  if (s === 2) return !!lHoraInicio.value
  if (s === 3) return !!lFechaFin.value
  if (s === 4) return !!lHoraFin.value
  return false
}

// Obtener referencia del evento para cada paso (solo en modo montaje)
const getReferencia = (idx) => {
  if (props.calendarType !== 'montaje') return null
  if (idx === 0 && props.fechaInicioEvento) return `Evento: ${readableDate(props.fechaInicioEvento)}`
  if (idx === 1 && props.horaInicioEvento) return `Evento: ${readableTime(props.horaInicioEvento)}`
  if (idx === 2 && props.fechaFinEvento) return `Evento: ${readableDate(props.fechaFinEvento)}`
  if (idx === 3 && props.horaFinEvento) return `Evento: ${readableTime(props.horaFinEvento)}`
  return null
}

// ── Open / close ─────────────────────────────────────────────
const openAt = (step) => {
  lFechaInicio.value = props.fechaInicio || ''
  lHoraInicio.value  = props.horaInicio  || '09:00'
  lFechaFin.value    = props.fechaFin    || ''
  lHoraFin.value     = props.horaFin     || '18:00'
  warningsOk.value   = false
  currentStep.value  = step
  isOpen.value       = true
}
const cancel = () => { isOpen.value = false }

const confirm = () => {
  if (!canConfirm.value) return
  emit('update:fechaInicio', lFechaInicio.value)
  emit('update:horaInicio',  lHoraInicio.value)
  emit('update:fechaFin',    lFechaFin.value)
  emit('update:horaFin',     lHoraFin.value)
  isOpen.value = false
}

// ── Navigation ───────────────────────────────────────────────
const goTo = (s) => {
  slideDir.value  = s > currentStep.value ? 'fwd' : 'bwd'
  currentStep.value = s
}
const nextStep = () => {
  if (currentStep.value < 4) goTo(currentStep.value + 1)
}
const prevStep = () => {
  if (currentStep.value > 1) goTo(currentStep.value - 1)
}

// ── Helpers ──────────────────────────────────────────────────
const readableDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  }).replace(/^\w/, c => c.toUpperCase())
}

const readableTime = (t) => {
  if (!t) return ''
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr)
  const m = mStr || '00'
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2,'0')}:${m} ${period}`
}

const allFilled = computed(() =>
  !!(lFechaInicio.value && lHoraInicio.value && lFechaFin.value && lHoraFin.value)
)

// Duration in ms
const durationMs = computed(() => {
  if (!allFilled.value) return 0
  const start = new Date(`${lFechaInicio.value}T${lHoraInicio.value}:00`)
  const end   = new Date(`${lFechaFin.value}T${lHoraFin.value}:00`)
  return end - start
})

const durationText = computed(() => {
  const ms = durationMs.value
  if (ms <= 0) return '—'
  const totalH = Math.floor(ms / 3_600_000)
  const days   = Math.floor(totalH / 24)
  const hours  = totalH % 24
  const parts  = []
  if (days > 0)  parts.push(`${days} día${days > 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`)
  return parts.join(' y ') || 'menos de 1 hora'
})

// ── Validation ───────────────────────────────────────────────
const today = new Date(); today.setHours(0, 0, 0, 0)

const errors = computed(() => {
  const errs = []
  if (!allFilled.value) return errs

  const startDt = new Date(`${lFechaInicio.value}T${lHoraInicio.value}:00`)
  const endDt   = new Date(`${lFechaFin.value}T${lHoraFin.value}:00`)
  const startD  = new Date(lFechaInicio.value + 'T00:00:00')

  if (startD < today)
    errs.push('La fecha de inicio no puede ser en el pasado')
  if (endDt <= startDt)
    errs.push('La fecha/hora de fin debe ser posterior a la de inicio')

  return errs
})

const warnings = computed(() => {
  if (errors.value.length || !allFilled.value) return []
  const wrns = []
  const days = durationMs.value / 86_400_000
  if (days > 30)
    wrns.push(`El evento dura más de 30 días (${Math.ceil(days)} días), ¿estás seguro?`)
  if (durationMs.value < 3_600_000)
    wrns.push('El evento dura menos de 1 hora, ¿estás seguro?')
  return wrns
})

const canConfirm = computed(() => {
  if (!allFilled.value)  return false
  if (errors.value.length) return false
  if (warnings.value.length && !warningsOk.value) return false
  return true
})

// ── Trigger cards ────────────────────────────────────────────
const triggerFields = computed(() => {
  const isMontaje = props.calendarType === 'montaje'
  const baseLabel = isMontaje ? 'Montaje' : 'Evento'
  
  return [
    {
      key: 'fi', step: 1, icon: '📅',
      label: `Fecha Inicio ${baseLabel}`,
      placeholder: `Seleccionar fecha de inicio`,
      value: props.fechaInicio ? readableDate(props.fechaInicio) : '',
      hasError: false,
      isActive: currentStep.value === 1,
      // Referencia al evento si es montaje
      referencia: isMontaje && props.fechaInicioEvento ? readableDate(props.fechaInicioEvento) : null,
    },
    {
      key: 'hi', step: 2, icon: '🕐',
      label: `Horario de Inicio ${baseLabel}`,
      placeholder: `Seleccionar hora de inicio`,
      value: props.horaInicio ? readableTime(props.horaInicio) : '',
      hasError: false,
      isActive: currentStep.value === 2,
      referencia: isMontaje && props.horaInicioEvento ? readableTime(props.horaInicioEvento) : null,
    },
    {
      key: 'ff', step: 3, icon: '📅',
      label: `Fecha Fin ${baseLabel}`,
      placeholder: `Seleccionar fecha de fin`,
      value: props.fechaFin ? readableDate(props.fechaFin) : '',
      hasError: false,
      isActive: currentStep.value === 3,
      referencia: isMontaje && props.fechaFinEvento ? readableDate(props.fechaFinEvento) : null,
    },
    {
      key: 'hf', step: 4, icon: '🕐',
      label: `Horario de Finalización ${baseLabel}`,
      placeholder: `Seleccionar hora de fin`,
      value: props.horaFin ? readableTime(props.horaFin) : '',
      hasError: false,
      isActive: currentStep.value === 4,
      referencia: isMontaje && props.horaFinEvento ? readableTime(props.horaFinEvento) : null,
    },
  ]
})
</script>

<style scoped>
/* ── Trigger grid ──────────────────────────────────────────── */
.edp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 768px) {
  .edp-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .edp-grid { grid-template-columns: 1fr; }
}

.edp-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.18s ease;
  min-width: 0;
  text-align: left;
}
.edp-trigger:hover {
  border-color: #27C8D8;
  background: #F0FAFB;
  box-shadow: 0 2px 8px rgba(39,200,216,0.1);
}
.edp-trigger--error {
  border-color: #FCA5A5;
  background: #FFF5F5;
}
.edp-trigger--filled {
  border-color: #A7EEF5;
}
.edp-trigger--active {
  border-color: #27C8D8;
  background: #F0FAFB;
  box-shadow: 0 2px 8px rgba(39,200,216,0.15);
}

.edp-trigger-icon {
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1;
}

.edp-trigger-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.edp-trigger-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edp-trigger-value {
  font-size: 13px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.edp-trigger-value--ph {
  color: #94A3B8;
  font-weight: 400;
  font-style: italic;
}
.edp-trigger-referencia {
  font-size: 10px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.edp-trigger-referencia-label {
  font-weight: 600;
  color: #27C8D8;
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: 0.03em;
  margin-right: 4px;
}

.edp-trigger-chevron {
  color: #94A3B8;
  flex-shrink: 0;
  transition: color 0.15s;
}
.edp-trigger:hover .edp-trigger-chevron { color: #27C8D8; }

/* ── Overlay ─────────────────────────────────────────────────── */
.edp-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(15, 26, 46, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

/* ── Modal ───────────────────────────────────────────────────── */
.edp-modal {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(39,200,216,0.18), 0 2px 8px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #EEF1F7;
}
@media (max-width: 560px) {
  .edp-overlay { padding: 0; align-items: flex-end; }
  .edp-modal {
    border-radius: 20px 20px 0 0;
    max-height: 95vh;
    max-width: 100%;
  }
}

/* ── Modal header ──────────────────────────────────────────── */
.edp-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}
.edp-modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.edp-close {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #F1F5F9;
  border: none;
  font-size: 18px;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  line-height: 1;
}
.edp-close:hover { background: #FEE2E2; color: #B91C1C; }

/* ── Progress bar ─────────────────────────────────────────── */
.edp-prog-track {
  height: 3px;
  background: #EEF1F7;
  margin: 16px 24px 0;
  border-radius: 99px;
  overflow: hidden;
}
.edp-prog-fill {
  height: 100%;
  background: #27C8D8;
  border-radius: 99px;
  transition: width 0.35s ease;
}

/* ── Step tabs ────────────────────────────────────────────── */
.edp-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px 0;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.edp-tabs::-webkit-scrollbar { display: none; }

.edp-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 72px;
  flex: 1;
}
.edp-tab:hover { background: #F8FAFC; }
.edp-tab--active {
  background: #F0FAFB;
  border-color: #A7EEF5;
}
.edp-tab--done {
  background: #F0FDF4;
  border-color: #BBF7D0;
}
.edp-tab-icon { font-size: 14px; }
.edp-tab-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
.edp-tab--active .edp-tab-label { color: #27C8D8; }
.edp-tab--done   .edp-tab-label { color: #16A34A; }
.edp-tab-referencia {
  font-size: 9px;
  color: #27C8D8;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  margin-top: 2px;
  white-space: nowrap;
}

/* ── Step body ────────────────────────────────────────────── */
.edp-body {
  padding: 16px 24px 0;
  min-height: 320px;
  display: flex;
  flex-direction: column;
}
.edp-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.edp-step-hint {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
}
.edp-step-hint strong { color: #0F1A2E; }
.edp-hint-ref {
  color: #27C8D8;
  font-weight: 500;
  font-size: 12px;
}

/* ── Feedback ─────────────────────────────────────────────── */
.edp-feedback {
  padding: 10px 24px 0;
  min-height: 32px;
}
.edp-feedback-block {
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 12.5px;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.edp-feedback-block--error {
  background: #FFF5F5;
  border: 1px solid #FCA5A5;
  color: #B91C1C;
}
.edp-feedback-block--warn {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  color: #92400E;
}
.edp-feedback-block--ok {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  color: #15803D;
  font-weight: 600;
}
.edp-feedback-line { margin: 0; }

.edp-confirm-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  cursor: pointer;
  font-weight: 600;
}
.edp-confirm-check input { cursor: pointer; accent-color: #27C8D8; }

/* ── Summary ─────────────────────────────────────────────── */
.edp-summary {
  margin: 10px 24px 0;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 12px;
  padding: 10px 16px;
}
.edp-summary-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.edp-summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  color: #0F1A2E;
  flex-shrink: 0;
}
.edp-summary-time {
  font-weight: 700;
  color: #27C8D8;
}
.edp-summary-arrow {
  color: #94A3B8;
  font-size: 16px;
  font-weight: 300;
}
.edp-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.edp-dot--start { background: #16A34A; }
.edp-dot--end   { background: #DC2626; }

/* ── Footer ──────────────────────────────────────────────── */
.edp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 20px;
  border-top: 1px solid #EEF1F7;
  margin-top: 16px;
  gap: 8px;
}
.edp-footer-nav {
  display: flex;
  gap: 8px;
}

.edp-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
  white-space: nowrap;
}
.edp-btn--cancel  { background: #F1F5FA; color: #64748B; }
.edp-btn--cancel:hover { background: #E5EAF0; }
.edp-btn--prev    { background: #F1F5FA; color: #0F1A2E; }
.edp-btn--prev:hover { background: #E5EAF0; }
.edp-btn--next    { background: #F0FAFB; color: #27C8D8; border: 1px solid #A7EEF5; }
.edp-btn--next:hover { background: #CCEFF2; }
.edp-btn--confirm { background: #27C8D8; color: white; box-shadow: 0 2px 8px rgba(39,200,216,0.22); }
.edp-btn--confirm:hover:not(:disabled) { background: #1BAEBB; }
.edp-btn--confirm:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Animations ──────────────────────────────────────────── */
.edp-modal-fade-enter-active { transition: all 0.25s ease-out; }
.edp-modal-fade-leave-active { transition: all 0.18s ease-in; }
.edp-modal-fade-enter-from   { opacity: 0; }
.edp-modal-fade-leave-to     { opacity: 0; }
.edp-modal-fade-enter-from .edp-modal { transform: translateY(16px) scale(0.97); }
.edp-modal-fade-leave-to   .edp-modal { transform: translateY(8px)  scale(0.98); }

.edp-slide-fwd-enter-active,
.edp-slide-fwd-leave-active,
.edp-slide-bwd-enter-active,
.edp-slide-bwd-leave-active { transition: all 0.22s ease; }
.edp-slide-fwd-enter-from { transform: translateX(28px); opacity: 0; }
.edp-slide-fwd-leave-to   { transform: translateX(-28px); opacity: 0; }
.edp-slide-bwd-enter-from { transform: translateX(-28px); opacity: 0; }
.edp-slide-bwd-leave-to   { transform: translateX(28px); opacity: 0; }

.edp-fade-enter-active,
.edp-fade-leave-active { transition: opacity 0.2s ease; }
.edp-fade-enter-from,
.edp-fade-leave-to     { opacity: 0; }
</style>
