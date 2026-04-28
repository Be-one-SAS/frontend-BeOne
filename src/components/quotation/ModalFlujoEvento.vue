<template>
  <Teleport to="body">
    <Transition name="mfe-fade">
      <div v-if="show" class="mfe-overlay" @click.self="$emit('close')">
        <div class="mfe-card">

          <!-- Header -->
          <div class="mfe-header">
            <div class="mfe-header-body">
              <div class="mfe-header-text">
                <h3 class="mfe-title">
                  {{ event?.description ?? event?.empresa ?? `Evento #${event?.numero}` }}
                </h3>
                <p class="mfe-subtitle">
                  {{ event?.cliente?.name ?? event?.empresa ?? '—' }}
                  <span v-if="eventDate"> · {{ eventDate }}</span>
                </p>
              </div>
              <div class="mfe-header-meta">
                <span class="mfe-status-badge" :class="statusCls">{{ statusLabel }}</span>
                <span class="mfe-pct-big" :class="pctColorCls">{{ progress }}%</span>
              </div>
            </div>
            <button class="mfe-close" @click="$emit('close')"><X :size="18" /></button>
          </div>

          <div class="mfe-body">

            <!-- ── Stepper ── -->
            <div class="mfe-stepper">
              <template v-for="(step, i) in steps" :key="step.key">
                <div class="mfe-step" :class="stepCls(i)">
                  <div class="mfe-circle">
                    <Check v-if="stepIndex > i" :size="13" />
                    <span v-else-if="stepIndex === i" class="mfe-pulse-dot" />
                    <span v-else class="mfe-step-num">{{ i + 1 }}</span>
                  </div>
                  <div class="mfe-step-label">{{ step.label }}</div>
                  <div v-if="step.date" class="mfe-step-date">{{ fmtDate(step.date) }}</div>
                </div>
                <div
                  v-if="i < steps.length - 1"
                  class="mfe-connector"
                  :class="{ 'mfe-connector--filled': stepIndex > i }"
                />
              </template>
            </div>

            <!-- ── Barra de preparación ── -->
            <div class="mfe-prog-block">
              <div class="mfe-prog-header">
                <span class="mfe-prog-title">Preparación del evento</span>
                <span class="mfe-prog-pct" :class="pctColorCls">{{ progress }}%</span>
              </div>
              <div class="mfe-track">
                <div
                  class="mfe-fill"
                  :class="[pctFillCls, { 'mfe-fill--complete': progress === 100 }]"
                  :style="{ width: progress + '%' }"
                />
              </div>
            </div>

            <!-- ── Indicadores ── -->
            <div class="mfe-ind-list">
              <div v-for="ind in indicators" :key="ind.key" class="mfe-ind-row">
                <div class="mfe-ind-icon" :class="ind.done ? 'ind-ok' : 'ind-no'">
                  <Check v-if="ind.done" :size="12" />
                  <X v-else :size="12" />
                </div>
                <div class="mfe-ind-info">
                  <span class="mfe-ind-label" :class="{ 'mfe-ind-done': ind.done }">{{ ind.label }}</span>
                </div>
                <div class="mfe-ind-right">
                  <span class="mfe-ind-weight">{{ ind.weight }}%</span>
                  <button v-if="!ind.done && ind.cta" class="mfe-cta" @click="ind.action?.()">
                    {{ ind.cta }}
                  </button>
                  <span v-else-if="!ind.done && ind.nodata" class="mfe-nodata">No configurado</span>
                </div>
              </div>
            </div>

            <!-- ── Cierre del evento ── -->
            <div class="mfe-post">
              <div class="mfe-post-title">Cierre del evento</div>
              <div class="mfe-post-items">
                <div v-for="pc in postChecks" :key="pc.key" class="mfe-post-row">
                  <span class="mfe-post-dot" :class="pc.done ? 'post-ok' : 'post-off'" />
                  <span :class="{ 'mfe-post-done': pc.done }">{{ pc.label }}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { X, Check } from 'lucide-vue-next'

const props = defineProps({ show: Boolean, event: Object })
const emit  = defineEmits(['close', 'open-team'])

// ── Stepper ──────────────────────────────────────────────
const steps = [
  { key: 'cotizacion',  label: 'Cotización',    dateKey: 'fechaCotizacion' },
  { key: 'confirmada',  label: 'Confirmada',    dateKey: null },
  { key: 'preparacion', label: 'En preparación', dateKey: null },
  { key: 'ejecucion',   label: 'En ejecución',  dateKey: '_eventStart' },
  { key: 'finalizada',  label: 'Finalizada',    dateKey: '_teardown' },
].map(s => ({
  ...s,
  get date() {
    if (s.dateKey === 'fechaCotizacion') return props.event?.fechaCotizacion
    if (s.dateKey === '_eventStart')     return props.event?.operationWindow?.eventStartAt
    if (s.dateKey === '_teardown')       return props.event?.operationWindow?.teardownEndAt
    return null
  },
}))

const stepIndex = computed(() => {
  const op  = props.event?.estadoOperativo
  const fin = props.event?.eventoFinalizado
  if (fin || op === 'EJECUTADO') return 5
  if (op === 'EN CURSO')         return 3
  if (op === 'RESERVA')          return 2
  if (props.event?.quotationStatus?.name === 'Aprobada') return 1
  return 0
})

const stepCls = (i) => ({
  'mfe-step--done':    stepIndex.value > i,
  'mfe-step--active':  stepIndex.value === i,
  'mfe-step--pending': stepIndex.value < i,
})

// ── Indicadores ──────────────────────────────────────────
const indicators = computed(() => {
  const ev = props.event
  return [
    {
      key: 'coord',     label: 'Coordinador asignado',           weight: 20,
      done: (ev?.coordinadores?.length ?? 0) > 0,
      cta: 'Asignar', action: () => emit('open-team'),
    },
    {
      key: 'equipo',    label: 'Equipo de apoyo asignado',       weight: 15,
      done: (ev?.members?.length ?? 0) > 0,
      cta: 'Asignar', action: () => emit('open-team'),
    },
    {
      key: 'material',  label: 'Lista de material validada',     weight: 20,
      done: !!ev?.listadoMaterial,
      cta: null,
    },
    {
      key: 'planilla',  label: 'Planilla de ejecución lista',    weight: 20,
      done: !!ev?.planillaEjecucion,
      cta: null,
    },
    {
      key: 'pago',      label: 'Estado administrativo confirmado', weight: 25,
      done: ev?.estadoAdministrativo === 'Pagada' || ev?.estadoAdministrativo === 'Facturada',
      cta: null,
      nodata: !ev?.estadoAdministrativo,
    },
  ]
})

const progress = computed(() =>
  indicators.value.filter(i => i.done).reduce((s, i) => s + i.weight, 0)
)

const postChecks = computed(() => [
  { key: 'encuesta', label: 'Encuesta completada',       done: !!props.event?.encuesta },
  { key: 'foto',     label: 'Registro fotográfico',      done: !!props.event?.registroFotografico },
  { key: 'final',    label: 'Evento marcado finalizado', done: !!props.event?.eventoFinalizado },
])

// ── Helpers ──────────────────────────────────────────────
const eventDate = computed(() =>
  fmtDate(props.event?.operationWindow?.eventStartAt)
)

const statusLabel = computed(() =>
  props.event?.estadoOperativo ?? props.event?.quotationStatus?.name ?? '—'
)

const statusCls = computed(() => {
  const op  = props.event?.estadoOperativo
  const sn  = props.event?.quotationStatus?.name
  if (op === 'EJECUTADO' || props.event?.eventoFinalizado) return 'badge-green'
  if (op === 'EN CURSO')   return 'badge-blue'
  if (op === 'RESERVA')    return 'badge-yellow'
  if (sn === 'Aprobada')   return 'badge-orange'
  return 'badge-gray'
})

const pctColorCls = computed(() => {
  const p = progress.value
  if (p === 100) return 'pct-green'
  if (p >= 80)   return 'pct-blue'
  if (p >= 41)   return 'pct-amber'
  return 'pct-red'
})

const pctFillCls = computed(() => {
  const p = progress.value
  if (p === 100) return 'fill-green'
  if (p >= 80)   return 'fill-blue'
  if (p >= 41)   return 'fill-amber'
  return 'fill-red'
})

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : null
</script>

<style scoped>
.mfe-overlay {
  position: fixed; inset: 0;
  background: rgba(15,26,46,.45);
  backdrop-filter: blur(6px);
  z-index: 1200;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.mfe-card {
  background: #fff;
  border-radius: 20px;
  width: 100%; max-width: 620px;
  max-height: 92vh;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(15,26,46,.22);
  overflow: hidden;
}

/* Header */
.mfe-header {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 18px 20px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}
.mfe-header-body { flex: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; min-width: 0; }
.mfe-header-text { min-width: 0; }
.mfe-title { font-family: 'Plus Jakarta Sans',sans-serif; font-size: 15px; font-weight: 700; color: #0F1A2E; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; }
.mfe-subtitle { font-size: 11px; color: #94A3B8; margin: 0; }
.mfe-header-meta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.mfe-pct-big { font-family: 'JetBrains Mono',monospace; font-size: 20px; font-weight: 800; }
.mfe-close { background: none; border: none; color: #94A3B8; cursor: pointer; padding: 4px; border-radius: 50%; transition: all .2s; flex-shrink: 0; }
.mfe-close:hover { background: #F1F5F9; color: #0F1A2E; }

/* Status badge */
.mfe-status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge-yellow { background: #FEFCE8; color: #854D0E; }
.badge-blue   { background: #EFF6FF; color: #1D4ED8; }
.badge-green  { background: #F0FDF4; color: #166534; }
.badge-orange { background: #FFF7ED; color: #C2410C; }
.badge-gray   { background: #F1F5F9; color: #64748B; }

/* Body */
.mfe-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 24px; }

/* Stepper */
.mfe-stepper {
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 4px;
}

.mfe-step {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px; min-width: 80px; flex-shrink: 0;
}

.mfe-circle {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  transition: all .2s;
  position: relative;
}

.mfe-step--done .mfe-circle   { background: #054EAF; color: #fff; }
.mfe-step--active .mfe-circle  { background: #fff; border: 2px solid #054EAF; color: #054EAF; }
.mfe-step--pending .mfe-circle { background: #F1F5F9; border: 2px solid #E2E8F0; color: #94A3B8; }

.mfe-pulse-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #054EAF;
  animation: pulse-step .9s ease-in-out infinite;
}
@keyframes pulse-step {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.4); opacity: .7; }
}

.mfe-step-num { font-size: 11px; font-weight: 700; }

.mfe-step-label {
  font-size: 10px; font-weight: 600;
  color: #64748B; text-align: center;
  white-space: nowrap;
  font-family: 'Inter',sans-serif;
}
.mfe-step--done .mfe-step-label   { color: #054EAF; }
.mfe-step--active .mfe-step-label  { color: #0F1A2E; font-weight: 700; }

.mfe-step-date { font-size: 9px; color: #94A3B8; text-align: center; white-space: nowrap; }

.mfe-connector {
  flex: 1; height: 2px;
  background: #E2E8F0;
  margin-top: 14px; /* align with circle center */
  min-width: 16px;
  transition: background .3s;
}
.mfe-connector--filled { background: #054EAF; }

/* Progress bar */
.mfe-prog-block { display: flex; flex-direction: column; gap: 8px; }
.mfe-prog-header { display: flex; align-items: center; justify-content: space-between; }
.mfe-prog-title { font-size: 12px; font-weight: 600; color: #64748B; font-family: 'Inter',sans-serif; }
.mfe-prog-pct { font-family: 'JetBrains Mono',monospace; font-size: 14px; font-weight: 800; }

.mfe-track {
  height: 8px; background: #F1F5F9; border-radius: 999px; overflow: hidden;
}
.mfe-fill {
  height: 100%; border-radius: 999px;
  transition: width .5s ease;
}

.fill-red   { background: linear-gradient(90deg, #F97316, #EF4444); }
.fill-amber { background: linear-gradient(90deg, #F59E0B, #EAB308); }
.fill-blue  { background: linear-gradient(90deg, #3B82F6, #054EAF); }
.fill-green { background: linear-gradient(90deg, #22C55E, #16A34A); }
.mfe-fill--complete { animation: pulse-green 1.5s ease-in-out 2; }
@keyframes pulse-green { 0%,100% { opacity: 1; } 50% { opacity: .75; } }

.pct-red   { color: #EF4444; }
.pct-amber { color: #D97706; }
.pct-blue  { color: #054EAF; }
.pct-green { color: #16A34A; }

/* Indicators */
.mfe-ind-list { display: flex; flex-direction: column; gap: 6px; }

.mfe-ind-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  background: #F8FAFC;
}

.mfe-ind-icon {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ind-ok { background: #F0FDF4; color: #16A34A; }
.ind-no { background: #FEF2F2; color: #DC2626; }

.mfe-ind-info { flex: 1; min-width: 0; }
.mfe-ind-label { font-size: 13px; color: #64748B; font-family: 'Inter',sans-serif; }
.mfe-ind-done  { color: #0F1A2E; font-weight: 500; }

.mfe-ind-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.mfe-ind-weight { font-size: 11px; font-weight: 700; color: #94A3B8; font-family: 'JetBrains Mono',monospace; }

.mfe-cta {
  padding: 4px 12px; background: #EBF3FC; color: #054EAF;
  border: none; border-radius: 6px;
  font-size: 11px; font-weight: 600; font-family: 'Inter',sans-serif;
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.mfe-cta:hover { background: #054EAF; color: #fff; }

.mfe-nodata { font-size: 11px; color: #94A3B8; font-style: italic; white-space: nowrap; }

/* Post-event */
.mfe-post { background: #F8FAFC; border-radius: 12px; padding: 14px 16px; }
.mfe-post-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94A3B8; margin-bottom: 10px; }
.mfe-post-items { display: flex; flex-direction: column; gap: 8px; }
.mfe-post-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748B; font-family: 'Inter',sans-serif; }
.mfe-post-done { color: #0F1A2E; font-weight: 500; }
.mfe-post-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.post-ok  { background: #22C55E; }
.post-off { background: #E2E8F0; }

/* Transition */
.mfe-fade-enter-active, .mfe-fade-leave-active { transition: opacity .2s ease, transform .2s ease; }
.mfe-fade-enter-from, .mfe-fade-leave-to { opacity: 0; transform: scale(.97); }
</style>
