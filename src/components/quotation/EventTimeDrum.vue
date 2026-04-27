<template>
  <div class="etd-wrap">
    <div class="etd-label-row">
      <span class="etd-col-label">Hora</span>
      <span class="etd-col-label">Minutos</span>
    </div>

    <div class="etd-drum-row">
      <!-- Horas -->
      <div class="etd-col-wrap">
        <div class="etd-fade-top" />
        <div class="etd-guide-lines" />
        <div class="etd-col" ref="hourColRef" @scroll.passive="onHourScroll">
          <div class="etd-pad" />
          <div
            v-for="h in 24"
            :key="h-1"
            class="etd-item"
            :class="{ 'etd-item--sel': localHour === h - 1 }"
            @click="setHour(h - 1)"
          >
            {{ String(h - 1).padStart(2, '0') }}
          </div>
          <div class="etd-pad" />
        </div>
        <div class="etd-fade-bot" />
      </div>

      <span class="etd-colon">:</span>

      <!-- Minutos -->
      <div class="etd-col-wrap">
        <div class="etd-fade-top" />
        <div class="etd-guide-lines" />
        <div class="etd-col" ref="minColRef" @scroll.passive="onMinScroll">
          <div class="etd-pad" />
          <div
            v-for="(m, idx) in minuteOpts"
            :key="m"
            class="etd-item"
            :class="{ 'etd-item--sel': localMinIdx === idx }"
            @click="setMinIdx(idx)"
          >
            {{ String(m).padStart(2, '0') }}
          </div>
          <div class="etd-pad" />
        </div>
        <div class="etd-fade-bot" />
      </div>
    </div>

    <!-- Valor seleccionado -->
    <div class="etd-preview">
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props  = defineProps({ modelValue: { type: String, default: '' } })
const emit   = defineEmits(['update:modelValue'])

const ITEM_H    = 44
const minuteOpts = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

const localHour   = ref(0)
const localMinIdx = ref(0)

const hourColRef = ref(null)
const minColRef  = ref(null)

let suppressHourScroll = false
let suppressMinScroll  = false

// Parse initial v-model
const parseModel = (val) => {
  if (!val) return
  const [hStr, mStr] = val.split(':')
  const h = parseInt(hStr) || 0
  const m = parseInt(mStr) || 0
  localHour.value   = Math.max(0, Math.min(23, h))
  const rounded = Math.round(m / 5) * 5 % 60
  localMinIdx.value = minuteOpts.indexOf(rounded) === -1 ? 0 : minuteOpts.indexOf(rounded)
}

watch(() => props.modelValue, parseModel, { immediate: true })

const displayValue = computed(() => {
  const h = String(localHour.value).padStart(2, '0')
  const m = String(minuteOpts[localMinIdx.value]).padStart(2, '0')
  const period = localHour.value < 12 ? 'AM' : 'PM'
  const h12 = localHour.value % 12 || 12
  return `${String(h12).padStart(2, '0')}:${m} ${period}`
})

const emitValue = () => {
  const h = String(localHour.value).padStart(2, '0')
  const m = String(minuteOpts[localMinIdx.value]).padStart(2, '0')
  emit('update:modelValue', `${h}:${m}`)
}

watch([localHour, localMinIdx], emitValue)

// Scroll handlers
const onHourScroll = () => {
  if (suppressHourScroll) return
  const idx = Math.round(hourColRef.value.scrollTop / ITEM_H)
  localHour.value = Math.max(0, Math.min(23, idx))
}
const onMinScroll = () => {
  if (suppressMinScroll) return
  const idx = Math.round(minColRef.value.scrollTop / ITEM_H)
  localMinIdx.value = Math.max(0, Math.min(minuteOpts.length - 1, idx))
}

// Programmatic scroll
const scrollTo = (colRef, idx, suppress) => {
  if (!colRef.value) return
  suppress = true
  colRef.value.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
  setTimeout(() => { suppress = false }, 400)
}

const setHour = (h) => {
  localHour.value = h
  suppressHourScroll = true
  hourColRef.value?.scrollTo({ top: h * ITEM_H, behavior: 'smooth' })
  setTimeout(() => { suppressHourScroll = false }, 400)
}
const setMinIdx = (idx) => {
  localMinIdx.value = idx
  suppressMinScroll = true
  minColRef.value?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
  setTimeout(() => { suppressMinScroll = false }, 400)
}

onMounted(async () => {
  await nextTick()
  if (hourColRef.value) {
    suppressHourScroll = true
    hourColRef.value.scrollTop = localHour.value * ITEM_H
    setTimeout(() => { suppressHourScroll = false }, 100)
  }
  if (minColRef.value) {
    suppressMinScroll = true
    minColRef.value.scrollTop = localMinIdx.value * ITEM_H
    setTimeout(() => { suppressMinScroll = false }, 100)
  }
})
</script>

<style scoped>
.etd-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.etd-label-row {
  display: flex;
  gap: 48px;
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.etd-drum-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.etd-col-wrap {
  position: relative;
  width: 72px;
  height: 220px; /* 5 × 44px */
}

.etd-col {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.etd-col::-webkit-scrollbar { display: none; }

.etd-pad {
  height: 88px; /* 2 × ITEM_H to allow first/last to center */
  scroll-snap-align: none;
  flex-shrink: 0;
}

.etd-item {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 400;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #94A3B8;
  cursor: pointer;
  scroll-snap-align: center;
  transition: color 0.15s, font-weight 0.15s, font-size 0.15s;
  border-radius: 8px;
}
.etd-item:hover { color: #475569; }
.etd-item--sel {
  color: #054EAF;
  font-weight: 700;
  font-size: 26px;
}

/* Fade gradients */
.etd-fade-top,
.etd-fade-bot {
  position: absolute;
  left: 0; right: 0;
  height: 88px;
  pointer-events: none;
  z-index: 2;
}
.etd-fade-top {
  top: 0;
  background: linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
}
.etd-fade-bot {
  bottom: 0;
  background: linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
}

/* Guide lines at center */
.etd-guide-lines {
  position: absolute;
  top: 50%;
  left: 4px; right: 4px;
  transform: translateY(-22px);
  height: 44px;
  border-top: 1.5px solid rgba(5,78,175,0.2);
  border-bottom: 1.5px solid rgba(5,78,175,0.2);
  border-radius: 8px;
  pointer-events: none;
  z-index: 3;
  background: rgba(5,78,175,0.03);
}

.etd-colon {
  font-size: 28px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1;
  margin-top: -4px;
}

.etd-preview {
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  background: #F1F5FA;
  padding: 4px 14px;
  border-radius: 20px;
}
</style>
