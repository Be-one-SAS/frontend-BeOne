<template>
  <div class="dash-page">

    <!-- Header -->
    <div class="dash-header">
      <div>
        <h1 class="dash-title">Dashboard Financiero</h1>
        <p class="dash-sub">Resumen ejecutivo · {{ mesActual }}</p>
      </div>
      <button class="dash-refresh" @click="load" :disabled="loading">
        <RefreshCw :size="15" :class="{ spin: loading }" />
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading && !data" class="dash-loading">
      <div class="dash-spinner" />
      <span>Cargando dashboard…</span>
    </div>
    <div v-else-if="error" class="dash-error">
      <AlertCircle :size="18" /> {{ error }}
      <button @click="load">Reintentar</button>
    </div>

    <template v-else-if="data">

      <!-- ── KPIs ───────────────────────────────────────── -->
      <div class="dash-kpis">
        <div v-for="kpi in kpis" :key="kpi.label" class="dash-kpi">
          <div class="dash-kpi-icon" :style="{ background: kpi.iconBg }">
            <component :is="kpi.icon" :size="20" :color="kpi.iconColor" />
          </div>
          <div class="dash-kpi-info">
            <span class="dash-kpi-label">{{ kpi.label }}</span>
            <span class="dash-kpi-value">{{ kpi.value }}</span>
            <span v-if="kpi.sub" class="dash-kpi-sub">{{ kpi.sub }}</span>
          </div>
          <div v-if="kpi.trend !== null" class="dash-kpi-trend" :class="kpi.trendPos ? 'up' : 'down'">
            <TrendingUp v-if="kpi.trendPos" :size="13" />
            <TrendingDown v-else :size="13" />
            {{ Math.abs(kpi.trend).toFixed(1) }}%
          </div>
        </div>
      </div>

      <!-- ── Charts row 1 ──────────────────────────────── -->
      <div class="dash-charts-row">
        <!-- Ingresos por mes -->
        <div class="dash-chart-card dash-chart-wide">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Ingresos aprobados por mes (últimos 12 meses)</span>
          </div>
          <canvas ref="barRef" class="dash-canvas" />
        </div>

        <!-- Distribución por estado admin -->
        <div class="dash-chart-card">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Por estado administrativo</span>
          </div>
          <canvas ref="donutRef" class="dash-canvas dash-canvas-sm" />
        </div>
      </div>

      <!-- ── Charts row 2 ──────────────────────────────── -->
      <div class="dash-charts-row">
        <!-- Top 10 clientes -->
        <div class="dash-chart-card dash-chart-wide">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Top 10 clientes por valor aprobado</span>
          </div>
          <canvas ref="clientesRef" class="dash-canvas" />
        </div>

        <!-- Por ejecutivo -->
        <div class="dash-chart-card">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Por ejecutivo / agente</span>
          </div>
          <div class="dash-exec-table-wrap">
            <table class="dash-exec-table">
              <thead>
                <tr>
                  <th>Ejecutivo</th>
                  <th>Cots.</th>
                  <th>Aprobadas</th>
                  <th>Tasa</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in data.porEjecutivo" :key="e.agente">
                  <td class="exec-name">{{ e.agente }}</td>
                  <td>{{ e.count }}</td>
                  <td>{{ e.aprobadas }}</td>
                  <td>
                    <span class="exec-tasa" :class="e.tasa >= 50 ? 'tasa-good' : 'tasa-low'">
                      {{ e.tasa }}%
                    </span>
                  </td>
                  <td class="exec-money">{{ fmtMoney(e.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  RefreshCw, AlertCircle, TrendingUp, TrendingDown,
  DollarSign, FileText, CheckCircle, Clock, XCircle, Percent,
} from 'lucide-vue-next'
import { Chart, registerables } from 'chart.js'
import { getAdminDashboard } from '@/services/administracion.service.js'
import { ESTADO_ADMIN_STYLE } from '@/composables/useEstadoAdmin.js'

Chart.register(...registerables)

// ── Helpers ───────────────────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const mesActual = computed(() => {
  const d = new Date()
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`
})

function fmtMoney(n) {
  if (n == null || n === 0) return '$0'
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function trend(current, prev) {
  if (!prev) return null
  return ((current - prev) / prev) * 100
}

// ── State ─────────────────────────────────────────────────
const loading = ref(false)
const error   = ref(null)
const data    = ref(null)

const barRef      = ref(null)
const donutRef    = ref(null)
const clientesRef = ref(null)

let barChart = null, donutChart = null, clientesChart = null

// ── KPIs computed ─────────────────────────────────────────
const kpis = computed(() => {
  if (!data.value?.kpis) return []
  const k = data.value.kpis
  const facTrend = trend(k.facturadoMes, k.facturadoPrev)
  const pagTrend = trend(k.pagadoMes, k.pagadoPrev)
  return [
    {
      label:    'Facturado (mes)',
      value:    fmtMoney(k.facturadoMes),
      sub:      `${k.facturadoMesCount} cotizaciones`,
      trend:    facTrend,
      trendPos: facTrend >= 0,
      icon:     DollarSign,
      iconBg:   '#EFF6FF', iconColor: '#1D4ED8',
    },
    {
      label:    'Pagado (mes)',
      value:    fmtMoney(k.pagadoMes),
      sub:      `${k.pagadoMesCount} cotizaciones`,
      trend:    pagTrend,
      trendPos: pagTrend >= 0,
      icon:     CheckCircle,
      iconBg:   '#F0FDF4', iconColor: '#166534',
    },
    {
      label:    'Cotizado aprobado (mes)',
      value:    fmtMoney(k.cotizadoMes),
      sub:      `${k.cotizadoMesCount} eventos`,
      trend:    null,
      icon:     FileText,
      iconBg:   '#EBF3FC', iconColor: '#054EAF',
    },
    {
      label:    'Por cobrar (total)',
      value:    fmtMoney(k.porCobrar),
      sub:      `${k.porCobrarCount} pendientes`,
      trend:    null,
      icon:     Clock,
      iconBg:   '#FFFBEB', iconColor: '#92400E',
    },
    {
      label:    'Anulado (mes)',
      value:    fmtMoney(k.anuladoMes),
      sub:      `${k.anuladoMesCount} cancelados`,
      trend:    null,
      icon:     XCircle,
      iconBg:   '#FEF2F2', iconColor: '#991B1B',
    },
    {
      label:    'Tasa de cierre',
      value:    `${k.tasaCierre}%`,
      sub:      'Aprobadas / Total',
      trend:    null,
      icon:     Percent,
      iconBg:   '#F5F3FF', iconColor: '#6D28D9',
    },
  ]
})

// ── Load ──────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value   = null
  try {
    data.value = await getAdminDashboard()
    await nextTick()
    buildCharts()
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(load)
onUnmounted(() => {
  barChart?.destroy()
  donutChart?.destroy()
  clientesChart?.destroy()
})

// ── Charts ────────────────────────────────────────────────
function buildCharts() {
  buildBarChart()
  buildDonutChart()
  buildClientesChart()
}

function buildBarChart() {
  if (barChart) { barChart.destroy(); barChart = null }
  if (!barRef.value || !data.value?.ingresosPorMes?.length) return

  const items = data.value.ingresosPorMes
  const labels = items.map(i => {
    const [y, m] = i.month.split('-')
    return `${MESES[parseInt(m, 10) - 1]} ${y.slice(2)}`
  })

  barChart = new Chart(barRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ingresos',
        data: items.map(i => i.totalIngresos),
        backgroundColor: 'rgba(5, 78, 175, 0.8)',
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => fmtMoney(ctx.parsed.y),
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          grid: { color: '#F1F5F9' },
          ticks: { font: { size: 11 }, callback: v => fmtMoney(v) },
        },
      },
    },
  })
}

function buildDonutChart() {
  if (donutChart) { donutChart.destroy(); donutChart = null }
  if (!donutRef.value || !data.value?.distribucionEstadoAdmin?.length) return

  const items = data.value.distribucionEstadoAdmin.slice(0, 10)
  const colors = items.map(i => ESTADO_ADMIN_STYLE[i.estado]?.color ?? '#94A3B8')

  donutChart = new Chart(donutRef.value, {
    type: 'doughnut',
    data: {
      labels: items.map(i => i.estado),
      datasets: [{
        data: items.map(i => i.count),
        backgroundColor: items.map(i => ESTADO_ADMIN_STYLE[i.estado]?.bg ?? '#F1F5F9'),
        borderColor: colors,
        borderWidth: 1.5,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, boxWidth: 12, padding: 8 },
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed} cotizaciones`,
          },
        },
      },
    },
  })
}

function buildClientesChart() {
  if (clientesChart) { clientesChart.destroy(); clientesChart = null }
  if (!clientesRef.value || !data.value?.topClientes?.length) return

  const items = data.value.topClientes.slice(0, 10)

  clientesChart = new Chart(clientesRef.value, {
    type: 'bar',
    data: {
      labels: items.map(i => i.cliente.length > 22 ? i.cliente.slice(0, 22) + '…' : i.cliente),
      datasets: [{
        label: 'Total aprobado',
        data: items.map(i => i.total),
        backgroundColor: 'rgba(22, 163, 74, 0.75)',
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => fmtMoney(ctx.parsed.x),
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#F1F5F9' },
          ticks: { font: { size: 11 }, callback: v => fmtMoney(v) },
        },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  })
}
</script>

<style scoped>
.dash-page {
  padding: 20px 24px;
  max-width: 1440px;
  font-family: 'Inter', sans-serif;
}

/* Header */
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.dash-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}
.dash-sub { font-size: 13px; color: #64748B; margin: 2px 0 0; }
.dash-refresh {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px;
  border: 1.5px solid #E2E8F0; border-radius: 8px;
  background: #fff; cursor: pointer; color: #64748B;
}
.dash-refresh:hover { background: #F8FAFC; }

/* Loading */
.dash-loading {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px; color: #64748B; font-size: 14px;
}
.dash-spinner {
  width: 28px; height: 28px;
  border: 3px solid #E2E8F0; border-top-color: #054EAF;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

.dash-error {
  display: flex; align-items: center; gap: 10px;
  padding: 16px; background: #FEF2F2; border-radius: 10px;
  color: #DC2626; font-size: 13px;
}
.dash-error button { margin-left: auto; padding: 4px 10px; border: 1px solid #DC2626; border-radius: 6px; background: none; color: #DC2626; cursor: pointer; }

/* KPIs */
.dash-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.dash-kpi {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 2px 8px rgba(5,78,175,.06);
}
.dash-kpi-icon {
  width: 42px; height: 42px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dash-kpi-info { flex: 1; min-width: 0; }
.dash-kpi-label { display: block; font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
.dash-kpi-value { display: block; font-size: 20px; font-weight: 700; color: #0F172A; line-height: 1.2; }
.dash-kpi-sub { display: block; font-size: 11px; color: #94A3B8; margin-top: 3px; }
.dash-kpi-trend {
  display: flex; align-items: center; gap: 3px;
  font-size: 11px; font-weight: 600;
  padding: 2px 6px; border-radius: 6px;
  flex-shrink: 0;
}
.dash-kpi-trend.up   { background: #F0FDF4; color: #166534; }
.dash-kpi-trend.down { background: #FEF2F2; color: #991B1B; }

/* Charts */
.dash-charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 900px) {
  .dash-charts-row { grid-template-columns: 1fr; }
}

.dash-chart-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 2px 8px rgba(5,78,175,.06);
  padding: 18px;
}
.dash-chart-head { margin-bottom: 16px; }
.dash-chart-title { font-size: 14px; font-weight: 600; color: #0F172A; }

.dash-canvas {
  width: 100% !important;
  height: 260px !important;
}
.dash-canvas-sm { height: 280px !important; }

/* Exec table */
.dash-exec-table-wrap { overflow-x: auto; }
.dash-exec-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.dash-exec-table th {
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: #94A3B8;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1.5px solid #E2E8F0;
}
.dash-exec-table td {
  padding: 8px 10px;
  color: #374151;
  border-bottom: 1px solid #F1F5F9;
}
.dash-exec-table tr:last-child td { border-bottom: none; }
.exec-name { font-weight: 500; }
.exec-money { font-weight: 600; color: #0F172A; white-space: nowrap; }
.exec-tasa { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 6px; }
.tasa-good { background: #F0FDF4; color: #166534; }
.tasa-low  { background: #FEF2F2; color: #991B1B; }
</style>
