<template>
  <div class="dp">

    <!-- SKELETON LOADER -->
    <div v-if="isLoading" class="dp-loading">
      <div class="dp-kpi-grid">
        <div class="skeleton-card" v-for="i in 4" :key="i"></div>
      </div>
      <div class="dp-mid-grid" style="margin-top: 16px;">
        <div class="skeleton-card large" style="height: 400px;"></div>
        <div class="skeleton-card split" style="height: 400px;"></div>
      </div>
    </div>

    <!-- MAIN DASHBOARD -->
    <template v-else>
      <!-- ══════════════════════════════════════════════════════
           FILA 1 — KPI CARDS
      ══════════════════════════════════════════════════════ -->
      <div class="dp-kpi-grid">
        <!-- KPI 1: Valor Total Cotizado -->
        <div class="kpi-card">
          <div class="kpi-icon" style="--icon-bg: #FEF3C7">
            <DollarSign :size="18" color="#F59E0B" />
          </div>
          <p class="kpi-label">Valor Total Cotizado</p>
          <p class="kpi-number" :title="formatCurrency(kpi.valorCotizado)">{{ formatCurrencyShort(kpi.valorCotizado) }}</p>
          <span class="kpi-trend trend-up">Cotizaciones Activas</span>
        </div>

        <!-- KPI 2: Total Cotizaciones -->
        <div class="kpi-card">
          <div class="kpi-icon" style="--icon-bg: #EEF4FF">
            <FileText :size="18" color="#054EAF" />
          </div>
          <p class="kpi-label">Total Cotizaciones</p>
          <p class="kpi-number">{{ kpi.totalCotizaciones }}</p>
          <span class="kpi-trend trend-up">Históricas</span>
        </div>

        <!-- KPI 3: Clientes Registrados -->
        <div class="kpi-card">
          <div class="kpi-icon" style="--icon-bg: #DCFCE7">
            <Users :size="18" color="#16A34A" />
          </div>
          <p class="kpi-label">Clientes Registrados</p>
          <p class="kpi-number">{{ kpi.totalClientes }}</p>
          <span class="kpi-trend trend-up" v-if="!isAdmin">Base Global</span>
          <span class="kpi-trend trend-up" v-else>Base Activa</span>
        </div>

        <!-- KPI 4: Cotizaciones Aprobadas vs Pendientes -->
        <div class="kpi-card kpi-primary">
          <div class="kpi-icon" style="--icon-bg: rgba(255,255,255,.18)">
            <CheckCircle2 :size="18" color="white" />
          </div>
          <p class="kpi-label" style="color: rgba(255,255,255,.65)">Ratio de Éxito</p>
          <p class="kpi-number kpi-number--sm">{{ kpi.aprobadas }} vs {{ kpi.pendientes }}</p>
          <p class="kpi-sub">Aprobadas / Pendientes</p>
          <span class="kpi-trend" style="background: rgba(255,255,255,.18); color: white">
            Eficiencia
          </span>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           FILA 2 — CALENDARIO (65%) + CONTROLES (35%)
      ══════════════════════════════════════════════════════ -->
      <div class="dp-mid-grid">

        <!-- Calendario Dinámico -->
        <div class="card">
          <Calendar />
        </div>

        <!-- Panel Lateral derecho -->
        <div class="side-panel">
          
          <!-- Accesos Rápidos -->
          <div class="card alerts-card" style="margin-bottom: 16px;">
            <div class="section-head">
              <h2 class="section-title">Accesos Rápidos</h2>
            </div>
            <div class="alerts-list">
              <router-link to="/admin/cotizar" class="alert-item link-item" style="--ac: #054EAF">
                <span class="alert-emoji">📝</span>
                <div class="alert-content">
                  <p class="alert-desc">Nueva Cotización</p>
                  <p class="alert-time">Crear y enviar al cliente</p>
                </div>
              </router-link>
              
              <router-link to="/customer/customer" class="alert-item link-item" style="--ac: #16A34A">
                <span class="alert-emoji">👥</span>
                <div class="alert-content">
                  <p class="alert-desc">Directorio de Clientes</p>
                  <p class="alert-time">Gestiona toda la base global</p>
                </div>
              </router-link>
              
              <router-link to="/admin/ver-cotizaciones" class="alert-item link-item" style="--ac: #8B5CF6">
                <span class="alert-emoji">📂</span>
                <div class="alert-content">
                  <p class="alert-desc">Ver Cotizaciones</p>
                  <p class="alert-time">Control y seguimiento comercial</p>
                </div>
              </router-link>
            </div>
          </div>

          <!-- Distribución por Estado -->
          <div class="card" v-show="chartDataExists">
            <div class="section-head">
              <h2 class="section-title">Tasa de Efectividad</h2>
            </div>
            <div class="chart-container" style="position: relative; height: 180px; width: 100%;">
              <canvas ref="chartCanvas"></canvas>
            </div>
          </div>

        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════
           FILA 3 — ACTIVIDAD RECIENTE
      ══════════════════════════════════════════════════════ -->
      <div class="dp-bottom-grid single-col">
        <div class="card">
          <div class="section-head">
            <h2 class="section-title">Últimas Cotizaciones Generadas</h2>
            <span class="count-badge">{{ recentQuotations.length }}</span>
          </div>

          <div v-if="recentQuotations.length === 0" class="empty-state">
            <p>No tienes cotizaciones recientes en tu historial.</p>
            <router-link to="/admin/cotizar" class="btn-link">Comienza creando tu primera cotización →</router-link>
          </div>
          
          <div v-else class="timeline">
            <div v-for="(act, i) in recentQuotations" :key="act.id" class="tl-item">
              <div class="tl-left">
                <div class="tl-dot" style="background: #3B82F6">
                  <FileEdit :size="12" color="white" />
                </div>
                <div v-if="i < recentQuotations.length - 1" class="tl-line"></div>
              </div>
              <div class="tl-body tl-link-body" @click="$router.push(`/admin/cotizar/${act.id}`)">
                <p class="tl-text">
                  <span style="font-weight:700; color:#054EAF;">Cotización #{{ act.id }}</span>
                   para {{ act.customer?.name || act.customer?.businessName || 'Cliente No Identificado' }}
                </p>
                <p class="tl-meta">
                  Valor: {{ formatCurrency(act.total) }} · Estado: {{ act.status?.params?.name || 'Creado' }} 
                  <span v-if="isAdmin">· Agente: {{ act.user?.fullName || 'Desconocido' }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, shallowRef } from 'vue'
import {
  FileText,
  CalendarDays,
  ClipboardList,
  Zap,
  FileEdit,
  CheckCircle2,
  PackageCheck,
  Users,
  DollarSign
} from 'lucide-vue-next'
import Calendar from '@/components/calendar/Calendar.vue'
import Chart from 'chart.js/auto'
import { useRouter } from 'vue-router'

import { getQuotations } from '@/services/quotation.service'
import { getCustomer } from '@/services/customer.service'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user } = useAuth()
const isLoading = ref(true)
const chartDataExists = ref(false)

const kpi = ref({
  totalCotizaciones: 0,
  totalClientes: 0,
  valorCotizado: 0,
  aprobadas: 0,
  pendientes: 0
})

const recentQuotations = ref([])
const chartCanvas = ref(null)
let chartInstance = null

// RBAC
const isAdmin = computed(() => {
  return user.value?.roles?.includes('ADMIN') || false
})

const formatCurrency = (val) => {
  if (!val) return '$0'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

const formatCurrencyShort = (val) => {
  if (!val) return '$0'
  if (val >= 1000000) {
    return '$' + (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  return formatCurrency(val)
}

onMounted(async () => {
  try {
    // Carga paralela controlada para que un fallo no rompa el dashboard completo
    let customersData = []
    let quotationsData = []

    try {
      const custRes = await getCustomer()
      // Estructura dependiendo del endpoint, normalmente data o data.data
      customersData = custRes.data?.data || custRes.data || []
      // El total de clientes es global para dar impresiones de tamaño
      kpi.value.totalClientes = Array.isArray(customersData) ? customersData.length : 0
    } catch (e) {
      console.warn("Fallo carga silenciosa de clientes", e)
    }

    try {
      const qRes = await getQuotations()
      quotationsData = qRes.data?.data || qRes.data || []
    } catch (e) {
      console.warn("Fallo carga silenciosa de cotizaciones", e)
    }

    const allQuotes = Array.isArray(quotationsData) ? quotationsData : []
    
    // Si no es admin, filtra por creación o asignación como coordinador
    const myQuotes = isAdmin.value 
      ? allQuotes 
      : allQuotes.filter(q => q.userId === user.value?.id || q.coordinadores?.some(c => c.id === user.value?.id))

    kpi.value.totalCotizaciones = myQuotes.length

    let val = 0
    let aprob = 0
    let pend = 0
    let estadosCount = {}

    myQuotes.forEach(q => {
      val += (q.total || 0)
      
      const st = q.status?.params?.name?.toLowerCase() || 'creado'
      const stName = q.status?.params?.name || 'Creado'

      if (st.includes('aprobad') || st.includes('ganad') || st.includes('acept')) aprob++
      if (st.includes('pendient') || st.includes('cread') || st.includes('proceso')) pend++
      
      estadosCount[stName] = (estadosCount[stName] || 0) + 1
    })

    kpi.value.valorCotizado = val
    kpi.value.aprobadas = aprob
    kpi.value.pendientes = pend

    // Ordenar descendentemente por ID
    const sorted = [...myQuotes].sort((a,b) => b.id - a.id)
    recentQuotations.value = sorted.slice(0, 5)

    // Renderizar Chart.js
    if (Object.keys(estadosCount).length > 0) {
      chartDataExists.value = true
      setTimeout(() => {
        if (chartCanvas.value) {
          chartInstance = new Chart(chartCanvas.value, {
            type: 'doughnut',
            data: {
              labels: Object.keys(estadosCount),
              datasets: [{
                data: Object.values(estadosCount),
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1'],
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11, family: 'Inter' } } }
              },
              cutout: '72%'
            }
          })
        }
      }, 50)
    }

  } catch (error) {
    console.error("Dashboard mount error:", error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
/* ─────────────────────────────────────────────
   LAYOUT PRINCIPAL
───────────────────────────────────────────── */
.dp {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* Skeleton Loaders */
.dp-loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.skeleton-card {
  background: #E2E8F0;
  border-radius: 18px;
  height: 120px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

/* Grid: 4 columnas iguales para KPIs */
.dp-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* Grid: 65% calendario | 35% alertas/graficos */
.dp-mid-grid {
  display: grid;
  grid-template-columns: 65fr 35fr;
  gap: 16px;
  align-items: start;
}

/* Grid: Full width simple para el historial */
.single-col {
  grid-template-columns: 1fr;
}
.dp-bottom-grid {
  display: grid;
  gap: 16px;
  align-items: start;
}

/* ─────────────────────────────────────────────
   CARD BASE
───────────────────────────────────────────── */
.card {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  border: 1px solid #EEF1F7;
}

/* ─────────────────────────────────────────────
   KPI CARDS
───────────────────────────────────────────── */
.kpi-card {
  position: relative;
  background: #FFFFFF;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  border: 1px solid #EEF1F7;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.2s;
}

.kpi-card:hover {
  box-shadow: 0 2px 8px rgba(5,78,175,.1), 0 8px 24px rgba(5,78,175,.12);
}

.kpi-primary {
  background: #054EAF;
  border-color: transparent;
}

/* Ícono flotante en esquina superior derecha */
.kpi-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--icon-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  padding-right: 48px; 
  line-height: 1.4;
}

.kpi-number {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #0F1A2E;
  line-height: 1;
  margin-top: 2px;
}

.kpi-number--sm {
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
  color: #FFFFFF;
}

.kpi-sub {
  font-size: 11px;
  color: rgba(255,255,255,.75);
  font-family: 'Inter', sans-serif;
}

.kpi-trend {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  margin-top: 2px;
}

.trend-up   { background: #DCFCE7; color: #16A34A; }
.trend-down { background: #FEE2E2; color: #B91C1C; }

/* ─────────────────────────────────────────────
   SECTION HEADER 
───────────────────────────────────────────── */
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #0F1A2E;
}

.count-badge {
  background: #EEF4FF;
  color: #054EAF;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
}

/* ─────────────────────────────────────────────
   PANEL LATERAL: RUTAS CORTAS Y ALERTAS
───────────────────────────────────────────── */
.alerts-card {
  display: flex;
  flex-direction: column;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border-left: 3px solid var(--ac);
  background: #FAFBFE;
  transition: all 0.15s;
  text-decoration: none;
  cursor: pointer;
}

.alert-item:hover { 
  background: #F4F7FD; 
  transform: translateX(4px);
}

.alert-emoji   { font-size: 16px; flex-shrink: 0; line-height: 1.3; }
.alert-content { flex: 1; min-width: 0; }

.alert-desc {
  font-size: 12px;
  color: #0F1A2E;
  font-weight: 600;
  line-height: 1.4;
  font-family: 'Inter', sans-serif;
}

.alert-time {
  font-size: 11px;
  color: #64748B;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
}

/* ─────────────────────────────────────────────
   TIMELINE ACTIVIDAD
───────────────────────────────────────────── */
.timeline {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
}

.timeline::-webkit-scrollbar { width: 4px; }
.timeline::-webkit-scrollbar-track { background: transparent; }
.timeline::-webkit-scrollbar-thumb { background: #E5EAF0; border-radius: 99px; }

.tl-item { display: flex; gap: 12px; }

.tl-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.tl-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tl-line {
  width: 2px;
  flex: 1;
  min-height: 12px;
  background: #E5EAF0;
  margin: 3px 0;
}

.tl-body {
  padding-bottom: 16px;
  flex: 1;
  min-width: 0;
}

.tl-link-body {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.15s;
}
.tl-link-body:hover {
  background: #FAFBFE;
}

.tl-text {
  font-size: 13px;
  color: #0F1A2E;
  line-height: 1.5;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
}

.tl-link {
  text-decoration: none;
  font-weight: 600;
  color: inherit;
}

.tl-meta {
  font-size: 11px;
  color: #64748B;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
}

.empty-state {
  font-size: 13px;
  color: #64748B;
  text-align: center;
  padding: 30px;
  font-family: 'Inter', sans-serif;
}

.btn-link {
  margin-top: 14px;
  font-size: 12px;
  font-weight: 600;
  color: #054EAF;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  font-family: 'Inter', sans-serif;
  transition: opacity 0.15s;
  text-decoration: none;
}
.btn-link:hover { opacity: 0.7; }

/* ─────────────────────────────────────────────
   RESPONSIVE
───────────────────────────────────────────── */
@media (max-width: 1280px) {
  .dp-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dp-kpi-grid,
  .dp-mid-grid,
  .dp-bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
