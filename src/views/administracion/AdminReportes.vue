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
        <div class="rep-card-icon" style="background:#E0F9FA">
          <Building2 :size="22" color="#27C8D8" />
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

    <!-- ══ Personal operativo — sección independiente ══════════════ -->
    <div class="po-section">

      <!-- Header de sección -->
      <div class="po-header">
        <div class="po-header-left">
          <div class="po-header-icon"><Users :size="20" color="#166534" /></div>
          <div>
            <h2 class="po-title">Personal logístico</h2>
            <p class="po-sub">Horas trabajadas, valor por hora y costo total por evento — personal logístico interno y externo</p>
          </div>
        </div>
        <div class="po-header-right">
          <button
            v-if="personalFiltrado.length && personal.personKey"
            class="rep-btn-export"
            :class="{ 'rep-btn-export--sent': personaYaEnviada }"
            @click="openEnviarCorreoModal"
          >
            <Mail :size="13" /> {{ personaYaEnviada ? 'Reenviar correo' : 'Enviar correo' }}
          </button>
          <button v-if="personalFiltrado.length" class="rep-btn-export" @click="exportPersonal">
            <Download :size="13" /> Exportar CSV
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="po-filters">
        <div class="po-filter-group">
          <label class="po-filter-label">Evento</label>
          <select v-model="personal.quotationId" class="po-filter-input" @change="runPersonal">
            <option :value="null">Todos los eventos</option>
            <option v-for="q in personal.quotations" :key="q.id" :value="q.id">
              #{{ q.numero }} — {{ q.cliente?.name ?? q.empresa ?? '—' }}
            </option>
          </select>
        </div>
        <div class="po-filter-group">
          <label class="po-filter-label">Personal</label>
          <select v-model="personal.personKey" class="po-filter-input">
            <option :value="null">Todo el personal</option>
            <option v-for="u in personalDisponible" :key="u.id" :value="u.id">
              {{ u.fullName }} · {{ u.role }}
            </option>
          </select>
        </div>
        <div class="po-filter-group">
          <label class="po-filter-label">Estado</label>
          <select v-model="personal.estado" class="po-filter-input">
            <option value="cumplido">Cumplidos</option>
            <option value="pendiente">Pendientes</option>
            <option value="todos">Todos</option>
          </select>
        </div>
        <div class="po-filter-group">
          <label class="po-filter-label">Desde</label>
          <input v-model="personal.fechaInicio" type="date" class="po-filter-input po-filter-date" />
        </div>
        <div class="po-filter-group">
          <label class="po-filter-label">Hasta</label>
          <input v-model="personal.fechaFin" type="date" class="po-filter-input po-filter-date" />
        </div>
        <button class="po-filter-clear" @click="clearPersonalFiltros" title="Limpiar filtros">✕ Limpiar</button>
      </div>

      <!-- KPIs -->
      <div v-if="personalFiltrado.length" class="po-kpis">
        <div class="po-kpi">
          <span class="po-kpi-val">{{ personalKpis.personas }}</span>
          <span class="po-kpi-lbl">Personas</span>
        </div>
        <div class="po-kpi">
          <span class="po-kpi-val">{{ personalKpis.horas }}h</span>
          <span class="po-kpi-lbl">Horas trabajadas</span>
        </div>
        <div class="po-kpi po-kpi--registros">
          <span class="po-kpi-val">{{ personal.data.length }}</span>
          <span class="po-kpi-lbl">Registros</span>
        </div>
        <div class="po-kpi po-kpi--money">
          <span class="po-kpi-val">{{ fmtMoney(personalKpis.costo) }}</span>
          <span class="po-kpi-lbl">Costo total personal</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="personal.loading" class="po-loading">
        <div class="po-spinner" /><span>Cargando registros…</span>
      </div>

      <!-- Error -->
      <p v-else-if="personal.error" class="rep-err" style="padding:16px 0">{{ personal.error }}</p>

      <!-- Vacío -->
      <div v-else-if="personal.data && !personalFiltrado.length" class="po-empty">
        Sin registros para los filtros seleccionados
      </div>

      <!-- Tabla -->
      <div v-else-if="personalFiltrado.length" class="po-table-wrap">
        <table class="po-table">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Rol</th>
              <th v-if="!personal.quotationId">Evento</th>
              <th>Fecha</th>
              <th>Ingreso</th>
              <th>Salida</th>
              <th>Horas reales</th>
              <th>Valor / hora</th>
              <th>% Extra</th>
              <th>Estado</th>
              <th>Correo</th>
              <th class="po-th-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in personalFiltrado" :key="r.id" :class="{ 'po-row-incomplete': !r.horaIngreso || !r.horaSalida }">
              <td class="po-td-person">
                <div class="po-avatar">{{ (r.user?.fullName ?? r.nombreExterno ?? '?').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() }}</div>
                <span>{{ r.user?.fullName ?? r.nombreExterno ?? '—' }}</span>
              </td>
              <td><span class="rep-role" :class="repRoleClass(r.user?.role)">{{ r.user?.role ?? 'Externo' }}</span></td>
              <td v-if="!personal.quotationId" class="po-td-event">
                <span class="po-event-num">#{{ r.quotation?.numero }}</span>
                {{ r.quotation?.cliente?.name ?? r.quotation?.empresa ?? '—' }}
              </td>
              <td>{{ fmtDate(r.fecha) }}</td>
              <td class="rep-mono po-td-time">{{ r.horaIngreso ? fmtTime(r.horaIngreso) : '—' }}</td>
              <td class="rep-mono po-td-time">{{ r.horaSalida  ? fmtTime(r.horaSalida)  : '—' }}</td>
              <td class="po-td-hours">{{ calcHours(r.horaIngreso, r.horaSalida) }}</td>
              <td class="po-td-rate">{{ r.valorHoraContratada ? fmtMoney(Number(r.valorHoraContratada)) : '—' }}</td>
              <td class="po-td-pct">{{ r.porcentajeAdicional ? r.porcentajeAdicional + '%' : '—' }}</td>
              <td><span class="po-cumplido-chip" :class="r.cumplido ? 'po-cumplido-chip--si' : 'po-cumplido-chip--no'">{{ r.cumplido ? 'Cumplido' : 'Pendiente' }}</span></td>
              <td>
                <span
                  class="po-cumplido-chip"
                  :class="r.emailEnviado ? 'po-cumplido-chip--si' : 'po-cumplido-chip--no'"
                  :title="r.emailEnviado && r.emailEnviadoAt ? `Enviado ${fmtDate(r.emailEnviadoAt)}` : 'Aún no enviado'"
                >{{ r.emailEnviado ? 'Enviado' : 'Pendiente' }}</span>
              </td>
              <td class="po-td-total">{{ calcTotal(r) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td :colspan="personal.quotationId ? 6 : 7" class="po-tfoot-label">Totales</td>
              <td class="po-td-hours po-tfoot-val">{{ personalKpis.horas }}h</td>
              <td colspan="4"></td>
              <td class="po-td-total po-tfoot-val">{{ fmtMoney(personalKpis.costo) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>

    <!-- ══ Modal: Enviar reporte por correo ══════════════════════════ -->
    <div v-if="enviarCorreo.open" class="po-modal-overlay" @click.self="closeEnviarCorreoModal">
      <div class="po-modal">
        <div class="po-modal-header">
          <h3 class="po-modal-title">{{ personaYaEnviada ? 'Reenviar reporte por correo' : 'Enviar reporte por correo' }}</h3>
          <button class="po-modal-close" @click="closeEnviarCorreoModal">✕</button>
        </div>
        <div class="po-modal-body">
          <p class="po-modal-desc">
            Se enviará el detalle de <strong>{{ personalFiltrado.length }}</strong> día{{ personalFiltrado.length !== 1 ? 's' : '' }}
            trabajado{{ personalFiltrado.length !== 1 ? 's' : '' }} por un total de <strong>{{ fmtMoney(personalKpis.costo) }}</strong>
            a <strong>{{ personalDisponibleSeleccionado?.fullName }}</strong>.
          </p>
          <div class="po-filter-group">
            <label class="po-filter-label">Correo destinatario</label>
            <input
              v-model="enviarCorreo.destinatario"
              type="email"
              class="po-filter-input"
              placeholder="correo@ejemplo.com"
              :readonly="enviarCorreo.esInterno"
            />
            <p v-if="enviarCorreo.esInterno" class="po-modal-hint">Correo del usuario registrado en el sistema.</p>
          </div>
          <p v-if="enviarCorreo.error" class="rep-err">{{ enviarCorreo.error }}</p>
        </div>
        <div class="po-modal-footer">
          <button class="po-btn-ghost" @click="closeEnviarCorreoModal">Cancelar</button>
          <button
            class="rep-btn-export"
            :disabled="enviarCorreo.enviando || !enviarCorreo.destinatario"
            @click="confirmEnviarCorreo"
          >
            <Loader2 v-if="enviarCorreo.enviando" :size="13" class="spin" />
            {{ personaYaEnviada ? 'Reenviar' : 'Enviar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatCOP } from '@/utils/currency.js'
import {
  Clock, Users, Building2, CalendarDays,
  Download, Play, Loader2, Mail,
} from 'lucide-vue-next'
import {
  getReporteCuentasPorCobrar,
  getReportePorEjecutivo,
  getReportePorCliente,
  getAdminCotizaciones,
} from '@/services/administracion.service.js'
import { getQuotations } from '@/services/quotation.service'
import { getReportePersonal, enviarReportePersonalCorreo } from '@/services/registros-turno.service'

// ── Helpers ───────────────────────────────────────────────
function fmtMoney(n) { return (n == null || n === 0) ? '$0' : formatCOP(n) }

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

// ── Personal operativo ────────────────────────────────────
const personal = ref({
  quotationId: null,
  personKey:   null,
  estado:      'cumplido', // 'cumplido' | 'pendiente' | 'todos'
  fechaInicio: '',
  fechaFin:    '',
  quotations:  [],
  data:        null,
  loading:     false,
  error:       null,
})

onMounted(async () => {
  try {
    const res = await getQuotations()
    personal.value.quotations = (res.data ?? []).filter(q =>
      ['Aprobada', 'Pendiente'].includes(q.quotationStatus?.name ?? '')
    )
  } catch (_) {}
  await runPersonal()
})

async function runPersonal() {
  personal.value.loading = true
  personal.value.error   = null
  try {
    personal.value.data = await getReportePersonal(personal.value.quotationId)
  } catch (e) {
    personal.value.error = e?.response?.data?.message ?? 'Error generando reporte'
  } finally {
    personal.value.loading = false
  }
}

// Esta sección debe mostrar personal logístico: usuarios internos con rol
// LOGISTICO y personal externo (nombreExterno) contratado para el evento,
// ya que este último no tiene cuenta ni rol asignado — se filtra en el
// origen para que KPIs, tabla, exportación y el selector de personas
// queden todos consistentes.
const personalLogistico = computed(() => {
  const rows = personal.value.data ?? []
  return rows.filter(r => r.user?.role === 'LOGISTICO' || (!r.userId && r.nombreExterno))
})

// Identificador único de persona: userId para internos, nombre para externos
function personKey(r) {
  return r.userId ? `u:${r.userId}` : `x:${r.nombreExterno}`
}

// Lista de personas únicas disponibles en los datos cargados
const personalDisponible = computed(() => {
  const rows = personalLogistico.value
  const seen = new Map()
  rows.forEach(r => {
    const key = personKey(r)
    if (!seen.has(key)) {
      seen.set(key, {
        id:       key,
        fullName: r.user?.fullName ?? r.nombreExterno ?? '—',
        role:     r.user?.role ?? 'Externo',
      })
    }
  })
  return Array.from(seen.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
})

// Persona actualmente seleccionada en el filtro "Personal"
const personalDisponibleSeleccionado = computed(() =>
  personalDisponible.value.find(u => u.id === personal.value.personKey) ?? null
)

// Datos filtrados por fecha, persona seleccionada y estado (cumplido/pendiente)
const personalFiltrado = computed(() => {
  const rows = personalLogistico.value
  const { personKey: selectedKey, fechaInicio, fechaFin, estado } = personal.value
  return rows.filter(r => {
    if (selectedKey && personKey(r) !== selectedKey) return false
    if (estado === 'cumplido' && !r.cumplido) return false
    if (estado === 'pendiente' && r.cumplido) return false
    if (fechaInicio && r.fecha) {
      if (r.fecha.slice(0, 10) < fechaInicio) return false
    }
    if (fechaFin && r.fecha) {
      if (r.fecha.slice(0, 10) > fechaFin) return false
    }
    return true
  })
})

// El botón muestra "Reenviar" solo si TODOS los días visibles ya fueron enviados
const personaYaEnviada = computed(() =>
  personalFiltrado.value.length > 0 && personalFiltrado.value.every(r => r.emailEnviado)
)

function clearPersonalFiltros() {
  personal.value.personKey   = null
  personal.value.estado      = 'cumplido'
  personal.value.fechaInicio = ''
  personal.value.fechaFin    = ''
}

const personalKpis = computed(() => {
  const rows = personalFiltrado.value
  const personas = new Set(rows.map(r => personKey(r))).size
  const horas = rows.reduce((s, r) => s + calcHoursNum(r.horaIngreso, r.horaSalida), 0)
  const costo = rows.reduce((s, r) => s + calcTotalNum(r), 0)
  return { personas, horas: horas.toFixed(1), costo }
})

function calcHoursNum(inIso, outIso) {
  if (!inIso || !outIso) return 0
  const h = (new Date(outIso) - new Date(inIso)) / 3600000
  return h > 0 ? h : 0
}
function calcHours(inIso, outIso) {
  const h = calcHoursNum(inIso, outIso)
  return h > 0 ? h.toFixed(1) + 'h' : '—'
}
function calcTotalNum(r) {
  if (!r.horaIngreso || !r.horaSalida || !r.valorHoraContratada) return 0
  return calcHoursNum(r.horaIngreso, r.horaSalida) * Number(r.valorHoraContratada) * (1 + (r.porcentajeAdicional ?? 0) / 100)
}
function calcTotal(r) {
  const t = calcTotalNum(r)
  return t > 0 ? fmtMoney(t) : '—'
}
function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function repRoleClass(role) {
  const map = { LOGISTICO: 'rep-role--blue', OPERATIVO: 'rep-role--green', SUPERVISOR: 'rep-role--purple', COORDINADOR: 'rep-role--orange' }
  return map[role] ?? 'rep-role--gray'
}

function exportPersonal() {
  const rows = personalFiltrado.value
  const headers = ['Persona', 'Rol', 'Evento', 'Fecha', 'Ingreso', 'Salida', 'Horas', 'Valor/hora', '% Extra', 'Estado', 'Total']
  const csv = rows.map(r => [
    r.user?.fullName ?? r.nombreExterno ?? '',
    r.user?.role ?? 'Externo',
    `#${r.quotation?.numero} ${r.quotation?.cliente?.name ?? r.quotation?.empresa ?? ''}`,
    fmtDate(r.fecha),
    r.horaIngreso ? fmtTime(r.horaIngreso) : '',
    r.horaSalida  ? fmtTime(r.horaSalida)  : '',
    calcHours(r.horaIngreso, r.horaSalida),
    r.valorHoraContratada ? Number(r.valorHoraContratada) : '',
    r.porcentajeAdicional ?? 0,
    r.cumplido ? 'Cumplido' : 'Pendiente',
    calcTotalNum(r).toFixed(0),
  ])
  downloadCSV(csv, headers, `personal-operativo-${today()}.csv`)
}

// ── Enviar reporte por correo ───────────────────────────────────────
const enviarCorreo = ref({
  open:         false,
  destinatario: '',
  esInterno:    false,
  enviando:     false,
  error:        null,
})

function openEnviarCorreoModal() {
  const rows = personalFiltrado.value
  if (!rows.length) return
  const primero = rows[0]
  enviarCorreo.value = {
    open:         true,
    destinatario: primero.user?.email ?? primero.emailExterno ?? '',
    esInterno:    !!primero.user,
    enviando:     false,
    error:        null,
  }
}

function closeEnviarCorreoModal() {
  enviarCorreo.value.open = false
}

async function confirmEnviarCorreo() {
  const rows = personalFiltrado.value
  if (!rows.length || !enviarCorreo.value.destinatario) return
  enviarCorreo.value.enviando = true
  enviarCorreo.value.error    = null
  try {
    const registroIds = rows.map(r => r.id)
    const actualizados = await enviarReportePersonalCorreo(registroIds, enviarCorreo.value.destinatario)
    const porId = new Map(actualizados.map(r => [r.id, r]))
    personal.value.data = (personal.value.data ?? []).map(r => porId.get(r.id) ?? r)
    enviarCorreo.value.open = false
  } catch (e) {
    enviarCorreo.value.error = e?.response?.data?.message ?? 'No se pudo enviar el correo'
  } finally {
    enviarCorreo.value.enviando = false
  }
}
</script>

<style scoped>
.rep-page {
  padding: 20px 24px;
  width: 100%;
  box-sizing: border-box;
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
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 2px 8px rgba(39,200,216,.06);
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
.rep-input:focus { border-color: #27C8D8; }

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
  background: #27C8D8;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.rep-btn-run:hover:not(:disabled) { background: #1BAEBB; }
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
.rep-btn-export:hover { background: #E0F9FA; border-color: #27C8D8; color: #27C8D8; }
.rep-btn-export:disabled { opacity: 0.6; cursor: not-allowed; }
.rep-btn-export--sent { background: #EFF6FF; border-color: #BFDBFE; color: #1D4ED8; }
.rep-btn-export--sent:hover { background: #DBEAFE; border-color: #93C5FD; color: #1D4ED8; }

.rep-err { font-size: 12px; color: #DC2626; margin: 4px 0 0; }

/* Modal enviar correo */
.po-modal-overlay {
  position: fixed; inset: 0; background: rgba(15,26,46,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}
.po-modal {
  background: #fff; border-radius: 14px; width: 100%; max-width: 440px;
  overflow: hidden;
}
.po-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-bottom: 1px solid #F1F5F9;
}
.po-modal-title { font-size: 15px; font-weight: 700; color: #0F1A2E; margin: 0; }
.po-modal-close {
  background: #F1F5F9; border: none; border-radius: 50%;
  width: 26px; height: 26px; cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.po-modal-body { padding: 18px 20px; }
.po-modal-desc { font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 16px; }
.po-modal-hint { font-size: 11px; color: #94A3B8; margin: 6px 0 0; }
.po-modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 20px; border-top: 1px solid #F1F5F9;
}
.po-btn-ghost {
  padding: 7px 14px; background: #F8FAFC; border: 1.5px solid #E2E8F0;
  border-radius: 8px; font-size: 13px; font-weight: 500; color: #64748B; cursor: pointer;
}
.po-btn-ghost:hover { background: #F1F5F9; }

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

/* Shared */
.rep-mono { font-family: monospace; }
.rep-role { display: inline-block; padding: 2px 7px; border-radius: 99px; font-size: 10px; font-weight: 600; }
.rep-role--blue   { background: #CCEFF2; color: #27C8D8; }
.rep-role--green  { background: #D1FAE5; color: #065F46; }
.rep-role--purple { background: #EDE9FE; color: #6D28D9; }
.rep-role--orange { background: #FEF3C7; color: #92400E; }
.rep-role--gray   { background: #F1F5F9; color: #475569; }

.po-cumplido-chip { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; white-space: nowrap; }
.po-cumplido-chip--si { background: #D1FAE5; color: #065F46; }
.po-cumplido-chip--no { background: #FEF3C7; color: #92400E; }

/* ── Personal operativo ── */
.po-section {
  margin-top: 28px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E8EDF5;
  overflow: hidden;
}

.po-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid #F1F5F9;
  flex-wrap: wrap;
}
.po-header-left { display: flex; align-items: center; gap: 12px; }
.po-header-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: #F0FDF4; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.po-title { font-size: 15px; font-weight: 700; color: #0F172A; margin: 0 0 2px; }
.po-sub   { font-size: 12px; color: #64748B; margin: 0; }
.po-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.po-select {
  border: 1.5px solid #E2E8F0; border-radius: 8px;
  padding: 7px 12px; font-size: 13px; color: #0F172A;
  background: white; cursor: pointer; min-width: 240px;
}

/* KPIs */
.po-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid #F1F5F9;
}
@media (max-width: 700px) { .po-kpis { grid-template-columns: repeat(2, 1fr); } }
.po-kpi {
  padding: 16px 24px;
  display: flex; flex-direction: column; gap: 3px;
  border-right: 1px solid #F1F5F9;
}
.po-kpi:last-child { border-right: none; }
.po-kpi--money { background: #F0FDF4; }
.po-kpi--registros { background: #F8FAFC; }
.po-kpi-val { font-size: 22px; font-weight: 800; color: #0F1A2E; line-height: 1; }
.po-kpi-lbl { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
.po-kpi--money .po-kpi-val { color: #059669; }

/* States */
.po-loading { display: flex; align-items: center; gap: 10px; padding: 40px 24px; color: #64748B; font-size: 13px; }
.po-spinner {
  width: 20px; height: 20px; border: 2.5px solid #E2E8F0;
  border-top-color: #27C8D8; border-radius: 50%;
  animation: spin 0.8s linear infinite; flex-shrink: 0;
}
.po-empty { text-align: center; padding: 40px 24px; color: #94A3B8; font-size: 13px; }

/* Tabla */
.po-table-wrap { width: 100%; overflow-x: auto; }
.po-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.po-table th {
  padding: 10px 16px;
  font-size: 11px; font-weight: 700; color: #64748B;
  text-transform: uppercase; letter-spacing: .04em;
  background: #FAFBFC; border-bottom: 1.5px solid #E8EDF5;
  text-align: left; white-space: nowrap;
}
.po-th-right { text-align: right; }
.po-table td { padding: 12px 16px; border-bottom: 1px solid #F8FAFC; color: #1E293B; vertical-align: middle; }
.po-table tr:last-child td { border-bottom: none; }
.po-row-incomplete td { opacity: .65; }
.po-table tfoot td {
  padding: 10px 16px; border-top: 2px solid #E8EDF5;
  background: #FAFBFC; font-size: 12px;
}
.po-tfoot-label { font-weight: 700; color: #374151; }
.po-tfoot-val   { font-weight: 800; }

.po-td-person { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
.po-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: #E0F9FA; color: #27C8D8;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.po-td-event   { font-size: 12px; }
.po-event-num  { font-weight: 700; color: #6366F1; margin-right: 5px; }
.po-td-time    { color: #334155; }
.po-td-hours   { font-weight: 700; color: #0F1A2E; }
.po-td-rate    { color: #475569; font-size: 12px; }
.po-td-pct     { color: #475569; font-size: 12px; }
.po-td-total   { font-weight: 700; color: #059669; text-align: right; white-space: nowrap; }

/* ── Filtros personal ── */
.po-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid #F1F5F9;
  background: #FAFBFC;
}
.po-filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.po-filter-label {
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.po-filter-input {
  height: 34px;
  padding: 0 10px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  background: #fff;
  outline: none;
  min-width: 200px;
}
.po-filter-input:focus { border-color: #27C8D8; }
.po-filter-date { min-width: 140px; }
.po-filter-clear {
  height: 34px;
  padding: 0 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #64748B;
  background: #fff;
  cursor: pointer;
  transition: all .15s;
  align-self: flex-end;
}
.po-filter-clear:hover { border-color: #27C8D8; color: #27C8D8; background: #E0F9FA; }
</style>
