<template>
  <div class="rep-page">

    <!-- Header -->
    <div class="rep-header">
      <div>
        <h1 class="rep-title">Reportes</h1>
        <p class="rep-sub">Exporta y analiza la información financiera</p>
      </div>
    </div>

    <!-- Report cards -->
    <div class="rep-grid">

      <!-- 1. Cuentas por cobrar -->
      <div class="rep-card">
        <div class="rep-card-icon" style="background:#FFFBEB">
          <Clock :size="22" color="#92400E" />
        </div>
        <div class="rep-card-body">
          <h3 class="rep-card-title">Cuentas por cobrar</h3>
          <p class="rep-card-desc">Cotizaciones aprobadas con estado pendiente de pago.</p>

          <div class="rep-filters">
            <label class="rep-label">Desde</label>
            <input v-model="cobrar.fechaInicio" type="date" class="rep-input" />
            <label class="rep-label">Hasta</label>
            <input v-model="cobrar.fechaFin" type="date" class="rep-input" />
          </div>

          <div v-if="cobrar.data" class="rep-summary">
            <span class="rep-count">{{ cobrar.data.count }} cotizaciones</span>
            <span class="rep-total">Total: {{ fmtMoney(cobrar.data.totalPorCobrar) }}</span>
          </div>

          <div class="rep-actions">
            <button class="rep-btn-run" :disabled="cobrar.loading" @click="runCobrar">
              <Loader2 v-if="cobrar.loading" :size="14" class="spin" />
              <Play v-else :size="14" />
              {{ cobrar.data ? 'Actualizar' : 'Generar' }}
            </button>
            <button v-if="cobrar.data" class="rep-btn-export" @click="exportCobrar">
              <Download :size="14" /> CSV
            </button>
          </div>

          <p v-if="cobrar.error" class="rep-err">{{ cobrar.error }}</p>
        </div>
      </div>

      <!-- 2. Por ejecutivo -->
      <div class="rep-card">
        <div class="rep-card-icon" style="background:#F5F3FF">
          <Users :size="22" color="#6D28D9" />
        </div>
        <div class="rep-card-body">
          <h3 class="rep-card-title">Desempeño por ejecutivo</h3>
          <p class="rep-card-desc">Totales de cotización y aprobación por agente comercial.</p>

          <div class="rep-filters">
            <label class="rep-label">Desde</label>
            <input v-model="ejecutivo.fechaInicio" type="date" class="rep-input" />
            <label class="rep-label">Hasta</label>
            <input v-model="ejecutivo.fechaFin" type="date" class="rep-input" />
          </div>

          <div v-if="ejecutivo.data" class="rep-summary">
            <span class="rep-count">{{ ejecutivo.data.data.length }} ejecutivos</span>
          </div>

          <div class="rep-actions">
            <button class="rep-btn-run" :disabled="ejecutivo.loading" @click="runEjecutivo">
              <Loader2 v-if="ejecutivo.loading" :size="14" class="spin" />
              <Play v-else :size="14" />
              {{ ejecutivo.data ? 'Actualizar' : 'Generar' }}
            </button>
            <button v-if="ejecutivo.data" class="rep-btn-export" @click="exportEjecutivo">
              <Download :size="14" /> CSV
            </button>
          </div>

          <p v-if="ejecutivo.error" class="rep-err">{{ ejecutivo.error }}</p>

          <!-- Preview table -->
          <div v-if="ejecutivo.data?.data?.length" class="rep-preview">
            <table class="rep-table">
              <thead>
                <tr>
                  <th>Ejecutivo</th>
                  <th>Cots.</th>
                  <th>Aprobadas</th>
                  <th>Tasa</th>
                  <th>Total aprobado</th>
                  <th>Pagado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in ejecutivo.data.data" :key="e.agente">
                  <td>{{ e.agente }}</td>
                  <td>{{ e.count }}</td>
                  <td>{{ e.aprobadas }}</td>
                  <td><span class="rep-tasa" :class="e.tasa >= 50 ? 'good' : 'low'">{{ e.tasa }}%</span></td>
                  <td class="rep-money">{{ fmtMoney(e.total) }}</td>
                  <td class="rep-money">{{ fmtMoney(e.pagado) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 3. Por cliente -->
      <div class="rep-card">
        <div class="rep-card-icon" style="background:#EFF6FF">
          <Building2 :size="22" color="#1D4ED8" />
        </div>
        <div class="rep-card-body">
          <h3 class="rep-card-title">Historial por cliente</h3>
          <p class="rep-card-desc">Todas las cotizaciones vinculadas a un cliente específico.</p>

          <div class="rep-filters">
            <label class="rep-label">Desde</label>
            <input v-model="cliente.fechaInicio" type="date" class="rep-input" />
            <label class="rep-label">Hasta</label>
            <input v-model="cliente.fechaFin" type="date" class="rep-input" />
          </div>

          <div v-if="cliente.data" class="rep-summary">
            <span class="rep-count">{{ cliente.data.count }} cotizaciones</span>
            <span class="rep-total">Aprobado: {{ fmtMoney(cliente.data.totalAprobado) }}</span>
            <span class="rep-total">Pagado: {{ fmtMoney(cliente.data.totalPagado) }}</span>
          </div>

          <div class="rep-actions">
            <button class="rep-btn-run" :disabled="cliente.loading" @click="runCliente">
              <Loader2 v-if="cliente.loading" :size="14" class="spin" />
              <Play v-else :size="14" />
              {{ cliente.data ? 'Actualizar' : 'Generar' }}
            </button>
            <button v-if="cliente.data" class="rep-btn-export" @click="exportCliente">
              <Download :size="14" /> CSV
            </button>
          </div>

          <p v-if="cliente.error" class="rep-err">{{ cliente.error }}</p>
        </div>
      </div>

      <!-- 4. Reporte de período -->
      <div class="rep-card">
        <div class="rep-card-icon" style="background:#F0FDF4">
          <CalendarDays :size="22" color="#166534" />
        </div>
        <div class="rep-card-body">
          <h3 class="rep-card-title">Reporte por período</h3>
          <p class="rep-card-desc">Todas las cotizaciones en un rango de fechas con todos sus campos.</p>

          <div class="rep-filters">
            <label class="rep-label">Desde</label>
            <input v-model="periodo.fechaInicio" type="date" class="rep-input" />
            <label class="rep-label">Hasta</label>
            <input v-model="periodo.fechaFin" type="date" class="rep-input" />
          </div>

          <div v-if="periodo.data" class="rep-summary">
            <span class="rep-count">{{ periodo.data.total }} cotizaciones</span>
          </div>

          <div class="rep-actions">
            <button class="rep-btn-run" :disabled="periodo.loading" @click="runPeriodo">
              <Loader2 v-if="periodo.loading" :size="14" class="spin" />
              <Play v-else :size="14" />
              {{ periodo.data ? 'Actualizar' : 'Generar' }}
            </button>
            <button v-if="periodo.data" class="rep-btn-export" @click="exportPeriodo">
              <Download :size="14" /> CSV
            </button>
          </div>

          <p v-if="periodo.error" class="rep-err">{{ periodo.error }}</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  Clock, Users, Building2, CalendarDays,
  Download, Play, Loader2,
} from 'lucide-vue-next'
import {
  getReporteCuentasPorCobrar,
  getReportePorEjecutivo,
  getReportePorCliente,
  getAdminCotizaciones,
} from '@/services/administracion.service.js'

// ── Helpers ───────────────────────────────────────────────
function fmtMoney(n) {
  if (n == null || n === 0) return '$0'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function downloadCSV(rows, headers, filename) {
  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Report states ─────────────────────────────────────────
const cobrar = ref({ fechaInicio: '', fechaFin: '', data: null, loading: false, error: null })
const ejecutivo = ref({ fechaInicio: '', fechaFin: '', data: null, loading: false, error: null })
const cliente   = ref({ fechaInicio: '', fechaFin: '', data: null, loading: false, error: null })
const periodo   = ref({ fechaInicio: '', fechaFin: '', data: null, loading: false, error: null })

// ── Cuentas por cobrar ────────────────────────────────────
async function runCobrar() {
  cobrar.value.loading = true
  cobrar.value.error   = null
  try {
    cobrar.value.data = await getReporteCuentasPorCobrar({
      fechaInicio: cobrar.value.fechaInicio || undefined,
      fechaFin:    cobrar.value.fechaFin    || undefined,
    })
  } catch (e) {
    cobrar.value.error = e?.response?.data?.message || 'Error generando reporte'
  } finally {
    cobrar.value.loading = false
  }
}

function exportCobrar() {
  const { data } = cobrar.value.data
  const headers = ['#', 'Empresa/Cliente', 'Descripción', 'Fecha evento', 'Total', 'Estado admin.', 'Responsable', 'Notas']
  const rows = data.map(r => [
    r.numero,
    r.cliente?.name || r.empresa || r.contacto || '',
    r.description || '',
    r.operationWindow ? fmtDate(r.operationWindow.eventStartAt) : '',
    r.total ?? '',
    r.estadoAdministrativo || '',
    r.agenteComercial || '',
    (r.notasOperativas || '').replace(/,/g, ';'),
  ])
  downloadCSV(rows, headers, `cuentas-por-cobrar-${today()}.csv`)
}

// ── Por ejecutivo ─────────────────────────────────────────
async function runEjecutivo() {
  ejecutivo.value.loading = true
  ejecutivo.value.error   = null
  try {
    ejecutivo.value.data = await getReportePorEjecutivo({
      fechaInicio: ejecutivo.value.fechaInicio || undefined,
      fechaFin:    ejecutivo.value.fechaFin    || undefined,
    })
  } catch (e) {
    ejecutivo.value.error = e?.response?.data?.message || 'Error generando reporte'
  } finally {
    ejecutivo.value.loading = false
  }
}

function exportEjecutivo() {
  const { data } = ejecutivo.value.data
  const headers = ['Ejecutivo', 'Total cots.', 'Aprobadas', 'Tasa %', 'Total aprobado', 'Pagado', 'Anulado']
  const rows = data.map(e => [
    e.agente, e.count, e.aprobadas, e.tasa, e.total, e.pagado, e.anulado,
  ])
  downloadCSV(rows, headers, `ejecutivos-${today()}.csv`)
}

// ── Por cliente ───────────────────────────────────────────
async function runCliente() {
  cliente.value.loading = true
  cliente.value.error   = null
  try {
    cliente.value.data = await getReportePorCliente({
      fechaInicio: cliente.value.fechaInicio || undefined,
      fechaFin:    cliente.value.fechaFin    || undefined,
    })
  } catch (e) {
    cliente.value.error = e?.response?.data?.message || 'Error generando reporte'
  } finally {
    cliente.value.loading = false
  }
}

function exportCliente() {
  const { data } = cliente.value.data
  const headers = ['#', 'Empresa/Cliente', 'Descripción', 'Fecha cot.', 'Fecha evento', 'Total', 'Estado cot.', 'Estado admin.', 'Responsable']
  const rows = data.map(r => [
    r.numero,
    r.cliente?.name || r.empresa || r.contacto || '',
    r.description || '',
    fmtDate(r.fechaCotizacion),
    r.operationWindow ? fmtDate(r.operationWindow.eventStartAt) : '',
    r.total ?? '',
    r.quotationStatus?.name || '',
    r.estadoAdministrativo || '',
    r.agenteComercial || '',
  ])
  downloadCSV(rows, headers, `clientes-${today()}.csv`)
}

// ── Por período ───────────────────────────────────────────
async function runPeriodo() {
  periodo.value.loading = true
  periodo.value.error   = null
  try {
    periodo.value.data = await getAdminCotizaciones({
      fechaInicio: periodo.value.fechaInicio || undefined,
      fechaFin:    periodo.value.fechaFin    || undefined,
      limit: 5000,
    })
  } catch (e) {
    periodo.value.error = e?.response?.data?.message || 'Error generando reporte'
  } finally {
    periodo.value.loading = false
  }
}

function exportPeriodo() {
  const { data } = periodo.value.data
  const headers = ['#', 'Empresa/Cliente', 'Descripción', 'Fecha cot.', 'Fecha evento', 'Total', 'Estado cot.', 'Estado admin.', 'Responsable', 'Notas']
  const rows = data.map(r => [
    r.numero,
    r.cliente?.name || r.empresa || r.contacto || '',
    r.description || '',
    fmtDate(r.fechaCotizacion),
    r.operationWindow ? fmtDate(r.operationWindow.eventStartAt) : '',
    r.total ?? '',
    r.quotationStatus?.name || '',
    r.estadoAdministrativo || '',
    r.agenteComercial || '',
    (r.notasOperativas || '').replace(/,/g, ';'),
  ])
  downloadCSV(rows, headers, `periodo-${today()}.csv`)
}

function today() { return new Date().toISOString().slice(0, 10) }
</script>

<style scoped>
.rep-page {
  padding: 20px 24px;
  max-width: 1200px;
  font-family: 'Inter', sans-serif;
}

.rep-header { margin-bottom: 24px; }
.rep-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}
.rep-sub { font-size: 13px; color: #64748B; margin: 2px 0 0; }

/* Grid */
.rep-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 16px;
}
@media (max-width: 560px) {
  .rep-grid { grid-template-columns: 1fr; }
}

/* Card */
.rep-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 2px 8px rgba(5,78,175,.06);
}
.rep-card-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rep-card-body { flex: 1; min-width: 0; }
.rep-card-title {
  font-size: 15px; font-weight: 700;
  color: #0F172A; margin: 0 0 4px;
}
.rep-card-desc { font-size: 12px; color: #64748B; margin: 0 0 14px; }

/* Filters */
.rep-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.rep-label { font-size: 12px; font-weight: 500; color: #64748B; }
.rep-input {
  height: 32px;
  padding: 0 8px;
  border: 1.5px solid #E2E8F0;
  border-radius: 7px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  outline: none;
}
.rep-input:focus { border-color: #054EAF; }

/* Summary */
.rep-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.rep-count, .rep-total {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 8px;
  background: #F1F5F9;
  color: #374151;
}
.rep-total { background: #F0FDF4; color: #166534; }

/* Actions */
.rep-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.rep-btn-run {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: #054EAF;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.rep-btn-run:hover:not(:disabled) { background: #0442A0; }
.rep-btn-run:disabled { opacity: 0.5; cursor: not-allowed; }

.rep-btn-export {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  background: #F8FAFC;
  color: #374151;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.rep-btn-export:hover { background: #EFF6FF; border-color: #054EAF; color: #054EAF; }

.rep-err { font-size: 12px; color: #DC2626; margin: 4px 0 0; }

/* Spin */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Preview table */
.rep-preview {
  margin-top: 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  overflow: hidden;
  overflow-x: auto;
}
.rep-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.rep-table th {
  padding: 8px 10px;
  font-size: 10px; font-weight: 600; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.4px;
  background: #F8FAFC;
  border-bottom: 1.5px solid #E2E8F0;
  text-align: left;
}
.rep-table td {
  padding: 7px 10px;
  color: #374151;
  border-bottom: 1px solid #F1F5F9;
}
.rep-table tr:last-child td { border-bottom: none; }
.rep-money { font-weight: 600; color: #0F172A; white-space: nowrap; }
.rep-tasa { font-size: 11px; font-weight: 600; padding: 2px 5px; border-radius: 5px; }
.rep-tasa.good { background: #F0FDF4; color: #166534; }
.rep-tasa.low  { background: #FEF2F2; color: #991B1B; }
</style>
