<template>
  <div class="adm-page">

    <!-- ── Header ───────────────────────────────────────── -->
    <div class="adm-header">
      <div>
        <h1 class="adm-title">Cotizaciones</h1>
        <p class="adm-subtitle">Gestión financiera y administrativa</p>
      </div>
      <button class="adm-btn-export" @click="exportCSV" :disabled="!rows.length">
        <Download :size="15" /> Exportar CSV
      </button>
    </div>

    <!-- ── Filtros ──────────────────────────────────────── -->
    <div class="adm-filters">
      <!-- Búsqueda global -->
      <div class="adm-filter-search">
        <Search :size="14" class="adm-search-icon" />
        <input v-model="filters.search" class="adm-input" placeholder="Buscar nº, cliente, descripción…" @input="onFilter" />
      </div>

      <!-- Estado admin multi-select -->
      <div class="adm-filter-estados" ref="estadosRef">
        <button class="adm-input adm-estado-trigger" @click="estadosOpen = !estadosOpen">
          <span v-if="!filters.estados.length" class="adm-placeholder">Estado administrativo</span>
          <span v-else class="adm-estado-pills">
            <span
              v-for="e in filters.estados.slice(0,3)" :key="e"
              class="adm-mini-badge"
              :style="{ background: estadoStyle(e).bg, color: estadoStyle(e).color }"
            >{{ e }}</span>
            <span v-if="filters.estados.length > 3" class="adm-mini-badge adm-mini-more">+{{ filters.estados.length - 3 }}</span>
          </span>
          <ChevronDown :size="13" />
        </button>
        <div v-if="estadosOpen" class="adm-estado-dropdown">
          <div
            v-for="e in ESTADOS_ADMIN" :key="e"
            class="adm-estado-opt"
            :class="{ selected: filters.estados.includes(e) }"
            @click="toggleEstado(e)"
          >
            <span class="adm-estado-check">
              <Check v-if="filters.estados.includes(e)" :size="12" />
            </span>
            <span class="adm-estado-badge" :style="{ background: estadoStyle(e).bg, color: estadoStyle(e).color }">
              {{ e }}
            </span>
          </div>
          <button v-if="filters.estados.length" class="adm-clear-btn" @click="filters.estados = []; onFilter()">
            Limpiar
          </button>
        </div>
      </div>

      <!-- Fechas -->
      <input v-model="filters.fechaInicio" type="date" class="adm-input" @change="onFilter" />
      <input v-model="filters.fechaFin"    type="date" class="adm-input" @change="onFilter" />

      <!-- Responsable -->
      <input v-model="filters.responsable" class="adm-input" placeholder="Responsable / ejecutivo" @input="onFilter" />
    </div>

    <!-- ── Tabla ────────────────────────────────────────── -->
    <div class="adm-table-wrap">

      <!-- Skeleton -->
      <div v-if="loading" class="adm-skeleton">
        <div v-for="i in 8" :key="i" class="adm-sk-row" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="adm-error">
        <AlertCircle :size="18" /> {{ error }}
        <button @click="load">Reintentar</button>
      </div>

      <!-- Empty -->
      <div v-else-if="!rows.length" class="adm-empty">
        <FileX :size="36" class="opacity-30" />
        <p>No hay cotizaciones con los filtros actuales</p>
      </div>

      <!-- Table -->
      <div v-else class="adm-scroll">
        <table class="adm-table">
          <thead>
            <tr>
              <th class="adm-th sortable" @click="sort('numero')">#
                <SortIcon field="numero" />
              </th>
              <th class="adm-th sortable" @click="sort('fechaCotizacion')">Fecha cot.
                <SortIcon field="fechaCotizacion" />
              </th>
              <th class="adm-th">Evento</th>
              <th class="adm-th">Fecha evento</th>
              <th class="adm-th sortable" @click="sort('empresa')">Cliente
                <SortIcon field="empresa" />
              </th>
              <th class="adm-th sortable" @click="sort('total')">Total
                <SortIcon field="total" />
              </th>
              <th class="adm-th">Estado cotización</th>
              <th class="adm-th sortable" @click="sort('estadoAdministrativo')">Estado admin.
                <SortIcon field="estadoAdministrativo" />
              </th>
              <th class="adm-th sortable" @click="sort('agenteComercial')">Responsable
                <SortIcon field="agenteComercial" />
              </th>
              <th class="adm-th">Notas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="adm-tr">
              <td class="adm-td adm-num">#{{ row.numero }}</td>
              <td class="adm-td adm-date">{{ fmtDate(row.fechaCotizacion) }}</td>
              <td class="adm-td adm-desc">{{ row.description || row.empresa || '—' }}</td>
              <td class="adm-td adm-date">{{ row.operationWindow ? fmtDate(row.operationWindow.eventStartAt) : '—' }}</td>
              <td class="adm-td">
                <div class="adm-cliente">
                  <span class="adm-cliente-name">{{ row.cliente?.name || row.empresa || row.contacto || '—' }}</span>
                </div>
              </td>
              <td class="adm-td adm-money">{{ fmtMoney(row.total) }}</td>
              <td class="adm-td">
                <span class="adm-cot-status" :class="cotStatusCls(row.quotationStatus?.name)">
                  {{ row.quotationStatus?.name || '—' }}
                </span>
              </td>
              <td class="adm-td adm-estado-cell">
                <!-- Inline edit dropdown -->
                <div class="adm-inline-wrap" v-if="editingId === row.id">
                  <select
                    class="adm-inline-select"
                    v-model="editingVal"
                    @change="saveEstado(row)"
                    @blur="editingId = null"
                    ref="editSelectRef"
                    autofocus
                  >
                    <option value="">— Sin estado —</option>
                    <option v-for="e in ESTADOS_ADMIN" :key="e" :value="e">{{ e }}</option>
                  </select>
                </div>
                <button
                  v-else
                  class="adm-estado-btn"
                  :style="{ background: estadoStyle(row.estadoAdministrativo).bg, color: estadoStyle(row.estadoAdministrativo).color }"
                  @click="startEdit(row)"
                  :title="row.saving ? 'Guardando…' : 'Clic para editar'"
                >
                  <span v-if="row.saving" class="adm-saving-dot" />
                  {{ row.estadoAdministrativo || 'Sin estado' }}
                  <Pencil :size="10" class="adm-pencil" />
                </button>
              </td>
              <td class="adm-td">{{ row.agenteComercial || '—' }}</td>
              <td class="adm-td adm-notes">
                <span v-if="row.notasOperativas" class="adm-notes-text" :title="row.notasOperativas">
                  {{ row.notasOperativas.slice(0, 40) }}{{ row.notasOperativas.length > 40 ? '…' : '' }}
                </span>
                <span v-else class="adm-no-notes">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="total > 0" class="adm-pagination">
        <span class="adm-pag-info">{{ (page-1)*pageLimit + 1 }}–{{ Math.min(page*pageLimit, total) }} de {{ total }}</span>
        <div class="adm-pag-btns">
          <button class="adm-pag-btn" :disabled="page <= 1" @click="changePage(page - 1)">‹</button>
          <button
            v-for="p in visiblePages"
            :key="p"
            class="adm-pag-btn"
            :class="{ active: p === page }"
            @click="changePage(p)"
          >{{ p }}</button>
          <button class="adm-pag-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  Download, Search, ChevronDown, Check, AlertCircle, FileX,
  Pencil, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-vue-next'
import { getAdminCotizaciones, updateEstadoAdmin } from '@/services/administracion.service.js'
import { ESTADOS_ADMIN, estadoAdminStyle } from '@/composables/useEstadoAdmin.js'

// ── Helpers ───────────────────────────────────────────────
function estadoStyle(e) { return estadoAdminStyle(e) }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtMoney(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function cotStatusCls(s) {
  return {
    'Aprobada':   'cot-aprobada',
    'En Proceso': 'cot-en-proceso',
    'Vencida':    'cot-vencida',
    'Cancelada':  'cot-cancelada',
  }[s] ?? 'cot-default'
}

// ── Sort icon component ────────────────────────────────────
const SortIcon = {
  props: ['field'],
  setup(props) {
    return () => {
      // parent scope via provide/inject would be cleaner,
      // but simple inline template works fine here
    }
  },
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

const filters = ref({
  search:      '',
  estados:     [],
  fechaInicio: '',
  fechaFin:    '',
  responsable: '',
})

// ── Pagination ────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageLimit)))
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
    const res = await getAdminCotizaciones({
      search:      filters.value.search     || undefined,
      estadoAdmin: filters.value.estados.join(',') || undefined,
      fechaInicio: filters.value.fechaInicio || undefined,
      fechaFin:    filters.value.fechaFin   || undefined,
      responsable: filters.value.responsable || undefined,
      page:        page.value,
      limit:       pageLimit,
      sortBy:      sortField.value,
      sortOrder:   sortDir.value,
    })
    rows.value  = (res.data ?? []).map(r => ({ ...r, saving: false }))
    total.value = res.total ?? 0
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando cotizaciones'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => document.removeEventListener('click', onClickOutside))

function onClickOutside(e) {
  if (estadosRef.value && !estadosRef.value.contains(e.target)) {
    estadosOpen.value = false
  }
}

// ── Sort ──────────────────────────────────────────────────
function sort(field) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'desc'
  }
  load()
}

// ── Estado filter ─────────────────────────────────────────
function toggleEstado(e) {
  const idx = filters.value.estados.indexOf(e)
  if (idx >= 0) filters.value.estados.splice(idx, 1)
  else          filters.value.estados.push(e)
  onFilter()
}

// ── Pagination ────────────────────────────────────────────
function changePage(p) {
  page.value = p
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Inline edit ───────────────────────────────────────────
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

// ── CSV export ────────────────────────────────────────────
function exportCSV() {
  const headers = ['#', 'Fecha cot.', 'Descripción/Evento', 'Fecha evento', 'Cliente', 'Total', 'Estado cot.', 'Estado admin.', 'Responsable', 'Notas']
  const csvRows = rows.value.map(r => [
    r.numero,
    fmtDate(r.fechaCotizacion),
    r.description || r.empresa || '',
    r.operationWindow ? fmtDate(r.operationWindow.eventStartAt) : '',
    r.cliente?.name || r.empresa || r.contacto || '',
    r.total ?? '',
    r.quotationStatus?.name || '',
    r.estadoAdministrativo || '',
    r.agenteComercial || '',
    (r.notasOperativas || '').replace(/,/g, ';'),
  ])

  const csv = [headers, ...csvRows]
    .map(row => row.map(c => `"${c}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `cotizaciones-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────── */
.adm-page {
  padding: 20px 24px;
  max-width: 1440px;
  font-family: 'Inter', sans-serif;
}

.adm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.adm-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}
.adm-subtitle { font-size: 13px; color: #64748B; margin: 2px 0 0; }

.adm-btn-export {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.adm-btn-export:hover:not(:disabled) { background: #EFF6FF; border-color: #054EAF; color: #054EAF; }
.adm-btn-export:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Filters ─────────────────────────────────────────── */
.adm-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.adm-filter-search { position: relative; flex: 1; min-width: 200px; }
.adm-search-icon {
  position: absolute;
  left: 10px; top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
}
.adm-filter-search .adm-input { padding-left: 30px; width: 100%; }

.adm-input {
  height: 36px;
  padding: 0 10px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  background: #fff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  min-width: 0;
}
.adm-input:focus { border-color: #054EAF; }

/* Estado dropdown */
.adm-filter-estados { position: relative; }
.adm-estado-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 260px;
  cursor: pointer;
  user-select: none;
}
.adm-placeholder { color: #94A3B8; font-size: 13px; }
.adm-estado-pills { display: flex; align-items: center; gap: 4px; flex: 1; overflow: hidden; }
.adm-mini-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  white-space: nowrap;
}
.adm-mini-more { background: #F1F5F9; color: #64748B; }

.adm-estado-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 200;
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(5,78,175,.12);
  width: 260px;
  max-height: 360px;
  overflow-y: auto;
  padding: 6px;
}
.adm-estado-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
}
.adm-estado-opt:hover { background: #F8FAFC; }
.adm-estado-opt.selected { background: #EBF3FC; }
.adm-estado-check {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #054EAF;
}
.adm-estado-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
}
.adm-clear-btn {
  width: 100%;
  margin-top: 4px;
  padding: 6px;
  border: none;
  background: none;
  color: #EF4444;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px;
}
.adm-clear-btn:hover { background: #FEF2F2; }

/* ── Table wrap ──────────────────────────────────────── */
.adm-table-wrap {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  overflow: hidden;
}
.adm-scroll { overflow-x: auto; }

.adm-skeleton { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.adm-sk-row {
  height: 40px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 400% 100%;
  border-radius: 8px;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }

.adm-error {
  display: flex; align-items: center; gap: 10px;
  padding: 20px; color: #DC2626; font-size: 13px;
}
.adm-error button { padding: 4px 12px; border: 1px solid #DC2626; border-radius: 6px; background: none; color: #DC2626; cursor: pointer; font-size: 12px; }

.adm-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px; color: #94A3B8; font-size: 14px;
}

/* ── Table ───────────────────────────────────────────── */
.adm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.adm-th {
  padding: 12px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: #F8FAFC;
  border-bottom: 1.5px solid #E2E8F0;
  white-space: nowrap;
}
.adm-th.sortable { cursor: pointer; user-select: none; }
.adm-th.sortable:hover { color: #054EAF; }

.adm-tr {
  border-bottom: 1px solid #F1F5F9;
  transition: background 0.1s;
}
.adm-tr:last-child { border-bottom: none; }
.adm-tr:hover { background: #F8FAFC; }

.adm-td { padding: 10px 14px; color: #374151; vertical-align: middle; }
.adm-num  { font-weight: 600; color: #054EAF; white-space: nowrap; }
.adm-date { white-space: nowrap; color: #64748B; }
.adm-desc { max-width: 220px; }
.adm-money { font-weight: 600; color: #0F172A; white-space: nowrap; }
.adm-notes { max-width: 180px; }
.adm-notes-text { font-size: 12px; color: #64748B; }
.adm-no-notes { color: #CBD5E1; }

.adm-cliente-name { font-weight: 500; }

/* Cotización status badges */
.adm-cot-status {
  font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 6px;
  white-space: nowrap;
}
.cot-aprobada   { background: #F0FDF4; color: #166534; }
.cot-en-proceso { background: #EFF6FF; color: #1D4ED8; }
.cot-vencida    { background: #FEFCE8; color: #854D0E; }
.cot-cancelada  { background: #FEF2F2; color: #991B1B; }
.cot-default    { background: #F1F5F9; color: #64748B; }

/* Inline edit */
.adm-estado-cell { min-width: 150px; }
.adm-inline-wrap { min-width: 150px; }
.adm-inline-select {
  width: 100%;
  padding: 4px 8px;
  border: 1.5px solid #054EAF;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  outline: none;
}
.adm-estado-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: filter 0.1s;
}
.adm-estado-btn:hover { filter: brightness(0.96); }
.adm-pencil { opacity: 0.6; }
.adm-saving-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: blink 0.8s infinite alternate;
}
@keyframes blink { from { opacity: 1 } to { opacity: 0.2 } }

/* ── Pagination ──────────────────────────────────────── */
.adm-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1.5px solid #E2E8F0;
}
.adm-pag-info { font-size: 12px; color: #64748B; }
.adm-pag-btns { display: flex; gap: 4px; }
.adm-pag-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: #374151;
  transition: all 0.15s;
}
.adm-pag-btn:hover:not(:disabled) { border-color: #054EAF; color: #054EAF; }
.adm-pag-btn.active { background: #054EAF; color: #fff; border-color: #054EAF; }
.adm-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
