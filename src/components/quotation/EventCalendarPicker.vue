<template>
  <div class="ecp-wrap">
    <!-- Header navegación -->
    <div class="ecp-header">
      <button type="button" class="ecp-nav" @click="prev">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="ecp-month-label">{{ monthLabel }}</span>
      <button type="button" class="ecp-nav" @click="next">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <!-- Días de la semana -->
    <div class="ecp-weekdays">
      <div v-for="d in ['Do','Lu','Ma','Mi','Ju','Vi','Sa']" :key="d" class="ecp-wd">{{ d }}</div>
    </div>

    <!-- Grid días con transición slide -->
    <div class="ecp-grid-wrap">
      <transition :name="slideDir === 'next' ? 'cal-slide-next' : 'cal-slide-prev'" mode="out-in">
        <div :key="monthKey" class="ecp-grid">
          <div
            v-for="day in days"
            :key="day.key"
            class="ecp-day"
            :class="getDayClass(day)"
            @click="day.enabled && select(day.iso)"
          >
            <span>{{ day.number }}</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  highlightMontaje: { type: String, default: '' },
  highlightStart: { type: String, default: '' },
  highlightEnd: { type: String, default: '' },
  minDate: { type: String, default: '' },
  disablePast: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const today = new Date()
today.setHours(0, 0, 0, 0)
const todayISO = today.toISOString().split('T')[0]

const viewYear  = ref(today.getFullYear())
const viewMonth = ref(today.getMonth()) // 0-based
const slideDir  = ref('next')

// Sync view to modelValue on first load
watch(() => props.modelValue, (val) => {
  if (val) {
    const d = new Date(val + 'T00:00:00')
    viewYear.value  = d.getFullYear()
    viewMonth.value = d.getMonth()
  }
}, { immediate: true })

const monthKey = computed(() => `${viewYear.value}-${viewMonth.value}`)

const monthLabel = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value, 1)
  return d.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
})

const days = computed(() => {
  const year  = viewYear.value
  const month = viewMonth.value
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const result = []

  const minD = props.minDate ? new Date(props.minDate + 'T00:00:00') : null
  const startH = props.highlightStart ? new Date(props.highlightStart + 'T00:00:00') : null
  const endH   = props.highlightEnd   ? new Date(props.highlightEnd   + 'T00:00:00') : null
  const montH  = props.highlightMontaje ? new Date(props.highlightMontaje + 'T00:00:00') : null

  // Empty slots before first day
  for (let i = 0; i < first.getDay(); i++) {
    result.push({ key: `e${i}`, number: '', iso: '', enabled: false, empty: true })
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const dt  = new Date(year, month, d)
    const iso = dt.toISOString().split('T')[0]
    let enabled = true
    if (props.disablePast && dt < today) enabled = false
    if (minD && dt < minD) enabled = false

    const isSelected = iso === props.modelValue
    const isToday    = iso === todayISO
    const inRange    = startH && endH && dt > startH && dt < endH
    const isStart    = startH && iso === props.highlightStart
    const isEnd      = endH   && iso === props.highlightEnd
    const isMontaje  = montH  && iso === props.highlightMontaje

    result.push({ key: iso, number: d, iso, enabled, isSelected, isToday, inRange, isStart, isEnd, isMontaje })
  }
  return result
})

const getDayClass = (day) => {
  if (day.empty) return 'ecp-day--empty'
  const cls = []
  if (!day.enabled)   cls.push('ecp-day--disabled')
  if (day.isToday)    cls.push('ecp-day--today')
  if (day.isSelected) cls.push('ecp-day--selected')
  if (day.inRange)    cls.push('ecp-day--range')
  if (day.isMontaje)  cls.push('ecp-day--montaje')
  if (day.isStart)    cls.push('ecp-day--range-start')
  if (day.isEnd)      cls.push('ecp-day--range-end')
  return cls
}

const prev = () => {
  slideDir.value = 'prev'
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
const next = () => {
  slideDir.value = 'next'
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

const select = (iso) => emit('update:modelValue', iso)
</script>

<style scoped>
.ecp-wrap { user-select: none; }

.ecp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.ecp-nav {
  width: 30px; height: 30px;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: white;
  color: #64748B;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.ecp-nav:hover { background: #EBF3FC; color: #054EAF; border-color: #BFDBFE; }

.ecp-month-label {
  font-size: 14px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  text-align: center;
  min-width: 160px;
  text-transform: capitalize;
}

.ecp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.ecp-wd {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 0;
  font-family: 'Inter', sans-serif;
}

.ecp-grid-wrap { overflow: hidden; }
.ecp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.ecp-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  color: #0F1A2E;
  cursor: pointer;
  transition: all 0.12s;
  position: relative;
}
.ecp-day--empty    { pointer-events: none; }
.ecp-day--disabled { color: #CBD5E1; cursor: not-allowed; pointer-events: none; opacity: 0.5; }
.ecp-day:not(.ecp-day--disabled):not(.ecp-day--empty):not(.ecp-day--selected):hover {
  background: #F1F5FA;
}
.ecp-day--today {
  font-weight: 700;
  box-shadow: inset 0 0 0 1.5px #054EAF;
  color: #054EAF;
}
.ecp-day--selected {
  background: #054EAF !important;
  color: white !important;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(5,78,175,0.3);
}
.ecp-day--range {
  background: #EBF3FC;
  border-radius: 0;
}
.ecp-day--montaje {
  background: #F59E0B !important; /* Naranja/amarillo */
  color: white !important;
  border-radius: 8px !important;
  font-weight: 700;
}
.ecp-day--range-start {
  background: #22C55E !important; /* Verde */
  color: white !important;
  border-radius: 8px 0 0 8px !important;
  font-weight: 700;
}
.ecp-day--range-end {
  background: #EF4444 !important; /* Rojo */
  color: white !important;
  border-radius: 0 8px 8px 0 !important;
  font-weight: 700;
}

/* Slide animations */
.cal-slide-next-enter-active,
.cal-slide-next-leave-active,
.cal-slide-prev-enter-active,
.cal-slide-prev-leave-active {
  transition: all 0.2s ease;
}
.cal-slide-next-enter-from { transform: translateX(24px); opacity: 0; }
.cal-slide-next-leave-to   { transform: translateX(-24px); opacity: 0; }
.cal-slide-prev-enter-from { transform: translateX(-24px); opacity: 0; }
.cal-slide-prev-leave-to   { transform: translateX(24px); opacity: 0; }
</style>
