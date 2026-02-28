<template>
  <div class="flex flex-col gap-0">

    <!-- ── HEADER ──────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <button
          @click="prevMonth"
          class="w-7 h-7 rounded-[8px] border border-[#E2EBF6] bg-white
                 flex items-center justify-center text-text-3
                 hover:bg-[#EBF3FC] hover:text-[#054EAF] hover:border-[#BFDBFE]
                 transition-all duration-150 cursor-pointer"
          aria-label="Mes anterior"
        >
          <ChevronLeft :size="14" />
        </button>

        <h3 class="text-[15px] font-bold text-text-1
                   font-['Plus_Jakarta_Sans',sans-serif] capitalize
                   min-w-[140px] text-center tracking-tight">
          {{ currentMonth.name }}
        </h3>

        <button
          @click="nextMonth"
          class="w-7 h-7 rounded-[8px] border border-[#E2EBF6] bg-white
                 flex items-center justify-center text-text-3
                 hover:bg-[#EBF3FC] hover:text-[#054EAF] hover:border-[#BFDBFE]
                 transition-all duration-150 cursor-pointer"
          aria-label="Mes siguiente"
        >
          <ChevronRight :size="14" />
        </button>
      </div>

      <!-- Badge contador de eventos -->
      <span class="text-[11px] font-medium px-2.5 py-1 rounded-full
                   bg-[#EBF3FC] text-[#054EAF] font-['Inter',sans-serif]
                   shrink-0">
        {{ eventCountThisMonth }} eventos
      </span>
    </div>

    <!-- ── BODY: Calendario + Panel lateral ────────────── -->
    <div class="flex flex-col md:flex-row gap-4">

      <!-- ════════ CALENDARIO COMPACTO ════════ -->
      <div class="flex-1 min-w-0">

        <!-- Días de la semana -->
        <div class="grid grid-cols-7 mb-1">
          <div
            v-for="d in weekDays"
            :key="d"
            class="text-center text-[10px] font-semibold text-text-3
                   uppercase tracking-wider py-1 font-['Inter',sans-serif]"
          >
            {{ d }}
          </div>
        </div>

        <!-- Cuadrícula de días -->
        <div class="grid grid-cols-7 gap-[3px]">
          <div
            v-for="day in currentMonth.days"
            :key="day.date"
            class="relative flex flex-col items-center justify-center
                   rounded-[8px] cursor-pointer select-none"
            style="height: 32px;"
            :class="getCellClass(day)"
            @mouseenter="day.isCurrentMonth && day.type ? (hoveredDay = day) : null"
            @mouseleave="hoveredDay = null"
          >
            <!-- Número del día -->
            <span
              class="text-[12px] leading-none"
              :class="getDayNumberClass(day)"
            >
              {{ day.dayNumber }}
            </span>

            <!-- Dot indicador debajo del número -->
            <span
              v-if="day.isCurrentMonth && day.type && day.date !== todayISO"
              class="absolute bottom-[4px] w-[4px] h-[4px] rounded-full"
              :class="{
                'bg-[#1D4ED8]': day.type === 'CONFIRMED',
                'bg-[#B45309]': day.type === 'IN_PROCESS',
              }"
            />

            <!-- Tooltip -->
            <div
              v-if="hoveredDay === day"
              class="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2
                     bg-[#1E293B] text-white text-[11px] font-['Inter',sans-serif]
                     whitespace-nowrap px-2.5 py-1.5 rounded-[6px] z-50
                     pointer-events-none shadow-lg tooltip-arrow"
            >
              {{ getTooltipText(day) }}
            </div>
          </div>
        </div>

      </div>

      <!-- ════════ PANEL LATERAL — Próximos eventos ════════ -->
      <div class="flex flex-col gap-1.5 shrink-0
                  border-t md:border-t-0 md:border-l border-[#EBF3FC]
                  pt-4 md:pt-0 md:pl-4
                  w-full md:w-[140px]">

        <p class="text-[10px] font-semibold text-text-3 uppercase
                  tracking-wider mb-1 font-['Inter',sans-serif]">
          Próximos
        </p>

        <!-- Lista de eventos -->
        <template v-if="upcomingEvents.length">
          <div
            v-for="event in upcomingEvents"
            :key="event.date"
            class="flex items-start gap-2 cursor-default"
          >
            <!-- Fecha compacta -->
            <div class="shrink-0 w-8 text-center">
              <p class="text-[14px] font-bold text-text-1 leading-none
                        font-['Plus_Jakarta_Sans',sans-serif]">
                {{ event.day }}
              </p>
              <p class="text-[9px] text-text-3 uppercase font-['Inter',sans-serif]">
                {{ event.monthShort }}
              </p>
            </div>

            <!-- Indicador + tipo -->
            <div class="flex items-center gap-1.5 pt-[1px] flex-1 min-w-0">
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0 mt-[2px]"
                :class="{
                  'bg-[#1D4ED8]': event.type === 'CONFIRMED',
                  'bg-[#B45309]': event.type === 'IN_PROCESS',
                }"
              />
              <span class="text-[11px] text-text-2 leading-tight
                           font-['Inter',sans-serif] truncate">
                {{ event.type === 'CONFIRMED' ? 'Confirmado' : 'En proceso' }}
              </span>
            </div>
          </div>
        </template>

        <!-- Estado vacío -->
        <div v-else class="flex flex-col items-center gap-1 pt-2 opacity-40">
          <CalendarX :size="18" class="text-text-3" />
          <p class="text-[10px] text-text-3 text-center font-['Inter',sans-serif]">
            Sin eventos
          </p>
        </div>

        <!-- Mini leyenda -->
        <div class="mt-auto pt-3 border-t border-[#EBF3FC] flex flex-col gap-1.5">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#054EAF] shrink-0" />
            <span class="text-[10px] text-text-3 font-['Inter',sans-serif]">Hoy</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#1D4ED8] shrink-0" />
            <span class="text-[10px] text-text-3 font-['Inter',sans-serif]">Confirmado</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#B45309] shrink-0" />
            <span class="text-[10px] text-text-3 font-['Inter',sans-serif]">En proceso</span>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, ChevronRight, CalendarX } from 'lucide-vue-next'
import { getConfirmedDates } from '@/services/dashboard.service'

// ─── Estado de datos (lógica original intacta) ──────────
const confirmedDates = ref([])
const months = ref([])

// ─── Estado de navegación (nuevo) ───────────────────────
const currentMonthOffset = ref(0)
const hoveredDay = ref(null)

const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const todayISO = new Date().toISOString().split('T')[0]

// ─── Carga de datos desde API (original, sin cambios) ───
const loadDates = async () => {
  try {
    const response = await getConfirmedDates()
    confirmedDates.value = response.data
  } catch (error) {
    console.error('Error cargando fechas:', error)
  }
}

// ─── Generación del calendario ──────────────────────────
const generateCalendar = () => {
  const now = new Date()
  const monthDate = new Date(now.getFullYear(), now.getMonth() + currentMonthOffset.value, 1)
  months.value = [buildMonth(monthDate)]
}

// ─── buildMonth (original, sin cambios) ─────────────────
const buildMonth = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days = []

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: `empty-${month}-${i}`, dayNumber: '', isCurrentMonth: false, type: null })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const currentDate = new Date(year, month, d)
    const isoDate = currentDate.toISOString().split('T')[0]
    const found = confirmedDates.value.find((item) => item.date === isoDate)

    days.push({ date: isoDate, dayNumber: d, isCurrentMonth: true, type: found?.type || null })
  }

  return {
    name: date
      .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
      .replace(/^\w/, (c) => c.toUpperCase()),
    days,
  }
}

// ─── Computed mes actual ─────────────────────────────────
const currentMonth = computed(() => months.value[0] ?? { name: '', days: [] })

// ─── Clases CSS por día (original — conservado) ─────────
const getDayClass = (day) => {
  if (!day.isCurrentMonth)       return 'empty'
  if (day.date === todayISO)     return 'today'
  if (day.type === 'CONFIRMED')  return 'confirmed'
  if (day.type === 'IN_PROCESS') return 'in-process'
  return 'regular'
}

// ─── Clases Tailwind para el contenedor de celda ────────
const getCellClass = (day) => {
  if (!day.isCurrentMonth)       return 'opacity-0 pointer-events-none'
  if (day.date === todayISO)     return 'bg-[#054EAF] text-white rounded-full'
  if (day.type === 'CONFIRMED')  return 'hover:bg-[#DBEAFE] transition-colors duration-150'
  if (day.type === 'IN_PROCESS') return 'hover:bg-[#FEF3C7] transition-colors duration-150'
  return 'hover:bg-[#F1F5FA] transition-colors duration-150'
}

// ─── Clases Tailwind para el número del día ─────────────
const getDayNumberClass = (day) => {
  if (!day.isCurrentMonth)       return ''
  if (day.date === todayISO)     return 'text-white font-bold text-[13px]'
  if (day.type === 'CONFIRMED')  return 'text-[#1D4ED8] font-semibold'
  if (day.type === 'IN_PROCESS') return 'text-[#B45309] font-semibold'
  return 'text-text-1'
}

// ─── Texto del tooltip ───────────────────────────────────
const getTooltipText = (day) => {
  const labels = {
    CONFIRMED:  '✅ Evento confirmado',
    IN_PROCESS: '🔄 En proceso / Cotización activa',
  }
  return labels[day.type] ?? day.type
}

// ─── Navegación entre meses ─────────────────────────────
const prevMonth = () => { currentMonthOffset.value--; generateCalendar() }
const nextMonth = () => { currentMonthOffset.value++; generateCalendar() }

// ─── Contador de eventos del mes visible ────────────────
const eventCountThisMonth = computed(() =>
  currentMonth.value.days.filter(d => d.isCurrentMonth && d.type).length
)

// ─── Próximos eventos desde hoy (máximo 4) ───────────────
const upcomingEvents = computed(() => {
  const today = new Date()
  return currentMonth.value.days
    .filter(d => d.isCurrentMonth && d.type && new Date(d.date) >= today)
    .slice(0, 4)
    .map(d => {
      const date = new Date(d.date)
      return {
        ...d,
        day: date.getDate(),
        monthShort: date
          .toLocaleString('es-ES', { month: 'short' })
          .replace('.', '')
          .toUpperCase(),
      }
    })
})

// ─── Lifecycle (original, sin cambios) ──────────────────
onMounted(async () => {
  await loadDates()
  generateCalendar()
})
</script>

<style scoped>
/* Tailwind handles everything */

/* Flecha del tooltip — pseudo-elemento no soportado por Tailwind */
.tooltip-arrow::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1E293B;
}
</style>
