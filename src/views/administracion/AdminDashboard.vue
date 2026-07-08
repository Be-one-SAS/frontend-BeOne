<template>
  <div class="dash-page">

    <!-- Header -->
    <div class="dash-header">
      <div>
        <h1 class="dash-title">Dashboard Financiero</h1>
        <p class="dash-sub">Resumen ejecutivo · {{ mesActual }}</p>
      </div>
      <div class="dash-header-actions">
        <select v-if="sedes.length" v-model="sedeSeleccionada" class="dash-sede-select" @change="load">
          <option value="">Todas las sedes</option>
          <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
        </select>
        <router-link to="/administracion/movimientos" class="dash-link-movimientos">
          <ListOrdered :size="14" /> Ver movimientos
        </router-link>
        <button class="dash-refresh" @click="load" :disabled="loading">
          <RefreshCw :size="15" :class="{ spin: loading }" />
        </button>
      </div>
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
            <span class="dash-kpi-label">Balance neto (mes)</span>
            <span class="dash-kpi-value" :class="balance >= 0 ? 'val-pos' : 'val-neg'">{{ fmtMoney(balance) }}</span>
            <span class="dash-kpi-sub">{{ balance >= 0 ? 'Ganancia estimada' : 'Se está perdiendo dinero este mes' }} · Pagado − OC − Personal</span>
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
import { formatCOP } from '@/utils/currency.js'
import {
  RefreshCw, AlertCircle, TrendingUp, TrendingDown,
  DollarSign, FileText, CheckCircle, Clock, XCircle,
  Percent, ShoppingCart, Users, Scale, ListOrdered,
} from 'lucide-vue-next'
import { Chart, registerables } from 'chart.js'
import { getAdminDashboard } from '@/services/administracion.service.js'
import { getSedes } from '@/services/sedes.service.js'
import { ESTADO_ADMIN_STYLE } from '@/composables/useEstadoAdmin.js'

Chart.register(...registerables)

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const mesActual = computed(() => { const d = new Date(); return `${MESES[d.getMonth()]} ${d.getFullYear()}` })

function fmtMoney(n) {
  if (n == null || n === 0) return '$0'
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`
  return formatCOP(n)
}
function trend(current, prev) { if (!prev) return null; return ((current - prev) / prev) * 100 }

const loading = ref(false)
const error   = ref(null)
const data    = ref(null)
const sedes   = ref([])
const sedeSeleccionada = ref('')

const barRef      = ref(null)
const donutRef    = ref(null)
const clientesRef = ref(null)
const provRef     = ref(null)
let barChart = null, donutChart = null, clientesChart = null, provChart = null

const balance = computed(() => data.value?.balanceNeto ?? 0)

const kpisIngresos = computed(() => {
  if (!data.value?.kpis) return []
  const k = data.value.kpis
  const facTrend = trend(k.facturadoMes, k.facturadoPrev)
  const pagTrend = trend(k.pagadoMes, k.pagadoPrev)
  return [
    { label: 'Facturado (mes)',         value: fmtMoney(k.facturadoMes),  sub: `${k.facturadoMesCount} cotizaciones`, trend: facTrend, trendPos: facTrend >= 0, icon: DollarSign,   iconBg: '#E0F9FA', iconColor: '#27C8D8' },
    { label: 'Pagado (mes)',            value: fmtMoney(k.pagadoMes),     sub: `${k.pagadoMesCount} pagos`,          trend: pagTrend, trendPos: pagTrend >= 0, icon: CheckCircle,  iconBg: '#F0FDF4', iconColor: '#166534' },
    { label: 'Cotizado aprobado (mes)', value: fmtMoney(k.cotizadoMes),   sub: `${k.cotizadoMesCount} eventos`,      trend: null,     icon: FileText,          iconBg: '#F0FAFB', iconColor: '#27C8D8' },
    { label: 'Por cobrar (total)',      value: fmtMoney(k.porCobrar),     sub: `${k.porCobrarCount} pendientes`,    trend: null,     icon: Clock,             iconBg: '#FFFBEB', iconColor: '#92400E' },
    { label: 'Anulado (mes)',           value: fmtMoney(k.anuladoMes),    sub: `${k.anuladoMesCount} cancelados`,   trend: null,     icon: XCircle,           iconBg: '#FEF2F2', iconColor: '#991B1B' },
  ]
})

const ROL_COLORS = { LOGISTICA: '#27C8D8', OPERATIVO: '#059669', SUPERVISOR: '#7C3AED', COORDINADOR: '#D97706', EJECUTIVO: '#D97706', EJECUTIVO_CUENTA: '#D97706', LIDER: '#0F1A2E' }
const rolColor = (rol) => ROL_COLORS[rol] ?? '#94A3B8'

async function load() {
  loading.value = true
  error.value   = null
  try {
    data.value = await getAdminDashboard(sedeSeleccionada.value || undefined)
    await nextTick()
    buildCharts()
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando dashboard'
  } finally {
    loading.value = false
  }
}

async function loadSedes() {
  try {
    const { data: res } = await getSedes()
    sedes.value = res
  } catch (e) {
    // Si el usuario no tiene permiso de ver todas las sedes, el dashboard
    // simplemente queda filtrado a la suya sin selector.
    sedes.value = []
  }
}

onMounted(() => { load(); loadSedes() })
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
        { label: 'Ingresos', data: allMonths.map(m => ingMap[m] ?? 0), backgroundColor: 'rgba(39,200,216,0.8)', borderRadius: 5, borderSkipped: false },
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
/* ── Base ─────────────────────────────────────────────── */
.dash-page {
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ───────────────────────────────────────────── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
}
.dash-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}
.dash-sub {
  font-size: 13px;
  color: #64748B;
  margin: 3px 0 0;
}
.dash-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  color: #64748B;
  transition: border-color .15s, color .15s;
}
.dash-refresh:hover { border-color: #27C8D8; color: #27C8D8; }

.dash-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dash-sede-select {
  padding: 8px 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #fff;
  color: #0F1A2E;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  outline: none;
}
.dash-sede-select:focus { border-color: #27C8D8; }
.dash-link-movimientos {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #fff;
  color: #27C8D8;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: border-color .15s, background .15s;
}
.dash-link-movimientos:hover { border-color: #27C8D8; background: #F0FAFB; }

/* ── States ───────────────────────────────────────────── */
.dash-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px;
  color: #64748B;
  font-size: 14px;
}
.dash-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #E2E8F0;
  border-top-color: #27C8D8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

.dash-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 12px;
  color: #DC2626;
  font-size: 13px;
  font-weight: 500;
}
.dash-error button {
  margin-left: auto;
  padding: 5px 12px;
  border: 1.5px solid #DC2626;
  border-radius: 8px;
  background: none;
  color: #DC2626;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}

/* ── Section label ────────────────────────────────────── */
.dash-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: .07em;
}
.dash-section-label::before {
  content: '';
  display: block;
  width: 3px;
  height: 14px;
  background: #27C8D8;
  border-radius: 2px;
}

/* ── KPI cards ────────────────────────────────────────── */
.dash-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
}
.dash-kpis-bottom {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
@media (max-width: 1100px) { .dash-kpis-bottom { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px)  { .dash-kpis-bottom { grid-template-columns: 1fr; } }

.dash-kpi {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E5EAF0;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
  transition: box-shadow .15s, border-color .15s;
}
.dash-kpi:hover {
  border-color: #A7EEF5;
  box-shadow: 0 2px 10px rgba(39,200,216,.12), 0 8px 24px rgba(39,200,216,.12);
}
.dash-kpi--gasto    { border-left: 3px solid #FCA5A5; }
.dash-kpi--personal { border-left: 3px solid #C4B5FD; }
.dash-kpi--pos      { border-left: 3px solid #6EE7B7; }
.dash-kpi--neg      { border-left: 3px solid #FCA5A5; }

.dash-kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dash-kpi-info { flex: 1; min-width: 0; }
.dash-kpi-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: 5px;
}
.dash-kpi-value {
  display: block;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 21px;
  font-weight: 700;
  color: #0F1A2E;
  line-height: 1.15;
}
.val-pos { color: #059669; }
.val-neg { color: #DC2626; }
.dash-kpi-sub {
  display: block;
  font-size: 11px;
  color: #94A3B8;
  margin-top: 4px;
}
.dash-kpi-trend {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 20px;
  flex-shrink: 0;
}
.dash-kpi-trend.up   { background: #F0FDF4; color: #166534; }
.dash-kpi-trend.down { background: #FEF2F2; color: #991B1B; }

/* ── Chart cards ──────────────────────────────────────── */
.dash-charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
@media (max-width: 960px) { .dash-charts-row { grid-template-columns: 1fr; } }

.dash-chart-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E5EAF0;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.dash-chart-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid #E5EAF0;
  margin-bottom: 16px;
}
.dash-chart-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #0F1A2E;
}
.dash-canvas { width: 100% !important; height: 260px !important; }
.dash-canvas-sm { height: 280px !important; }
.dash-empty {
  font-size: 13px;
  color: #94A3B8;
  padding: 24px 0;
  text-align: center;
  font-style: italic;
}

/* ── Personal por rol ─────────────────────────────────── */
.dash-personal-list { display: flex; flex-direction: column; gap: 10px; }
.dash-personal-row {
  display: grid;
  grid-template-columns: 120px 40px 1fr 88px;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.dash-personal-rol { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #374151; }
.dash-rol-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dash-personal-horas { color: #94A3B8; font-size: 11px; }
.dash-personal-bar-wrap { background: #F1F5F9; border-radius: 99px; height: 5px; overflow: hidden; }
.dash-personal-bar { height: 100%; border-radius: 99px; transition: width .5s ease; }
.dash-personal-costo { font-weight: 700; color: #0F1A2E; text-align: right; white-space: nowrap; font-size: 12px; }

/* ── OC por estado ────────────────────────────────────── */
.dash-oc-estados { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.dash-oc-estado-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  padding: 7px 10px;
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E5EAF0;
}
.dash-oc-estado-name { flex: 1; font-weight: 500; color: #374151; }
.dash-oc-count {
  background: #E2E8F0;
  color: #475569;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.dash-oc-total { font-weight: 700; color: #DC2626; white-space: nowrap; }

/* ── Exec table ───────────────────────────────────────── */
.dash-exec-table-wrap { overflow-x: auto; }
.dash-exec-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.dash-exec-table th {
  padding: 9px 12px;
  text-align: left;
  font-weight: 700;
  color: #94A3B8;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .05em;
  border-bottom: 1.5px solid #E5EAF0;
  background: #F8FAFC;
}
.dash-exec-table td {
  padding: 9px 12px;
  color: #374151;
  border-bottom: 1px solid #F1F5FA;
}
.dash-exec-table tbody tr:hover td { background: #F0FAFB; }
.dash-exec-table tr:last-child td { border-bottom: none; }
.exec-name { font-weight: 600; color: #0F1A2E; }
.exec-money { font-weight: 700; color: #0F1A2E; white-space: nowrap; }
.exec-tasa { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.tasa-good { background: #F0FDF4; color: #166534; }
.tasa-low  { background: #FEF2F2; color: #991B1B; }
</style>
