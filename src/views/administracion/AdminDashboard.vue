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

    <div v-if="loading && !data" class="dash-loading">
      <div class="dash-spinner" /><span>Cargando dashboard…</span>
    </div>
    <div v-else-if="error" class="dash-error">
      <AlertCircle :size="18" /> {{ error }}
      <button @click="load">Reintentar</button>
    </div>

    <template v-else-if="data">

      <!-- ══ KPIs INGRESOS ══════════════════════════════════ -->
      <div class="dash-section-label">Ingresos</div>
      <div class="dash-kpis">
        <div v-for="kpi in kpisIngresos" :key="kpi.label" class="dash-kpi">
          <div class="dash-kpi-icon" :style="{ background: kpi.iconBg }">
            <component :is="kpi.icon" :size="20" :color="kpi.iconColor" />
          </div>
          <div class="dash-kpi-info">
            <span class="dash-kpi-label">{{ kpi.label }}</span>
            <span class="dash-kpi-value">{{ kpi.value }}</span>
            <span v-if="kpi.sub" class="dash-kpi-sub">{{ kpi.sub }}</span>
          </div>
          <div v-if="kpi.trend != null" class="dash-kpi-trend" :class="kpi.trendPos ? 'up' : 'down'">
            <TrendingUp v-if="kpi.trendPos" :size="13" />
            <TrendingDown v-else :size="13" />
            {{ Math.abs(kpi.trend).toFixed(1) }}%
          </div>
        </div>
      </div>

      <!-- ══ KPIs GASTOS + BALANCE ═════════════════════════ -->
      <div class="dash-kpis-bottom">
        <!-- Gastos OC -->
        <div class="dash-kpi dash-kpi--gasto">
          <div class="dash-kpi-icon" style="background:#FEF2F2">
            <ShoppingCart :size="20" color="#DC2626" />
          </div>
          <div class="dash-kpi-info">
            <span class="dash-kpi-label">Gastos OC (total)</span>
            <span class="dash-kpi-value">{{ fmtMoney(data.gastos.totalHistorico) }}</span>
            <span class="dash-kpi-sub">{{ data.gastos.totalHistoricoCount }} órdenes · {{ fmtMoney(data.gastos.totalMes) }} este mes</span>
          </div>
        </div>
        <!-- Costo personal -->
        <div class="dash-kpi dash-kpi--personal">
          <div class="dash-kpi-icon" style="background:#F5F3FF">
            <Users :size="20" color="#6D28D9" />
          </div>
          <div class="dash-kpi-info">
            <span class="dash-kpi-label">Costo personal</span>
            <span class="dash-kpi-value">{{ fmtMoney(data.personal.costoTotal) }}</span>
            <span class="dash-kpi-sub">{{ data.personal.registros }} registros de turno</span>
          </div>
        </div>
        <!-- Balance neto -->
        <div class="dash-kpi dash-kpi--balance" :class="balance >= 0 ? 'dash-kpi--pos' : 'dash-kpi--neg'">
          <div class="dash-kpi-icon" :style="{ background: balance >= 0 ? '#F0FDF4' : '#FEF2F2' }">
            <Scale :size="20" :color="balance >= 0 ? '#166534' : '#991B1B'" />
          </div>
          <div class="dash-kpi-info">
            <span class="dash-kpi-label">Balance neto estimado</span>
            <span class="dash-kpi-value" :class="balance >= 0 ? 'val-pos' : 'val-neg'">{{ fmtMoney(balance) }}</span>
            <span class="dash-kpi-sub">Pagado − OC − Personal</span>
          </div>
        </div>
        <!-- Tasa cierre -->
        <div class="dash-kpi">
          <div class="dash-kpi-icon" style="background:#F5F3FF">
            <Percent :size="20" color="#6D28D9" />
          </div>
          <div class="dash-kpi-info">
            <span class="dash-kpi-label">Tasa de cierre</span>
            <span class="dash-kpi-value">{{ data.kpis.tasaCierre }}%</span>
            <span class="dash-kpi-sub">Aprobadas / Total</span>
          </div>
        </div>
      </div>

      <!-- ══ INGRESOS por mes ═══════════════════════════════ -->
      <div class="dash-charts-row">
        <div class="dash-chart-card dash-chart-wide">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Ingresos aprobados vs Gastos OC por mes (12 meses)</span>
          </div>
          <canvas ref="barRef" class="dash-canvas" />
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Por estado administrativo</span>
          </div>
          <canvas ref="donutRef" class="dash-canvas dash-canvas-sm" />
        </div>
      </div>

      <!-- ══ GASTOS + PERSONAL ══════════════════════════════ -->
      <div class="dash-charts-row">
        <!-- Top proveedores OC -->
        <div class="dash-chart-card">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Top proveedores por gasto (OC)</span>
          </div>
          <canvas ref="provRef" class="dash-canvas" />
        </div>

        <!-- Costo personal por rol -->
        <div class="dash-chart-card">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Costo personal por rol</span>
          </div>
          <div v-if="!data.personal.porRol.length" class="dash-empty">Sin datos de personal registrados</div>
          <div v-else class="dash-personal-list">
            <div v-for="r in data.personal.porRol" :key="r.rol" class="dash-personal-row">
              <span class="dash-personal-rol">
                <span class="dash-rol-dot" :style="{ background: rolColor(r.rol) }" />
                {{ r.rol }}
              </span>
              <span class="dash-personal-horas">{{ r.horas }}h</span>
              <div class="dash-personal-bar-wrap">
                <div class="dash-personal-bar" :style="{ width: ((r.costo / data.personal.costoTotal) * 100).toFixed(1) + '%', background: rolColor(r.rol) }" />
              </div>
              <span class="dash-personal-costo">{{ fmtMoney(r.costo) }}</span>
            </div>
          </div>

          <!-- OC por estado -->
          <div class="dash-chart-head" style="margin-top:20px">
            <span class="dash-chart-title">Órdenes de compra por estado</span>
          </div>
          <div class="dash-oc-estados">
            <div v-for="e in data.gastos.porEstado" :key="e.estado" class="dash-oc-estado-row">
              <span class="dash-oc-estado-name">{{ e.estado }}</span>
              <span class="dash-oc-count">{{ e.count }}</span>
              <span class="dash-oc-total">{{ fmtMoney(e.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ CLIENTES + EJECUTIVOS ══════════════════════════ -->
      <div class="dash-charts-row">
        <div class="dash-chart-card dash-chart-wide">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Top 10 clientes por valor aprobado</span>
          </div>
          <canvas ref="clientesRef" class="dash-canvas" />
        </div>
        <div class="dash-chart-card">
          <div class="dash-chart-head">
            <span class="dash-chart-title">Por ejecutivo / agente</span>
          </div>
          <div class="dash-exec-table-wrap">
            <table class="dash-exec-table">
              <thead><tr><th>Ejecutivo</th><th>Cots.</th><th>Aprobadas</th><th>Tasa</th><th>Total</th></tr></thead>
              <tbody>
                <tr v-for="e in data.porEjecutivo" :key="e.agente">
                  <td class="exec-name">{{ e.agente }}</td>
                  <td>{{ e.count }}</td>
                  <td>{{ e.aprobadas }}</td>
                  <td><span class="exec-tasa" :class="e.tasa >= 50 ? 'tasa-good' : 'tasa-low'">{{ e.tasa }}%</span></td>
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
  DollarSign, FileText, CheckCircle, Clock, XCircle,
  Percent, ShoppingCart, Users, Scale,
} from 'lucide-vue-next'
import { Chart, registerables } from 'chart.js'
import { getAdminDashboard } from '@/services/administracion.service.js'
import { ESTADO_ADMIN_STYLE } from '@/composables/useEstadoAdmin.js'

Chart.register(...registerables)

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const mesActual = computed(() => { const d = new Date(); return `${MESES[d.getMonth()]} ${d.getFullYear()}` })

function fmtMoney(n) {
  if (n == null || n === 0) return '$0'
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function trend(current, prev) { if (!prev) return null; return ((current - prev) / prev) * 100 }

const loading = ref(false)
const error   = ref(null)
const data    = ref(null)

const barRef      = ref(null)
const donutRef    = ref(null)
const clientesRef = ref(null)
const provRef     = ref(null)
let barChart = null, donutChart = null, clientesChart = null, provChart = null

const balance = computed(() => {
  if (!data.value) return 0
  return (data.value.kpis.pagadoMes * 12) - data.value.gastos.totalHistorico - data.value.personal.costoTotal
})

const kpisIngresos = computed(() => {
  if (!data.value?.kpis) return []
  const k = data.value.kpis
  const facTrend = trend(k.facturadoMes, k.facturadoPrev)
  const pagTrend = trend(k.pagadoMes, k.pagadoPrev)
  return [
    { label: 'Facturado (mes)',         value: fmtMoney(k.facturadoMes),  sub: `${k.facturadoMesCount} cotizaciones`, trend: facTrend, trendPos: facTrend >= 0, icon: DollarSign,   iconBg: '#EFF6FF', iconColor: '#1D4ED8' },
    { label: 'Pagado (mes)',            value: fmtMoney(k.pagadoMes),     sub: `${k.pagadoMesCount} cotizaciones`,   trend: pagTrend, trendPos: pagTrend >= 0, icon: CheckCircle,  iconBg: '#F0FDF4', iconColor: '#166534' },
    { label: 'Cotizado aprobado (mes)', value: fmtMoney(k.cotizadoMes),   sub: `${k.cotizadoMesCount} eventos`,      trend: null,     icon: FileText,          iconBg: '#EBF3FC', iconColor: '#054EAF' },
    { label: 'Por cobrar (total)',      value: fmtMoney(k.porCobrar),     sub: `${k.porCobrarCount} pendientes`,    trend: null,     icon: Clock,             iconBg: '#FFFBEB', iconColor: '#92400E' },
    { label: 'Anulado (mes)',           value: fmtMoney(k.anuladoMes),    sub: `${k.anuladoMesCount} cancelados`,   trend: null,     icon: XCircle,           iconBg: '#FEF2F2', iconColor: '#991B1B' },
  ]
})

const ROL_COLORS = { LOGISTICA: '#2563EB', OPERATIVO: '#059669', SUPERVISOR: '#7C3AED', COORDINADOR: '#D97706', LIDER: '#0F1A2E' }
const rolColor = (rol) => ROL_COLORS[rol] ?? '#94A3B8'

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
onUnmounted(() => { barChart?.destroy(); donutChart?.destroy(); clientesChart?.destroy(); provChart?.destroy() })

function buildCharts() { buildBarChart(); buildDonutChart(); buildClientesChart(); buildProvChart() }

function buildBarChart() {
  if (barChart) { barChart.destroy(); barChart = null }
  if (!barRef.value) return

  const ingItems = data.value?.ingresosPorMes ?? []
  const gasItems = data.value?.gastos?.porMes ?? []

  // Merge labels
  const allMonths = [...new Set([...ingItems.map(i => i.month), ...gasItems.map(g => g.month)])].sort()
  const ingMap = Object.fromEntries(ingItems.map(i => [i.month, i.totalIngresos]))
  const gasMap = Object.fromEntries(gasItems.map(g => [g.month, g.total]))
  const labels = allMonths.map(m => { const [y, mo] = m.split('-'); return `${MESES[parseInt(mo)-1]} ${y.slice(2)}` })

  barChart = new Chart(barRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Ingresos', data: allMonths.map(m => ingMap[m] ?? 0), backgroundColor: 'rgba(5,78,175,0.8)', borderRadius: 5, borderSkipped: false },
        { label: 'Gastos OC', data: allMonths.map(m => gasMap[m] ?? 0), backgroundColor: 'rgba(220,38,38,0.7)', borderRadius: 5, borderSkipped: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtMoney(ctx.parsed.y)}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, callback: v => fmtMoney(v) } },
      },
    },
  })
}

function buildDonutChart() {
  if (donutChart) { donutChart.destroy(); donutChart = null }
  if (!donutRef.value || !data.value?.distribucionEstadoAdmin?.length) return
  const items = data.value.distribucionEstadoAdmin.slice(0, 10)
  donutChart = new Chart(donutRef.value, {
    type: 'doughnut',
    data: {
      labels: items.map(i => i.estado),
      datasets: [{ data: items.map(i => i.count), backgroundColor: items.map(i => ESTADO_ADMIN_STYLE[i.estado]?.bg ?? '#F1F5F9'), borderColor: items.map(i => ESTADO_ADMIN_STYLE[i.estado]?.color ?? '#94A3B8'), borderWidth: 1.5, hoverOffset: 6 }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 8 } }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} cotizaciones` } } } },
  })
}

function buildClientesChart() {
  if (clientesChart) { clientesChart.destroy(); clientesChart = null }
  if (!clientesRef.value || !data.value?.topClientes?.length) return
  const items = data.value.topClientes.slice(0, 10)
  clientesChart = new Chart(clientesRef.value, {
    type: 'bar',
    data: { labels: items.map(i => i.cliente.length > 22 ? i.cliente.slice(0,22)+'…' : i.cliente), datasets: [{ label: 'Total aprobado', data: items.map(i => i.total), backgroundColor: 'rgba(22,163,74,0.75)', borderRadius: 4, borderSkipped: false }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmtMoney(ctx.parsed.x) } } }, scales: { x: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, callback: v => fmtMoney(v) } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } } },
  })
}

function buildProvChart() {
  if (provChart) { provChart.destroy(); provChart = null }
  if (!provRef.value || !data.value?.gastos?.topProveedores?.length) return
  const items = data.value.gastos.topProveedores
  provChart = new Chart(provRef.value, {
    type: 'bar',
    data: { labels: items.map(i => i.proveedor.length > 22 ? i.proveedor.slice(0,22)+'…' : i.proveedor), datasets: [{ label: 'Gasto total', data: items.map(i => i.total), backgroundColor: 'rgba(220,38,38,0.7)', borderRadius: 4, borderSkipped: false }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmtMoney(ctx.parsed.x) } } }, scales: { x: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, callback: v => fmtMoney(v) } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } } },
  })
}
</script>

<style scoped>
.dash-page { padding: 20px 24px; width: 100%; box-sizing: border-box; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; gap: 16px; }

.dash-header { display: flex; align-items: flex-start; justify-content: space-between; }
.dash-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
.dash-sub { font-size: 13px; color: #64748B; margin: 2px 0 0; }
.dash-refresh { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1.5px solid #E2E8F0; border-radius: 8px; background: #fff; cursor: pointer; color: #64748B; }
.dash-refresh:hover { background: #F8FAFC; }

.dash-loading { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px; color: #64748B; font-size: 14px; }
.dash-spinner { width: 28px; height: 28px; border: 3px solid #E2E8F0; border-top-color: #054EAF; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
.dash-error { display: flex; align-items: center; gap: 10px; padding: 16px; background: #FEF2F2; border-radius: 10px; color: #DC2626; font-size: 13px; }
.dash-error button { margin-left: auto; padding: 4px 10px; border: 1px solid #DC2626; border-radius: 6px; background: none; color: #DC2626; cursor: pointer; }

/* Section label */
.dash-section-label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: .06em; }

/* KPIs ingresos */
.dash-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }

/* KPIs bottom row */
.dash-kpis-bottom { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 900px) { .dash-kpis-bottom { grid-template-columns: repeat(2, 1fr); } }

.dash-kpi { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px; background: #fff; border-radius: 14px; box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 2px 8px rgba(5,78,175,.06); }
.dash-kpi--gasto    { border-left: 3px solid #FCA5A5; }
.dash-kpi--personal { border-left: 3px solid #C4B5FD; }
.dash-kpi--pos      { border-left: 3px solid #86EFAC; }
.dash-kpi--neg      { border-left: 3px solid #FCA5A5; }
.dash-kpi-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dash-kpi-info { flex: 1; min-width: 0; }
.dash-kpi-label { display: block; font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
.dash-kpi-value { display: block; font-size: 20px; font-weight: 700; color: #0F172A; line-height: 1.2; }
.val-pos { color: #059669; }
.val-neg { color: #DC2626; }
.dash-kpi-sub { display: block; font-size: 11px; color: #94A3B8; margin-top: 3px; }
.dash-kpi-trend { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 6px; flex-shrink: 0; }
.dash-kpi-trend.up   { background: #F0FDF4; color: #166534; }
.dash-kpi-trend.down { background: #FEF2F2; color: #991B1B; }

/* Charts */
.dash-charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
@media (max-width: 900px) { .dash-charts-row { grid-template-columns: 1fr; } }
.dash-chart-card { background: #fff; border-radius: 14px; box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 2px 8px rgba(5,78,175,.06); padding: 18px; }
.dash-chart-head { margin-bottom: 14px; }
.dash-chart-title { font-size: 13px; font-weight: 600; color: #0F172A; }
.dash-canvas { width: 100% !important; height: 260px !important; }
.dash-canvas-sm { height: 280px !important; }
.dash-empty { font-size: 13px; color: #94A3B8; padding: 20px 0; text-align: center; }

/* Personal por rol */
.dash-personal-list { display: flex; flex-direction: column; gap: 10px; }
.dash-personal-row { display: grid; grid-template-columns: 120px 42px 1fr 90px; align-items: center; gap: 8px; font-size: 12px; }
.dash-personal-rol { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #374151; }
.dash-rol-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dash-personal-horas { color: #64748B; font-size: 11px; }
.dash-personal-bar-wrap { background: #F1F5F9; border-radius: 99px; height: 6px; overflow: hidden; }
.dash-personal-bar { height: 100%; border-radius: 99px; transition: width .4s ease; }
.dash-personal-costo { font-weight: 700; color: #0F172A; text-align: right; white-space: nowrap; }

/* OC por estado */
.dash-oc-estados { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.dash-oc-estado-row { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 6px 8px; background: #F8FAFC; border-radius: 8px; }
.dash-oc-estado-name { flex: 1; font-weight: 500; color: #374151; }
.dash-oc-count { background: #E2E8F0; color: #475569; padding: 1px 7px; border-radius: 99px; font-size: 11px; font-weight: 600; }
.dash-oc-total { font-weight: 700; color: #DC2626; white-space: nowrap; }

/* Exec table */
.dash-exec-table-wrap { overflow-x: auto; }
.dash-exec-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.dash-exec-table th { padding: 8px 10px; text-align: left; font-weight: 600; color: #94A3B8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1.5px solid #E2E8F0; }
.dash-exec-table td { padding: 8px 10px; color: #374151; border-bottom: 1px solid #F1F5F9; }
.dash-exec-table tr:last-child td { border-bottom: none; }
.exec-name { font-weight: 500; }
.exec-money { font-weight: 600; color: #0F172A; white-space: nowrap; }
.exec-tasa { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 6px; }
.tasa-good { background: #F0FDF4; color: #166534; }
.tasa-low  { background: #FEF2F2; color: #991B1B; }
</style>
