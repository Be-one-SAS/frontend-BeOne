<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatCOP as _fmt } from '@/utils/currency.js'
import { getThirdPartyCatalog, updateThirdPartyCatalog } from '@/services/products.service'
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import SelectLabel from '@/components/input/SelectLabel.vue'
import {
  Search, RefreshCw, ChevronUp, ChevronDown, Inbox,
  Pencil, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-vue-next'

/* ─── state ─────────────────────────────────────────────── */
const products = ref([])
const loading  = ref(false)

const search      = ref('')
const categFilter = ref('')
const condFilter  = ref('')
const pageSize    = ref(25)

const conditionOptions = [
  { value: 'OPERATIVO_OK',      label: 'Operativo OK'      },
  { value: 'OPERATIVO_70',      label: 'Operativo 70%'     },
  { value: 'OPERATIVO_50',      label: 'Operativo 50%'     },
  { value: 'EN_MANTENIMIENTO',  label: 'En mantenimiento'  },
  { value: 'DEFECTUOSO',        label: 'Defectuoso'        },
  { value: 'NO_ACTIVO',         label: 'No activo'         },
]

const sortKey = ref('dispositivo')
const sortDir = ref('asc')

const expandedRow = ref(null)
const toggleRow   = (id) => { expandedRow.value = expandedRow.value === id ? null : id }

const deleteModal     = ref(false)
const productToDelete = ref(null)

// modal editar
const editModal   = ref(false)
const editLoading = ref(false)
const editError   = ref('')
const editForm    = ref({
  dispositivo:             '',
  nombre:                  '',
  categoria:               '',
  bodega:                  '',
  conditionStatus:         '',
  availabilityStatus:      '',
  valorBase:               null,
  amperios:                null,
  medidas:                 '',
  qMotores:                null,
  qOperarios:              null,
  m2Dispositivo:           null,
  pesoAproxDisp:           null,
  m3Transporte:            null,
  qHorasOperacion:         null,
  qHorasMontaje:           null,
  qPersonalMontaje:        null,
  anioDispositivo:         null,
  montacarga:              '',
  qPesosEstacas:           null,
  qExtintores:             null,
  incluyeTransporteBogMde: '',
  descripcion:             '',
  notas:                   '',
})
const productToEdit = ref(null)

/* ─── options ────────────────────────────────────────────── */
const categorias = computed(() => {
  const set = new Set(products.value.map(p => p.categoria).filter(Boolean))
  return [...set].sort()
})

/* ─── badge helpers ──────────────────────────────────────── */
const condClass = (val) => ({
  OPERATIVO_OK:     'badge badge--green',
  OPERATIVO_70:     'badge badge--yellow',
  OPERATIVO_50:     'badge badge--orange',
  EN_MANTENIMIENTO: 'badge badge--blue',
  DEFECTUOSO:       'badge badge--red',
  NO_ACTIVO:        'badge badge--slate',
}[val] || 'badge badge--slate')

const condLabel = (val) => ({
  OPERATIVO_OK:     'Operativo OK',
  OPERATIVO_70:     'Operativo 70%',
  OPERATIVO_50:     'Operativo 50%',
  EN_MANTENIMIENTO: 'En mantenimiento',
  DEFECTUOSO:       'Defectuoso',
  NO_ACTIVO:        'No activo',
}[val] || val || '—')

const availClass = (val) => ({
  DISPONIBLE:    'badge badge--green',
  EN_RESERVA:    'badge badge--yellow',
  NO_DISPONIBLE: 'badge badge--red',
}[val] || 'badge badge--slate')

const availLabel = (val) => ({
  DISPONIBLE:    'Disponible',
  EN_RESERVA:    'En reserva',
  NO_DISPONIBLE: 'No disponible',
}[val] || val || '—')

/* ─── filter + sort ──────────────────────────────────────── */
const filteredSorted = computed(() => {
  const q = search.value.toLowerCase()
  let list = products.value.filter(p => {
    const matchSearch = !q ||
      (p.dispositivo?.toLowerCase().includes(q)) ||
      (p.descripcion?.toLowerCase().includes(q)) ||
      (p.categoria?.toLowerCase().includes(q))
    const matchCateg = !categFilter.value || p.categoria === categFilter.value
    const matchCond  = !condFilter.value  || p.conditionStatus === condFilter.value
    return matchSearch && matchCateg && matchCond
  })

  if (sortKey.value) {
    const dir = sortDir.value === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const av = (a[sortKey.value] ?? '').toString().toLowerCase()
      const bv = (b[sortKey.value] ?? '').toString().toLowerCase()
      return av < bv ? -dir : av > bv ? dir : 0
    })
  }

  return list
})

/* ─── pagination ─────────────────────────────────────────── */
const currentPage = ref(1)
watch(filteredSorted, () => { currentPage.value = 1 })

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * Number(pageSize.value)
  return filteredSorted.value.slice(start, start + Number(pageSize.value))
})

const totalPages = computed(() => Math.ceil(filteredSorted.value.length / Number(pageSize.value)))

const visiblePages = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (cur <= 4)            pages.push(1, 2, 3, 4, 5, '...', total)
  else if (cur >= total-3) pages.push(1, '...', total-4, total-3, total-2, total-1, total)
  else                     pages.push(1, '...', cur-1, cur, cur+1, '...', total)
  return pages
})

/* ─── sort toggle ────────────────────────────────────────── */
const sortBy = (key) => {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

/* ─── currency format ────────────────────────────────────── */
const formatCOP = (val) => val != null ? _fmt(val) : '—'

/* ─── fetch ──────────────────────────────────────────────── */
async function fetchProducts() {
  loading.value = true
  try {
    const res = await getThirdPartyCatalog()
    products.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function reset() {
  search.value = ''
  categFilter.value = ''
  condFilter.value = ''
  fetchProducts()
}

/* ─── delete ─────────────────────────────────────────────── */
function confirmDelete(product) {
  productToDelete.value = product
  deleteModal.value = true
}
function executeDelete() {
  products.value = products.value.filter(p => p.id !== productToDelete.value.id)
  deleteModal.value = false
  productToDelete.value = null
}

/* ─── editar producto ────────────────────────────────────── */
function openEdit(product) {
  productToEdit.value = product
  editError.value     = ''
  Object.keys(editForm.value).forEach(k => {
    editForm.value[k] = product[k] ?? (typeof editForm.value[k] === 'string' ? '' : null)
  })
  editModal.value = true
}

async function saveEdit() {
  if (!editForm.value.dispositivo?.trim()) {
    editError.value = 'El nombre del dispositivo es obligatorio.'
    return
  }
  editLoading.value = true
  editError.value   = ''
  try {
    const res = await updateThirdPartyCatalog(productToEdit.value.id, editForm.value)
    const updated = res.data
    const idx = products.value.findIndex(p => p.id === productToEdit.value.id)
    if (idx !== -1) products.value[idx] = { ...products.value[idx], ...updated }
    editModal.value = false
  } catch (e) {
    editError.value = e?.response?.data?.message || 'Error al guardar. Intenta de nuevo.'
  } finally {
    editLoading.value = false
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="np-page">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="np-title">Productos de Terceros</h2>
        <p class="np-subtitle">{{ filteredSorted.length }} productos encontrados</p>
      </div>
      <div class="np-head-actions">
        <div class="per-page-wrap">
          <span class="per-page-lbl">Por página</span>
          <select v-model="pageSize" class="np-input np-input--sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
        <button class="btn-reload" @click="reset">
          <RefreshCw :size="13" /> Recargar
        </button>
      </div>
    </div>

    <!-- ── Filters ────────────────────────────────────────── -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(39,200,216,.06)] grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="search-field">
        <Search :size="14" class="s-ico" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar dispositivo, descripción, categoría…"
          class="np-input"
          style="padding-left:34px"
        />
      </div>

      <select v-model="categFilter" class="np-input">
        <option value="">Todas las categorías</option>
        <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
      </select>

      <select v-model="condFilter" class="np-input">
        <option value="">Todas las condiciones</option>
        <option v-for="c in conditionOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <!-- ── Tabla ──────────────────────────────────────────── -->
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(39,200,216,.06),_0_4px_16px_rgba(39,200,216,.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="np-table">

          <thead>
            <tr class="np-head-row">
              <th class="np-th" style="width:36px"></th>
              <th class="np-th np-th-center" style="width:44px">#</th>
              <th class="np-th np-th-sort" @click="sortBy('dispositivo')">
                Dispositivo
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey==='dispositivo'&&sortDir==='asc'  ?'sort-active':'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey==='dispositivo'&&sortDir==='desc' ?'sort-active':'sort-dim'" />
                </span>
              </th>
              <th class="np-th np-th-sort" @click="sortBy('categoria')">
                Categoría
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey==='categoria'&&sortDir==='asc'  ?'sort-active':'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey==='categoria'&&sortDir==='desc' ?'sort-active':'sort-dim'" />
                </span>
              </th>
              <th class="np-th np-th-sort" @click="sortBy('bodega')">
                Bodega
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey==='bodega'&&sortDir==='asc'  ?'sort-active':'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey==='bodega'&&sortDir==='desc' ?'sort-active':'sort-dim'" />
                </span>
              </th>
              <th class="np-th np-th-sort" @click="sortBy('conditionStatus')">
                Condición
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey==='conditionStatus'&&sortDir==='asc'  ?'sort-active':'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey==='conditionStatus'&&sortDir==='desc' ?'sort-active':'sort-dim'" />
                </span>
              </th>
              <th class="np-th">Disponibilidad</th>
              <th class="np-th np-th-sort" @click="sortBy('valorBase')">
                Valor Base
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey==='valorBase'&&sortDir==='asc'  ?'sort-active':'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey==='valorBase'&&sortDir==='desc' ?'sort-active':'sort-dim'" />
                </span>
              </th>
              <th class="np-th" style="width:120px">Acciones</th>
            </tr>
          </thead>

          <tbody>

            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="n in 5" :key="`sk-${n}`" class="np-row">
                <td class="np-td"></td>
                <td class="np-td"><div class="sk-box" style="width:30px"></div></td>
                <td class="np-td"><div class="sk-box" style="width:140px"></div></td>
                <td class="np-td"><div class="sk-box" style="width:90px"></div></td>
                <td class="np-td"><div class="sk-box" style="width:80px"></div></td>
                <td class="np-td"><div class="sk-box" style="width:100px"></div></td>
                <td class="np-td"><div class="sk-box" style="width:90px"></div></td>
                <td class="np-td"><div class="sk-box" style="width:80px"></div></td>
                <td class="np-td"><div class="sk-box" style="width:60px"></div></td>
              </tr>
            </template>

            <!-- Filas reales -->
            <template v-else>
              <template v-for="(row, index) in pagedRows" :key="row.id">

                <!-- Fila principal -->
                <tr class="np-row" @click="toggleRow(row.id)">

                  <td class="np-td np-td-center">
                    <ChevronDown
                      :size="14"
                      class="np-chevron"
                      :class="{ 'np-chevron-open': expandedRow === row.id }"
                    />
                  </td>

                  <td class="np-td np-td-center np-idx">
                    {{ index + 1 + (currentPage - 1) * Number(pageSize) }}
                  </td>

                  <td class="np-td">
                    <div class="np-disp-cell">
                      <span class="np-disp-name">{{ row.dispositivo || '—' }}</span>
                      <span v-if="row.nombre" class="np-disp-sub">{{ row.nombre }}</span>
                    </div>
                  </td>

                  <td class="np-td">
                    <span class="np-categ">{{ row.categoria || '—' }}</span>
                  </td>

                  <td class="np-td">
                    <span class="np-bodega">{{ row.bodega || '—' }}</span>
                  </td>

                  <td class="np-td">
                    <span :class="condClass(row.conditionStatus)">{{ condLabel(row.conditionStatus) }}</span>
                  </td>

                  <td class="np-td">
                    <span :class="availClass(row.availabilityStatus)">{{ availLabel(row.availabilityStatus) }}</span>
                  </td>

                  <td class="np-td">
                    <span class="np-price">{{ formatCOP(row.valorBase) }}</span>
                  </td>

                  <td class="np-td" @click.stop>
                    <div class="np-actions">
                      <button class="act-btn act-edit" title="Editar" @click.stop="openEdit(row)">
                        <Pencil :size="12" />
                      </button>
                      <button class="act-btn act-del" title="Eliminar" @click.stop="confirmDelete(row)">
                        <Trash2 :size="12" />
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Fila expandida -->
                <tr class="np-exp-tr">
                  <td colspan="9" class="np-exp-td" style="padding:0!important">
                    <div class="np-exp-panel" :class="{ 'np-exp-open': expandedRow === row.id }">
                      <div class="np-exp-inner">
                        <div class="np-exp-grid">

                          <div class="np-exp-field">
                            <span class="np-exp-label">Amperios</span>
                            <span class="np-exp-val">{{ row.amperios ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Medidas</span>
                            <span class="np-exp-val">{{ row.medidas || '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Motores</span>
                            <span class="np-exp-val">{{ row.qMotores ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Operarios</span>
                            <span class="np-exp-val">{{ row.qOperarios ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">m²</span>
                            <span class="np-exp-val">{{ row.m2Dispositivo ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Peso (kg)</span>
                            <span class="np-exp-val">{{ row.pesoAproxDisp ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">m³ Transporte</span>
                            <span class="np-exp-val">{{ row.m3Transporte ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Horas Operación</span>
                            <span class="np-exp-val">{{ row.qHorasOperacion ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Horas Montaje</span>
                            <span class="np-exp-val">{{ row.qHorasMontaje ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Personal Montaje</span>
                            <span class="np-exp-val">{{ row.qPersonalMontaje ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Año</span>
                            <span class="np-exp-val">{{ row.anioDispositivo ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Montacarga</span>
                            <span class="np-exp-val">{{ row.montacarga || '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Pesos Estacas</span>
                            <span class="np-exp-val">{{ row.qPesosEstacas ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field">
                            <span class="np-exp-label">Extintores</span>
                            <span class="np-exp-val">{{ row.qExtintores ?? '—' }}</span>
                          </div>
                          <div class="np-exp-field np-exp-field--wide">
                            <span class="np-exp-label">Incluye Transporte</span>
                            <span class="np-exp-val">{{ row.incluyeTransporteBogMde || '—' }}</span>
                          </div>
                          <div class="np-exp-field np-exp-field--wide">
                            <span class="np-exp-label">Descripción</span>
                            <span class="np-exp-val">{{ row.descripcion || '—' }}</span>
                          </div>
                          <div class="np-exp-field np-exp-field--wide">
                            <span class="np-exp-label">Notas</span>
                            <span class="np-exp-val">{{ row.notas || '—' }}</span>
                          </div>

                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

              </template>
            </template>

          </tbody>
        </table>
      </div>

      <!-- Estado vacío -->
      <div v-if="!loading && pagedRows.length === 0" class="py-16 flex flex-col items-center gap-3 text-text-3">
        <Inbox class="w-10 h-10 opacity-40" />
        <p class="text-[14px]">No se encontraron productos de terceros</p>
      </div>

      <!-- Paginación -->
      <div v-if="!loading && filteredSorted.length > 0" class="np-pagination">
        <span class="pg-info">
          {{ (currentPage - 1) * Number(pageSize) + 1 }}–{{ Math.min(currentPage * Number(pageSize), filteredSorted.length) }}
          de {{ filteredSorted.length }}
        </span>
        <div class="pg-pages">
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage = 1"><ChevronsLeft :size="14" /></button>
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft :size="14" /></button>
          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="pg-ellipsis">…</span>
            <button v-else class="pg-btn pg-num" :class="{ 'pg-active': p === currentPage }" @click="currentPage = p">{{ p }}</button>
          </template>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight :size="14" /></button>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages"><ChevronsRight :size="14" /></button>
        </div>
      </div>
    </div>

    <!-- ── MODAL: Editar producto ────────────────────────── -->
    <ModalReutilizable :show="editModal" @close="editModal = false">
      <div class="edit-modal-wrap">
        <h2 class="modal-title mb-1">Editar producto de terceros</h2>
        <p class="edit-modal-sub">{{ productToEdit?.dispositivo }}</p>

        <div v-if="editError" class="edit-error">{{ editError }}</div>

        <div class="edit-form-grid">

          <p class="edit-section-label" style="grid-column: 1/-1">Identificación</p>

          <div class="edit-field">
            <label class="edit-label">Dispositivo *</label>
            <input v-model="editForm.dispositivo" class="edit-input" placeholder="Nombre del dispositivo" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Nombre interno</label>
            <input v-model="editForm.nombre" class="edit-input" placeholder="Nombre interno" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Categoría</label>
            <SelectLabel
              class="edit-select"
              v-model="editForm.categoria"
              :options="categorias"
              :creatable="true"
              placeholder="Selecciona o crea una categoría"
              search-placeholder="Buscar o crear categoría…"
            />
          </div>
          <div class="edit-field">
            <label class="edit-label">Bodega</label>
            <input v-model="editForm.bodega" class="edit-input" placeholder="Bodega" />
          </div>

          <p class="edit-section-label" style="grid-column: 1/-1">Estado y precio</p>

          <div class="edit-field">
            <label class="edit-label">Condición</label>
            <select v-model="editForm.conditionStatus" class="edit-input">
              <option value="">— Seleccionar —</option>
              <option value="OPERATIVO_OK">Operativo OK</option>
              <option value="OPERATIVO_70">Operativo 70%</option>
              <option value="OPERATIVO_50">Operativo 50%</option>
              <option value="EN_MANTENIMIENTO">En mantenimiento</option>
              <option value="DEFECTUOSO">Defectuoso</option>
              <option value="NO_ACTIVO">No activo</option>
            </select>
          </div>
          <div class="edit-field">
            <label class="edit-label">Disponibilidad</label>
            <select v-model="editForm.availabilityStatus" class="edit-input">
              <option value="">— Seleccionar —</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_RESERVA">En reserva</option>
              <option value="NO_DISPONIBLE">No disponible</option>
            </select>
          </div>
          <div class="edit-field">
            <label class="edit-label">Valor base (COP)</label>
            <input v-model.number="editForm.valorBase" type="number" step="1000" class="edit-input" placeholder="0" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Año del dispositivo</label>
            <input v-model.number="editForm.anioDispositivo" type="number" class="edit-input" placeholder="Ej: 2020" />
          </div>

          <p class="edit-section-label" style="grid-column: 1/-1">Especificaciones técnicas</p>

          <div class="edit-field">
            <label class="edit-label">Amperios</label>
            <input v-model.number="editForm.amperios" type="number" class="edit-input" placeholder="A" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Medidas</label>
            <input v-model="editForm.medidas" class="edit-input" placeholder="Ej: 2x1x1 m" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Motores</label>
            <input v-model.number="editForm.qMotores" type="number" class="edit-input" placeholder="Cantidad" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Operarios</label>
            <input v-model.number="editForm.qOperarios" type="number" class="edit-input" placeholder="Cantidad" />
          </div>
          <div class="edit-field">
            <label class="edit-label">m²</label>
            <input v-model.number="editForm.m2Dispositivo" type="number" step="0.01" class="edit-input" placeholder="m²" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Peso aprox. (kg)</label>
            <input v-model.number="editForm.pesoAproxDisp" type="number" step="0.1" class="edit-input" placeholder="kg" />
          </div>
          <div class="edit-field">
            <label class="edit-label">m³ Transporte</label>
            <input v-model.number="editForm.m3Transporte" type="number" step="0.01" class="edit-input" placeholder="m³" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Pesos / Estacas</label>
            <input v-model.number="editForm.qPesosEstacas" type="number" class="edit-input" placeholder="Cantidad" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Extintores</label>
            <input v-model.number="editForm.qExtintores" type="number" class="edit-input" placeholder="Cantidad" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Montacarga</label>
            <input v-model="editForm.montacarga" class="edit-input" placeholder="Tipo de montacarga" />
          </div>

          <p class="edit-section-label" style="grid-column: 1/-1">Operación y montaje</p>

          <div class="edit-field">
            <label class="edit-label">Horas de operación</label>
            <input v-model.number="editForm.qHorasOperacion" type="number" step="0.5" class="edit-input" placeholder="h" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Horas de montaje</label>
            <input v-model.number="editForm.qHorasMontaje" type="number" step="0.5" class="edit-input" placeholder="h" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Personal de montaje</label>
            <input v-model.number="editForm.qPersonalMontaje" type="number" class="edit-input" placeholder="Cantidad" />
          </div>
          <div class="edit-field" style="grid-column: span 2">
            <label class="edit-label">Incluye transporte BOG/MDE</label>
            <input v-model="editForm.incluyeTransporteBogMde" class="edit-input" placeholder="Ej: Sí, No, Consultar…" />
          </div>

          <p class="edit-section-label" style="grid-column: 1/-1">Descripción y notas</p>

          <div class="edit-field" style="grid-column: 1/-1">
            <label class="edit-label">Descripción</label>
            <textarea v-model="editForm.descripcion" class="edit-input edit-textarea" rows="3" placeholder="Descripción del producto…"></textarea>
          </div>
          <div class="edit-field" style="grid-column: 1/-1">
            <label class="edit-label">Notas</label>
            <textarea v-model="editForm.notas" class="edit-input edit-textarea" rows="2" placeholder="Notas internas…"></textarea>
          </div>

        </div>

        <div class="edit-footer">
          <button @click="editModal = false" class="btn-cancel" :disabled="editLoading">Cancelar</button>
          <button @click="saveEdit" class="btn-save" :disabled="editLoading">
            <span v-if="editLoading" class="edit-spinner"></span>
            {{ editLoading ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </ModalReutilizable>

    <!-- ── MODAL: Confirmar eliminación ──────────────────── -->
    <ModalReutilizable :show="deleteModal" @close="deleteModal = false">
      <div class="text-center p-2">
        <div class="flex justify-center mb-4">
          <div class="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <Trash2 :size="22" class="text-[#B91C1C]" />
          </div>
        </div>
        <h2 class="modal-title text-center">Eliminar producto</h2>
        <p class="text-[13px] text-[#64748B] mt-2 mb-6 leading-relaxed">
          ¿Estás seguro de que deseas eliminar
          <strong>{{ productToDelete?.dispositivo }}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div class="flex justify-center gap-3">
          <button
            @click="deleteModal = false"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E5EAF0] rounded-[8px] hover:bg-[#E5EAF0] transition"
          >Cancelar</button>
          <button
            @click="executeDelete"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#B91C1C] text-white rounded-[8px] hover:bg-[#991B1B] transition flex items-center gap-2"
          >
            <Trash2 :size="14" /> Eliminar
          </button>
        </div>
      </div>
    </ModalReutilizable>

  </div>
</template>

<style scoped>
.np-page { width: 100%; }

/* ─── Header ────────────────────────────────────────────── */
.np-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 4px;
  line-height: 1.2;
}
.np-subtitle {
  font-size: 13px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}
.np-head-actions { display: flex; align-items: center; gap: 8px; }

.btn-reload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: #F8FAFC;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-reload:hover { background: #E2EBF6; }

.per-page-wrap { display: flex; align-items: center; gap: 8px; }
.per-page-lbl  { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; white-space: nowrap; }

/* ─── Search field ──────────────────────────────────────── */
.search-field { position: relative; }
.s-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}

/* ─── Inputs ────────────────────────────────────────────── */
.np-input {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  appearance: auto;
}
.np-input:focus {
  border-color: #27C8D8;
  box-shadow: 0 0 0 3px rgba(39,200,216,0.1);
}
.np-input::placeholder { color: #94A3B8; }
.np-input--sm { width: 70px; text-align: center; }

/* ─── Tabla ─────────────────────────────────────────────── */
.np-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

.np-head-row { background: #F0FAFB; }

.np-th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #E2EBF6;
}
.np-th-center { text-align: center; }
.np-th-sort { cursor: pointer; user-select: none; transition: color 0.12s; }
.np-th-sort:hover { color: #27C8D8; }

.sort-icons {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin-left: 4px;
  vertical-align: middle;
  gap: 0;
  line-height: 0;
}
.sort-active { color: #27C8D8; }
.sort-dim    { color: #CBD5E1; }

/* ─── Filas ─────────────────────────────────────────────── */
.np-row {
  background: #FFFFFF;
  cursor: pointer;
  transition: background 0.15s ease;
}
.np-row:hover { background: #F0F7FF; }

.np-td {
  padding: 14px 16px;
  font-size: 13px;
  color: #0F1A2E;
  border-bottom: 1px solid #F0FAFB;
  vertical-align: middle;
  white-space: nowrap;
}
.np-td-center { text-align: center; }
.np-idx { font-size: 12px; color: #94A3B8; font-weight: 500; }

/* ─── Chevron ────────────────────────────────────────────── */
.np-chevron {
  color: #94A3B8;
  transition: transform 0.2s ease, color 0.15s ease;
  display: block;
  margin: 0 auto;
}
.np-chevron-open { transform: rotate(180deg); color: #27C8D8; }

/* ─── Cell: dispositivo ──────────────────────────────────── */
.np-disp-cell { display: flex; flex-direction: column; gap: 2px; }
.np-disp-name { font-weight: 600; font-size: 13px; color: #0F1A2E; }
.np-disp-sub  { font-size: 11px; color: #94A3B8; }

.np-categ  { font-size: 13px; color: #64748B; }
.np-bodega { font-size: 13px; color: #64748B; }
.np-price  { font-size: 13px; font-weight: 600; color: #16A34A; font-family: 'Inter', sans-serif; }

/* ─── Badges ─────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
.badge--green  { background: #DCFCE7; color: #16A34A; }
.badge--yellow { background: #FEF3C7; color: #B45309; }
.badge--orange { background: #FFEDD5; color: #C2410C; }
.badge--blue   { background: #CCEFF2; color: #27C8D8; }
.badge--red    { background: #FEE2E2; color: #B91C1C; }
.badge--slate  { background: #F1F5F9; color: #64748B; }

/* ─── Acciones ───────────────────────────────────────────── */
.np-actions { display: flex; align-items: center; gap: 6px; }

.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
  line-height: 1;
}
.act-edit       { background: #FEF3C7; color: #B45309; }
.act-edit:hover { background: #FDE68A; }
.act-del        { background: #FEE2E2; color: #B91C1C; }
.act-del:hover  { background: #FECACA; }

/* ─── Fila expandida ─────────────────────────────────────── */
.np-exp-td { padding: 0 !important; border-bottom: 1px solid #F0FAFB; }

.np-exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}
.np-exp-open { max-height: 600px; }

.np-exp-inner {
  background: #F8FBFF;
  border-left: 3px solid #27C8D8;
  padding: 16px 24px;
}

.np-exp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
}
@media (max-width: 768px) { .np-exp-grid { grid-template-columns: repeat(2, 1fr); } }

.np-exp-field { display: flex; flex-direction: column; gap: 4px; }
.np-exp-field--wide { grid-column: span 2; }

.np-exp-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}
.np-exp-val {
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  white-space: normal;
  word-break: break-word;
}

/* ─── Skeleton ───────────────────────────────────────────── */
.sk-box {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Paginación ─────────────────────────────────────────── */
.np-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #F0FAFB;
  flex-wrap: wrap;
  gap: 8px;
}
.pg-info { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; }
.pg-pages { display: flex; align-items: center; gap: 4px; }
.pg-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: #FFFFFF;
  color: #64748B;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
}
.pg-btn:hover:not(:disabled) { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-active { background: #27C8D8 !important; color: #FFFFFF !important; border-color: #27C8D8 !important; font-weight: 600; }
.pg-ellipsis { color: #94A3B8; font-size: 13px; padding: 0 4px; }

/* ─── Modal title ────────────────────────────────────────── */
.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}

/* ─── Edit modal ─────────────────────────────────────────── */
.edit-modal-wrap { display: flex; flex-direction: column; gap: 16px; }

.edit-modal-sub {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin: -10px 0 0;
}

.edit-error {
  background: #FEE2E2;
  color: #B91C1C;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}

.edit-form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 16px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}
@media (max-width: 768px) { .edit-form-grid { grid-template-columns: repeat(2, 1fr); } }

.edit-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #27C8D8;
  font-family: 'Inter', sans-serif;
  padding: 6px 0 2px;
  border-bottom: 1px solid #F0FAFB;
  margin-bottom: 2px;
}

.edit-field { display: flex; flex-direction: column; gap: 5px; }

.edit-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: 'Inter', sans-serif;
}

.edit-input {
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: auto;
}
.edit-input:focus {
  border-color: #27C8D8;
  box-shadow: 0 0 0 3px rgba(39,200,216,.1);
}
.edit-input::placeholder { color: #94A3B8; }

/* ── Categoría (SelectLabel) para que combine con el resto del formulario ── */
.edit-select :deep(.sl-trigger) {
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
}
.edit-select :deep(.sl-trigger--open),
.edit-select :deep(.sl-trigger:focus-visible) {
  border-color: #27C8D8;
  box-shadow: 0 0 0 3px rgba(39,200,216,.1);
}
.edit-select :deep(.sl-trigger-placeholder) { color: #94A3B8; }

.edit-textarea {
  resize: vertical;
  border-radius: 8px;
  min-height: 60px;
}

.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid #F0FAFB;
}

.btn-cancel {
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: #F1F5F9;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel:hover:not(:disabled) { background: #E2EBF6; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 22px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #27C8D8;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(39,200,216,.25);
  transition: background 0.15s;
}
.btn-save:hover:not(:disabled) { background: #1BAEBB; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.edit-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
