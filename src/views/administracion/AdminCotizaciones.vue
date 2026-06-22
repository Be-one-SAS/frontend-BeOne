<template>
  <div class="adm-page">

    <!-- ── Header ───────────────────────────────────────── -->
    <div class="adm-header">
      <div>
        <h1 class="adm-title">Eventos</h1>
        <p class="adm-subtitle">Gestión financiera y administrativa</p>
      </div>
      <button class="adm-btn-export" @click="exportCSV" :disabled="!rows.length">
        <Download :size="15" /> Exportar CSV
      </button>
    </div>

    <!-- ── Filtros ──────────────────────────────────────── -->
    <div class="adm-filters">
      <div class="adm-filter-search">
        <Search :size="14" class="adm-search-icon" />
        <input v-model="filters.search" class="adm-input" placeholder="Buscar nº, cliente, descripción…" @input="onFilter" />
      </div>

      <!-- Estado admin multi-select -->
      <div class="adm-filter-estados" ref="estadosRef">
        <button class="adm-input adm-estado-trigger" @click="estadosOpen = !estadosOpen">
          <span v-if="!filters.estados.length" class="adm-placeholder">Estado administrativo</span>
          <span v-else class="adm-estado-pills">
            <span v-for="e in filters.estados.slice(0,3)" :key="e" class="adm-mini-badge"
              :style="{ background: estadoStyle(e).bg, color: estadoStyle(e).color }">{{ e }}</span>
            <span v-if="filters.estados.length > 3" class="adm-mini-badge adm-mini-more">+{{ filters.estados.length - 3 }}</span>
          </span>
          <ChevronDown :size="13" />
        </button>
        <div v-if="estadosOpen" class="adm-estado-dropdown">
          <div v-for="e in ESTADOS_ADMIN" :key="e" class="adm-estado-opt"
            :class="{ selected: filters.estados.includes(e) }" @click="toggleEstado(e)">
            <span class="adm-estado-check">
              <Check v-if="filters.estados.includes(e)" :size="12" />
            </span>
            <span class="adm-estado-badge" :style="{ background: estadoStyle(e).bg, color: estadoStyle(e).color }">{{ e }}</span>
          </div>
          <button v-if="filters.estados.length" class="adm-clear-btn" @click="filters.estados = []; onFilter()">Limpiar</button>
        </div>
      </div>

      <!-- VAL ADM filter -->
      <select v-model="filters.valAdm" class="adm-input" @change="onFilter" style="width:140px">
        <option value="">VAL ADM: Todos</option>
        <option value="si">Validados</option>
        <option value="no">Sin validar</option>
      </select>

      <input v-model="filters.fechaInicio" type="date" class="adm-input" @change="onFilter" />
      <input v-model="filters.fechaFin"    type="date" class="adm-input" @change="onFilter" />
      <input v-model="filters.responsable" class="adm-input" placeholder="Responsable / ejecutivo" @input="onFilter" />
    </div>

    <!-- ── Tabla ────────────────────────────────────────── -->
    <div class="adm-table-wrap">

      <div v-if="loading" class="adm-skeleton">
        <div v-for="i in 8" :key="i" class="adm-sk-row" />
      </div>

      <div v-else-if="error" class="adm-error">
        <AlertCircle :size="18" /> {{ error }}
        <button @click="load">Reintentar</button>
      </div>

      <div v-else-if="!rows.length" class="adm-empty">
        <FileX :size="36" class="opacity-30" />
        <p>No hay eventos con los filtros actuales</p>
      </div>

      <div v-else class="adm-scroll">
        <table class="adm-table">
          <thead>
            <tr>
              <th class="adm-th sortable" @click="sort('numero')">#</th>
              <th class="adm-th sortable" @click="sort('fechaCotizacion')">Fecha cot.</th>
              <th class="adm-th">Evento</th>
              <th class="adm-th">Unidad</th>
              <th class="adm-th">Fecha evento</th>
              <th class="adm-th sortable" @click="sort('empresa')">Cliente</th>
              <th class="adm-th sortable" @click="sort('total')">Total</th>
              <th class="adm-th">Estado cot.</th>
              <th class="adm-th sortable" @click="sort('estadoAdministrativo')">Estado admin.</th>
              <th class="adm-th">VAL ADM</th>
              <th class="adm-th">% Ejec.</th>
              <th class="adm-th sortable" @click="sort('agenteComercial')">Comercial</th>
              <th class="adm-th"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in rows" :key="row.id">
              <tr class="adm-tr" :class="{ 'adm-tr-expanded': expandedId === row.id }">
                <td class="adm-td adm-num">#{{ row.numero }}</td>
                <td class="adm-td adm-date">{{ fmtDate(row.fechaCotizacion) }}</td>
                <td class="adm-td adm-desc">{{ row.description || row.empresa || '—' }}</td>
                <td class="adm-td adm-unit">{{ row.unidadEjecucion || '—' }}</td>
                <td class="adm-td adm-date">{{ row.operationWindow ? fmtDate(row.operationWindow.eventStartAt) : '—' }}</td>
                <td class="adm-td">
                  <span class="adm-cliente-name">{{ row.cliente?.name || row.empresa || row.contacto || '—' }}</span>
                </td>
                <td class="adm-td adm-money">{{ fmtMoney(row.total) }}</td>
                <td class="adm-td">
                  <span class="adm-cot-status" :class="cotStatusCls(row.quotationStatus?.name)">
                    {{ row.quotationStatus?.name || '—' }}
                  </span>
                </td>
                <td class="adm-td adm-estado-cell">
                  <div class="adm-inline-wrap" v-if="editingId === row.id">
                    <select class="adm-inline-select" v-model="editingVal"
                      @change="saveEstado(row)" @blur="editingId = null" ref="editSelectRef" autofocus>
                      <option value="">— Sin estado —</option>
                      <option v-for="e in ESTADOS_ADMIN" :key="e" :value="e">{{ e }}</option>
                    </select>
                  </div>
                  <button v-else class="adm-estado-btn"
                    :style="{ background: estadoStyle(row.estadoAdministrativo).bg, color: estadoStyle(row.estadoAdministrativo).color }"
                    @click="startEdit(row)" :title="row.saving ? 'Guardando…' : 'Clic para editar'">
                    <span v-if="row.saving" class="adm-saving-dot" />
                    {{ row.estadoAdministrativo || 'Sin estado' }}
                    <Pencil :size="10" class="adm-pencil" />
                  </button>
                </td>
                <!-- VAL ADM badge -->
                <td class="adm-td">
                  <button class="val-adm-badge" :class="row.validadoAdministrativamente ? 'val-ok' : 'val-no'"
                    @click="handleToggleValAdm(row)" :title="row.validadoAdministrativamente ? 'Validado — clic para revertir' : 'Sin validar — clic para validar'">
                    <CheckCircle v-if="row.validadoAdministrativamente" :size="12" />
                    <XCircle v-else :size="12" />
                    {{ row.validadoAdministrativamente ? 'OK' : 'Pdte.' }}
                  </button>
                </td>
                <!-- % Ejecución -->
                <td class="adm-td">
                  <div class="ejec-wrap">
                    <div class="ejec-bar">
                      <div class="ejec-fill" :style="{ width: calcEjec(row) + '%' }"
                        :class="calcEjec(row) === 100 ? 'ejec-full' : ''" />
                    </div>
                    <span class="ejec-pct">{{ calcEjec(row) }}%</span>
                  </div>
                </td>
                <td class="adm-td">{{ row.agenteComercial || '—' }}</td>
                <td class="adm-td">
                  <button class="adm-expand-btn" @click="toggleExpand(row.id)" :title="expandedId === row.id ? 'Cerrar' : 'Ver detalle'">
                    <ChevronDown :size="15" :class="{ 'rotate-180': expandedId === row.id }" style="transition: transform 0.2s" />
                  </button>
                </td>
              </tr>

              <!-- Panel DSO expandible -->
              <tr v-if="expandedId === row.id" class="adm-detail-row">
                <td colspan="13">
                  <div class="dso-panel">

                    <!-- ── Header con toggle edición ───────────────── -->
                    <div class="dso-panel-head">
                      <span class="dso-head-title">Detalles del evento</span>
                      <button class="dso-edit-toggle" @click="toggleDsoEdit(row.id)">
                        <template v-if="!dsoEditMode[row.id]"><Pencil :size="12" /> Editar datos</template>
                        <template v-else><Check :size="12" /> Cerrar edición</template>
                      </button>
                    </div>

                    <!-- ── VISTA: muestra valores guardados ──────────── -->
                    <div v-if="!dsoEditMode[row.id]" class="dso-grid">

                      <!-- Responsables -->
                      <div class="dso-section">
                        <h4 class="dso-section-title"><Users :size="13" /> Responsables</h4>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Comercial</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !resolveUser(dsoForm[row.id]?.responsableComercialId, row.responsableComercial) }">
                            {{ resolveUser(dsoForm[row.id]?.responsableComercialId, row.responsableComercial) || '— Sin asignar' }}
                          </span>
                        </div>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Administrativo</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !resolveUser(dsoForm[row.id]?.responsableAdministrativoId, row.responsableAdministrativo) }">
                            {{ resolveUser(dsoForm[row.id]?.responsableAdministrativoId, row.responsableAdministrativo) || '— Sin asignar' }}
                          </span>
                        </div>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Operativo</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !resolveUser(dsoForm[row.id]?.responsableOperativoId, row.responsableOperativo) }">
                            {{ resolveUser(dsoForm[row.id]?.responsableOperativoId, row.responsableOperativo) || '— Sin asignar' }}
                          </span>
                        </div>
                      </div>

                      <!-- Datos financieros -->
                      <div class="dso-section">
                        <h4 class="dso-section-title"><DollarSign :size="13" /> Datos financieros</h4>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Dept. servicio</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !row.departamentoServicio }">{{ row.departamentoServicio || '—' }}</span>
                        </div>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Valor OC</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !row.ordenCompraValor }">{{ fmtMoney(row.ordenCompraValor) }}</span>
                        </div>
                        <div class="dso-view-row">
                          <span class="dso-view-label">No. Factura</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !row.noFactura }">{{ row.noFactura || '—' }}</span>
                        </div>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Fecha factura</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !row.fechaFactura }">{{ fmtDate(row.fechaFactura) }}</span>
                        </div>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Retención</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !row.retencion }">{{ fmtMoney(row.retencion) }}</span>
                        </div>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Fecha venc.</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !row.fechaVencimiento }">{{ fmtDate(row.fechaVencimiento) }}</span>
                        </div>
                      </div>

                      <!-- Facturación y notas -->
                      <div class="dso-section">
                        <h4 class="dso-section-title"><FileText :size="13" /> Facturación y notas</h4>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Anticipo</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !row.anticipo }">{{ fmtMoney(row.anticipo) }}</span>
                        </div>
                        <div class="dso-view-row">
                          <span class="dso-view-label">Tipo saldo</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !row.tipoSaldo }">{{ row.tipoSaldo || '—' }}</span>
                        </div>
                        <div class="dso-view-row">
                          <span class="dso-view-label">IVA total</span>
                          <span class="dso-view-val" :class="{ 'dso-view-empty': !row.ivaTotal }">{{ fmtMoney(row.ivaTotal) }}</span>
                        </div>
                        <div v-if="row.observacionesComerciales" class="dso-view-col">
                          <span class="dso-view-label">Obs. comerciales</span>
                          <p class="dso-view-text">{{ row.observacionesComerciales }}</p>
                        </div>
                        <div v-if="row.observacionesAdministrativas" class="dso-view-col">
                          <span class="dso-view-label">Obs. administrativas</span>
                          <p class="dso-view-text">{{ row.observacionesAdministrativas }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- ── EDICIÓN: formulario de inputs ─────────────── -->
                    <div v-else class="dso-grid">

                      <!-- Responsables form -->
                      <div class="dso-section">
                        <h4 class="dso-section-title"><Users :size="13" /> Responsables</h4>
                        <div class="dso-field-row">
                          <label>Comercial</label>
                          <select class="dso-select" v-model="dsoForm[row.id].responsableComercialId" @change="saveResponsables(row)">
                            <option :value="null">— Sin asignar —</option>
                            <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.fullName }}</option>
                          </select>
                        </div>
                        <div class="dso-field-row">
                          <label>Administrativo</label>
                          <select class="dso-select" v-model="dsoForm[row.id].responsableAdministrativoId" @change="saveResponsables(row)">
                            <option :value="null">— Sin asignar —</option>
                            <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.fullName }}</option>
                          </select>
                        </div>
                        <div class="dso-field-row">
                          <label>Operativo</label>
                          <select class="dso-select" v-model="dsoForm[row.id].responsableOperativoId" @change="saveResponsables(row)">
                            <option :value="null">— Sin asignar —</option>
                            <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.fullName }}</option>
                          </select>
                        </div>
                      </div>

                      <!-- Datos financieros form -->
                      <div class="dso-section">
                        <h4 class="dso-section-title"><DollarSign :size="13" /> Datos financieros</h4>
                        <div class="dso-field-row">
                          <label>Dept. servicio</label>
                          <select class="dso-select" v-model="dsoForm[row.id].departamentoServicio" @change="saveDatosFinancieros(row)">
                            <option value="">—</option>
                            <option value="TODOS">Todos</option>
                            <option value="ADMINISTRATIVO">Administrativo</option>
                          </select>
                        </div>
                        <div class="dso-field-row">
                          <label>Valor OC</label>
                          <input type="number" class="dso-input" v-model.number="dsoForm[row.id].ordenCompraValor" @blur="saveDatosFinancieros(row)" placeholder="0" />
                        </div>
                        <div class="dso-field-row">
                          <label>No. Factura</label>
                          <input type="text" class="dso-input" v-model="dsoForm[row.id].noFactura" @blur="saveDatosFinancieros(row)" placeholder="—" />
                        </div>
                        <div class="dso-field-row">
                          <label>Fecha factura</label>
                          <input type="date" class="dso-input" v-model="dsoForm[row.id].fechaFactura" @change="saveDatosFinancieros(row)" />
                        </div>
                        <div class="dso-field-row">
                          <label>Retención</label>
                          <input type="number" class="dso-input" v-model.number="dsoForm[row.id].retencion" @blur="saveDatosFinancieros(row)" placeholder="0" />
                        </div>
                        <div class="dso-field-row">
                          <label>Fecha venc.</label>
                          <input type="date" class="dso-input" v-model="dsoForm[row.id].fechaVencimiento" @change="saveDatosFinancieros(row)" />
                        </div>
                      </div>

                      <!-- Facturación y notas form -->
                      <div class="dso-section">
                        <h4 class="dso-section-title"><FileText :size="13" /> Facturación y notas</h4>
                        <div class="dso-field-row">
                          <label>Anticipo</label>
                          <input type="number" class="dso-input" v-model.number="dsoForm[row.id].anticipo" @blur="saveDatosFinancieros(row)" placeholder="0" />
                        </div>
                        <div class="dso-field-row">
                          <label>Tipo saldo</label>
                          <input type="text" class="dso-input" v-model="dsoForm[row.id].tipoSaldo" @blur="saveDatosFinancieros(row)" placeholder="—" />
                        </div>
                        <div class="dso-field-row">
                          <label>IVA total</label>
                          <input type="number" class="dso-input" v-model.number="dsoForm[row.id].ivaTotal" @blur="saveDatosFinancieros(row)" placeholder="0" />
                        </div>
                        <div class="dso-field-col">
                          <label>Obs. comerciales</label>
                          <textarea class="dso-textarea" v-model="dsoForm[row.id].observacionesComerciales" @blur="saveDatosFinancieros(row)" rows="2" placeholder="—" />
                        </div>
                        <div class="dso-field-col">
                          <label>Obs. administrativas</label>
                          <textarea class="dso-textarea" v-model="dsoForm[row.id].observacionesAdministrativas" @blur="saveDatosFinancieros(row)" rows="2" placeholder="—" />
                        </div>
                      </div>
                    </div>

                    <!-- Notas Comercial + Administrativo -->
                    <NotasCotizacionPanel
                      :quotationId="row.id"
                      :areasFiltro="['Comercial', 'Administrativo']"
                    />

                    <!-- Indicador guardado -->
                    <div v-if="dsoSaving[row.id]" class="dso-saving">Guardando…</div>
                    <div v-if="dsoSaved[row.id]" class="dso-saved"><Check :size="12" /> Guardado</div>
                    <div v-if="dsoError[row.id]" class="dso-save-err">Error al guardar — revisa la consola</div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="total > 0" class="adm-pagination">
        <span class="adm-pag-info">{{ (page-1)*pageLimit + 1 }}–{{ Math.min(page*pageLimit, total) }} de {{ total }}</span>
        <div class="adm-pag-btns">
          <button class="adm-pag-btn" :disabled="page <= 1" @click="changePage(page - 1)">‹</button>
          <button v-for="p in visiblePages" :key="p" class="adm-pag-btn" :class="{ active: p === page }" @click="changePage(p)">{{ p }}</button>
          <button class="adm-pag-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Download, Search, ChevronDown, Check, AlertCircle, FileX,
  Pencil, Users, DollarSign, FileText, CheckCircle, XCircle,
} from 'lucide-vue-next'
import {
  getAdminCotizaciones, updateEstadoAdmin,
  updateResponsables, toggleValidacionAdmin, updateDatosFinancieros,
} from '@/services/administracion.service.js'
import { getUsers } from '@/services/users.service.js'
import { ESTADOS_ADMIN, estadoAdminStyle } from '@/composables/useEstadoAdmin.js'
import NotasCotizacionPanel from '@/components/quotation/NotasCotizacionPanel.vue'

function estadoStyle(e) { return estadoAdminStyle(e) }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtDateInput(d) {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

function fmtDisplayDate(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

// Resuelve nombre de usuario: primero busca en el listado cargado (más fresco),
// luego usa el objeto anidado que trajo la API (fallback).
function resolveUser(id, nestedObj) {
  if (id) {
    const found = usuarios.value.find(u => u.id === id)
    if (found) return found.fullName
  }
  return nestedObj?.fullName || null
}

function fmtMoney(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function cotStatusCls(s) {
  return { 'Aprobada': 'cot-aprobada', 'En Proceso': 'cot-en-proceso', 'Vencida': 'cot-vencida', 'Cancelada': 'cot-cancelada' }[s] ?? 'cot-default'
}

function calcEjec(row) {
  const flags = [row.planillaEjecucion, row.listadoMaterial, row.registroFotografico, row.despachado, row.retorno, row.eventoFinalizado]
  const done = flags.filter(Boolean).length
  return Math.round((done / flags.length) * 100)
}

// ── State ─────────────────────────────────────────────────
const loading    = ref(false)
const error      = ref(null)
const rows       = ref([])
const total      = ref(0)
const page       = ref(1)
const pageLimit  = 50
const sortField  = ref('fechaCotizacion')
const sortDir    = ref('desc')
const estadosOpen = ref(false)
const estadosRef  = ref(null)
const editingId   = ref(null)
const editingVal  = ref('')
const editSelectRef = ref(null)
const expandedId  = ref(null)
const usuarios    = ref([])
const dsoForm     = ref({})
const dsoSaving   = ref({})
const dsoSaved    = ref({})
const dsoError    = ref({})
const dsoEditMode = ref({})

const filters = ref({
  search:      '',
  estados:     [],
  valAdm:      '',
  fechaInicio: '',
  fechaFin:    '',
  responsable: '',
})

// ── Pagination ────────────────────────────────────────────
const totalPages   = computed(() => Math.max(1, Math.ceil(total.value / pageLimit)))
const visiblePages = computed(() => {
  const p = page.value, tp = totalPages.value
  const pages = []
  for (let i = Math.max(1, p - 2); i <= Math.min(tp, p + 2); i++) pages.push(i)
  return pages
})

// ── Load data ─────────────────────────────────────────────
let debounceTimer = null
function onFilter() {
  page.value = 1
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 400)
}

async function load() {
  loading.value = true
  error.value   = null
  try {
    const params = {
      search:      filters.value.search     || undefined,
      estadoAdmin: filters.value.estados.join(',') || undefined,
      fechaInicio: filters.value.fechaInicio || undefined,
      fechaFin:    filters.value.fechaFin   || undefined,
      responsable: filters.value.responsable || undefined,
      page:        page.value,
      limit:       pageLimit,
      sortBy:      sortField.value,
      sortOrder:   sortDir.value,
    }
    const res = await getAdminCotizaciones(params)
    rows.value  = (res.data ?? []).map(r => ({ ...r, saving: false }))
    total.value = res.total ?? 0

    // Sync dsoForm from server for every row.
    // Skip re-initialization only for the currently expanded row to avoid
    // resetting values the user is actively editing.
    for (const r of rows.value) {
      if (expandedId.value === r.id) continue
      dsoForm.value[r.id] = {
        responsableComercialId:      r.responsableComercialId ?? null,
        responsableAdministrativoId: r.responsableAdministrativoId ?? null,
        responsableOperativoId:      r.responsableOperativoId ?? null,
        departamentoServicio:        r.departamentoServicio ?? '',
        ordenCompraValor:            r.ordenCompraValor ?? null,
        noFactura:                   r.noFactura ?? '',
        fechaFactura:                fmtDateInput(r.fechaFactura),
        retencion:                   r.retencion ?? null,
        fechaVencimiento:            fmtDateInput(r.fechaVencimiento),
        anticipo:                    r.anticipo ?? null,
        tipoSaldo:                   r.tipoSaldo ?? '',
        ivaTotal:                    r.ivaTotal ?? null,
        observacionesComerciales:    r.observacionesComerciales ?? '',
        observacionesAdministrativas:r.observacionesAdministrativas ?? '',
      }
    }

    // Apply client-side valAdm filter
    if (filters.value.valAdm === 'si')  rows.value = rows.value.filter(r => r.validadoAdministrativamente)
    if (filters.value.valAdm === 'no')  rows.value = rows.value.filter(r => !r.validadoAdministrativamente)
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando eventos'
  } finally {
    loading.value = false
  }
}

async function loadUsuarios() {
  try {
    const res = await getUsers()
    usuarios.value = (res.data ?? res ?? []).filter(u => u.isActive)
  } catch {}
}

onMounted(() => {
  load()
  loadUsuarios()
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => document.removeEventListener('click', onClickOutside))

function onClickOutside(e) {
  if (estadosRef.value && !estadosRef.value.contains(e.target)) estadosOpen.value = false
}

// ── Sort ──────────────────────────────────────────────────
function sort(field) {
  if (sortField.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortField.value = field; sortDir.value = 'desc' }
  load()
}

// ── Filters ───────────────────────────────────────────────
function toggleEstado(e) {
  const idx = filters.value.estados.indexOf(e)
  if (idx >= 0) filters.value.estados.splice(idx, 1)
  else          filters.value.estados.push(e)
  onFilter()
}

function changePage(p) {
  page.value = p
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Inline edit estado ────────────────────────────────────
function startEdit(row) {
  editingId.value  = row.id
  editingVal.value = row.estadoAdministrativo ?? ''
  nextTick(() => editSelectRef.value?.focus())
}

async function saveEstado(row) {
  const newVal = editingVal.value
  editingId.value = null
  if (newVal === (row.estadoAdministrativo ?? '')) return
  row.saving = true
  const prev = row.estadoAdministrativo
  row.estadoAdministrativo = newVal || null
  try {
    await updateEstadoAdmin(row.id, newVal || null)
  } catch {
    row.estadoAdministrativo = prev
  } finally {
    row.saving = false
  }
}

// ── VAL ADM toggle ────────────────────────────────────────
async function handleToggleValAdm(row) {
  const prev = row.validadoAdministrativamente
  row.validadoAdministrativamente = !prev
  try {
    await toggleValidacionAdmin(row.id)
  } catch {
    row.validadoAdministrativamente = prev
  }
}

// ── Expand / DSO panel ────────────────────────────────────
function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
  if (expandedId.value === null) {
    dsoEditMode.value[id] = false
  } else {
    const row = rows.value.find(r => r.id === id)
    const hasData = row && (
      row.responsableComercialId || row.responsableAdministrativoId || row.responsableOperativoId ||
      row.noFactura || row.fechaFactura || row.ordenCompraValor || row.departamentoServicio
    )
    if (!hasData) dsoEditMode.value[id] = true
  }
}

function toggleDsoEdit(id) {
  dsoEditMode.value[id] = !dsoEditMode.value[id]
}

let saveTimer = {}

async function saveResponsables(row) {
  clearTimeout(saveTimer[`resp_${row.id}`])
  saveTimer[`resp_${row.id}`] = setTimeout(async () => {
    dsoSaving.value[row.id] = true
    dsoSaved.value[row.id]  = false
    dsoError.value[row.id]  = false
    try {
      const f = dsoForm.value[row.id]
      await updateResponsables(row.id, {
        responsableComercialId:      f.responsableComercialId,
        responsableAdministrativoId: f.responsableAdministrativoId,
        responsableOperativoId:      f.responsableOperativoId,
      })
      // Sync FK ids and nested objects so view mode shows updated values immediately
      const mkUser = (id) => { const u = usuarios.value.find(x => x.id === id); return u ? { id: u.id, fullName: u.fullName } : null }
      row.responsableComercialId      = f.responsableComercialId
      row.responsableAdministrativoId = f.responsableAdministrativoId
      row.responsableOperativoId      = f.responsableOperativoId
      row.responsableComercial      = mkUser(f.responsableComercialId)
      row.responsableAdministrativo = mkUser(f.responsableAdministrativoId)
      row.responsableOperativo      = mkUser(f.responsableOperativoId)
      dsoSaved.value[row.id] = true
      setTimeout(() => { dsoSaved.value[row.id] = false }, 2000)
    } catch {
      dsoError.value[row.id] = true
      setTimeout(() => { dsoError.value[row.id] = false }, 3000)
    } finally {
      dsoSaving.value[row.id] = false
    }
  }, 300)
}

async function saveDatosFinancieros(row) {
  clearTimeout(saveTimer[`fin_${row.id}`])
  saveTimer[`fin_${row.id}`] = setTimeout(async () => {
    dsoSaving.value[row.id] = true
    dsoSaved.value[row.id]  = false
    dsoError.value[row.id]  = false
    try {
      const f = dsoForm.value[row.id]
      await updateDatosFinancieros(row.id, {
        departamentoServicio:        f.departamentoServicio || undefined,
        ordenCompraValor:            f.ordenCompraValor ?? undefined,
        noFactura:                   f.noFactura || undefined,
        fechaFactura:                f.fechaFactura || undefined,
        retencion:                   f.retencion ?? undefined,
        fechaVencimiento:            f.fechaVencimiento || undefined,
        anticipo:                    f.anticipo ?? undefined,
        tipoSaldo:                   f.tipoSaldo || undefined,
        ivaTotal:                    f.ivaTotal ?? undefined,
        observacionesComerciales:    f.observacionesComerciales || undefined,
        observacionesAdministrativas:f.observacionesAdministrativas || undefined,
      })
      // Sync saved values back to row so view mode reflects them immediately
      Object.assign(row, {
        departamentoServicio:        f.departamentoServicio || null,
        ordenCompraValor:            f.ordenCompraValor ?? null,
        noFactura:                   f.noFactura || null,
        fechaFactura:                f.fechaFactura || null,
        retencion:                   f.retencion ?? null,
        fechaVencimiento:            f.fechaVencimiento || null,
        anticipo:                    f.anticipo ?? null,
        tipoSaldo:                   f.tipoSaldo || null,
        ivaTotal:                    f.ivaTotal ?? null,
        observacionesComerciales:    f.observacionesComerciales || null,
        observacionesAdministrativas:f.observacionesAdministrativas || null,
      })
      dsoSaved.value[row.id] = true
      setTimeout(() => { dsoSaved.value[row.id] = false }, 2000)
    } catch {
      dsoError.value[row.id] = true
      setTimeout(() => { dsoError.value[row.id] = false }, 3000)
    } finally {
      dsoSaving.value[row.id] = false
    }
  }, 600)
}

// ── CSV export ────────────────────────────────────────────
function exportCSV() {
  const headers = ['#', 'Fecha cot.', 'Evento', 'Unidad', 'Fecha evento', 'Cliente', 'Total', 'Estado cot.', 'Estado admin.', 'VAL ADM', '% Ejec.', 'Comercial']
  const csvRows = rows.value.map(r => [
    r.numero,
    fmtDate(r.fechaCotizacion),
    r.description || r.empresa || '',
    r.unidadEjecucion || '',
    r.operationWindow ? fmtDate(r.operationWindow.eventStartAt) : '',
    r.cliente?.name || r.empresa || r.contacto || '',
    r.total ?? '',
    r.quotationStatus?.name || '',
    r.estadoAdministrativo || '',
    r.validadoAdministrativamente ? 'Sí' : 'No',
    calcEjec(r) + '%',
    r.agenteComercial || '',
  ])
  const csv = [headers, ...csvRows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `eventos-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.adm-page { padding: 20px 24px; max-width: 1440px; font-family: 'Inter', sans-serif; }

.adm-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.adm-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
.adm-subtitle { font-size: 13px; color: #64748B; margin: 2px 0 0; }

.adm-btn-export {
  display: flex; align-items: center; gap: 7px; padding: 8px 16px;
  background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; font-weight: 500; color: #374151; cursor: pointer; transition: all 0.15s;
}
.adm-btn-export:hover:not(:disabled) { background: #EFF6FF; border-color: #054EAF; color: #054EAF; }
.adm-btn-export:disabled { opacity: 0.4; cursor: not-allowed; }

.adm-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.adm-filter-search { position: relative; flex: 1; min-width: 200px; }
.adm-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
.adm-filter-search .adm-input { padding-left: 30px; width: 100%; }

.adm-input {
  height: 36px; padding: 0 10px; border: 1.5px solid #E2E8F0; border-radius: 8px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #0F172A; background: #fff;
  outline: none; box-sizing: border-box; transition: border-color 0.15s; min-width: 0;
}
.adm-input:focus { border-color: #054EAF; }

.adm-filter-estados { position: relative; }
.adm-estado-trigger {
  display: flex; align-items: center; justify-content: space-between;
  gap: 6px; width: 260px; cursor: pointer; user-select: none;
}
.adm-placeholder { color: #94A3B8; font-size: 13px; }
.adm-estado-pills { display: flex; align-items: center; gap: 4px; flex: 1; overflow: hidden; }
.adm-mini-badge { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 6px; white-space: nowrap; }
.adm-mini-more { background: #F1F5F9; color: #64748B; }

.adm-estado-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 200;
  background: #fff; border: 1.5px solid #E2E8F0; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(5,78,175,.12); width: 260px; max-height: 360px;
  overflow-y: auto; padding: 6px;
}
.adm-estado-opt {
  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
  border-radius: 8px; cursor: pointer; transition: background 0.1s;
}
.adm-estado-opt:hover { background: #F8FAFC; }
.adm-estado-opt.selected { background: #EBF3FC; }
.adm-estado-check {
  width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid #CBD5E1;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #054EAF;
}
.adm-estado-badge { font-size: 12px; font-weight: 500; padding: 2px 8px; border-radius: 6px; }
.adm-clear-btn {
  width: 100%; margin-top: 4px; padding: 6px; border: none; background: none;
  color: #EF4444; font-size: 12px; cursor: pointer; border-radius: 6px;
}
.adm-clear-btn:hover { background: #FEF2F2; }

.adm-table-wrap {
  background: #fff; border-radius: 16px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08); overflow: hidden;
}
.adm-scroll { overflow-x: auto; }

.adm-skeleton { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.adm-sk-row {
  height: 40px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 400% 100%; border-radius: 8px; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }

.adm-error { display: flex; align-items: center; gap: 10px; padding: 20px; color: #DC2626; font-size: 13px; }
.adm-error button { padding: 4px 12px; border: 1px solid #DC2626; border-radius: 6px; background: none; color: #DC2626; cursor: pointer; font-size: 12px; }
.adm-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px; color: #94A3B8; font-size: 14px; }

.adm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.adm-th {
  padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 600;
  color: #94A3B8; text-transform: uppercase; letter-spacing: 0.4px;
  background: #F8FAFC; border-bottom: 1.5px solid #E2E8F0; white-space: nowrap;
}
.adm-th.sortable { cursor: pointer; user-select: none; }
.adm-th.sortable:hover { color: #054EAF; }

.adm-tr { border-bottom: 1px solid #F1F5F9; transition: background 0.1s; }
.adm-tr:hover { background: #F8FAFC; }
.adm-tr-expanded { background: #F0F7FF; }

.adm-td { padding: 10px 14px; color: #374151; vertical-align: middle; }
.adm-num  { font-weight: 600; color: #054EAF; white-space: nowrap; }
.adm-date { white-space: nowrap; color: #64748B; }
.adm-desc { max-width: 200px; }
.adm-unit { white-space: nowrap; color: #64748B; font-size: 12px; }
.adm-money { font-weight: 600; color: #0F172A; white-space: nowrap; }
.adm-cliente-name { font-weight: 500; }

.adm-cot-status { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }
.cot-aprobada   { background: #F0FDF4; color: #166534; }
.cot-en-proceso { background: #EFF6FF; color: #1D4ED8; }
.cot-vencida    { background: #FEFCE8; color: #854D0E; }
.cot-cancelada  { background: #FEF2F2; color: #991B1B; }
.cot-default    { background: #F1F5F9; color: #64748B; }

.adm-estado-cell { min-width: 150px; }
.adm-inline-wrap { min-width: 150px; }
.adm-inline-select {
  width: 100%; padding: 4px 8px; border: 1.5px solid #054EAF;
  border-radius: 6px; font-size: 12px; font-family: 'Inter', sans-serif; outline: none;
}
.adm-estado-btn {
  display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600;
  padding: 3px 8px; border-radius: 6px; border: none; cursor: pointer; white-space: nowrap; transition: filter 0.1s;
}
.adm-estado-btn:hover { filter: brightness(0.96); }
.adm-pencil { opacity: 0.6; }
.adm-saving-dot {
  width: 7px; height: 7px; border-radius: 50%; background: currentColor;
  animation: blink 0.8s infinite alternate;
}
@keyframes blink { from { opacity: 1 } to { opacity: 0.2 } }

/* VAL ADM */
.val-adm-badge {
  display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 6px; border: none; cursor: pointer; transition: filter 0.1s; white-space: nowrap;
}
.val-adm-badge:hover { filter: brightness(0.93); }
.val-ok { background: #F0FDF4; color: #166534; }
.val-no { background: #FEF2F2; color: #991B1B; }

/* Ejecución */
.ejec-wrap { display: flex; align-items: center; gap: 6px; min-width: 80px; }
.ejec-bar { flex: 1; height: 5px; background: #E2E8F0; border-radius: 99px; overflow: hidden; }
.ejec-fill { height: 100%; background: #054EAF; border-radius: 99px; transition: width 0.3s; }
.ejec-full { background: #16A34A; }
.ejec-pct { font-size: 11px; color: #64748B; white-space: nowrap; }

/* Expand button */
.adm-expand-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid #E2E8F0;
  background: #F8FAFC; color: #64748B; cursor: pointer; transition: all 0.15s;
}
.adm-expand-btn:hover { border-color: #054EAF; color: #054EAF; background: #EFF6FF; }

/* DSO panel */
.adm-detail-row { background: #F0F7FF; }
.adm-detail-row td { padding: 0; border-bottom: 2px solid #BFDBFE; }

.dso-panel { padding: 20px 24px; }

.dso-panel-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1.5px solid #E2E8F0;
}
.dso-head-title { font-size: 13px; font-weight: 600; color: #0F172A; }
.dso-edit-toggle {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 8px; border: 1.5px solid #E2E8F0;
  font-size: 12px; font-weight: 500; color: #374151; background: #F8FAFC;
  cursor: pointer; transition: all 0.15s;
}
.dso-edit-toggle:hover { border-color: #054EAF; color: #054EAF; background: #EFF6FF; }

.dso-view-row {
  display: flex; align-items: baseline; gap: 8px; margin-bottom: 7px;
}
.dso-view-label {
  font-size: 11px; color: #94A3B8; width: 110px; flex-shrink: 0; font-weight: 500;
}
.dso-view-val {
  font-size: 13px; color: #0F172A; font-weight: 500;
}
.dso-view-empty { color: #CBD5E1; font-weight: 400; font-style: italic; }
.dso-view-col { display: flex; flex-direction: column; gap: 3px; margin-bottom: 7px; }
.dso-view-text {
  margin: 0; font-size: 12px; color: #374151; background: #F8FAFC;
  border-radius: 6px; padding: 6px 8px; line-height: 1.5;
}

.dso-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

.dso-section {}
.dso-section-title {
  display: flex; align-items: center; gap: 5px; margin: 0 0 12px;
  font-size: 11px; font-weight: 700; color: #054EAF; text-transform: uppercase; letter-spacing: 0.5px;
}

.dso-field-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.dso-field-row label { font-size: 11px; color: #64748B; width: 110px; flex-shrink: 0; }
.dso-field-col { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.dso-field-col label { font-size: 11px; color: #64748B; }

.dso-input, .dso-select {
  flex: 1; height: 30px; padding: 0 8px; border: 1.5px solid #E2E8F0;
  border-radius: 6px; font-size: 12px; font-family: 'Inter', sans-serif;
  color: #0F172A; background: #fff; outline: none; transition: border-color 0.15s;
}
.dso-input:focus, .dso-select:focus { border-color: #054EAF; }
.dso-textarea {
  width: 100%; padding: 6px 8px; border: 1.5px solid #E2E8F0; border-radius: 6px;
  font-size: 12px; font-family: 'Inter', sans-serif; color: #0F172A;
  background: #fff; outline: none; resize: vertical; transition: border-color 0.15s; box-sizing: border-box;
}
.dso-textarea:focus { border-color: #054EAF; }

.dso-saving { font-size: 11px; color: #64748B; margin-top: 8px; }
.dso-save-err {
  font-size: 11px; color: #991B1B; background: #FEF2F2; padding: 3px 8px;
  border-radius: 6px; margin-top: 8px;
}
.dso-saved {
  display: inline-flex; align-items: center; gap: 4px; font-size: 11px;
  color: #166534; background: #F0FDF4; padding: 3px 8px; border-radius: 6px; margin-top: 8px;
}

/* Pagination */
.adm-pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-top: 1.5px solid #E2E8F0;
}
.adm-pag-info { font-size: 12px; color: #64748B; }
.adm-pag-btns { display: flex; gap: 4px; }
.adm-pag-btn {
  min-width: 32px; height: 32px; padding: 0 8px; border: 1.5px solid #E2E8F0;
  border-radius: 8px; background: #fff; font-size: 13px; cursor: pointer;
  color: #374151; transition: all 0.15s;
}
.adm-pag-btn:hover:not(:disabled) { border-color: #054EAF; color: #054EAF; }
.adm-pag-btn.active { background: #054EAF; color: #fff; border-color: #054EAF; }
.adm-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 900px) {
  .dso-grid { grid-template-columns: 1fr; }
}
</style>
