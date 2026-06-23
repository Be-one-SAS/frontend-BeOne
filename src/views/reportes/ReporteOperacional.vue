<template>
  <div class="ro-root">

    <!-- Header -->
    <div class="ro-page-header">
      <div>
        <h1 class="ro-page-title">Reporte Personal Operativo</h1>
        <p class="ro-page-sub">Detalle financiero de logística y operaciones por evento</p>
      </div>
      <div class="ro-header-actions">
        <select v-model="selectedQuotationId" class="ro-select" @change="loadData">
          <option :value="null">Todos los eventos</option>
          <option v-for="q in quotations" :key="q.id" :value="q.id">
            #{{ q.numero }} — {{ q.cliente?.name ?? q.empresa ?? '—' }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ro-loading">
      <div class="ro-spinner" /><p>Cargando reporte…</p>
    </div>

    <template v-else>
      <!-- KPIs -->
      <div class="ro-kpis">
        <div class="ro-kpi">
          <span class="ro-kpi-val">{{ kpis.personas }}</span>
          <span class="ro-kpi-lbl">Personas</span>
        </div>
        <div class="ro-kpi">
          <span class="ro-kpi-val">{{ kpis.horas }}h</span>
          <span class="ro-kpi-lbl">Horas trabajadas</span>
        </div>
        <div class="ro-kpi ro-kpi--highlight">
          <span class="ro-kpi-val">{{ formatCurrency(kpis.costoTotal) }}</span>
          <span class="ro-kpi-lbl">Costo total personal</span>
        </div>
        <div class="ro-kpi">
          <span class="ro-kpi-val">{{ kpis.sinRegistro }}</span>
          <span class="ro-kpi-lbl">Sin registro</span>
        </div>
      </div>

      <!-- Sin datos -->
      <div v-if="!rows.length" class="ro-empty">
        <Activity :size="36" class="ro-empty-icon" />
        <p>No hay registros de turno para los filtros seleccionados</p>
      </div>

      <!-- Tabla -->
      <div v-else class="ro-table-wrap">
        <table class="ro-table">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Rol</th>
              <th v-if="!selectedQuotationId">Evento</th>
              <th>Fecha</th>
              <th>Ingreso</th>
              <th>Salida</th>
              <th>Horas reales</th>
              <th>Valor / hora</th>
              <th>% Extra</th>
              <th class="ro-th--money">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" :class="{ 'ro-row--incomplete': !r.horaIngreso || !r.horaSalida }">
              <td>
                <div class="ro-user-cell">
                  <div class="ro-avatar">{{ initials(r.user?.fullName) }}</div>
                  <span>{{ r.user?.fullName ?? '—' }}</span>
                </div>
              </td>
              <td><span class="ro-role-badge" :class="roleClass(r.user?.role)">{{ r.user?.role ?? '—' }}</span></td>
              <td v-if="!selectedQuotationId" class="ro-event-cell">
                <span class="ro-event-num">#{{ r.quotation?.numero }}</span>
                {{ r.quotation?.cliente?.name ?? r.quotation?.empresa ?? '—' }}
              </td>
              <td>{{ formatDate(r.fecha) }}</td>
              <td class="ro-time">
                <span v-if="r.horaIngreso">{{ formatTime(r.horaIngreso) }}</span>
                <span v-if="r.horaIngresoOriginal && r.horaIngreso !== r.horaIngresoOriginal" class="ro-original">orig. {{ formatTime(r.horaIngresoOriginal) }}</span>
                <span v-else-if="!r.horaIngreso" class="ro-pending">Sin ingreso</span>
              </td>
              <td class="ro-time">
                <span v-if="r.horaSalida">{{ formatTime(r.horaSalida) }}</span>
                <span v-if="r.horaSalidaOriginal && r.horaSalida !== r.horaSalidaOriginal" class="ro-original">orig. {{ formatTime(r.horaSalidaOriginal) }}</span>
                <span v-else-if="!r.horaSalida" class="ro-pending">Sin salida</span>
              </td>
              <td class="ro-hours">{{ calcHours(r.horaIngreso, r.horaSalida) }}</td>
              <td class="ro-money-sm">{{ r.valorHoraContratada ? formatCurrency(Number(r.valorHoraContratada)) : '—' }}</td>
              <td class="ro-pct">{{ r.porcentajeAdicional ? r.porcentajeAdicional + '%' : '—' }}</td>
              <td class="ro-total">{{ calcTotal(r) }}</td>
            </tr>
          </tbody>
          <tfoot v-if="rows.length">
            <tr>
              <td :colspan="selectedQuotationId ? 6 : 7" class="ro-tfoot-label">Totales</td>
              <td class="ro-hours ro-tfoot-val">{{ kpis.horas }}h</td>
              <td colspan="2"></td>
              <td class="ro-total ro-tfoot-val">{{ formatCurrency(kpis.costoTotal) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Desglose por evento (solo en vista "todos") -->
      <div v-if="!selectedQuotationId && byEvent.length > 1" class="ro-by-event">
        <h2 class="ro-section-title">Desglose por evento</h2>
        <div class="ro-event-cards">
          <div v-for="ev in byEvent" :key="ev.id" class="ro-event-card">
            <div class="ro-event-card-header">
              <span class="ro-event-card-num">#{{ ev.numero }}</span>
              <span class="ro-event-card-name">{{ ev.name }}</span>
            </div>
            <div class="ro-event-card-stats">
              <div><span class="ro-stat-val">{{ ev.personas }}</span><span class="ro-stat-lbl">personas</span></div>
              <div><span class="ro-stat-val">{{ ev.horas }}h</span><span class="ro-stat-lbl">horas</span></div>
              <div class="ro-stat--money"><span class="ro-stat-val">{{ formatCurrency(ev.costo) }}</span><span class="ro-stat-lbl">costo</span></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Activity } from 'lucide-vue-next'
import { getQuotations } from '@/services/quotation.service'
import { getReportePersonal } from '@/services/registros-turno.service'

const quotations         = ref([])
const selectedQuotationId = ref(null)
const registros          = ref([])
const loading            = ref(true)

const rows = computed(() => registros.value)

const kpis = computed(() => {
  const personas    = new Set(rows.value.map(r => r.userId)).size
  const horas       = rows.value.reduce((s, r) => s + calcHoursNum(r.horaIngreso, r.horaSalida), 0)
  const costoTotal  = rows.value.reduce((s, r) => s + calcTotalNum(r), 0)
  const sinRegistro = rows.value.filter(r => !r.horaIngreso || !r.horaSalida).length
  return { personas, horas: horas.toFixed(1), costoTotal, sinRegistro }
})

const byEvent = computed(() => {
  const map = new Map()
  rows.value.forEach(r => {
    const qId = r.quotationId
    if (!map.has(qId)) {
      map.set(qId, {
        id:      qId,
        numero:  r.quotation?.numero,
        name:    r.quotation?.cliente?.name ?? r.quotation?.empresa ?? '—',
        personas: new Set(),
        horas:   0,
        costo:   0,
      })
    }
    const ev = map.get(qId)
    ev.personas.add(r.userId)
    ev.horas += calcHoursNum(r.horaIngreso, r.horaSalida)
    ev.costo += calcTotalNum(r)
  })
  return [...map.values()].map(ev => ({
    ...ev,
    personas: ev.personas.size,
    horas: ev.horas.toFixed(1),
  }))
})

onMounted(async () => {
  await Promise.all([loadQuotations(), loadData()])
})

const loadQuotations = async () => {
  try {
    const res = await getQuotations()
    quotations.value = (res.data ?? []).filter(q =>
      ['Aprobada', 'Pendiente'].includes(q.quotationStatus?.name ?? '')
    )
  } catch (_) {}
}

const loadData = async () => {
  loading.value = true
  try {
    registros.value = await getReportePersonal(selectedQuotationId.value)
  } catch (_) { registros.value = [] }
  finally { loading.value = false }
}

// ── Helpers ────────────────────────────────────────────────────────
const initials = (name) => {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

const formatTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const formatCurrency = (val) => {
  if (val == null || isNaN(val)) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

const calcHoursNum = (inIso, outIso) => {
  if (!inIso || !outIso) return 0
  const h = (new Date(outIso) - new Date(inIso)) / 3600000
  return h > 0 ? h : 0
}

const calcHours = (inIso, outIso) => {
  const h = calcHoursNum(inIso, outIso)
  return h > 0 ? h.toFixed(1) + 'h' : '—'
}

const calcTotalNum = (r) => {
  if (!r.horaIngreso || !r.horaSalida || !r.valorHoraContratada) return 0
  const horas = calcHoursNum(r.horaIngreso, r.horaSalida)
  const extra = 1 + (r.porcentajeAdicional ?? 0) / 100
  return horas * Number(r.valorHoraContratada) * extra
}

const calcTotal = (r) => {
  const t = calcTotalNum(r)
  return t > 0 ? formatCurrency(t) : '—'
}

const roleClass = (role) => {
  const map = { LOGISTICA: 'ro-role--blue', OPERATIVO: 'ro-role--green', SUPERVISOR: 'ro-role--purple', COORDINADOR: 'ro-role--orange' }
  return map[role] ?? 'ro-role--gray'
}
</script>

<style scoped>
.ro-root { padding: 28px; width: 100%; box-sizing: border-box; }

.ro-page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
}
.ro-page-title { font-size: 22px; font-weight: 800; color: #0F1A2E; margin: 0 0 4px; }
.ro-page-sub   { font-size: 13px; color: #64748B; margin: 0; }
.ro-select {
  border: 1px solid #CBD5E1; border-radius: 8px; padding: 8px 12px;
  font-size: 13px; color: #0F1A2E; background: white; min-width: 240px;
}

.ro-loading { display: flex; align-items: center; gap: 12px; padding: 60px 0; color: #64748B; }
.ro-spinner {
  width: 24px; height: 24px; border: 3px solid #E2E8F0;
  border-top-color: #6366F1; border-radius: 50%;
  animation: ro-spin .8s linear infinite; flex-shrink: 0;
}
@keyframes ro-spin { to { transform: rotate(360deg); } }

/* KPIs */
.ro-kpis {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px; margin-bottom: 24px;
}
.ro-kpi {
  background: white; border: 1px solid #E8EDF5; border-radius: 12px;
  padding: 16px 20px; display: flex; flex-direction: column; gap: 4px;
}
.ro-kpi--highlight { background: #0F1A2E; border-color: #0F1A2E; }
.ro-kpi--highlight .ro-kpi-val { color: white; }
.ro-kpi--highlight .ro-kpi-lbl { color: #94A3B8; }
.ro-kpi-val { font-size: 22px; font-weight: 800; color: #0F1A2E; }
.ro-kpi-lbl { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }

.ro-empty {
  text-align: center; padding: 60px 0; color: #94A3B8;
}
.ro-empty-icon { margin: 0 auto 12px; display: block; opacity: .4; }

/* Tabla */
.ro-table-wrap { overflow-x: auto; background: white; border-radius: 12px; border: 1px solid #E8EDF5; }
.ro-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ro-table th {
  text-align: left; padding: 10px 14px;
  font-size: 11px; font-weight: 700; color: #64748B;
  text-transform: uppercase; letter-spacing: .04em;
  border-bottom: 1px solid #F1F5F9; background: #FAFBFC;
}
.ro-th--money { text-align: right; }
.ro-table td { padding: 11px 14px; border-bottom: 1px solid #F8FAFC; vertical-align: middle; color: #1E293B; }
.ro-table tr:last-child td { border-bottom: none; }
.ro-row--incomplete td { opacity: .7; }
.ro-user-cell { display: flex; align-items: center; gap: 8px; }
.ro-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: #EFF6FF; color: #2563EB;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.ro-role-badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; }
.ro-role--blue   { background: #DBEAFE; color: #1D4ED8; }
.ro-role--green  { background: #D1FAE5; color: #065F46; }
.ro-role--purple { background: #EDE9FE; color: #6D28D9; }
.ro-role--orange { background: #FEF3C7; color: #92400E; }
.ro-role--gray   { background: #F1F5F9; color: #475569; }
.ro-event-cell { font-size: 12px; }
.ro-event-num  { font-weight: 700; color: #6366F1; margin-right: 6px; }
.ro-time { font-family: monospace; font-size: 12px; color: #334155; }
.ro-original { display: block; font-size: 10px; color: #F59E0B; font-style: italic; }
.ro-pending  { color: #CBD5E1; font-size: 11px; font-style: italic; }
.ro-hours    { font-weight: 700; color: #0F1A2E; }
.ro-money-sm { color: #475569; font-size: 12px; }
.ro-pct      { color: #475569; font-size: 12px; }
.ro-total    { font-weight: 700; color: #059669; text-align: right; }

/* Tfoot */
.ro-table tfoot td { border-top: 2px solid #E8EDF5; background: #FAFBFC; }
.ro-tfoot-label { font-size: 12px; font-weight: 700; color: #374151; }
.ro-tfoot-val   { font-size: 13px; font-weight: 800; color: #0F1A2E; }

/* Desglose por evento */
.ro-by-event { margin-top: 28px; }
.ro-section-title { font-size: 15px; font-weight: 700; color: #0F1A2E; margin: 0 0 14px; }
.ro-event-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.ro-event-card {
  background: white; border: 1px solid #E8EDF5; border-radius: 12px; padding: 16px;
}
.ro-event-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ro-event-card-num  { background: #EEF2FF; color: #4F46E5; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.ro-event-card-name { font-size: 12px; color: #374151; font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ro-event-card-stats { display: flex; gap: 16px; }
.ro-event-card-stats > div { display: flex; flex-direction: column; gap: 2px; }
.ro-stat--money { margin-left: auto; align-items: flex-end; }
.ro-stat-val { font-size: 16px; font-weight: 800; color: #0F1A2E; }
.ro-stat-lbl { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: .04em; }
</style>
