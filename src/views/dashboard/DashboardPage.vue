<template>
  <div class="dp">
    <Loader :visible="isLoading" message="Cargando dashboard…" />

    <template v-if="!isLoading">
      <!-- ════════════════════════════════════════
           GREETING
      ════════════════════════════════════════ -->
      <div class="greeting">
        <div class="greeting-left">
          <h1 class="greeting-title">{{ greetingText }}, {{ firstName }} 👋</h1>
          <p class="greeting-sub">{{ todayLabel }}</p>
        </div>
        <div class="greeting-chips">
          <span v-if="pendingTasks > 0" class="g-chip g-chip--amber">
            ⚠ {{ pendingTasks }} tarea{{ pendingTasks !== 1 ? 's' : '' }} pendiente{{ pendingTasks !== 1 ? 's' : '' }}
          </span>
          <span v-if="upcomingEventsCount > 0" class="g-chip g-chip--teal">
            📅 {{ upcomingEventsCount }} evento{{ upcomingEventsCount !== 1 ? 's' : '' }} próximos
          </span>
        </div>
      </div>

      <!-- ════════════════════════════════════════
           KPI ROW
      ════════════════════════════════════════ -->
      <div class="kpi-grid">

        <!-- KPI 1: Valor Total Cotizado -->
        <div class="kpi">
          <div class="kpi-icon" style="--ib:#FEF3C7">
            <DollarSign :size="17" color="#F59E0B" />
          </div>
          <p class="kpi-label">Valor Total Cotizado</p>
          <p class="kpi-value" :title="formatCOP(stats.totals.value)">{{ formatShort(stats.totals.value) }}</p>
          <div class="kpi-footer">
            <span class="kpi-chip" :class="valueTrendUp ? 'chip-up' : 'chip-down'">
              {{ valueTrendUp ? '↑' : '↓' }} {{ valueTrendPct }}%
            </span>
            <span class="kpi-caption">vs mes anterior</span>
          </div>
          <svg class="sparkline" viewBox="0 0 80 32" preserveAspectRatio="none">
            <polyline :points="sparklinePoints(monthlyValues)" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- KPI 2: Cotizaciones del Mes -->
        <div class="kpi">
          <div class="kpi-icon" style="--ib:#E0F9FA">
            <FileText :size="17" color="#27C8D8" />
          </div>
          <p class="kpi-label">Cotizaciones del Mes</p>
          <p class="kpi-value">{{ stats.currentMonth.count }}</p>
          <div class="kpi-footer">
            <span class="kpi-chip" :class="countTrendUp ? 'chip-up' : 'chip-down'">
              {{ countTrendUp ? '↑' : '↓' }} {{ countTrendPct }}%
            </span>
            <span class="kpi-caption">vs mes anterior</span>
          </div>
          <svg class="sparkline" viewBox="0 0 80 32" preserveAspectRatio="none">
            <polyline :points="sparklinePoints(monthlyCounts)" fill="none" stroke="#27C8D8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- KPI 3: Total Clientes -->
        <div class="kpi">
          <div class="kpi-icon" style="--ib:#DCFCE7">
            <Users :size="17" color="#16A34A" />
          </div>
          <p class="kpi-label">Clientes Registrados</p>
          <p class="kpi-value">{{ totalClientes }}</p>
          <div class="kpi-footer">
            <span class="kpi-chip chip-neutral">Base activa</span>
          </div>
        </div>

        <!-- KPI 4: Tasa de Aprobación -->
        <div class="kpi kpi-teal">
          <div class="kpi-icon" style="--ib:rgba(255,255,255,.2)">
            <CheckCircle2 :size="17" color="white" />
          </div>
          <p class="kpi-label" style="color:rgba(255,255,255,.7)">Tasa de Aprobación</p>
          <p class="kpi-value" style="color:#fff">{{ approvalRate }}%</p>
          <div class="kpi-footer">
            <span class="kpi-chip" style="background:rgba(255,255,255,.2);color:#fff">
              {{ approvedCount }} aprobadas
            </span>
            <span class="kpi-caption" style="color:rgba(255,255,255,.6)">de {{ stats.totals.count }}</span>
          </div>
        </div>

      </div>

      <!-- ════════════════════════════════════════
           CHARTS ROW
      ════════════════════════════════════════ -->
      <div class="charts-row">

        <!-- Bar chart mensual -->
        <div class="card">
          <div class="card-head">
            <div>
              <p class="card-title">Cotizaciones por Mes</p>
              <p class="card-sub">Cantidad — últimos 6 meses</p>
            </div>
          </div>
          <div style="position:relative;height:140px;width:100%">
            <canvas ref="barChartEl"></canvas>
          </div>
        </div>

        <!-- Donut por estado -->
        <div class="card">
          <div class="card-head">
            <div>
              <p class="card-title">Distribución por Estado</p>
              <p class="card-sub">Todas las cotizaciones</p>
            </div>
          </div>
          <div class="donut-wrap">
            <div style="position:relative;height:150px;width:150px;flex-shrink:0">
              <canvas ref="donutCanvas"></canvas>
              <div class="donut-center">
                <span class="donut-num">{{ stats.totals.count }}</span>
                <span class="donut-lbl">cotiz.</span>
              </div>
            </div>
            <div class="donut-legend">
              <div v-for="s in stats.statusBreakdown.slice(0, 6)" :key="s.status" class="legend-item">
                <span class="legend-dot" :style="{ background: statusColor(s.status) }"></span>
                <span class="legend-name">{{ s.status }}</span>
                <span class="legend-pct">{{ pct(s.count, stats.totals.count) }}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ════════════════════════════════════════
           MIDDLE ROW: eventos / acciones / tareas
      ════════════════════════════════════════ -->
      <div class="middle-row">

        <!-- Próximos Eventos -->
        <div class="card">
          <div class="card-head">
            <p class="card-title">Próximos Eventos</p>
            <span class="card-badge">{{ upcomingEvents.length }}</span>
          </div>
          <div v-if="upcomingEvents.length === 0" class="empty-mini">Sin eventos próximos</div>
          <div v-else>
            <div v-for="ev in upcomingEvents" :key="ev.date" class="event-item">
              <div class="event-date">
                <span class="event-day">{{ formatDay(ev.date) }}</span>
                <span class="event-mon">{{ formatMon(ev.date) }}</span>
              </div>
              <div class="event-info">
                <p class="event-name">{{ ev.quotation?.empresa || ev.quotation?.customer?.name || 'Evento' }}</p>
                <p class="event-client">{{ ev.type === 'CONFIRMED' ? 'Confirmado' : 'En proceso' }}</p>
              </div>
              <span class="event-dot" :class="ev.type === 'CONFIRMED' ? 'dot-confirmed' : 'dot-process'"></span>
            </div>
          </div>
          <div class="legend-row" style="margin-top:10px">
            <span class="dot-confirmed ev-dot-small"></span><span class="ev-legend-txt">Confirmado</span>
            <span class="dot-process ev-dot-small" style="margin-left:10px"></span><span class="ev-legend-txt">En proceso</span>
          </div>
        </div>

        <!-- Accesos Rápidos -->
        <div class="card">
          <div class="card-head"><p class="card-title">Accesos Rápidos</p></div>
          <router-link to="/admin/cotizar" class="action-btn">
            <div class="action-icon" style="background:#E0F9FA">📝</div>
            <div class="action-text">
              <p class="action-label">Nueva Cotización</p>
              <p class="action-hint">Crear y enviar al cliente</p>
            </div>
            <ChevronRight :size="14" color="#C4CBD6" />
          </router-link>
          <router-link to="/customer/customer" class="action-btn">
            <div class="action-icon" style="background:#DCFCE7">👥</div>
            <div class="action-text">
              <p class="action-label">Directorio de Clientes</p>
              <p class="action-hint">Gestiona la base global</p>
            </div>
            <ChevronRight :size="14" color="#C4CBD6" />
          </router-link>
          <router-link to="/admin/ver-cotizaciones" class="action-btn">
            <div class="action-icon" style="background:#EDE9FE">📂</div>
            <div class="action-text">
              <p class="action-label">Ver Cotizaciones</p>
              <p class="action-hint">Control y seguimiento</p>
            </div>
            <ChevronRight :size="14" color="#C4CBD6" />
          </router-link>
          <router-link to="/operativa/inventory" class="action-btn">
            <div class="action-icon" style="background:#FEF3C7">📦</div>
            <div class="action-text">
              <p class="action-label">Inventario</p>
              <p class="action-hint">Estado del equipo</p>
            </div>
            <ChevronRight :size="14" color="#C4CBD6" />
          </router-link>
        </div>

        <!-- Mis Tareas -->
        <div class="card">
          <div class="card-head">
            <p class="card-title">Mis Tareas</p>
            <span class="card-badge card-badge--amber" v-if="pendingTasks > 0">{{ pendingTasks }}</span>
          </div>
          <div v-if="myTasks.length === 0" class="empty-mini">Sin tareas asignadas</div>
          <div v-else>
            <div v-for="t in myTasks.slice(0, 5)" :key="t.id" class="task-item">
              <span class="task-prio" :class="taskPrioClass(t)"></span>
              <p class="task-text">{{ t.title }}</p>
              <span class="task-due">{{ formatTaskDue(t.dueDate) }}</span>
            </div>
          </div>
          <div class="legend-row" style="margin-top:10px">
            <span class="task-prio prio-pend"></span><span class="ev-legend-txt">Pendiente</span>
            <span class="task-prio prio-proc" style="margin-left:10px"></span><span class="ev-legend-txt">En proceso</span>
          </div>
        </div>

      </div>

      <!-- ════════════════════════════════════════
           BOTTOM: TABLA COTIZACIONES
      ════════════════════════════════════════ -->
      <div class="card">
        <div class="card-head">
          <p class="card-title">Últimas Cotizaciones</p>
          <router-link to="/admin/ver-cotizaciones" class="see-all">Ver todas →</router-link>
        </div>
        <div v-if="recentQuotations.length === 0" class="empty-mini" style="padding:24px 0">
          No hay cotizaciones recientes.
          <router-link to="/admin/cotizar" class="see-all" style="margin-left:8px">Crear →</router-link>
        </div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Empresa / Evento</th>
                <th>Valor</th>
                <th>Estado</th>
                <th v-if="isAdmin">Agente</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in recentQuotations" :key="q.id" class="tr-link" @click="$router.push(`/admin/cotizar/${q.id}`)">
                <td class="td-id">#{{ q.numero ?? q.id }}</td>
                <td>{{ q.customer?.name || q.customer?.businessName || q.empresa || '—' }}</td>
                <td class="td-muted">{{ q.description || '—' }}</td>
                <td class="td-val">{{ formatShort(q.total) }}</td>
                <td><span class="status-pill" :class="statusPillClass(q.status?.name)">{{ q.status?.name || 'Creada' }}</span></td>
                <td v-if="isAdmin">
                  <span class="agent-av">{{ initials(q.user?.fullName) }}</span>
                  {{ q.user?.fullName?.split(' ')[0] || '—' }}
                </td>
                <td class="td-muted">{{ formatDate(q.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { formatCOP } from '@/utils/currency.js'
import {
  DollarSign, FileText, Users, CheckCircle2, ChevronRight
} from 'lucide-vue-next'
import Loader from '@/components/ui/Loader.vue'
import Chart from 'chart.js/auto'
import { useAuth } from '@/composables/useAuth'
import { getQuotations } from '@/services/quotation.service'
import { getCustomer } from '@/services/customer.service'
import { getDashboardStats, getConfirmedDates } from '@/services/dashboard.service'
import { getTasks } from '@/services/task.service'

const { user } = useAuth()
const isLoading = ref(true)

// ── Data ──────────────────────────────────────
const stats = ref({
  monthlyQuotations: [],
  statusBreakdown: [],
  currentMonth:  { count: 0, totalValue: 0 },
  previousMonth: { count: 0, totalValue: 0 },
  totals: { count: 0, value: 0 },
})
const totalClientes   = ref(0)
const recentQuotations = ref([])
const upcomingEvents  = ref([])
const myTasks         = ref([])

// ── Refs for charts ────────────────────────────
const donutCanvas = ref(null)
const barChartEl  = ref(null)

// ── RBAC ──────────────────────────────────────
const isAdmin = computed(() =>
  user.value?.roles?.some(r => ['ADMIN','ADMINISTRADOR','DIRECCION'].includes(r)) ?? false
)

const firstName = computed(() => user.value?.fullName?.split(' ')[0] || 'Usuario')

// ── Greeting ──────────────────────────────────
const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

const todayLabel = computed(() => {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).replace(/^\w/, c => c.toUpperCase())
})

// ── KPI derived ───────────────────────────────
const monthlyValues = computed(() => stats.value.monthlyQuotations.map(m => m.totalValue))
const monthlyCounts = computed(() => stats.value.monthlyQuotations.map(m => m.count))

const valueTrendPct = computed(() => {
  const cur = stats.value.currentMonth.totalValue
  const pre = stats.value.previousMonth.totalValue
  if (!pre) return cur > 0 ? 100 : 0
  return Math.abs(Math.round(((cur - pre) / pre) * 100))
})
const valueTrendUp = computed(() =>
  stats.value.currentMonth.totalValue >= stats.value.previousMonth.totalValue
)
const countTrendPct = computed(() => {
  const cur = stats.value.currentMonth.count
  const pre = stats.value.previousMonth.count
  if (!pre) return cur > 0 ? 100 : 0
  return Math.abs(Math.round(((cur - pre) / pre) * 100))
})
const countTrendUp = computed(() =>
  stats.value.currentMonth.count >= stats.value.previousMonth.count
)

const approvedCount = computed(() => {
  return stats.value.statusBreakdown
    .filter(s => /aprobad|ganad|acept/i.test(s.status))
    .reduce((sum, s) => sum + s.count, 0)
})
const approvalRate = computed(() => {
  if (!stats.value.totals.count) return 0
  return Math.round((approvedCount.value / stats.value.totals.count) * 100)
})

const pendingTasks = computed(() =>
  myTasks.value.filter(t => t.status === 'PENDIENTE').length
)
const upcomingEventsCount = computed(() => upcomingEvents.value.length)

// ── Helpers ────────────────────────────────────
const formatShort = (val) => {
  if (!val) return '$0'
  if (val >= 1_000_000_000) return '$' + (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (val >= 1_000_000)     return '$' + (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (val >= 1_000)         return '$' + (val / 1_000).toFixed(0) + 'K'
  return formatCOP(val)
}

const pct = (n, total) => total ? Math.round((n / total) * 100) : 0

const sparklinePoints = (vals) => {
  if (!vals || vals.length < 2) return '0,32 80,32'
  const max = Math.max(...vals) || 1
  return vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * 80
    const y = 32 - (v / max) * 28
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

const STATUS_COLORS = ['#27C8D8','#10B981','#F59E0B','#EF4444','#8B5CF6','#6366F1','#EC4899','#14B8A6']
const statusColor = (name) => {
  const idx = (stats.value.statusBreakdown.findIndex(s => s.status === name)) % STATUS_COLORS.length
  return STATUS_COLORS[idx < 0 ? 0 : idx]
}

const statusPillClass = (name = '') => {
  const n = name.toLowerCase()
  if (/aprobad|ganad|acept/.test(n)) return 'st-aprob'
  if (/pendient|cread/.test(n))      return 'st-pend'
  if (/proceso|progres/.test(n))     return 'st-proc'
  if (/perd|cancel|rechaz/.test(n))  return 'st-perd'
  return 'st-neutral'
}

const initials = (name = '') => name.split(' ').slice(0,2).map(w => w[0] ?? '').join('').toUpperCase() || '?'

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short' }) : '—'
const formatDay  = (d) => new Date(d + 'T00:00').getDate()
const formatMon  = (d) => new Date(d + 'T00:00').toLocaleDateString('es-CO', { month:'short' }).toUpperCase()

const formatTaskDue = (d) => {
  if (!d) return ''
  const date = new Date(d)
  const now  = new Date()
  const diff = Math.ceil((date - now) / 86400000)
  if (diff < 0)  return 'Vencida'
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return formatDate(d)
}

const taskPrioClass = (t) =>
  t.status === 'EN_PROCESO' ? 'prio-proc' : 'prio-pend'

// ── Charts ────────────────────────────────────
const buildBarChart = () => {
  if (!barChartEl.value || !stats.value.monthlyQuotations.length) return
  const months = stats.value.monthlyQuotations
  const labels = months.map(m =>
    new Date(m.month + '-01').toLocaleDateString('es-CO', { month: 'short' })
      .replace(/^\w/, c => c.toUpperCase())
  )
  const counts = months.map(m => m.count)
  const colors = months.map((_, i) =>
    i === months.length - 1 ? '#27C8D8' : '#CCF2F5'
  )
  new Chart(barChartEl.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.y} cotizaciones` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' }, color: '#94A3B8' } },
        y: { grid: { color: '#F1F5FA' }, ticks: { font: { size: 10, family: 'Inter' }, color: '#94A3B8', stepSize: 1 }, beginAtZero: true }
      }
    }
  })
}

const buildDonut = () => {
  if (!donutCanvas.value || !stats.value.statusBreakdown.length) return
  const data = stats.value.statusBreakdown.slice(0, 6)
  new Chart(donutCanvas.value, {
    type: 'doughnut',
    data: {
      labels: data.map(s => s.status),
      datasets: [{
        data: data.map(s => s.count),
        backgroundColor: data.map(s => statusColor(s.status)),
        borderWidth: 0,
        hoverOffset: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '74%',
    }
  })
}

// ── Mount ─────────────────────────────────────
onMounted(async () => {
  try {
    const [statsRes, custRes, quotRes, confirmedRes, tasksRes] = await Promise.allSettled([
      getDashboardStats(),
      getCustomer(),
      getQuotations(),
      getConfirmedDates(),
      getTasks(),
    ])

    // Stats
    if (statsRes.status === 'fulfilled') {
      stats.value = statsRes.value?.data ?? stats.value
    }

    // Clients count
    if (custRes.status === 'fulfilled') {
      const raw = custRes.value?.data?.data ?? custRes.value?.data ?? []
      totalClientes.value = Array.isArray(raw) ? raw.length : 0
    }

    // Recent quotations
    if (quotRes.status === 'fulfilled') {
      const allQ = quotRes.value?.data?.data ?? quotRes.value?.data ?? []
      const filtered = isAdmin.value
        ? allQ
        : allQ.filter(q => q.userId === user.value?.id || q.coordinadorId === user.value?.id)
      recentQuotations.value = [...filtered].sort((a, b) => b.id - a.id).slice(0, 8)
    }

    // Upcoming events (next 14 days)
    if (confirmedRes.status === 'fulfilled') {
      const raw = confirmedRes.value?.data ?? []
      const today = new Date().toISOString().split('T')[0]
      const limit = new Date(); limit.setDate(limit.getDate() + 14)
      const limitStr = limit.toISOString().split('T')[0]
      upcomingEvents.value = Array.isArray(raw)
        ? raw.filter(e => e.date >= today && e.date <= limitStr).slice(0, 5)
        : []
    }

    // Tasks
    if (tasksRes.status === 'fulfilled') {
      const raw = tasksRes.value?.data?.data ?? tasksRes.value?.data ?? []
      myTasks.value = Array.isArray(raw)
        ? raw.filter(t => t.status !== 'COMPLETADA').slice(0, 5)
        : []
    }

    isLoading.value = false
    await nextTick()
    buildBarChart()
    buildDonut()
  } catch (err) {
    console.error('Dashboard error:', err)
    isLoading.value = false
  }
})
</script>

<style scoped>
/* ── LAYOUT ────────────────────────────────── */
.dp {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

/* ── GREETING ──────────────────────────────── */
.greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 18px;
  padding: 18px 24px;
  border: 1px solid #E5EAF0;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
}
.greeting-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #0F1A2E;
}
.greeting-sub {
  font-size: 12px;
  color: #64748B;
  margin-top: 3px;
  font-family: 'Inter', sans-serif;
}
.greeting-chips {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.g-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 99px;
  font-family: 'Inter', sans-serif;
}
.g-chip--amber { background: #FEF3C7; color: #D97706; border: 1px solid #FDE68A; }
.g-chip--teal  { background: #E0F9FA; color: #27C8D8; border: 1px solid #A7EEF5; }

/* ── KPI GRID ─────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.kpi {
  position: relative;
  overflow: hidden;
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px 14px;
  border: 1px solid #E5EAF0;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: box-shadow 0.2s;
}
.kpi:hover { box-shadow: 0 2px 10px rgba(39,200,216,.12), 0 8px 24px rgba(39,200,216,.12); }
.kpi-teal {
  background: linear-gradient(135deg, #27C8D8 0%, #1BAEBB 100%);
  border-color: transparent;
}
.kpi-icon {
  position: absolute;
  top: 16px; right: 16px;
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--ib);
  display: flex; align-items: center; justify-content: center;
}
.kpi-label {
  font-size: 11px; font-weight: 500;
  color: #64748B; font-family: 'Inter', sans-serif;
  padding-right: 46px; line-height: 1.4;
}
.kpi-value {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 28px; font-weight: 700;
  color: #0F1A2E; line-height: 1;
  margin-top: 2px;
}
.kpi-footer {
  display: flex; align-items: center; gap: 6px;
  margin-top: 8px;
}
.kpi-chip {
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 99px;
  font-family: 'Inter', sans-serif;
}
.chip-up      { background: #DCFCE7; color: #16A34A; }
.chip-down    { background: #FEE2E2; color: #B91C1C; }
.chip-neutral { background: #E0F9FA; color: #27C8D8; }
.kpi-caption  { font-size: 10px; color: #94A3B8; font-family: 'Inter', sans-serif; }
.sparkline {
  position: absolute;
  bottom: 0; right: 0;
  width: 80px; height: 32px;
  opacity: 0.18;
}

/* ── CARD BASE ────────────────────────────── */
.card {
  background: #fff;
  border-radius: 16px;
  padding: 20px 22px;
  border: 1px solid #E5EAF0;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
}
.card-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.card-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 600; color: #0F1A2E;
}
.card-sub { font-size: 11px; color: #94A3B8; margin-top: 2px; font-family: 'Inter', sans-serif; }
.card-badge {
  background: #E0F9FA; color: #27C8D8;
  font-size: 11px; font-weight: 600;
  padding: 2px 9px; border-radius: 99px;
  font-family: 'Inter', sans-serif;
}
.card-badge--amber { background: #FEF3C7; color: #D97706; }

/* ── CHARTS ROW ───────────────────────────── */
.charts-row {
  display: grid;
  grid-template-columns: 60fr 40fr;
  gap: 14px;
}


/* Donut */
.donut-wrap {
  display: flex; align-items: center; gap: 18px;
}
.donut-center {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center; pointer-events: none;
}
.donut-num {
  display: block;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 18px; font-weight: 700; color: #0F1A2E;
}
.donut-lbl { font-size: 9px; color: #94A3B8; font-family: 'Inter', sans-serif; }
.donut-legend { display: flex; flex-direction: column; gap: 7px; }
.legend-item { display: flex; align-items: center; gap: 7px; font-size: 11px; color: #0F1A2E; font-family: 'Inter', sans-serif; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-name { flex: 1; }
.legend-pct { font-weight: 700; color: #0F1A2E; padding-left: 10px; }

/* ── MIDDLE ROW ────────────────────────────── */
.middle-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

/* Upcoming events */
.event-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #F1F5FA;
}
.event-item:last-child { border-bottom: none; }
.event-date {
  text-align: center; background: #F0FAFB;
  border-radius: 10px; padding: 6px 10px; min-width: 44px;
}
.event-day { display: block; font-size: 16px; font-weight: 700; color: #0F1A2E; line-height: 1; font-family: 'Plus Jakarta Sans', sans-serif; }
.event-mon { font-size: 9px; color: #64748B; text-transform: uppercase; font-family: 'Inter', sans-serif; }
.event-info { flex: 1; }
.event-name   { font-size: 12px; font-weight: 600; color: #0F1A2E; font-family: 'Inter', sans-serif; }
.event-client { font-size: 10px; color: #64748B; margin-top: 1px; font-family: 'Inter', sans-serif; }
.event-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-confirmed { background: #27C8D8; }
.dot-process   { background: #F59E0B; }
.ev-dot-small { display: inline-block; width: 7px; height: 7px; border-radius: 50%; vertical-align: middle; }
.ev-legend-txt { font-size: 10px; color: #94A3B8; vertical-align: middle; margin-left: 3px; font-family: 'Inter', sans-serif; }
.legend-row { display: flex; align-items: center; }

/* Quick actions */
.action-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #FAFBFE;
  border: 1px solid #EEF1F7;
  margin-bottom: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s;
}
.action-btn:last-child { margin-bottom: 0; }
.action-btn:hover { background: #F0FAFB; border-color: #A7EEF5; transform: translateX(2px); }
.action-icon {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.action-text { flex: 1; }
.action-label { font-size: 12px; font-weight: 600; color: #0F1A2E; font-family: 'Inter', sans-serif; }
.action-hint  { font-size: 10px; color: #94A3B8; margin-top: 1px; font-family: 'Inter', sans-serif; }

/* Tasks */
.task-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; border-bottom: 1px solid #F1F5FA;
}
.task-item:last-child { border-bottom: none; }
.task-prio { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.prio-pend { background: #F59E0B; }
.prio-proc { background: #27C8D8; }
.task-text { font-size: 11px; color: #0F1A2E; font-weight: 500; flex: 1; font-family: 'Inter', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.task-due  { font-size: 10px; color: #94A3B8; font-family: 'Inter', sans-serif; white-space: nowrap; }

/* ── BOTTOM TABLE ───────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead tr { border-bottom: 2px solid #F1F5FA; }
th {
  font-size: 10px; font-weight: 700; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 8px 12px; text-align: left;
  font-family: 'Inter', sans-serif;
}
td {
  padding: 11px 12px; font-size: 12px; color: #0F1A2E;
  border-bottom: 1px solid #F1F5FA;
  font-family: 'Inter', sans-serif;
}
tr:last-child td { border-bottom: none; }
.tr-link { cursor: pointer; transition: background 0.12s; }
.tr-link:hover td { background: #FAFBFE; }
.td-id  { font-weight: 700; color: #27C8D8; }
.td-val { font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; }
.td-muted { color: #64748B; }

.status-pill {
  display: inline-block; font-size: 10px; font-weight: 600;
  padding: 2px 9px; border-radius: 99px;
  font-family: 'Inter', sans-serif;
}
.st-aprob   { background: #DCFCE7; color: #16A34A; }
.st-pend    { background: #FEF3C7; color: #D97706; }
.st-proc    { background: #E0F9FA; color: #27C8D8; }
.st-perd    { background: #FEE2E2; color: #B91C1C; }
.st-neutral { background: #F1F5F9; color: #64748B; }

.agent-av {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: #E0F9FA; color: #27C8D8;
  font-size: 9px; font-weight: 700; margin-right: 5px;
  font-family: 'Inter', sans-serif;
}

.see-all {
  font-size: 11px; font-weight: 600; color: #27C8D8;
  text-decoration: none; cursor: pointer;
}
.see-all:hover { opacity: 0.8; }

.empty-mini {
  font-size: 12px; color: #94A3B8;
  font-family: 'Inter', sans-serif;
  text-align: center; padding: 12px 0;
}

/* ── RESPONSIVE ─────────────────────────────── */
@media (max-width: 1280px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .middle-row { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .greeting { flex-direction: column; align-items: flex-start; gap: 10px; }
  .kpi-grid, .charts-row, .middle-row { grid-template-columns: 1fr; }
}
</style>
