<template>
  <div class="page-wrap">

    <div class="page-header">
      <div>
        <h1 class="page-title">Ejecutivos de Cuenta</h1>
        <p class="page-sub">Monitorea metas de ingresos, evaluación y cotizaciones de tu equipo comercial</p>
      </div>
      <div v-if="detail" class="exec-profile-row">
        <div class="exec-profile">
          <div class="exec-avatar-wrap">
            <img v-if="detail.avatar" :src="detail.avatar" class="exec-avatar-img" alt="" />
            <div v-else class="exec-avatar" :style="{ background: getAvatarColor(detail.fullName) }">{{ getInitials(detail.fullName) }}</div>
          </div>
          <div class="exec-profile-info">
            <span class="exec-profile-name">{{ detail.fullName }}</span>
            <span class="exec-profile-email">{{ detail.email }}</span>
            <div class="exec-profile-roles">
              <span v-for="r in detail.roles" :key="r" class="badge badge-slate">{{ r }}</span>
            </div>
          </div>
        </div>

        <!-- Referencia visual "reporta a" — solo si tiene líder asignado -->
        <div v-if="detail.lider" class="lider-link">
          <svg class="lider-link-svg" viewBox="0 0 48 20" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2,10 L38,10" />
            <path d="M32,4 L40,10 L32,16" />
          </svg>
          <span class="lider-link-label">Reporta a</span>
        </div>

        <div v-if="detail.lider" class="lider-card">
          <div class="lider-avatar-wrap">
            <img v-if="detail.lider.avatar" :src="detail.lider.avatar" class="lider-avatar-img" alt="" />
            <div v-else class="lider-avatar" :style="{ background: getAvatarColor(detail.lider.fullName) }">{{ getInitials(detail.lider.fullName) }}</div>
          </div>
          <div class="lider-info">
            <span class="lider-tag"><Crown :size="10" /> Su líder</span>
            <span class="lider-name">{{ detail.lider.fullName }}</span>
            <span class="lider-role">{{ liderRoleLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="filter-row">
      <SelectLabel
        label="Ejecutivo de cuenta"
        v-model="selectedId"
        :options="execOptions"
        placeholder="Selecciona un ejecutivo…"
      />
    </div>

    <div v-if="rosterError" class="empty-state">
      <AlertCircle :size="32" color="#EF4444" />
      <p>{{ rosterError }}</p>
      <button class="btn-ghost" @click="fetchRoster">Reintentar</button>
    </div>

    <div v-else-if="!selectedId" class="empty-state">
      <Gauge :size="32" color="#94A3B8" />
      <p>{{ roster.length ? 'Selecciona un ejecutivo para ver su desempeño.' : 'No tienes ejecutivos de cuenta a tu cargo.' }}</p>
    </div>

    <div v-else-if="detailLoading" class="skeleton-wrap">
      <div v-for="i in 4" :key="i" class="skeleton-row" />
    </div>

    <div v-else-if="detail" class="exec-dashboard">

      <!-- Barra de progreso de la meta de ingresos activa -->
      <div v-if="activeGoal" class="goal-card">
        <div class="goal-header">
          <span class="goal-title">{{ activeGoal.titulo }}</span>
          <span class="goal-deadline">Vence {{ formatDateShort(activeGoal.fechaLimite) }}</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" :style="{ width: goalPct + '%' }" />
        </div>
        <div class="goal-numbers">
          <span class="goal-achieved">{{ formatCOP(activeGoal.progreso) }} logrado</span>
          <span class="goal-pct">{{ goalPct }}%</span>
          <span class="goal-remaining">Faltan {{ formatCOP(goalRemaining) }} de {{ formatCOP(activeGoal.metaObjetivo) }}</span>
        </div>
      </div>
      <div v-else class="goal-card goal-card--empty">
        <span>Sin meta de ingresos activa para {{ detail.fullName }}.</span>
        <button v-if="canManage" class="btn-sm" @click="openMetaModal"><Plus :size="14" /> Definir meta</button>
      </div>

      <!-- KPI tiles del embudo -->
      <div class="kpi-grid">
        <div class="kpi-tile">
          <span class="kpi-value">{{ detail.funnel.proceso }}</span>
          <span class="kpi-label">En proceso</span>
        </div>
        <div class="kpi-tile kpi-tile--info">
          <span class="kpi-value">{{ detail.funnel.ejecucion }}</span>
          <span class="kpi-label">En ejecución</span>
        </div>
        <div class="kpi-tile kpi-tile--ok">
          <span class="kpi-value">{{ detail.funnel.cerrada }}</span>
          <span class="kpi-label">Cerradas</span>
        </div>
        <div class="kpi-tile kpi-tile--bad">
          <span class="kpi-value">{{ detail.funnel.perdida }}</span>
          <span class="kpi-label">Perdidas</span>
        </div>
        <div class="kpi-tile kpi-tile--money">
          <span class="kpi-value">{{ formatCOP(detail.ganancias) }}</span>
          <span class="kpi-label">Ganancias generadas</span>
        </div>
        <div class="kpi-tile kpi-tile--money-bad">
          <span class="kpi-value">{{ formatCOP(detail.perdidas) }}</span>
          <span class="kpi-label">Valor perdido</span>
        </div>
      </div>

      <!-- Gráfico de cierre acumulado -->
      <div class="chart-card">
        <h3 class="section-title">Cierre acumulado — {{ periodoLabel }}</h3>
        <div v-if="!chartData.data.length" class="section-empty">Sin cierres registrados en este periodo.</div>
        <div v-else class="chart-canvas-wrap"><canvas ref="waveChartRef" /></div>
      </div>

      <!-- Metas -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">Metas asignadas</h3>
          <button v-if="canManage" class="btn-sm" @click="openMetaModal"><Plus :size="14" /> Nueva meta</button>
        </div>
        <div v-if="!metasDelEjecutivo.length" class="section-empty">Sin metas asignadas todavía.</div>
        <div v-else class="metas-list">
          <div v-for="m in metasDelEjecutivo" :key="m.id" class="meta-card">
            <div class="meta-title">{{ m.titulo }}</div>
            <div class="meta-meta">
              <span class="badge" :class="estadoBadgeClass(m.estado)">{{ estadoLabel(m.estado) }}</span>
              <span v-if="m.tipo === 'CIERRE_MONTO'" class="meta-progreso">{{ formatCOP(m.progreso) }}/{{ formatCOP(m.metaObjetivo) }}</span>
              <span v-else-if="m.tipo !== 'TAREA_EVENTO'" class="meta-progreso">{{ m.progreso }}/{{ m.metaObjetivo }}</span>
              <span v-if="m.fechaLimite" class="meta-fecha">Límite: {{ formatDateShort(m.fechaLimite) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bitácora de comentarios -->
      <div class="section">
        <h3 class="section-title">Bitácora de evaluación</h3>
        <div v-if="canManage" class="comentario-input-row">
          <input
            v-model="nuevoComentario"
            class="field-input"
            placeholder="Agregar un comentario de evaluación…"
            @keyup.enter="submitComentario"
          />
          <button class="btn-sm" :disabled="!nuevoComentario.trim() || comentarioBusy" @click="submitComentario">
            {{ comentarioBusy ? 'Guardando…' : 'Agregar' }}
          </button>
        </div>
        <div v-if="!comentarios.length" class="section-empty">Sin comentarios todavía.</div>
        <div v-else class="comentarios-list">
          <div v-for="c in comentarios" :key="c.id" class="comentario-item">
            <div class="comentario-meta">
              <span class="comentario-autor">{{ c.autor?.fullName ?? '—' }}</span>
              <span class="comentario-fecha">{{ formatDate(c.createdAt) }}</span>
            </div>
            <div class="comentario-body">{{ c.contenido }}</div>
          </div>
        </div>
      </div>

      <!-- Cotizaciones -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">Cotizaciones</h3>
          <button class="btn-sm" :disabled="!detail.cotizaciones.length" @click="exportarCSV">Exportar CSV</button>
        </div>
        <div v-if="!detail.cotizaciones.length" class="section-empty">Sin cotizaciones registradas.</div>
        <template v-else>
          <div class="quotes-list">
            <div v-for="q in pagedCotizaciones" :key="q.id" class="quote-card">
              <div class="quote-head">
                <div class="quote-head-main">
                  <span class="quote-numero">#{{ q.numero }}</span>
                  <span class="quote-empresa">{{ q.empresa ?? 'Sin empresa' }}</span>
                </div>
                <div class="quote-head-side">
                  <span class="badge" :class="bucketBadgeClass(q.bucket)">{{ bucketLabel(q.bucket) }}</span>
                  <span class="quote-total">{{ formatCOP(q.total) }}</span>
                </div>
              </div>
              <div class="quote-sub">
                <span>{{ q.estado ?? '—' }}</span>
                <span>{{ formatDateShort(q.fechaCotizacion) }}</span>
                <span v-if="tieneDescuento(q)" class="badge badge-bad">Con descuento</span>
              </div>
              <div v-if="q.productos.length" class="quote-products">
                <div v-for="(p, i) in q.productos" :key="i" class="product-row">
                  <span class="product-tipo" :class="p.tipo === 'TERCERO' ? 'product-tipo--tp' : 'product-tipo--own'">
                    {{ p.tipo === 'TERCERO' ? 'Tercero' : 'Propio' }}
                  </span>
                  <span
                    class="product-nombre"
                    @mouseenter="showThumbPreview($event, p.foto)"
                    @mouseleave="hideThumbPreview"
                  >{{ p.cantidad }}× {{ p.nombre }}</span>
                  <span class="product-precio">{{ formatCOP(p.precioUnitario) }} c/u</span>
                  <span class="product-descuento" :class="{ 'product-descuento--active': p.descuentoPct > 0 }">
                    {{ p.descuentoPct > 0 ? `−${p.descuentoPct}%` : 'Sin descuento' }}
                  </span>
                  <span class="product-subtotal">{{ formatCOP(p.total) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="totalCotizacionesPages > 1" class="cotiz-pagination">
            <span class="cotiz-pg-info">
              {{ (cotizacionesPage - 1) * COTIZACIONES_PAGE_SIZE + 1 }}–{{ Math.min(cotizacionesPage * COTIZACIONES_PAGE_SIZE, detail.cotizaciones.length) }}
              de {{ detail.cotizaciones.length }}
            </span>
            <div class="cotiz-pg-btns">
              <button class="pg-btn" :disabled="cotizacionesPage === 1" @click="cotizacionesPage--">
                <ChevronLeft :size="14" />
              </button>
              <span class="cotiz-pg-current">{{ cotizacionesPage }} / {{ totalCotizacionesPages }}</span>
              <button class="pg-btn" :disabled="cotizacionesPage === totalCotizacionesPages" @click="cotizacionesPage++">
                <ChevronRight :size="14" />
              </button>
            </div>
          </div>
        </template>
      </div>

    </div>

    <ThumbHoverPreview :preview="thumbPreview" />

    <!-- Modal nueva meta -->
    <Teleport to="body">
      <Transition name="tp-fade">
        <div v-if="showMetaModal" class="overlay">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <Target :size="20" color="#27C8D8" />
                <h2 class="modal-title">Nueva meta para {{ detail?.fullName }}</h2>
              </div>
              <button class="close-btn" @click="closeMetaModal"><X :size="18" /></button>
            </div>

            <div class="modal-body">
              <div class="field-group">
                <label class="field-label">Título <span class="req">*</span></label>
                <input v-model="metaForm.titulo" class="field-input" :class="{ 'field-error': metaSubmitted && !metaForm.titulo }" placeholder="Ej: Cerrar $40M este mes" />
                <span v-if="metaSubmitted && !metaForm.titulo" class="err-msg">Requerido</span>
              </div>

              <div class="field-group">
                <label class="field-label">Tipo de meta <span class="req">*</span></label>
                <SelectLabel v-model="metaForm.tipo" :options="tipos" />
              </div>

              <div v-if="metaForm.tipo === 'CIERRE_TRATO'" class="field-group">
                <label class="field-label">Cotización a cerrar <span class="req">*</span></label>
                <SelectLabel v-model="metaForm.quotationId" :options="quotationOptions" placeholder="Seleccionar…" />
                <span v-if="metaSubmitted && !metaForm.quotationId" class="err-msg">Requerido</span>
              </div>

              <div v-if="metaForm.tipo === 'CIERRE_MULTIPLE' || metaForm.tipo === 'CIERRE_MONTO'" class="form-row">
                <div class="field-group">
                  <label class="field-label">
                    {{ metaForm.tipo === 'CIERRE_MONTO' ? 'Meta de ingresos (COP)' : 'Meta de tratos a cerrar' }} <span class="req">*</span>
                  </label>
                  <input v-model.number="metaForm.metaObjetivo" type="number" min="1" class="field-input" />
                </div>
                <div class="field-group">
                  <label class="field-label">Fecha límite del periodo <span class="req">*</span></label>
                  <input v-model="metaForm.fechaLimite" type="date" class="field-input" :class="{ 'field-error': metaSubmitted && !metaForm.fechaLimite }" />
                  <span v-if="metaSubmitted && !metaForm.fechaLimite" class="err-msg">Requerido</span>
                </div>
              </div>

              <div class="form-row">
                <div class="field-group">
                  <label class="field-label">Tipo de comisión <span class="req">*</span></label>
                  <SelectLabel v-model="metaForm.comisionTipo" :options="comisionTipos" :disabled="metaForm.tipo === 'TAREA_EVENTO'" />
                </div>
                <div class="field-group">
                  <label class="field-label">
                    {{ metaForm.comisionTipo === 'PORCENTAJE' ? 'Porcentaje (%)' : 'Monto fijo (COP)' }} <span class="req">*</span>
                  </label>
                  <input v-model.number="metaForm.comisionValor" type="number" min="0" step="any" class="field-input" :class="{ 'field-error': metaSubmitted && !metaForm.comisionValor }" />
                  <span v-if="metaSubmitted && !metaForm.comisionValor" class="err-msg">Requerido</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-ghost" @click="closeMetaModal">Cancelar</button>
              <button class="btn-primary" :disabled="metaSaving" @click="handleSaveMeta">
                <span v-if="metaSaving" class="spinner" />
                {{ metaSaving ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'
import { AlertCircle, ChevronLeft, ChevronRight, Crown, Gauge, Plus, Target, X } from 'lucide-vue-next'
import SelectLabel from '@/components/input/SelectLabel.vue'
import ThumbHoverPreview from '@/components/shared/ThumbHoverPreview.vue'
import { useThumbHoverPreview } from '@/composables/useThumbHoverPreview'
import { getEjecutivos, getEjecutivoDetalle, getComentarios, crearComentario } from '@/services/ejecutivos.service'
import { useDesafiosComerciales } from '@/composables/useDesafiosComerciales'
import { getQuotations } from '@/services/quotation.service'
import { formatCOP } from '@/utils/currency'
import { useAuth } from '@/composables/useAuth'

Chart.register(...registerables)

// ── Roster (solo para el selector) ──────────────────────────
const roster      = ref([])
const rosterError = ref(null)

const fetchRoster = async () => {
  rosterError.value = null
  try {
    roster.value = await getEjecutivos()
    // Por defecto siempre se muestra un ejecutivo — el primero del roster —
    // en vez de dejar la pantalla vacía a la espera de que el usuario elija.
    if (!selectedId.value && roster.value.length) {
      selectedId.value = roster.value[0].id
    }
  } catch (e) {
    rosterError.value = e?.response?.data?.message ?? 'Error al cargar los ejecutivos de cuenta'
  }
}

const execOptions = computed(() => roster.value.map((e) => ({ value: e.id, label: e.fullName })))

// Un EJECUTIVO/EJECUTIVO_CUENTA sin gente a cargo solo puede verse a sí mismo
// (autoservicio de solo lectura) — el backend ya lo restringe, esto solo
// evita mostrarle botones de "Nueva meta"/"Agregar comentario" que le darían
// 403 al usarlos, ya que esas acciones son del líder, no de sí mismo.
const { user: authUser } = useAuth()
const canManage = computed(() =>
  ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER'].some((r) => authUser.value?.roles?.includes(r)),
)

// ── Avatar del ejecutivo (y de su líder) mostrados en el header ──────────
const AVATAR_COLORS = ['#27C8D8', '#7C3AED', '#B45309', '#B91C1C', '#16A34A', '#0EA5E9', '#C2410C']
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
const getInitials = (name) =>
  (name ?? '').trim().split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

// Rol principal del líder para la tarjeta de referencia — prioriza el rol
// jerárquico más alto en vez de mostrar el primero del array sin criterio.
const ROLE_PRIORITY = ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR']
const ROLE_LABELS = { ADMIN: 'Admin', ADMINISTRADOR: 'Administrador', DIRECCION: 'Dirección', LIDER: 'Líder', SUPERVISOR: 'Supervisor' }
const liderRoleLabel = computed(() => {
  const roles = detail.value?.lider?.roles ?? []
  const top = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0]
  return ROLE_LABELS[top] ?? top ?? '—'
})

// ── Ejecutivo seleccionado ───────────────────────────────────
const selectedId    = ref('')
const details       = reactive({})   // cache por id
const detailLoading = ref(false)
const detail        = computed(() => details[selectedId.value] ?? null)

const loadDetail = async (id) => {
  if (details[id]) return
  detailLoading.value = true
  try {
    details[id] = await getEjecutivoDetalle(id)
  } catch (e) {
    console.error('Error al cargar el detalle del ejecutivo:', e)
  } finally {
    detailLoading.value = false
  }
}

watch(selectedId, async (id) => {
  cotizacionesPage.value = 1
  if (!id) return
  await loadDetail(id)
  await nextTick()
  drawChart()
})

// ── Paginación de cotizaciones (máx. 5 por página) ────────────
const COTIZACIONES_PAGE_SIZE = 5
const cotizacionesPage = ref(1)
const totalCotizacionesPages = computed(() =>
  Math.max(1, Math.ceil((detail.value?.cotizaciones.length ?? 0) / COTIZACIONES_PAGE_SIZE)),
)
const pagedCotizaciones = computed(() => {
  if (!detail.value) return []
  const start = (cotizacionesPage.value - 1) * COTIZACIONES_PAGE_SIZE
  return detail.value.cotizaciones.slice(start, start + COTIZACIONES_PAGE_SIZE)
})

// ── Hover de imagen del producto (mismo patrón que VerCotizaciones.vue) ──
const { preview: thumbPreview, showPreview: showThumbPreview, hidePreview: hideThumbPreview } = useThumbHoverPreview(380)

// ── Metas (reutiliza Desafíos Comerciales) ───────────────────
const { desafios, fetchDesafios, addDesafio } = useDesafiosComerciales()

const metasDelEjecutivo = computed(() =>
  desafios.value
    .filter((d) => d.assignedToId === selectedId.value)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
)

const activeGoal = computed(() =>
  metasDelEjecutivo.value.find((m) => m.tipo === 'CIERRE_MONTO') ?? null,
)

const goalPct = computed(() => {
  if (!activeGoal.value || !activeGoal.value.metaObjetivo) return 0
  return Math.min(100, Math.round((activeGoal.value.progreso / activeGoal.value.metaObjetivo) * 100))
})
const goalRemaining = computed(() => {
  if (!activeGoal.value) return 0
  return Math.max(0, activeGoal.value.metaObjetivo - activeGoal.value.progreso)
})

const estadoLabel = (e) => ({ PENDIENTE: 'Pendiente', EN_PROGRESO: 'En progreso', CUMPLIDA: 'Cumplida', NO_CUMPLIDA: 'No cumplida' }[e] ?? e)
const estadoBadgeClass = (e) => ({ PENDIENTE: 'badge-slate', EN_PROGRESO: 'badge-info', CUMPLIDA: 'badge-ok', NO_CUMPLIDA: 'badge-bad' }[e] ?? 'badge-slate')

// ── Comentarios ───────────────────────────────────────────────
const comentarios     = ref([])
const nuevoComentario = ref('')
const comentarioBusy  = ref(false)

watch(selectedId, async (id) => {
  comentarios.value = []
  if (!id) return
  try {
    comentarios.value = await getComentarios(id)
  } catch (e) {
    console.error('Error al cargar los comentarios:', e)
  }
})

const submitComentario = async () => {
  const contenido = nuevoComentario.value.trim()
  if (!contenido || !selectedId.value) return
  comentarioBusy.value = true
  try {
    const created = await crearComentario(selectedId.value, contenido)
    comentarios.value = [created, ...comentarios.value]
    nuevoComentario.value = ''
  } catch (e) {
    console.error('Error al agregar el comentario:', e)
  } finally {
    comentarioBusy.value = false
  }
}

// ── Embudo / etiquetas ────────────────────────────────────────
const bucketLabel = (b) => ({ proceso: 'En proceso', ejecucion: 'En ejecución', cerrada: 'Cerrada', perdida: 'Perdida' }[b] ?? b)
const bucketBadgeClass = (b) => ({ proceso: 'badge-slate', ejecucion: 'badge-info', cerrada: 'badge-ok', perdida: 'badge-bad' }[b] ?? 'badge-slate')

const tieneDescuento = (q) => q.productos.some((p) => p.descuentoPct > 0)

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const formatDateShort = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// ── Gráfico de cierre acumulado ("onda") ───────────────────────
const waveChartRef = ref(null)
let waveChart = null

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
const endOfMonth   = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0)
const dayKey = (d) => d.toISOString().slice(0, 10)

const periodo = computed(() => {
  if (activeGoal.value) {
    return { start: new Date(activeGoal.value.fechaInicio), end: new Date(activeGoal.value.fechaLimite) }
  }
  const now = new Date()
  return { start: startOfMonth(now), end: endOfMonth(now) }
})

const periodoLabel = computed(() => {
  const { start, end } = periodo.value
  return `${formatDateShort(start)} — ${formatDateShort(end)}`
})

const chartData = computed(() => {
  if (!detail.value) return { labels: [], data: [] }
  const { start, end } = periodo.value
  const today = new Date()
  const effectiveEnd = end < today ? end : today
  if (effectiveEnd < start) return { labels: [], data: [] }

  const closedByDay = new Map()
  for (const q of detail.value.cotizaciones) {
    if (q.estado !== 'Aprobada') continue
    const qd = new Date(q.fechaCotizacion)
    if (qd < start || qd > effectiveEnd) continue
    const key = dayKey(qd)
    closedByDay.set(key, (closedByDay.get(key) ?? 0) + (q.total ?? 0))
  }

  const labels = []
  const data = []
  let cum = 0
  for (let d = new Date(start); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
    cum += closedByDay.get(dayKey(d)) ?? 0
    labels.push(d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }))
    data.push(cum)
  }
  return { labels, data }
})

const fmtShort = (v) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

const drawChart = () => {
  waveChart?.destroy()
  waveChart = null
  if (!waveChartRef.value || !chartData.value.data.length) return
  waveChart = new Chart(waveChartRef.value, {
    type: 'line',
    data: {
      labels: chartData.value.labels,
      datasets: [{
        label: 'Cierre acumulado',
        data: chartData.value.data,
        borderColor: '#27C8D8',
        backgroundColor: 'rgba(39,200,216,0.16)',
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: '#27C8D8',
        tension: 0.35,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${formatCOP(ctx.raw)}` } },
      },
      scales: {
        x: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } }, grid: { color: '#F1F5FA' } },
        y: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 }, callback: (v) => fmtShort(v) }, grid: { color: '#F1F5FA' } },
      },
    },
  })
}

watch(chartData, async () => { await nextTick(); drawChart() })

// ── Exportar CSV ────────────────────────────────────────────
const exportarCSV = () => {
  if (!detail.value?.cotizaciones?.length) return
  const headers = ['Número', 'Empresa', 'Total', 'Estado', 'Embudo', 'Fecha', 'Con descuento', 'Productos']
  const csvRows = detail.value.cotizaciones.map((q) => [
    q.numero, q.empresa || '', q.total, q.estado || '', bucketLabel(q.bucket),
    q.fechaCotizacion ? new Date(q.fechaCotizacion).toLocaleDateString('es-CO') : '',
    tieneDescuento(q) ? 'Sí' : 'No',
    q.productos.map((p) => `[${p.tipo === 'TERCERO' ? 'Tercero' : 'Propio'}] ${p.cantidad}x ${p.nombre} @ ${p.precioUnitario}${p.descuentoPct > 0 ? ` (-${p.descuentoPct}%)` : ''} = ${p.total}`).join(' | '),
  ])
  const csv = [headers, ...csvRows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ejecutivo-${(detail.value.fullName ?? selectedId.value).replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Modal nueva meta ────────────────────────────────────────
const tipos = [
  { value: 'CIERRE_TRATO',    label: 'Cierre de trato específico' },
  { value: 'CIERRE_MULTIPLE', label: 'Meta de cierres múltiples' },
  { value: 'CIERRE_MONTO',    label: 'Meta de ingresos ($)' },
  { value: 'TAREA_EVENTO',    label: 'Tarea de evento' },
]
const comisionTipos = [
  { value: 'FIJA',       label: 'Monto fijo (COP)' },
  { value: 'PORCENTAJE', label: 'Porcentaje del trato' },
]

const quotations = ref([])
const quotationOptions = computed(() =>
  quotations.value.map((q) => ({ value: q.id, label: `#${q.numero} — ${q.empresa ?? 'Sin empresa'}` })),
)

const emptyMetaForm = () => ({
  titulo: '', tipo: 'CIERRE_MONTO',
  quotationId: '', metaObjetivo: 1, fechaLimite: '',
  comisionTipo: 'FIJA', comisionValor: 0,
})

const showMetaModal = ref(false)
const metaSubmitted = ref(false)
const metaSaving    = ref(false)
const metaForm      = ref(emptyMetaForm())

const openMetaModal = () => {
  metaForm.value = emptyMetaForm()
  metaSubmitted.value = false
  showMetaModal.value = true
}
const closeMetaModal = () => { showMetaModal.value = false }

const handleSaveMeta = async () => {
  metaSubmitted.value = true
  const f = metaForm.value
  if (!f.titulo || !f.comisionValor) return
  if (f.tipo === 'CIERRE_TRATO' && !f.quotationId) return
  if ((f.tipo === 'CIERRE_MULTIPLE' || f.tipo === 'CIERRE_MONTO') && !f.fechaLimite) return

  metaSaving.value = true
  try {
    const esMeta = f.tipo === 'CIERRE_MULTIPLE' || f.tipo === 'CIERRE_MONTO'
    const payload = {
      titulo: f.titulo,
      tipo: f.tipo,
      assignedToId: selectedId.value,
      comisionTipo: f.tipo === 'TAREA_EVENTO' ? 'FIJA' : f.comisionTipo,
      comisionValor: Number(f.comisionValor),
      fechaLimite: f.fechaLimite ? `${f.fechaLimite}T23:59:59.000Z` : undefined,
      quotationId: !esMeta && f.quotationId ? Number(f.quotationId) : undefined,
      metaObjetivo: esMeta ? Number(f.metaObjetivo) || 1 : undefined,
    }
    await addDesafio(payload)
    closeMetaModal()
  } catch (e) {
    console.error('Error al crear la meta:', e)
  } finally {
    metaSaving.value = false
  }
}

onMounted(async () => {
  fetchRoster()
  fetchDesafios()
  try {
    const res = await getQuotations()
    quotations.value = res.data ?? []
  } catch (e) {
    console.error('Error al cargar cotizaciones para el selector:', e)
  }
})
</script>

<style scoped>
.page-wrap {
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100vh;
  background: #F8FAFC;
}

.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px;
}
.page-sub { font-size: 13px; color: #64748B; margin: 0; }

.exec-profile-row { display: flex; align-items: center; gap: 4px; }

.exec-profile {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border: 1px solid #EEF1F7; border-radius: 14px;
  padding: 10px 16px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06);
}
.exec-avatar-wrap { flex-shrink: 0; width: 42px; height: 42px; }
.exec-avatar-img {
  width: 42px; height: 42px; border-radius: 50%; object-fit: cover;
  border: 1px solid #EEF1F7;
}
.exec-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0;
}
.exec-profile-info { display: flex; flex-direction: column; gap: 2px; }
.exec-profile-name { font-weight: 700; font-size: 13px; color: #0F172A; }
.exec-profile-email { font-size: 11px; color: #94A3B8; }
.exec-profile-roles { display: flex; gap: 4px; margin-top: 2px; flex-wrap: wrap; }

/* ── Referencia visual "reporta a" ───────────────────────── */
.lider-link {
  display: flex; flex-direction: column; align-items: center;
  gap: 2px; flex-shrink: 0; padding: 0 2px;
}
.lider-link-svg { width: 44px; height: 18px; stroke: #CBD5E1; fill: none; stroke-width: 1.6; }
.lider-link-svg path:last-child { fill: #CBD5E1; stroke: none; }
.lider-link-label {
  font-size: 9px; font-weight: 600; color: #94A3B8;
  text-transform: uppercase; letter-spacing: .04em; white-space: nowrap;
}

.lider-card {
  display: flex; align-items: center; gap: 10px;
  background: #FAFBFF; border: 1px dashed #D8DEEA; border-radius: 14px;
  padding: 8px 14px;
}
.lider-avatar-wrap { flex-shrink: 0; width: 36px; height: 36px; }
.lider-avatar-img {
  width: 36px; height: 36px; border-radius: 50%; object-fit: cover;
  border: 1px solid #E5EAF0;
}
.lider-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 12px; flex-shrink: 0;
}
.lider-info { display: flex; flex-direction: column; gap: 1px; }
.lider-tag {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 9px; font-weight: 700; color: #7C3AED;
  text-transform: uppercase; letter-spacing: .04em;
}
.lider-name { font-weight: 700; font-size: 12px; color: #0F172A; }
.lider-role { font-size: 11px; color: #94A3B8; }

.filter-row { max-width: 360px; }

.empty-state {
  padding: 48px; display: flex; flex-direction: column;
  align-items: center; gap: 12px; color: #94A3B8; font-size: 14px;
}
.btn-ghost {
  padding: 10px 20px; background: transparent; border: 1.5px solid #E2E8F0;
  border-radius: 10px; font-size: 14px; font-weight: 600; color: #475569;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: border-color .15s;
}
.btn-ghost:hover { border-color: #94A3B8; }

.skeleton-wrap { display: flex; flex-direction: column; gap: 10px; }
.skeleton-row {
  height: 60px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200%; border-radius: 12px; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0%{background-position:200%}100%{background-position:-200%} }

.exec-dashboard { display: flex; flex-direction: column; gap: 20px; }

/* ── Meta de ingresos ────────────────────────────────────── */
.goal-card {
  background: #fff; border-radius: 16px; padding: 18px 22px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
  display: flex; flex-direction: column; gap: 10px;
}
.goal-card--empty {
  flex-direction: row; align-items: center; justify-content: space-between;
  color: #64748B; font-size: 13px;
}
.goal-header { display: flex; align-items: center; justify-content: space-between; }
.goal-title { font-weight: 700; font-size: 15px; color: #0F172A; }
.goal-deadline { font-size: 12px; color: #94A3B8; }
.goal-progress-bar { height: 14px; background: #F1F5F9; border-radius: 99px; overflow: hidden; }
.goal-progress-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, #27C8D8, #16A34A);
  transition: width .4s ease;
}
.goal-numbers { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.goal-achieved { font-size: 13px; font-weight: 700; color: #16A34A; }
.goal-pct { font-size: 13px; font-weight: 700; color: #27C8D8; }
.goal-remaining { font-size: 12px; color: #64748B; }

/* ── KPI tiles ───────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}
.kpi-tile {
  background: #fff; border: 1px solid #EEF1F7; border-radius: 12px;
  padding: 12px 14px; display: flex; flex-direction: column; gap: 2px;
}
.kpi-value { font-size: 18px; font-weight: 700; color: #0F172A; }
.kpi-label { font-size: 11px; color: #94A3B8; }
.kpi-tile--info .kpi-value { color: #2563EB; }
.kpi-tile--ok .kpi-value { color: #16A34A; }
.kpi-tile--bad .kpi-value { color: #EF4444; }
.kpi-tile--money .kpi-value { color: #27C8D8; }
.kpi-tile--money-bad .kpi-value { color: #C2410C; }

/* ── Chart ───────────────────────────────────────────────── */
.chart-card {
  background: #fff; border-radius: 16px; padding: 18px 22px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
  display: flex; flex-direction: column; gap: 12px;
}
.chart-canvas-wrap { height: 240px; position: relative; }

/* ── Secciones ───────────────────────────────────────────── */
.section { display: flex; flex-direction: column; gap: 10px; }
.section-header { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 13px; font-weight: 700; color: #0F172A; margin: 0; }
.section-empty { font-size: 12px; color: #94A3B8; }

.btn-sm {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; background: #27C8D8; color: #fff;
  border: none; border-radius: 8px; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s;
}
.btn-sm:hover:not(:disabled) { background: #1BAEBB; }
.btn-sm:disabled { opacity: .5; cursor: not-allowed; }

.metas-list { display: flex; flex-direction: column; gap: 8px; }
.meta-card { background: #fff; border: 1px solid #EEF1F7; border-radius: 10px; padding: 10px 14px; }
.meta-title { font-weight: 600; font-size: 13px; color: #0F172A; }
.meta-meta { display: flex; align-items: center; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
.meta-progreso { font-size: 12px; color: #475569; font-weight: 600; }
.meta-fecha { font-size: 11px; color: #94A3B8; }

.comentario-input-row { display: flex; gap: 8px; }
.comentario-input-row .field-input { flex: 1; }
.comentarios-list { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
.comentario-item { background: #fff; border: 1px solid #EEF1F7; border-radius: 10px; padding: 10px 14px; }
.comentario-meta { display: flex; justify-content: space-between; gap: 10px; }
.comentario-autor { font-size: 12px; font-weight: 700; color: #0F172A; }
.comentario-fecha { font-size: 11px; color: #94A3B8; }
.comentario-body { font-size: 13px; color: #334155; margin-top: 4px; white-space: pre-wrap; }

/* ── Cotizaciones (tarjetas, no tabla) ──────────────────────── */
.quotes-list { display: flex; flex-direction: column; gap: 10px; }

.cotiz-pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 4px; flex-wrap: wrap; gap: 8px;
}
.cotiz-pg-info { font-size: 12px; color: #94A3B8; }
.cotiz-pg-btns { display: flex; align-items: center; gap: 8px; }
.cotiz-pg-current { font-size: 12px; font-weight: 600; color: #475569; min-width: 44px; text-align: center; }
.pg-btn {
  width: 28px; height: 28px; border-radius: 8px; border: 1px solid #E2E8F0;
  background: #fff; color: #64748B; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .12s ease;
}
.pg-btn:hover:not(:disabled) { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.pg-btn:disabled { opacity: .35; cursor: not-allowed; }
.quote-card { background: #fff; border: 1px solid #EEF1F7; border-radius: 12px; padding: 14px 16px; }
.quote-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.quote-head-main { display: flex; align-items: baseline; gap: 8px; }
.quote-numero { font-weight: 700; color: #0F172A; font-size: 13px; }
.quote-empresa { font-size: 13px; color: #334155; }
.quote-head-side { display: flex; align-items: center; gap: 10px; }
.quote-total { font-weight: 700; color: #27C8D8; font-size: 14px; }
.quote-sub { display: flex; gap: 14px; margin-top: 6px; font-size: 11px; color: #94A3B8; }
.quote-products {
  display: flex; flex-direction: column; gap: 4px; margin-top: 10px;
  padding-top: 10px; border-top: 1px dashed #EEF1F7;
}
.product-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  padding: 4px 0;
}
.product-tipo {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
  padding: 2px 8px; border-radius: 999px; white-space: nowrap;
}
.product-tipo--own { background: #E0F9FA; color: #27C8D8; }
.product-tipo--tp  { background: #FFF7ED; color: #C2410C; }
.product-nombre { color: #334155; }
.product-nombre:hover { text-decoration: underline; text-decoration-color: #CBD5E1; text-underline-offset: 2px; }
.product-precio { color: #94A3B8; white-space: nowrap; }
.product-descuento { color: #94A3B8; white-space: nowrap; }
.product-descuento--active { color: #EF4444; font-weight: 600; }
.product-subtotal { color: #0F172A; font-weight: 600; white-space: nowrap; min-width: 90px; text-align: right; }

.badge {
  display: inline-block; padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 600; font-family: 'Inter', sans-serif;
}
.badge-slate { background: #F1F5F9; color: #475569; }
.badge-info  { background: #DBEAFE; color: #2563EB; }
.badge-ok    { background: #DCFCE7; color: #16A34A; }
.badge-bad   { background: #FEE2E2; color: #EF4444; }

.field-input {
  padding: 10px 12px; border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; color: #0F172A; background: #fff;
  font-family: 'Inter', sans-serif; transition: border-color .15s; resize: vertical;
  width: 100%; box-sizing: border-box;
}
.field-input:focus { outline: none; border-color: #27C8D8; }
.field-input:disabled { background: #F1F5F9; color: #94A3B8; cursor: not-allowed; }
.field-error { border-color: #EF4444 !important; }
.err-msg { font-size: 11px; color: #EF4444; }

.overlay {
  position: fixed; inset: 0; background: rgba(15,26,46,.45);
  backdrop-filter: blur(4px); z-index: 9000;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: #fff; border-radius: 20px; width: 100%; max-width: 560px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(39,200,216,.18);
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 0;
}
.modal-title-wrap { display: flex; align-items: center; gap: 10px; }
.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px; font-weight: 700; color: #0F172A; margin: 0;
}
.close-btn {
  padding: 6px; background: transparent; border: none;
  cursor: pointer; color: #94A3B8; border-radius: 8px;
  display: flex; transition: background .12s;
}
.close-btn:hover { background: #F1F5F9; color: #475569; }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 600; color: #475569; }
.req { color: #EF4444; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #F1F5F9;
}

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: #27C8D8; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s;
}
.btn-primary:hover:not(:disabled) { background: #1BAEBB; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.tp-fade-enter-active { transition: all .22s ease; }
.tp-fade-leave-active { transition: all .15s ease; }
.tp-fade-enter-from { opacity: 0; transform: translateY(16px); }
.tp-fade-leave-to  { opacity: 0; transform: translateY(8px); }
</style>
