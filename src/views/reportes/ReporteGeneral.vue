<template>
  <div class="cc-wrap">

    <!-- ══════════════════════════════════════════════
         HEADER
    ══════════════════════════════════════════════ -->
    <div class="cc-page-header">
      <div class="cc-page-title-wrap">
        <div class="cc-page-icon"><Receipt :size="20" color="#27C8D8" /></div>
        <div>
          <h1 class="cc-page-title">Cuadro de costos</h1>
          <p class="cc-page-sub">Gastos adicionales de todos los eventos — transporte, personal, daños y más</p>
        </div>
      </div>
      <div class="cc-page-actions">
        <button class="cc-btn-ghost" :disabled="loading || !costos.length" @click="exportarCSV">
          <Download :size="14" /> Exportar
        </button>
        <button v-if="canManage" class="cc-btn-primary" @click="abrirCrear">
          <Plus :size="14" /> Agregar costo
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         FILTROS
    ══════════════════════════════════════════════ -->
    <div class="cc-filter-card">
      <div class="cc-filter-grid">
        <div class="cc-field">
          <label class="cc-label">Desde</label>
          <input v-model="filtros.fechaDesde" type="date" class="cc-input" />
        </div>
        <div class="cc-field">
          <label class="cc-label">Hasta</label>
          <input v-model="filtros.fechaHasta" type="date" class="cc-input" />
        </div>
        <div class="cc-field">
          <label class="cc-label">Categoría</label>
          <SelectLabel v-model="filtros.categoria" :options="categoriaOptions" placeholder="Todas las categorías" />
        </div>
        <div v-if="mostrarFiltroSede" class="cc-field">
          <label class="cc-label">Unidad de Ejecución</label>
          <SelectLabel v-model="filtros.sedeId" :options="sedeOptions" placeholder="Todas las unidades" />
        </div>
        <div class="cc-field cc-field-search">
          <label class="cc-label">Buscar</label>
          <div class="cc-search-input-wrap">
            <Search :size="13" class="cc-search-icon" />
            <input v-model="filtros.search" type="text" placeholder="Cotización, cliente o descripción…" class="cc-input cc-input-search" />
          </div>
        </div>
        <label class="cc-checkbox-field">
          <input v-model="filtros.soloSinComprobante" type="checkbox" />
          Solo sin comprobante
        </label>
        <button class="cc-btn-apply" :disabled="loading" @click="recargarTodo">
          <BarChart2 :size="14" />
          {{ loading ? 'Cargando…' : 'Aplicar filtros' }}
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         ERROR
    ══════════════════════════════════════════════ -->
    <div v-if="error" class="cc-error-card">
      <AlertCircle :size="36" class="cc-error-icon" />
      <p class="cc-error-msg">{{ error }}</p>
      <button class="cc-btn-retry" @click="recargarTodo">Reintentar</button>
    </div>

    <template v-else>

      <!-- ══════════════════════════════════════════
           KPIs
      ══════════════════════════════════════════ -->
      <div class="cc-kpi-grid">
        <template v-if="loading">
          <div v-for="i in 4" :key="i" class="cc-kpi-skel" />
        </template>
        <template v-else>
          <div v-for="kpi in kpiList" :key="kpi.label" class="cc-kpi-card">
            <div class="cc-kpi-icon" :style="{ background: kpi.iconBg }">
              <component :is="kpi.icon" :size="18" :color="kpi.iconColor" />
            </div>
            <div class="cc-kpi-body">
              <p class="cc-kpi-label">{{ kpi.label }}</p>
              <p class="cc-kpi-value">{{ kpi.value }}</p>
              <p v-if="kpi.sub" class="cc-kpi-sub" :class="kpi.subClass">{{ kpi.sub }}</p>
            </div>
          </div>
        </template>
      </div>

      <!-- ══════════════════════════════════════════
           GRÁFICAS — Fila 1
      ══════════════════════════════════════════ -->
      <div class="cc-charts-row">
        <div class="cc-chart-card">
          <div class="cc-chart-header"><TrendingUp :size="15" class="cc-chart-hico" /><span>Evolución Mensual</span></div>
          <div class="cc-chart-body">
            <div v-if="loading" class="cc-chart-skel" />
            <div v-else-if="!resumen?.evolucionMensual?.length" class="cc-no-data">Sin datos para el período</div>
            <div v-else class="cc-canvas-wrap"><canvas ref="evolucionRef" /></div>
          </div>
        </div>
        <div class="cc-chart-card">
          <div class="cc-chart-header"><PieChart :size="15" class="cc-chart-hico" /><span>Distribución por Categoría</span></div>
          <div class="cc-chart-body cc-chart-body--donut">
            <div v-if="loading" class="cc-chart-skel" />
            <div v-else-if="!resumen?.porCategoria?.length" class="cc-no-data">Sin datos para el período</div>
            <div v-else class="cc-canvas-wrap"><canvas ref="categoriaRef" /></div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           GRÁFICAS — Fila 2
      ══════════════════════════════════════════ -->
      <div class="cc-charts-row">
        <div class="cc-chart-card">
          <div class="cc-chart-header"><Trophy :size="15" class="cc-chart-hico" /><span>Top 5 Eventos con más costo</span></div>
          <div class="cc-chart-body">
            <div v-if="loading" class="cc-chart-skel" />
            <div v-else-if="!resumen?.topCotizaciones?.length" class="cc-no-data">Sin datos para el período</div>
            <div v-else class="cc-canvas-wrap"><canvas ref="topRef" /></div>
          </div>
        </div>
        <div class="cc-chart-card">
          <div class="cc-chart-header"><ShieldCheck :size="15" class="cc-chart-hico" /><span>Cumplimiento de Comprobantes</span></div>
          <div class="cc-chart-body cc-chart-body--donut">
            <div v-if="loading" class="cc-chart-skel" />
            <div v-else-if="!resumen?.totalRegistros" class="cc-no-data">Sin datos para el período</div>
            <div v-else class="cc-canvas-wrap"><canvas ref="comprobanteRef" /></div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           TABLA DE COSTOS
      ══════════════════════════════════════════ -->
      <div class="cc-section-card">
        <div class="cc-section-header">
          <ClipboardList :size="15" class="cc-chart-hico" />
          <span>Detalle de costos</span>
          <span v-if="costos.length" class="cc-section-count">{{ costos.length }}</span>
        </div>

        <template v-if="loading">
          <div v-for="i in 5" :key="i" class="cc-row-skel" />
        </template>

        <div v-else-if="!costos.length" class="cc-no-data cc-no-data--pad">
          Sin costos registrados para los filtros seleccionados
        </div>

        <div v-else class="cc-table-scroll">
          <table class="cc-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Evento</th>
                <th>Sede</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th class="cc-th-r">Monto</th>
                <th>Registrado por</th>
                <th class="cc-th-c">Comprobante</th>
                <th v-if="canManage" class="cc-th-c">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in costos" :key="c.id" class="cc-tr">
                <td class="cc-td-meta">{{ fmtDate(c.fecha) }}</td>
                <td class="cc-td-name">#{{ c.quotation?.numero ?? '—' }} — {{ nombreCliente(c.quotation) }}</td>
                <td class="cc-td-meta">{{ c.quotation?.sede?.nombre ?? '—' }}</td>
                <td>
                  <span class="cc-cat-badge" :style="badgeStyle(c.categoria)">{{ CATEGORIA_META[c.categoria]?.label ?? c.categoria }}</span>
                </td>
                <td class="cc-td-desc" :title="c.descripcion">{{ c.descripcion }}</td>
                <td class="cc-td-r cc-val">{{ fmt(c.monto) }}</td>
                <td class="cc-td-meta">{{ c.registradoPor?.fullName ?? '—' }}</td>
                <td class="cc-td-c">
                  <a v-if="c.soporteUrl" :href="c.soporteUrl" target="_blank" class="cc-soporte-link" title="Ver comprobante">
                    <FileCheck2 :size="14" />
                  </a>
                  <label v-else-if="canManage" class="cc-soporte-upload" title="Adjuntar comprobante">
                    <Paperclip :size="14" v-if="uploadingId !== c.id" />
                    <Loader2 :size="14" class="cc-spin" v-else />
                    <input type="file" accept="image/*,application/pdf" class="cc-file-input" :disabled="uploadingId === c.id" @change="onFileChange($event, c)" />
                  </label>
                  <span v-else class="cc-sin-soporte" title="Sin comprobante">
                    <AlertTriangle :size="14" />
                  </span>
                </td>
                <td v-if="canManage" class="cc-td-c">
                  <div class="cc-actions">
                    <button class="cc-action-btn" title="Editar" @click="abrirEditar(c)"><Pencil :size="13" /></button>
                    <button v-if="canDelete" class="cc-action-btn cc-action-btn--danger" title="Eliminar" @click="confirmarEliminar(c)"><Trash2 :size="13" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>

    <!-- ══════════════════════════════════════════════
         MODAL AGREGAR / EDITAR
    ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="cc-modal-fade">
        <div v-if="modalOpen" class="cc-modal-overlay" @click.self="cerrarModal">
          <div class="cc-modal-card">
            <div class="cc-modal-header">
              <h3>{{ editando ? 'Editar costo' : 'Agregar costo' }}</h3>
              <button class="cc-modal-close" @click="cerrarModal"><X :size="16" /></button>
            </div>

            <div class="cc-modal-body">
              <div v-if="!editando" class="cc-field">
                <label class="cc-label">Cotización / evento</label>
                <div class="cc-picker-wrap" ref="pickerRootEl">
                  <button type="button" class="cc-picker-trigger" @click="togglePicker">
                    <span :class="{ 'cc-picker-placeholder': !form.quotationId }">{{ form.quotationLabel || 'Buscar cotización…' }}</span>
                    <ChevronDown :size="14" />
                  </button>
                  <div v-if="pickerOpen" class="cc-picker-menu">
                    <input v-model="pickerSearch" type="text" class="cc-picker-search" placeholder="Buscar por número o cliente…" autofocus />
                    <div v-if="loadingQuotations" class="cc-picker-empty">Cargando cotizaciones…</div>
                    <div v-else-if="!filteredQuotations.length" class="cc-picker-empty">Sin resultados</div>
                    <ul v-else class="cc-picker-list">
                      <li v-for="q in filteredQuotations" :key="q.id" class="cc-picker-option" @click="seleccionarQuotation(q)">
                        #{{ q.numero }} — {{ nombreCliente(q) }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div v-else class="cc-field">
                <label class="cc-label">Cotización / evento</label>
                <p class="cc-static-value">#{{ form.quotationLabel }}</p>
              </div>

              <div class="cc-field">
                <label class="cc-label">Categoría</label>
                <SelectLabel v-model="form.categoria" :options="categoriaFormOptions" placeholder="Seleccionar categoría…" />
              </div>

              <div class="cc-field-row">
                <div class="cc-field">
                  <label class="cc-label">Fecha</label>
                  <input v-model="form.fecha" type="date" class="cc-input" />
                </div>
                <div class="cc-field">
                  <label class="cc-label">Monto (COP)</label>
                  <input v-model.number="form.monto" type="number" min="0" placeholder="Ej: 150000" class="cc-input" />
                </div>
              </div>

              <div class="cc-field">
                <label class="cc-label">Descripción</label>
                <textarea v-model="form.descripcion" class="cc-textarea" rows="3" placeholder="Detalle del gasto — ej: Flete adicional por cambio de bodega" />
              </div>

              <div class="cc-field">
                <label class="cc-label">Comprobante {{ editando ? '(opcional — reemplaza el actual)' : '(opcional)' }}</label>
                <div class="cc-file-field">
                  <a v-if="editando?.soporteUrl && !comprobanteFile" :href="editando.soporteUrl" target="_blank" class="cc-file-current">
                    <FileCheck2 :size="14" /> Ver comprobante actual
                  </a>
                  <label class="cc-file-picker">
                    <Paperclip :size="14" />
                    {{ comprobanteFile ? comprobanteFile.name : (editando?.soporteUrl ? 'Reemplazar archivo…' : 'Adjuntar imagen o PDF…') }}
                    <input type="file" accept="image/*,application/pdf" class="cc-file-input" @change="onComprobanteSelected" />
                  </label>
                </div>
              </div>

              <p v-if="formError" class="cc-form-error">{{ formError }}</p>
            </div>

            <div class="cc-modal-footer">
              <button class="cc-btn-ghost" @click="cerrarModal">Cancelar</button>
              <button class="cc-btn-primary" :disabled="!canSave || guardando" @click="guardar">
                {{ guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar costo' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmModal
      :show="confirmState.show"
      variant="danger"
      title="Eliminar costo"
      :message="confirmState.message"
      confirm-label="Eliminar"
      @confirm="eliminarConfirmado"
      @cancel="confirmState.show = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import {
  Receipt, Plus, Download, Search, BarChart2, AlertCircle, TrendingUp, PieChart,
  Trophy, ShieldCheck, ClipboardList, FileCheck2, Paperclip, Loader2, AlertTriangle,
  Pencil, Trash2, X, ChevronDown,
} from 'lucide-vue-next'
import { formatCOP } from '@/utils/currency.js'
import SelectLabel from '@/components/input/SelectLabel.vue'
import ConfirmModal from '@/components/modal/ConfirmModal.vue'
import { useAuth } from '@/composables/useAuth'
import { getSedes } from '@/services/sedes.service'
import {
  getExtraCostsGlobal, getExtraCostsSummary,
  getQuotations, createExtraCost, updateExtraCost, deleteExtraCost, uploadExtraCostSoporte,
} from '@/services/quotation.service'

Chart.register(...registerables)

// ── Permisos ─────────────────────────────────────────────
const { user } = useAuth()
const roles = computed(() => user.value?.roles ?? [])
const canManage = computed(() => roles.value.some(r => ['ADMIN', 'ADMINISTRADOR'].includes(r)))
const canDelete = canManage
const mostrarFiltroSede = computed(() =>
  !user.value?.sedeId && roles.value.some(r => ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'].includes(r))
)

// ── Categorías ───────────────────────────────────────────
const CATEGORIA_META = {
  TRANSPORTE: { label: 'Transporte extra',   color: '#0369A1', bg: '#E0F2FE' },
  PERSONAL:   { label: 'Personal adicional', color: '#6D28D9', bg: '#EDE9FE' },
  DANOS:      { label: 'Daños',              color: '#B91C1C', bg: '#FEE2E2' },
  ALQUILER:   { label: 'Alquiler adicional', color: '#B45309', bg: '#FEF3C7' },
  OTROS:      { label: 'Otros',              color: '#475569', bg: '#F1F5F9' },
}
const categoriaOptions = Object.entries(CATEGORIA_META).map(([value, m]) => ({ value, label: m.label }))
const categoriaFormOptions = categoriaOptions

const badgeStyle = (cat) => ({ background: CATEGORIA_META[cat]?.bg ?? '#F1F5F9', color: CATEGORIA_META[cat]?.color ?? '#475569' })

// ── Filtros ──────────────────────────────────────────────
const filtros = ref({
  fechaDesde: '',
  fechaHasta: '',
  categoria: '',
  sedeId: '',
  search: '',
  soloSinComprobante: false,
})

const sedeOptions = ref([])
const cargarSedes = async () => {
  if (!mostrarFiltroSede.value) return
  try {
    const { data } = await getSedes()
    sedeOptions.value = (Array.isArray(data) ? data : []).map(s => ({ value: s.id, label: s.nombre }))
  } catch (e) {
    console.error('[CuadroCostos] Error cargando sedes:', e)
  }
}

// ── Estado principal ─────────────────────────────────────
const loading = ref(false)
const error   = ref(null)
const costos  = ref([])
const resumen = ref(null)

const buildFilterParams = () => ({
  fechaDesde: filtros.value.fechaDesde || undefined,
  fechaHasta: filtros.value.fechaHasta || undefined,
  categoria:  filtros.value.categoria || undefined,
  sedeId:     filtros.value.sedeId || undefined,
  search:     filtros.value.search?.trim() || undefined,
  soloSinComprobante: filtros.value.soloSinComprobante || undefined,
})

const recargarTodo = async () => {
  loading.value = true
  error.value = null
  destroyCharts()
  try {
    const params = buildFilterParams()
    const [listRes, summaryRes] = await Promise.all([
      getExtraCostsGlobal(params),
      getExtraCostsSummary(params),
    ])
    costos.value = listRes.data
    resumen.value = summaryRes.data
    loading.value = false
    await nextTick()
    initCharts()
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar el cuadro de costos'
    loading.value = false
  }
}

const nombreCliente = (q) => q?.empresa || q?.contacto || q?.cliente?.name || 'Sin nombre'

// ── KPIs ─────────────────────────────────────────────────
const kpiList = computed(() => {
  const r = resumen.value
  if (!r) return []
  const topCategoria = r.porCategoria?.[0]
  return [
    {
      label: 'Costo total del período', value: fmt(r.totalCosto ?? 0),
      icon: Receipt, iconBg: '#FEE2E2', iconColor: '#B91C1C',
    },
    {
      label: 'Registros', value: r.totalRegistros ?? 0,
      sub: `Promedio ${fmt(r.promedioPorRegistro ?? 0)}`,
      icon: ClipboardList, iconBg: '#F0FAFB', iconColor: '#27C8D8',
    },
    {
      label: 'Sin comprobante', value: r.sinComprobante ?? 0,
      sub: r.sinComprobante ? 'Pendientes de soporte' : 'Todo documentado',
      subClass: r.sinComprobante ? 'cc-sub--warn' : 'cc-sub--ok',
      icon: AlertTriangle, iconBg: '#FFFBEB', iconColor: '#B45309',
    },
    {
      label: 'Mayor categoría', value: topCategoria ? CATEGORIA_META[topCategoria.categoria]?.label ?? topCategoria.categoria : '—',
      sub: topCategoria ? fmt(topCategoria.monto) : undefined,
      icon: Trophy, iconBg: '#EDE9FE', iconColor: '#6D28D9',
    },
  ]
})

// ── Gráficas ─────────────────────────────────────────────
const evolucionRef   = ref(null)
const categoriaRef   = ref(null)
const topRef         = ref(null)
const comprobanteRef = ref(null)
let evolucionChart, categoriaChart, topChart, comprobanteChart

const TICK = { color: '#94A3B8', font: { family: 'Inter', size: 11 } }
const GRID = { color: '#F1F5FA' }
const LGND = { font: { family: 'Inter', size: 11 }, color: '#64748B', boxWidth: 10, padding: 14 }

const destroyCharts = () => {
  evolucionChart?.destroy();   evolucionChart = null
  categoriaChart?.destroy();   categoriaChart = null
  topChart?.destroy();         topChart = null
  comprobanteChart?.destroy(); comprobanteChart = null
}

const initCharts = () => {
  initEvolucion()
  initCategoria()
  initTop()
  initComprobante()
}

const initEvolucion = () => {
  const d = resumen.value?.evolucionMensual
  if (!evolucionRef.value || !d?.length) return
  evolucionChart = new Chart(evolucionRef.value, {
    type: 'bar',
    data: {
      labels: d.map(x => x.mes),
      datasets: [{
        label: 'Costo mensual', data: d.map(x => x.monto),
        backgroundColor: 'rgba(185, 28, 28, 0.16)', borderColor: '#B91C1C',
        borderWidth: 1.5, borderRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } },
      },
      scales: {
        x: { ticks: TICK, grid: GRID },
        y: { ticks: { ...TICK, callback: v => fmtShort(v) }, grid: GRID },
      },
    },
  })
}

const initCategoria = () => {
  const d = resumen.value?.porCategoria
  if (!categoriaRef.value || !d?.length) return
  const total = d.reduce((s, x) => s + x.monto, 0)
  categoriaChart = new Chart(categoriaRef.value, {
    type: 'doughnut',
    data: {
      labels: d.map(x => CATEGORIA_META[x.categoria]?.label ?? x.categoria),
      datasets: [{
        data: d.map(x => x.monto),
        backgroundColor: d.map(x => CATEGORIA_META[x.categoria]?.color ?? '#94A3B8'),
        borderWidth: 1.5, borderColor: '#fff', hoverOffset: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '66%',
      plugins: {
        legend: { position: 'bottom', labels: LGND },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0.0'
              return ` ${ctx.label}: ${fmt(ctx.raw)} (${pct}%)`
            },
          },
        },
      },
    },
  })
}

const initTop = () => {
  const d = resumen.value?.topCotizaciones
  if (!topRef.value || !d?.length) return
  topChart = new Chart(topRef.value, {
    type: 'bar',
    data: {
      labels: d.map(x => `#${x.numero} — ${x.cliente}`),
      datasets: [{
        label: 'Costo adicional', data: d.map(x => x.monto),
        backgroundColor: 'rgba(180, 83, 9, 0.2)', borderColor: '#B45309',
        borderWidth: 1.5, borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } },
      },
      scales: {
        x: { ticks: { ...TICK, callback: v => fmtShort(v) }, grid: GRID },
        y: { ticks: TICK, grid: { display: false } },
      },
    },
  })
}

const initComprobante = () => {
  const r = resumen.value
  if (!comprobanteRef.value || !r?.totalRegistros) return
  const conComprobante = r.totalRegistros - r.sinComprobante
  comprobanteChart = new Chart(comprobanteRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Con comprobante', 'Sin comprobante'],
      datasets: [{
        data: [conComprobante, r.sinComprobante],
        backgroundColor: ['#16A34A', '#EF4444'],
        borderWidth: 1.5, borderColor: '#fff', hoverOffset: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '66%',
      plugins: {
        legend: { position: 'bottom', labels: LGND },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = r.totalRegistros > 0 ? ((ctx.raw / r.totalRegistros) * 100).toFixed(1) : '0.0'
              return ` ${ctx.label}: ${ctx.raw} (${pct}%)`
            },
          },
        },
      },
    },
  })
}

// ── Modal Agregar / Editar ────────────────────────────────
const modalOpen  = ref(false)
const editando   = ref(null) // costo original en edición, o null si es creación
const guardando  = ref(false)
const formError  = ref('')

const initialForm = () => ({ quotationId: null, quotationLabel: '', categoria: '', fecha: new Date().toISOString().slice(0, 10), monto: null, descripcion: '' })
const form = ref(initialForm())

const canSave = computed(() =>
  form.value.quotationId && form.value.categoria && form.value.fecha &&
  form.value.monto > 0 && form.value.descripcion.trim().length >= 3
)

const comprobanteFile = ref(null)
const onComprobanteSelected = (e) => {
  comprobanteFile.value = e.target.files?.[0] || null
}

const abrirCrear = () => {
  form.value = initialForm()
  formError.value = ''
  comprobanteFile.value = null
  editando.value = null
  modalOpen.value = true
}

const abrirEditar = (c) => {
  form.value = {
    quotationId: c.quotationId,
    quotationLabel: `${c.quotation?.numero ?? '—'} — ${nombreCliente(c.quotation)}`,
    categoria: c.categoria,
    fecha: c.fecha?.slice(0, 10),
    monto: c.monto,
    descripcion: c.descripcion,
  }
  formError.value = ''
  comprobanteFile.value = null
  editando.value = c
  modalOpen.value = true
}

const cerrarModal = () => {
  modalOpen.value = false
  pickerOpen.value = false
}

const guardar = async () => {
  if (!canSave.value) return
  guardando.value = true
  formError.value = ''
  const payload = {
    categoria: form.value.categoria,
    fecha: form.value.fecha,
    monto: form.value.monto,
    descripcion: form.value.descripcion.trim(),
  }
  try {
    let quotationId, costId
    if (editando.value) {
      quotationId = editando.value.quotationId
      costId = editando.value.id
      await updateExtraCost(quotationId, costId, payload)
    } else {
      quotationId = form.value.quotationId
      const { data } = await createExtraCost(quotationId, payload)
      costId = data.id
    }
    if (comprobanteFile.value) {
      await uploadExtraCostSoporte(quotationId, costId, comprobanteFile.value)
    }
    modalOpen.value = false
    await recargarTodo()
  } catch (e) {
    formError.value = e?.response?.data?.message || 'Error al guardar el costo'
  } finally {
    guardando.value = false
  }
}

// ── Picker de cotización (buscador inline) ────────────────
const pickerOpen = ref(false)
const pickerSearch = ref('')
const pickerRootEl = ref(null)
const quotationsCache = ref([])
const loadingQuotations = ref(false)

const cargarQuotations = async () => {
  if (quotationsCache.value.length) return
  loadingQuotations.value = true
  try {
    const res = await getQuotations()
    quotationsCache.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('[CuadroCostos] Error cargando cotizaciones:', e)
  } finally {
    loadingQuotations.value = false
  }
}

const filteredQuotations = computed(() => {
  const term = pickerSearch.value.trim().toLowerCase()
  const list = quotationsCache.value
  if (!term) return list.slice(0, 30)
  return list.filter(q =>
    String(q.numero).includes(term) ||
    q.empresa?.toLowerCase().includes(term) ||
    q.contacto?.toLowerCase().includes(term)
  ).slice(0, 30)
})

const togglePicker = () => {
  pickerOpen.value = !pickerOpen.value
  if (pickerOpen.value) cargarQuotations()
}

const seleccionarQuotation = (q) => {
  form.value.quotationId = q.id
  form.value.quotationLabel = `#${q.numero} — ${nombreCliente(q)}`
  pickerOpen.value = false
  pickerSearch.value = ''
}

const onClickOutsidePicker = (e) => {
  if (pickerRootEl.value && !pickerRootEl.value.contains(e.target)) pickerOpen.value = false
}

// ── Comprobante inline (desde la tabla) ───────────────────
const uploadingId = ref(null)
const onFileChange = async (event, c) => {
  const file = event.target.files?.[0]
  if (!file) return
  uploadingId.value = c.id
  try {
    const { data } = await uploadExtraCostSoporte(c.quotationId, c.id, file)
    c.soporteUrl = data.soporteUrl
  } catch (e) {
    console.error('[CuadroCostos] Error subiendo comprobante:', e)
  } finally {
    uploadingId.value = null
    event.target.value = ''
  }
}

// ── Eliminar ───────────────────────────────────────────────
const confirmState = ref({ show: false, target: null, message: '' })
const confirmarEliminar = (c) => {
  confirmState.value = {
    show: true,
    target: c,
    message: `Vas a eliminar el costo "${c.descripcion}" de ${fmt(c.monto)} en la cotización #${c.quotation?.numero ?? '—'}. Esta acción no se puede deshacer.`,
  }
}
const eliminarConfirmado = async () => {
  const c = confirmState.value.target
  confirmState.value.show = false
  if (!c) return
  try {
    await deleteExtraCost(c.quotationId, c.id)
    await recargarTodo()
  } catch (e) {
    console.error('[CuadroCostos] Error eliminando:', e)
  }
}

// ── Exportar CSV ─────────────────────────────────────────
const exportarCSV = () => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const headers = ['Fecha', 'Cotización', 'Cliente', 'Sede', 'Categoría', 'Descripción', 'Monto', 'Registrado por', 'Comprobante']
  const rows = costos.value.map(c => [
    fmtDate(c.fecha),
    c.quotation?.numero ?? '',
    nombreCliente(c.quotation),
    c.quotation?.sede?.nombre ?? '',
    CATEGORIA_META[c.categoria]?.label ?? c.categoria,
    c.descripcion,
    c.monto,
    c.registradoPor?.fullName ?? '',
    c.soporteUrl ? 'Sí' : 'No',
  ].map(escape).join(','))
  const csv = [headers.map(escape).join(','), ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cuadro-de-costos_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Helpers de formato ─────────────────────────────────────
const fmt = formatCOP
const fmtShort = (v) => {
  if (!v && v !== 0) return ''
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

onMounted(() => {
  cargarSedes()
  recargarTodo()
  document.addEventListener('mousedown', onClickOutsidePicker)
})
onUnmounted(destroyCharts)
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutsidePicker))
</script>

<style scoped>
/* ── Contenedor ────────────────────────────────────────── */
.cc-wrap { padding: 24px; display: flex; flex-direction: column; gap: 20px; min-height: 100%; }

/* ── Header ────────────────────────────────────────────── */
.cc-page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.cc-page-title-wrap { display: flex; align-items: center; gap: 12px; }
.cc-page-icon {
  width: 42px; height: 42px; border-radius: 12px; background: #F0FAFB;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cc-page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: #0F172A; margin: 0; }
.cc-page-sub { font-size: 12.5px; color: #94A3B8; font-family: 'Inter', sans-serif; margin: 2px 0 0; }
.cc-page-actions { display: flex; gap: 10px; }

.cc-btn-primary {
  display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px;
  background: #27C8D8; color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
  box-shadow: 0 2px 8px rgba(39,200,216,.22); transition: background .15s;
}
.cc-btn-primary:hover:not(:disabled) { background: #1BAEBB; }
.cc-btn-primary:disabled { opacity: .55; cursor: not-allowed; }

.cc-btn-ghost {
  display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px;
  background: #F8FAFC; color: #475569; border: 1px solid #E2EBF6; border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: background .15s;
}
.cc-btn-ghost:hover:not(:disabled) { background: #EEF2F7; }
.cc-btn-ghost:disabled { opacity: .5; cursor: not-allowed; }

/* ── Filtros ───────────────────────────────────────────── */
.cc-filter-card { background: #fff; border-radius: 18px; padding: 16px 20px; border: 1px solid #E2EBF6; box-shadow: 0 1px 4px rgba(39,200,216,.06); }
.cc-filter-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; align-items: end; }
.cc-field-search { grid-column: span 2; }
.cc-field { display: flex; flex-direction: column; gap: 5px; }
.cc-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cc-label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: .06em; font-family: 'Inter', sans-serif; }

.cc-input {
  padding: 8px 12px; background: #F8FAFC; border: 1px solid #E2EBF6; border-radius: 8px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #0F172A; outline: none; box-sizing: border-box; width: 100%;
  transition: border-color .15s;
}
.cc-input:focus { border-color: #27C8D8; }
.cc-search-input-wrap { position: relative; }
.cc-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
.cc-input-search { padding-left: 32px; }

.cc-checkbox-field {
  display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: #475569;
  font-family: 'Inter', sans-serif; cursor: pointer; padding-bottom: 8px; white-space: nowrap;
}
.cc-checkbox-field input { width: 15px; height: 15px; accent-color: #27C8D8; cursor: pointer; }

.cc-btn-apply {
  display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px;
  background: #27C8D8; color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
  white-space: nowrap; box-shadow: 0 2px 8px rgba(39,200,216,.22); transition: background .15s;
}
.cc-btn-apply:hover:not(:disabled) { background: #1BAEBB; }
.cc-btn-apply:disabled { opacity: .6; cursor: not-allowed; }

/* ── Error ─────────────────────────────────────────────── */
.cc-error-card { background: #FFF8F8; border: 1px solid #FECACA; border-radius: 18px; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.cc-error-icon { color: #EF4444; }
.cc-error-msg { font-size: 14px; color: #B91C1C; font-family: 'Inter', sans-serif; margin: 0; text-align: center; }
.cc-btn-retry { padding: 8px 20px; background: #27C8D8; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; }

/* ── KPI Grid ──────────────────────────────────────────── */
.cc-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.cc-kpi-skel { height: 88px; background: #F0FAFB; border-radius: 16px; animation: cc-pulse 1.5s ease-in-out infinite; }
.cc-kpi-card { background: #fff; border-radius: 16px; border: 1px solid #E2EBF6; box-shadow: 0 1px 4px rgba(39,200,216,.06); padding: 16px; display: flex; align-items: flex-start; gap: 12px; }
.cc-kpi-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cc-kpi-body { flex: 1; min-width: 0; }
.cc-kpi-label { font-size: 11px; color: #94A3B8; font-family: 'Inter', sans-serif; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cc-kpi-value { font-size: 20px; font-weight: 700; color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif; margin: 0 0 5px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cc-kpi-sub { font-size: 11px; font-weight: 600; color: #94A3B8; margin: 0; font-family: 'Inter', sans-serif; }
.cc-sub--warn { color: #B45309; }
.cc-sub--ok { color: #16A34A; }

/* ── Charts ────────────────────────────────────────────── */
.cc-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.cc-chart-card { background: #fff; border-radius: 18px; border: 1px solid #E2EBF6; box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08); overflow: hidden; }
.cc-chart-header { display: flex; align-items: center; gap: 8px; padding: 14px 20px; background: #F8FAFC; border-bottom: 1px solid #E2EBF6; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; color: #0F172A; }
.cc-chart-hico { color: #27C8D8; flex-shrink: 0; }
/* NOTA: `.cc-chart-body` NO debe ser flex — Chart.js observa este elemento
   (responsive:true) para redimensionar el canvas, y flexbox usa un algoritmo
   de sizing incompatible que puede disparar un bucle de ResizeObserver que
   satura el hilo principal y "congela" el scroll de toda la página. El
   canvas va en su propio wrapper absoluto; el flex-centrado queda solo en
   el skeleton/no-data vía position:absolute. */
.cc-chart-body { padding: 20px; height: 260px; position: relative; }
.cc-chart-body--donut { height: 280px; }
.cc-canvas-wrap { position: absolute; inset: 20px; }
.cc-chart-skel {
  position: absolute; inset: 20px; background: #F0FAFB; border-radius: 12px;
  animation: cc-pulse 1.5s ease-in-out infinite;
}
.cc-no-data {
  position: absolute; inset: 20px; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #94A3B8; font-family: 'Inter', sans-serif;
}
.cc-no-data--pad { position: static; inset: auto; padding: 40px 24px; text-align: center; }

/* ── Section / Tabla ──────────────────────────────────────── */
.cc-section-card { background: #fff; border-radius: 18px; border: 1px solid #E2EBF6; box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08); overflow: clip; }
.cc-section-header { display: flex; align-items: center; gap: 8px; padding: 14px 20px; background: #F8FAFC; border-bottom: 1px solid #E2EBF6; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; color: #0F172A; }
.cc-section-count { font-size: 11px; font-weight: 700; background: #E0F9FA; color: #0E7C8A; border-radius: 99px; padding: 1px 8px; }
.cc-row-skel { height: 44px; margin: 8px 20px; background: #F0FAFB; border-radius: 8px; animation: cc-pulse 1.5s ease-in-out infinite; }

.cc-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.cc-table { width: 100%; border-collapse: collapse; min-width: 900px; }
.cc-table thead tr { background: #F8FAFC; border-bottom: 1px solid #E2EBF6; }
.cc-table th { padding: 10px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #94A3B8; font-family: 'Inter', sans-serif; text-align: left; white-space: nowrap; }
.cc-th-r { text-align: right; }
.cc-th-c { text-align: center; }
.cc-table td { padding: 12px 16px; font-size: 13px; font-family: 'Inter', sans-serif; color: #475569; border-bottom: 1px solid #F1F5FA; vertical-align: middle; }
.cc-table tbody tr:last-child td { border-bottom: none; }
.cc-tr { transition: background .12s ease; }
.cc-tr:hover { background: #F0F7FF; }
.cc-td-name { font-weight: 600; color: #0F172A; white-space: nowrap; }
.cc-td-meta { color: #94A3B8; font-size: 12px; white-space: nowrap; }
.cc-td-desc { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc-td-r { text-align: right; white-space: nowrap; }
.cc-td-c { text-align: center; }
.cc-val { font-weight: 700; color: #B91C1C; }

.cc-cat-badge { display: inline-flex; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; font-family: 'Inter', sans-serif; white-space: nowrap; }

.cc-soporte-link, .cc-soporte-upload { display: inline-flex; align-items: center; justify-content: center; color: #16A34A; cursor: pointer; }
.cc-soporte-upload { color: #94A3B8; }
.cc-soporte-upload:hover { color: #27C8D8; }
.cc-sin-soporte { display: inline-flex; color: #F59E0B; }
.cc-file-input { display: none; }
.cc-spin { animation: cc-spin 0.8s linear infinite; }

.cc-actions { display: flex; gap: 6px; justify-content: center; }
.cc-action-btn { background: none; border: none; color: #94A3B8; padding: 5px; border-radius: 6px; cursor: pointer; display: inline-flex; transition: all .15s; }
.cc-action-btn:hover { background: #F0F7FF; color: #27C8D8; }
.cc-action-btn--danger:hover { background: #FEE2E2; color: #B91C1C; }

/* ── Modal ─────────────────────────────────────────────── */
.cc-modal-overlay { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15,26,46,.45); backdrop-filter: blur(4px); }
.cc-modal-card { background: #fff; border-radius: 20px; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(15,26,46,.18); }
.cc-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid #F1F5F9; }
.cc-modal-header h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; color: #0F172A; margin: 0; }
.cc-modal-close { background: none; border: none; color: #94A3B8; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; }
.cc-modal-close:hover { background: #F1F5F9; color: #0F172A; }
.cc-modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.cc-textarea { width: 100%; background: #F8FAFC; border: 1px solid #E2EBF6; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #0F172A; font-family: 'Inter', sans-serif; outline: none; resize: none; box-sizing: border-box; }
.cc-textarea:focus { border-color: #27C8D8; }
.cc-static-value { font-size: 13px; color: #0F172A; font-weight: 600; font-family: 'Inter', sans-serif; background: #F8FAFC; border-radius: 8px; padding: 8px 12px; margin: 0; }
.cc-form-error { font-size: 12px; color: #B91C1C; font-family: 'Inter', sans-serif; margin: 0; }
.cc-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px; border-top: 1px solid #F1F5F9; }

.cc-file-field { display: flex; flex-direction: column; gap: 6px; }
.cc-file-current {
  display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
  color: #16A34A; font-family: 'Inter', sans-serif; text-decoration: none; width: fit-content;
}
.cc-file-current:hover { text-decoration: underline; }
.cc-file-picker {
  display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569;
  font-family: 'Inter', sans-serif; background: #F8FAFC; border: 1px dashed #CBD5E1;
  border-radius: 8px; padding: 9px 12px; cursor: pointer; transition: border-color .15s, background .15s;
}
.cc-file-picker:hover { border-color: #27C8D8; background: #F0FAFB; }

/* ── Picker de cotización ──────────────────────────────── */
.cc-picker-wrap { position: relative; }
.cc-picker-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; background: #F8FAFC; border: 1px solid #E5EAF0; border-radius: 8px; padding: 8px 12px; font-size: 13px; font-family: 'Inter', sans-serif; color: #0F1A2E; cursor: pointer; box-sizing: border-box; }
.cc-picker-placeholder { color: #94A3B8; }
.cc-picker-menu { position: absolute; z-index: 20; top: calc(100% + 6px); left: 0; right: 0; background: #fff; border: 1px solid #E5EAF0; border-radius: 12px; box-shadow: 0 8px 24px rgba(15,26,46,.12); padding: 8px; }
.cc-picker-search { width: 100%; background: #F8FAFC; border: 1px solid #E5EAF0; border-radius: 8px; padding: 7px 10px; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; margin-bottom: 6px; box-sizing: border-box; }
.cc-picker-search:focus { border-color: #27C8D8; }
.cc-picker-list { max-height: 200px; overflow-y: auto; list-style: none; margin: 0; padding: 0; }
.cc-picker-option { padding: 8px 10px; font-size: 12.5px; font-family: 'Inter', sans-serif; color: #0F1A2E; border-radius: 8px; cursor: pointer; }
.cc-picker-option:hover { background: #F0F7FF; }
.cc-picker-empty { padding: 10px; text-align: center; font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; }

.cc-modal-fade-enter-active, .cc-modal-fade-leave-active { transition: opacity .2s ease; }
.cc-modal-fade-enter-from, .cc-modal-fade-leave-to { opacity: 0; }

/* ── Animaciones ───────────────────────────────────────── */
@keyframes cc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
@keyframes cc-spin { to { transform: rotate(360deg); } }

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 1024px) {
  .cc-kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .cc-charts-row { grid-template-columns: 1fr; }
  .cc-filter-grid { grid-template-columns: 1fr 1fr; }
  .cc-field-search { grid-column: span 2; }
}
@media (max-width: 640px) {
  .cc-wrap { padding: 16px; gap: 14px; }
  .cc-filter-grid { grid-template-columns: 1fr; }
  .cc-field-search { grid-column: span 1; }
  .cc-kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .cc-kpi-value { font-size: 17px; }
  .cc-chart-body { height: 220px; }
}
</style>
