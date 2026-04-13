<template>
  <div class="rf-wrap">

    <!-- ══════════════════════════════════════════════
         FILTROS
    ══════════════════════════════════════════════ -->
    <div class="rf-filter-card">
      <div class="rf-filter-grid">

        <div class="rf-field">
          <label class="rf-label">Año</label>
          <select v-model="filtros.year" class="rf-select">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <div class="rf-field">
          <label class="rf-label">Mes</label>
          <select v-model="filtros.month" class="rf-select">
            <option value="">Todos los meses</option>
            <option v-for="(m, i) in MESES" :key="i" :value="i + 1">{{ m }}</option>
          </select>
        </div>

        <div class="rf-field">
          <label class="rf-label">Sede</label>
          <select v-model="filtros.sede" class="rf-select">
            <option value="">Todas las sedes</option>
            <option v-for="s in SEDES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <button class="rf-btn-apply" :disabled="loading" @click="cargarDatos">
          <BarChart2 :size="14" />
          Aplicar filtros
        </button>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         ERROR
    ══════════════════════════════════════════════ -->
    <div v-if="error" class="rf-error-card">
      <AlertCircle :size="36" class="rf-error-icon" />
      <p class="rf-error-msg">{{ error }}</p>
      <button class="rf-btn-retry" @click="cargarDatos">Reintentar</button>
    </div>

    <template v-else>

      <!-- ══════════════════════════════════════════
           KPIs GLOBALES
      ══════════════════════════════════════════ -->
      <div class="rf-kpi-grid">
        <template v-if="loading">
          <div v-for="i in 4" :key="i" class="rf-kpi-skel" />
        </template>
        <template v-else>
          <div v-for="kpi in kpiList" :key="kpi.label" class="rf-kpi-card">
            <div class="rf-kpi-icon" :style="{ background: kpi.iconBg }">
              <component :is="kpi.icon" :size="18" :color="kpi.iconColor" />
            </div>
            <div class="rf-kpi-body">
              <p class="rf-kpi-label">{{ kpi.label }}</p>
              <p class="rf-kpi-value">{{ kpi.value }}</p>
              <div
                v-if="kpi.trend !== null && kpi.trend !== undefined"
                class="rf-kpi-trend"
                :class="kpi.trend >= 0 ? 'rf-trend-up' : 'rf-trend-down'"
              >
                <TrendingUp v-if="kpi.trend >= 0" :size="11" />
                <TrendingDown v-else :size="11" />
                {{ Math.abs(kpi.trend) }}% vs mes anterior
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ══════════════════════════════════════════
           FILA 1 — Evolución Mensual + Estados
      ══════════════════════════════════════════ -->
      <div class="rf-charts-row">

        <div class="rf-chart-card">
          <div class="rf-chart-header">
            <TrendingUp :size="15" class="rf-chart-hico" />
            <span>Evolución Mensual</span>
          </div>
          <div class="rf-chart-body">
            <div v-if="loading" class="rf-chart-skel" />
            <div v-else-if="!data.evolucionMensual?.length" class="rf-no-data">Sin datos para el período</div>
            <canvas v-else ref="evolucionRef" />
          </div>
        </div>

        <div class="rf-chart-card">
          <div class="rf-chart-header">
            <PieChart :size="15" class="rf-chart-hico" />
            <span>Distribución por Estado</span>
          </div>
          <div class="rf-chart-body rf-chart-body--donut">
            <div v-if="loading" class="rf-chart-skel" />
            <div v-else-if="!data.distribucionEstados?.length" class="rf-no-data">Sin datos para el período</div>
            <canvas v-else ref="estadosRef" />
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════
           FILA 2 — Top Productos + Por Agente
      ══════════════════════════════════════════ -->
      <div class="rf-charts-row">

        <div class="rf-chart-card">
          <div class="rf-chart-header">
            <Boxes :size="15" class="rf-chart-hico" />
            <span>Top 5 Productos más cotizados</span>
          </div>
          <div class="rf-chart-body">
            <div v-if="loading" class="rf-chart-skel" />
            <div v-else-if="!data.topProductos?.length" class="rf-no-data">Sin datos para el período</div>
            <canvas v-else ref="productosRef" />
          </div>
        </div>

        <div class="rf-chart-card">
          <div class="rf-chart-header">
            <Users :size="15" class="rf-chart-hico" />
            <span>Cotizaciones por Agente</span>
          </div>
          <div class="rf-chart-body">
            <div v-if="loading" class="rf-chart-skel" />
            <div v-else-if="!data.porAgente?.length" class="rf-no-data">Sin datos para el período</div>
            <canvas v-else ref="agenteRef" />
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════
           RENDIMIENTO POR SEDE
      ══════════════════════════════════════════ -->
      <div class="rf-section-card">
        <div class="rf-section-header">
          <MapPin :size="15" class="rf-chart-hico" />
          <span>Rendimiento por Sede</span>
        </div>

        <template v-if="loading">
          <div v-for="i in 4" :key="i" class="rf-row-skel" />
        </template>

        <div v-else-if="!data.sedes?.length" class="rf-no-data rf-no-data--pad">
          Sin datos de sedes para el período
        </div>

        <div v-else class="rf-table-scroll">
          <table class="rf-table">
            <thead>
              <tr>
                <th>Sede</th>
                <th class="rf-th-r">Cotizaciones</th>
                <th class="rf-th-r">Valor Total</th>
                <th class="rf-th-r">Aprobadas</th>
                <th class="rf-th-r">Tasa Aprobación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in data.sedes" :key="s.nombre" class="rf-tr">
                <td class="rf-td-sede">{{ s.nombre }}</td>
                <td class="rf-td-r">{{ s.cotizaciones }}</td>
                <td class="rf-td-r rf-val">{{ fmt(s.valorTotal) }}</td>
                <td class="rf-td-r">{{ s.aprobadas }}</td>
                <td class="rf-td-r">
                  <span class="rf-tasa-badge" :class="tasaClass(s.tasa)">{{ s.tasa.toFixed(1) }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           ÚLTIMAS COTIZACIONES
      ══════════════════════════════════════════ -->
      <div class="rf-section-card">
        <div class="rf-section-header">
          <FileText :size="15" class="rf-chart-hico" />
          <span>Últimas Cotizaciones</span>
        </div>

        <template v-if="loading">
          <div v-for="i in 5" :key="i" class="rf-row-skel" />
        </template>

        <div v-else-if="!data.ultimasCotizaciones?.length" class="rf-no-data rf-no-data--pad">
          Sin cotizaciones en el período seleccionado
        </div>

        <div v-else class="rf-table-scroll">
          <table class="rf-table">
            <thead>
              <tr>
                <th class="rf-th-num">#</th>
                <th>Cliente</th>
                <th>Agente</th>
                <th class="rf-th-r">Total</th>
                <th class="rf-th-c">Estado</th>
                <th class="rf-th-r">Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in data.ultimasCotizaciones" :key="c.id" class="rf-tr">
                <td class="rf-td-num">{{ i + 1 }}</td>
                <td class="rf-td-name">{{ c.cliente }}</td>
                <td class="rf-td-meta">{{ c.agente }}</td>
                <td class="rf-td-r rf-val">{{ fmt(c.total) }}</td>
                <td class="rf-td-c">
                  <span class="rf-status-badge" :class="statusClass(c.estado)">{{ c.estado }}</span>
                </td>
                <td class="rf-td-r rf-td-meta">{{ fmtDate(c.fecha) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import {
  BarChart2, TrendingUp, TrendingDown, PieChart,
  Boxes, Users, MapPin, FileText,
  DollarSign, CheckCircle2, ReceiptText,
  AlertCircle,
} from 'lucide-vue-next'
import { getFinancialReport } from '@/services/financial-report.service'

Chart.register(...registerables)

// ── Constantes ─────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const SEDES = ['Bogotá','Medellín','Cali','Barranquilla','Bucaramanga','Cartagena','Santa Marta','Pereira']

const now   = new Date()
const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)

// ── Estado ─────────────────────────────────────────────────
const filtros = ref({ year: now.getFullYear(), month: '', sede: '' })
const loading = ref(false)
const error   = ref(null)

const data = ref({
  kpis:                null,
  evolucionMensual:    [],
  distribucionEstados: [],
  topProductos:        [],
  porAgente:           [],
  sedes:               [],
  ultimasCotizaciones: [],
})

// ── Canvas refs ────────────────────────────────────────────
const evolucionRef  = ref(null)
const estadosRef    = ref(null)
const productosRef  = ref(null)
const agenteRef     = ref(null)

// ── Chart instances (para destruir en unmount/reload) ──────
let evolucionChart  = null
let estadosChart    = null
let productosChart  = null
let agenteChart     = null

// ── KPIs computed ──────────────────────────────────────────
const kpiList = computed(() => {
  const k = data.value.kpis
  if (!k) return []
  return [
    {
      label: 'Total Cotizaciones',
      value: k.totalCotizaciones ?? 0,
      trend: k.totalCotizacionesTrend ?? null,
      icon: FileText,
      iconBg: '#EBF3FC', iconColor: '#054EAF',
    },
    {
      label: 'Valor Cotizado',
      value: fmt(k.valorCotizado ?? 0),
      trend: k.valorCotizadoTrend ?? null,
      icon: DollarSign,
      iconBg: '#DCFCE7', iconColor: '#16A34A',
    },
    {
      label: 'Tasa Aprobación',
      value: `${(k.tasaAprobacion ?? 0).toFixed(1)}%`,
      trend: k.tasaAprobacionTrend ?? null,
      icon: CheckCircle2,
      iconBg: '#EDE9FE', iconColor: '#7C3AED',
    },
    {
      label: 'Ticket Promedio',
      value: fmt(k.ticketPromedio ?? 0),
      trend: k.ticketPromedioTrend ?? null,
      icon: ReceiptText,
      iconBg: '#FEF3C7', iconColor: '#B45309',
    },
  ]
})

// ── Carga de datos ─────────────────────────────────────────
const cargarDatos = async () => {
  loading.value = true
  error.value   = null
  destroyCharts()

  try {
    const res = await getFinancialReport({
      year:  filtros.value.year,
      month: filtros.value.month || undefined,
      sede:  filtros.value.sede  || undefined,
    })
    data.value = {
      kpis:                res.kpis                ?? null,
      evolucionMensual:    res.evolucionMensual    ?? [],
      distribucionEstados: res.distribucionEstados ?? [],
      topProductos:        res.topProductos        ?? [],
      porAgente:           res.porAgente           ?? [],
      sedes:               res.sedes               ?? [],
      ultimasCotizaciones: res.ultimasCotizaciones ?? [],
    }
    loading.value = false
    await nextTick()
    initCharts()
  } catch (e) {
    error.value   = e?.response?.data?.message ?? 'No se pudo cargar el reporte financiero'
    loading.value = false
  }
}

// ── Chart lifecycle ────────────────────────────────────────
const destroyCharts = () => {
  evolucionChart?.destroy();  evolucionChart  = null
  estadosChart?.destroy();    estadosChart    = null
  productosChart?.destroy();  productosChart  = null
  agenteChart?.destroy();     agenteChart     = null
}

const TICK = { color: '#94A3B8', font: { family: 'Inter', size: 11 } }
const GRID = { color: '#F1F5FA' }
const LGND = { font: { family: 'Inter', size: 11 }, color: '#64748B', boxWidth: 10, padding: 14 }

const initCharts = () => {
  initEvolucion()
  initEstados()
  initProductos()
  initAgente()
}

const initEvolucion = () => {
  if (!evolucionRef.value || !data.value.evolucionMensual?.length) return
  const d = data.value.evolucionMensual
  evolucionChart = new Chart(evolucionRef.value, {
    type: 'bar',
    data: {
      labels: d.map(x => x.mes),
      datasets: [
        {
          type: 'bar',
          label: 'Valor Cotizado',
          data: d.map(x => x.valorCotizado),
          backgroundColor: 'rgba(5, 78, 175, 0.16)',
          borderColor: '#054EAF',
          borderWidth: 1.5,
          borderRadius: 4,
          order: 2,
        },
        {
          type: 'line',
          label: 'Valor Aprobado',
          data: d.map(x => x.valorAprobado),
          borderColor: '#16A34A',
          backgroundColor: 'rgba(22, 163, 74, 0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#16A34A',
          pointRadius: 3,
          tension: 0.35,
          fill: true,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: LGND },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` },
        },
      },
      scales: {
        x: { ticks: TICK, grid: GRID },
        y: { ticks: { ...TICK, callback: v => fmtShort(v) }, grid: GRID },
      },
    },
  })
}

const STATE_COLORS = {
  Aprobada:  { bg: '#16A34A', border: '#15803D' },
  Pendiente: { bg: '#F59E0B', border: '#D97706' },
  Rechazada: { bg: '#EF4444', border: '#DC2626' },
  Borrador:  { bg: '#94A3B8', border: '#64748B' },
}

const initEstados = () => {
  if (!estadosRef.value || !data.value.distribucionEstados?.length) return
  const d     = data.value.distribucionEstados
  const total = d.reduce((s, x) => s + x.cantidad, 0)
  estadosChart = new Chart(estadosRef.value, {
    type: 'doughnut',
    data: {
      labels: d.map(x => x.estado),
      datasets: [{
        data:            d.map(x => x.cantidad),
        backgroundColor: d.map(x => STATE_COLORS[x.estado]?.bg     ?? '#94A3B8'),
        borderColor:     d.map(x => STATE_COLORS[x.estado]?.border  ?? '#64748B'),
        borderWidth: 1.5,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%',
      plugins: {
        legend: { position: 'bottom', labels: LGND },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0.0'
              return ` ${ctx.label}: ${ctx.raw} (${pct}%)`
            },
          },
        },
      },
    },
  })
}

const initProductos = () => {
  if (!productosRef.value || !data.value.topProductos?.length) return
  const d = data.value.topProductos.slice(0, 5)
  productosChart = new Chart(productosRef.value, {
    type: 'bar',
    data: {
      labels: d.map(x => x.nombre),
      datasets: [{
        label: 'Veces cotizado',
        data:  d.map(x => x.cantidad),
        backgroundColor: 'rgba(5, 78, 175, 0.16)',
        borderColor: '#054EAF',
        borderWidth: 1.5,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw} veces` } },
      },
      scales: {
        x: { ticks: TICK, grid: GRID },
        y: { ticks: TICK, grid: { display: false } },
      },
    },
  })
}

const initAgente = () => {
  if (!agenteRef.value || !data.value.porAgente?.length) return
  const d = [...data.value.porAgente].sort((a, b) => b.valorTotal - a.valorTotal).slice(0, 8)
  agenteChart = new Chart(agenteRef.value, {
    type: 'bar',
    data: {
      labels: d.map(x => x.nombre),
      datasets: [{
        label: 'Valor Total',
        data:  d.map(x => x.valorTotal),
        backgroundColor: 'rgba(110, 231, 160, 0.45)',
        borderColor: '#16A34A',
        borderWidth: 1.5,
        borderRadius: 4,
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
            label: ctx => {
              const item = d[ctx.dataIndex]
              return [` ${fmt(ctx.raw)}`, ` ${item.cantidad} cotizaciones`]
            },
          },
        },
      },
      scales: {
        x: { ticks: { ...TICK, callback: v => fmtShort(v) }, grid: GRID },
        y: { ticks: TICK, grid: { display: false } },
      },
    },
  })
}

// ── Helpers ────────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(v ?? 0)

const fmtShort = (v) => {
  if (!v && v !== 0) return ''
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusClass = (s) => ({
  Aprobada:  'rf-status--green',
  Pendiente: 'rf-status--yellow',
  Rechazada: 'rf-status--red',
  Borrador:  'rf-status--gray',
}[s] ?? 'rf-status--gray')

const tasaClass = (t) => t >= 70 ? 'rf-tasa--green' : t >= 40 ? 'rf-tasa--yellow' : 'rf-tasa--red'

onMounted(cargarDatos)
onUnmounted(destroyCharts)
</script>

<style scoped>
/* ── Contenedor ────────────────────────────────────────── */
.rf-wrap {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}

/* ── Filtros ───────────────────────────────────────────── */
.rf-filter-card {
  background: #fff;
  border-radius: 18px;
  padding: 16px 20px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06);
}

.rf-filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}

.rf-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rf-label {
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: 'Inter', sans-serif;
}

.rf-select {
  padding: 8px 12px;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}
.rf-select:focus { border-color: #054EAF; }

.rf-btn-apply {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #054EAF;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(5, 78, 175, 0.22);
  transition: background 0.15s;
}
.rf-btn-apply:hover:not(:disabled) { background: #03368A; }
.rf-btn-apply:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Error ─────────────────────────────────────────────── */
.rf-error-card {
  background: #FFF8F8;
  border: 1px solid #FECACA;
  border-radius: 18px;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.rf-error-icon { color: #EF4444; }
.rf-error-msg {
  font-size: 14px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
  margin: 0;
  text-align: center;
}
.rf-btn-retry {
  padding: 8px 20px;
  background: #054EAF;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
}

/* ── KPI Grid ──────────────────────────────────────────── */
.rf-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.rf-kpi-skel {
  height: 88px;
  background: #EBF3FC;
  border-radius: 16px;
  animation: rf-pulse 1.5s ease-in-out infinite;
}

.rf-kpi-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.rf-kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rf-kpi-body { flex: 1; min-width: 0; }

.rf-kpi-label {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rf-kpi-value {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin: 0 0 5px;
  line-height: 1.2;
}

.rf-kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  font-family: 'Inter', sans-serif;
}
.rf-trend-up   { background: #DCFCE7; color: #16A34A; }
.rf-trend-down { background: #FEE2E2; color: #B91C1C; }

/* ── Charts Row (2 columnas) ───────────────────────────── */
.rf-charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.rf-chart-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06), 0 4px 16px rgba(5, 78, 175, .08);
  overflow: hidden;
}

.rf-chart-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2EBF6;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
}
.rf-chart-hico { color: #054EAF; flex-shrink: 0; }

.rf-chart-body {
  padding: 20px;
  height: 260px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rf-chart-body--donut { height: 280px; }

.rf-chart-skel {
  width: 100%;
  height: 100%;
  background: #EBF3FC;
  border-radius: 12px;
  animation: rf-pulse 1.5s ease-in-out infinite;
}

.rf-no-data {
  font-size: 13px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}
.rf-no-data--pad { padding: 40px 24px; text-align: center; }

/* ── Section Cards ─────────────────────────────────────── */
.rf-section-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06), 0 4px 16px rgba(5, 78, 175, .08);
  overflow: hidden;
}

.rf-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2EBF6;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
}

.rf-row-skel {
  height: 44px;
  margin: 8px 20px;
  background: #EBF3FC;
  border-radius: 8px;
  animation: rf-pulse 1.5s ease-in-out infinite;
}

/* ── Tablas ────────────────────────────────────────────── */
.rf-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.rf-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 480px;
}

.rf-table thead tr {
  background: #F8FAFC;
  border-bottom: 1px solid #E2EBF6;
}

.rf-table th {
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  text-align: left;
  white-space: nowrap;
}
.rf-th-r   { text-align: right; }
.rf-th-c   { text-align: center; }
.rf-th-num { width: 40px; text-align: center; }

.rf-table td {
  padding: 12px 16px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #475569;
  border-bottom: 1px solid #F1F5FA;
  vertical-align: middle;
}
.rf-table tbody tr:last-child td { border-bottom: none; }

.rf-tr { transition: background 0.12s ease; }
.rf-tr:hover { background: #F0F7FF; }

.rf-td-num  { text-align: center; color: #94A3B8; font-size: 11px; font-weight: 600; }
.rf-td-name { font-weight: 500; color: #0F172A; }
.rf-td-sede { font-weight: 600; color: #0F172A; }
.rf-td-meta { color: #94A3B8; font-size: 12px; }
.rf-td-r    { text-align: right; white-space: nowrap; }
.rf-td-c    { text-align: center; }
.rf-val     { font-weight: 700; color: #054EAF; }

/* ── Badges de estado ──────────────────────────────────── */
.rf-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
.rf-status--green  { background: #DCFCE7; color: #16A34A; }
.rf-status--yellow { background: #FEF3C7; color: #B45309; }
.rf-status--red    { background: #FEE2E2; color: #B91C1C; }
.rf-status--gray   { background: #F1F5F9; color: #64748B; }

/* ── Badge tasa aprobación ─────────────────────────────── */
.rf-tasa-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
}
.rf-tasa--green  { background: #DCFCE7; color: #16A34A; }
.rf-tasa--yellow { background: #FEF3C7; color: #B45309; }
.rf-tasa--red    { background: #FEE2E2; color: #B91C1C; }

/* ── Pulse skeleton ────────────────────────────────────── */
@keyframes rf-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

/* ── Responsive — tablet ───────────────────────────────── */
@media (max-width: 1024px) {
  .rf-kpi-grid    { grid-template-columns: repeat(2, 1fr); }
  .rf-charts-row  { grid-template-columns: 1fr; }
  .rf-filter-grid { grid-template-columns: 1fr 1fr; }
}

/* ── Responsive — móvil ────────────────────────────────── */
@media (max-width: 640px) {
  .rf-wrap        { padding: 16px; gap: 14px; }
  .rf-filter-grid { grid-template-columns: 1fr; }
  .rf-kpi-grid    { grid-template-columns: 1fr 1fr; gap: 10px; }
  .rf-kpi-value   { font-size: 17px; }
  .rf-chart-body  { height: 220px; }
}
</style>
