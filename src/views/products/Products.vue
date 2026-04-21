<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getProducts, getByName } from '@/services/products.service'
import { getBox }                  from '@/services/suppliers.service'
import ModalReutilizable           from '@/components/modal/ModalReutilizable.vue'
import {
  RefreshCw, ChevronUp, ChevronDown, Inbox,
  Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-vue-next'

/* ─── state ─────────────────────────────────────────────── */
const products       = ref([])
const boxOptions     = ref([])
const loading        = ref(false)

const search         = ref('')
const categFilter    = ref('')
const condFilter     = ref('')
const selectedBox    = ref('')
const pageSize       = ref(25)

const isFiltering    = ref(false)
const filteredByName = ref([])

// sort
const sortKey = ref('dispositivo')
const sortDir = ref('asc')

// accordion
const expandedRow = ref(null)
const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

// modal precios
const isModalOpen     = ref(false)
const selectedProduct = ref(null)
const modalPrices     = ref([])

// modal delete
const deleteModal     = ref(false)
const productToDelete = ref(null)

/* ─── options lists ─────────────────────────────────────── */
const categorias = computed(() => {
  const set = new Set(products.value.map(p => p.categoria).filter(Boolean))
  return [...set].sort()
})

const conditionOptions = [
  { value: 'OPERATIVO_OK',      label: 'Operativo OK'      },
  { value: 'OPERATIVO_70',      label: 'Operativo 70%'     },
  { value: 'OPERATIVO_50',      label: 'Operativo 50%'     },
  { value: 'EN_MANTENIMIENTO',  label: 'En mantenimiento'  },
  { value: 'DEFECTUOSO',        label: 'Defectuoso'        },
  { value: 'NO_ACTIVO',         label: 'No activo'         },
]

/* ─── filter + sort ─────────────────────────────────────── */
const filteredSorted = computed(() => {
  const q = search.value.toLowerCase()
  let list = products.value.filter(p => {
    const matchSearch = !q ||
      (p.dispositivo?.toLowerCase().includes(q)) ||
      (p.categoria?.toLowerCase().includes(q))   ||
      (p.bodega?.toLowerCase().includes(q))
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

/* ─── pagination ────────────────────────────────────────── */
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
  if (cur <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total)
  } else if (cur >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', cur - 1, cur, cur + 1, '...', total)
  }
  return pages
})

/* ─── sort toggle ───────────────────────────────────────── */
const sortBy = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

/* ─── badge helpers ─────────────────────────────────────── */
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

/* ─── fetch ─────────────────────────────────────────────── */
async function fetchProducts() {
  loading.value = true
  try {
    const res      = await getProducts()
    products.value = res.data || []

    const resBoxes   = await getBox()
    boxOptions.value = (resBoxes.data?.[1] || []).map(b => ({ id: b.id, name: b.boxName }))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleBoxFilter() {
  if (!selectedBox.value) { isFiltering.value = false; return }
  const res = await getByName(selectedBox.value)
  filteredByName.value = res.data || []
  isFiltering.value = true
}

function resetTables() {
  selectedBox.value = ''
  isFiltering.value = false
  search.value      = ''
  categFilter.value = ''
  condFilter.value  = ''
  fetchProducts()
}

async function saveFilteredPrices() {
  alert('Precios filtrados actualizados')
}

/* ─── modal precios ─────────────────────────────────────── */
function openModal(product) {
  selectedProduct.value = product
  modalPrices.value = (product.productBoxes || []).map(b => ({
    id: b.id, boxName: b.boxName, price: b.price,
  }))
  isModalOpen.value = true
}

async function saveModalPrices() {
  alert('Precios actualizados correctamente (modal)')
  isModalOpen.value = false
}

/* ─── delete ────────────────────────────────────────────── */
function confirmDelete(product) {
  productToDelete.value = product
  deleteModal.value = true
}
function executeDelete() {
  products.value = products.value.filter(p => p.id !== productToDelete.value.id)
  deleteModal.value     = false
  productToDelete.value = null
}

onMounted(fetchProducts)
</script>

<template>
  <div class="pp-page">

    <!-- ══════════════════════════════════════════ -->
    <!-- HEADER                                     -->
    <!-- ══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="pp-title">Productos Propios</h2>
        <p class="pp-subtitle">
          {{ isFiltering ? filteredByName.length : filteredSorted.length }} productos encontrados
        </p>
      </div>
      <div class="pp-head-actions">
        <div class="per-page-wrap">
          <span class="per-page-lbl">Por página</span>
          <select v-model="pageSize" class="pp-input pp-input--sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
        <button class="btn-reload" @click="resetTables">
          <RefreshCw :size="13" /> Recargar
        </button>
        <button v-if="isFiltering" class="btn-save-prices" @click="saveFilteredPrices">
          Guardar cambios
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- FILTROS                                    -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(5,78,175,.06)] grid grid-cols-2 md:grid-cols-4 gap-4">

      <input
        v-model="search"
        type="text"
        placeholder="Buscar dispositivo, categoría…"
        class="pp-input"
      />

      <select v-model="categFilter" class="pp-input">
        <option value="">Todas las categorías</option>
        <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
      </select>

      <select v-model="condFilter" class="pp-input">
        <option value="">Todas las condiciones</option>
        <option v-for="c in conditionOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>

      <select v-model="selectedBox" class="pp-input" @change="handleBoxFilter">
        <option value="">Filtrar por Box</option>
        <option v-for="box in boxOptions" :key="box.id" :value="box.name">{{ box.name }}</option>
      </select>

    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA PRINCIPAL                            -->
    <!-- ══════════════════════════════════════════ -->
    <div v-if="!isFiltering" class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(5,78,175,.06),_0_4px_16px_rgba(5,78,175,.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="pp-table">

          <!-- HEAD -->
          <thead>
            <tr class="pp-head-row">
              <th class="pp-th" style="width:36px"></th>
              <th class="pp-th pp-th-center" style="width:44px">#</th>
              <th class="pp-th pp-th-sort" @click="sortBy('dispositivo')">
                Dispositivo
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey === 'dispositivo' && sortDir === 'asc'  ? 'sort-active' : 'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey === 'dispositivo' && sortDir === 'desc' ? 'sort-active' : 'sort-dim'" />
                </span>
              </th>
              <th class="pp-th pp-th-sort" @click="sortBy('categoria')">
                Categoría
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey === 'categoria' && sortDir === 'asc'  ? 'sort-active' : 'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey === 'categoria' && sortDir === 'desc' ? 'sort-active' : 'sort-dim'" />
                </span>
              </th>
              <th class="pp-th pp-th-sort" @click="sortBy('bodega')">
                Bodega
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey === 'bodega' && sortDir === 'asc'  ? 'sort-active' : 'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey === 'bodega' && sortDir === 'desc' ? 'sort-active' : 'sort-dim'" />
                </span>
              </th>
              <th class="pp-th pp-th-sort" @click="sortBy('conditionStatus')">
                Condición
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey === 'conditionStatus' && sortDir === 'asc'  ? 'sort-active' : 'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey === 'conditionStatus' && sortDir === 'desc' ? 'sort-active' : 'sort-dim'" />
                </span>
              </th>
              <th class="pp-th">Disponibilidad</th>
              <th class="pp-th" style="width:120px">Acciones</th>
            </tr>
          </thead>

          <!-- BODY -->
          <tbody>

            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="n in 5" :key="`sk-${n}`" class="pp-row">
                <td class="pp-td"></td>
                <td class="pp-td"><div class="sk-box" style="width:30px"></div></td>
                <td class="pp-td"><div class="sk-box" style="width:140px"></div></td>
                <td class="pp-td"><div class="sk-box" style="width:90px"></div></td>
                <td class="pp-td"><div class="sk-box" style="width:80px"></div></td>
                <td class="pp-td"><div class="sk-box" style="width:100px"></div></td>
                <td class="pp-td"><div class="sk-box" style="width:90px"></div></td>
                <td class="pp-td"><div class="sk-box" style="width:40px"></div></td>
                <td class="pp-td"><div class="sk-box" style="width:60px"></div></td>
              </tr>
            </template>

            <!-- Filas reales -->
            <template v-else>
              <template v-for="(row, index) in pagedRows" :key="row.id">

                <!-- ── Fila principal ── -->
                <tr class="pp-row" @click="toggleRow(row.id)">

                  <!-- Chevron -->
                  <td class="pp-td pp-td-center">
                    <ChevronDown
                      :size="14"
                      class="pp-chevron"
                      :class="{ 'pp-chevron-open': expandedRow === row.id }"
                    />
                  </td>

                  <!-- # -->
                  <td class="pp-td pp-td-center pp-idx">
                    {{ index + 1 + (currentPage - 1) * Number(pageSize) }}
                  </td>

                  <!-- Dispositivo -->
                  <td class="pp-td">
                    <div class="pp-disp-cell">
                      <span class="pp-disp-name">{{ row.dispositivo || '—' }}</span>
                      <span v-if="row.nombre" class="pp-disp-sub">{{ row.nombre }}</span>
                    </div>
                  </td>

                  <!-- Categoría -->
                  <td class="pp-td">
                    <span class="pp-categ">{{ row.categoria || '—' }}</span>
                  </td>

                  <!-- Bodega -->
                  <td class="pp-td">
                    <span class="pp-bodega">{{ row.bodega || '—' }}</span>
                  </td>

                  <!-- Condición -->
                  <td class="pp-td">
                    <span :class="condClass(row.conditionStatus)">{{ condLabel(row.conditionStatus) }}</span>
                  </td>

                  <!-- Disponibilidad -->
                  <td class="pp-td">
                    <span :class="availClass(row.availabilityStatus)">{{ availLabel(row.availabilityStatus) }}</span>
                  </td>


                  <!-- Acciones — @click.stop evita el toggle -->
                  <td class="pp-td" @click.stop>
                    <div class="pp-actions">
                      <button class="act-btn act-edit" title="Editar">
                        <Pencil :size="12" />
                      </button>
                      <button class="act-btn act-del" title="Eliminar" @click.stop="confirmDelete(row)">
                        <Trash2 :size="12" />
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- ── Fila expandida (siempre en DOM, transición max-height) ── -->
                <tr class="pp-exp-tr">
                  <td colspan="9" class="pp-exp-td">
                    <div
                      class="pp-exp-panel"
                      :class="{ 'pp-exp-open': expandedRow === row.id }"
                    >
                      <div class="pp-exp-inner">
                        <div class="pp-exp-grid">

                          <div v-if="row.amperios != null" class="pp-exp-field">
                            <span class="pp-exp-label">Amperios</span>
                            <span class="pp-exp-val">{{ row.amperios }}</span>
                          </div>
                          <div v-if="row.medidas" class="pp-exp-field">
                            <span class="pp-exp-label">Medidas</span>
                            <span class="pp-exp-val">{{ row.medidas }}</span>
                          </div>
                          <div v-if="row.qMotores != null" class="pp-exp-field">
                            <span class="pp-exp-label">Motores</span>
                            <span class="pp-exp-val">{{ row.qMotores }}</span>
                          </div>
                          <div v-if="row.qOperarios != null" class="pp-exp-field">
                            <span class="pp-exp-label">Operarios</span>
                            <span class="pp-exp-val">{{ row.qOperarios }}</span>
                          </div>
                          <div v-if="row.m2Dispositivo != null" class="pp-exp-field">
                            <span class="pp-exp-label">m²</span>
                            <span class="pp-exp-val">{{ row.m2Dispositivo }}</span>
                          </div>
                          <div v-if="row.pesoAproxDisp != null" class="pp-exp-field">
                            <span class="pp-exp-label">Peso (kg)</span>
                            <span class="pp-exp-val">{{ row.pesoAproxDisp }}</span>
                          </div>
                          <div v-if="row.m3Transporte != null" class="pp-exp-field">
                            <span class="pp-exp-label">m³ Transporte</span>
                            <span class="pp-exp-val">{{ row.m3Transporte }}</span>
                          </div>
                          <div v-if="row.qHorasOperacion != null" class="pp-exp-field">
                            <span class="pp-exp-label">Horas Operación</span>
                            <span class="pp-exp-val">{{ row.qHorasOperacion }}</span>
                          </div>
                          <div v-if="row.qHorasMontaje != null" class="pp-exp-field">
                            <span class="pp-exp-label">Horas Montaje</span>
                            <span class="pp-exp-val">{{ row.qHorasMontaje }}</span>
                          </div>
                          <div v-if="row.qPersonalMontaje != null" class="pp-exp-field">
                            <span class="pp-exp-label">Personal Montaje</span>
                            <span class="pp-exp-val">{{ row.qPersonalMontaje }}</span>
                          </div>
                          <div v-if="row.anioDispositivo != null" class="pp-exp-field">
                            <span class="pp-exp-label">Año</span>
                            <span class="pp-exp-val">{{ row.anioDispositivo }}</span>
                          </div>
                          <div v-if="row.montacarga" class="pp-exp-field">
                            <span class="pp-exp-label">Montacarga</span>
                            <span class="pp-exp-val">{{ row.montacarga }}</span>
                          </div>
                          <div v-if="row.incluyeTransporteBogMde" class="pp-exp-field">
                            <span class="pp-exp-label">Incluye Transporte</span>
                            <span class="pp-exp-val">{{ row.incluyeTransporteBogMde }}</span>
                          </div>
                          <div v-if="row.descripcion" class="pp-exp-field pp-exp-field--wide">
                            <span class="pp-exp-label">Descripción</span>
                            <span class="pp-exp-val">{{ row.descripcion }}</span>
                          </div>
                          <div v-if="row.notas" class="pp-exp-field pp-exp-field--wide">
                            <span class="pp-exp-label">Notas</span>
                            <span class="pp-exp-val">{{ row.notas }}</span>
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
      <div
        v-if="!loading && pagedRows.length === 0"
        class="py-16 flex flex-col items-center gap-3 text-text-3"
      >
        <Inbox class="w-10 h-10 opacity-40" />
        <p class="text-[14px]">No se encontraron productos</p>
      </div>

      <!-- Paginación -->
      <div v-if="!loading && totalPages > 1" class="pp-pagination">
        <span class="pg-info">
          {{ (currentPage - 1) * Number(pageSize) + 1 }}–{{ Math.min(currentPage * Number(pageSize), filteredSorted.length) }}
          de {{ filteredSorted.length }}
        </span>
        <div class="pg-pages">
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage = 1">
            <ChevronsLeft :size="14" />
          </button>
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">
            <ChevronLeft :size="14" />
          </button>
          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="pg-ellipsis">…</span>
            <button
              v-else
              class="pg-btn pg-num"
              :class="{ 'pg-active': p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</button>
          </template>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">
            <ChevronRight :size="14" />
          </button>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">
            <ChevronsRight :size="14" />
          </button>
        </div>
      </div>

    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA FILTRADA POR BOX                     -->
    <!-- ══════════════════════════════════════════ -->
    <div v-if="isFiltering" class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(5,78,175,.06),_0_4px_16px_rgba(5,78,175,.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="pp-table">
          <thead>
            <tr class="pp-head-row">
              <th class="pp-th">ID</th>
              <th class="pp-th">Cliente / Box</th>
              <th class="pp-th">Precio</th>
              <th class="pp-th">Producto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredByName" :key="item.id" class="pp-row">
              <td class="pp-td pp-idx">{{ item.id }}</td>
              <td class="pp-td">{{ item.boxName }}</td>
              <td class="pp-td">
                <input
                  type="number"
                  v-model.number="item.price"
                  class="price-input"
                />
              </td>
              <td class="pp-td">{{ item.product?.dispositivo }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!filteredByName.length" class="py-16 flex flex-col items-center gap-3 text-text-3">
        <Inbox class="w-10 h-10 opacity-40" />
        <p class="text-[14px]">No se encontraron registros para ese box</p>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL: Precios por Box                     -->
    <!-- ══════════════════════════════════════════ -->
    <ModalReutilizable :show="isModalOpen" @close="isModalOpen = false">
      <div>
        <h2 class="modal-title">Precios — {{ selectedProduct?.dispositivo }}</h2>
        <table class="w-full text-sm border border-[#E5EAF0] rounded-[var(--r-lg)] overflow-hidden mt-4">
          <thead class="bg-[#F8FAFC]">
            <tr>
              <th class="border border-[#E5EAF0] px-3 py-2 text-[11px] font-semibold text-[#64748B] uppercase text-left">Caja</th>
              <th class="border border-[#E5EAF0] px-3 py-2 text-[11px] font-semibold text-[#64748B] uppercase text-left">Precio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="box in modalPrices" :key="box.id" class="border-b border-[#F1F5FA] hover:bg-[#F8FAFC]">
              <td class="border border-[#F1F5FA] px-3 py-2 text-[13px] text-[#64748B]">{{ box.boxName }}</td>
              <td class="border border-[#F1F5FA] px-3 py-2">
                <input
                  type="number"
                  v-model.number="box.price"
                  class="bg-[#F8FAFC] border border-[#E5EAF0] rounded-full px-3 py-1 text-[13px] text-[#0F1A2E] w-full focus:outline-none focus:ring-2 focus:ring-[#054EAF]"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-end gap-3 mt-6">
          <button
            @click="isModalOpen = false"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#EEF4FF] text-[#054EAF] border border-[#BFDBFE] rounded-[8px] hover:bg-[#DBEAFE] transition"
          >Cerrar</button>
          <button
            @click="saveModalPrices"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#054EAF] text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-[#03368A] transition"
          >Guardar cambios</button>
        </div>
      </div>
    </ModalReutilizable>

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL: Confirmar eliminación               -->
    <!-- ══════════════════════════════════════════ -->
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
/* ─── Page ──────────────────────────────────────────────── */
.pp-page { width: 100%; }

/* ─── Header ────────────────────────────────────────────── */
.pp-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 0 0 4px;
  line-height: 1.2;
}
.pp-subtitle {
  font-size: 13px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
  margin: 0;
}
.pp-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

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

.btn-save-prices {
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #054EAF;
  color: #fff;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  transition: background 0.15s;
}
.btn-save-prices:hover { background: #03368A; }

.per-page-wrap { display: flex; align-items: center; gap: 8px; }
.per-page-lbl  { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; white-space: nowrap; }

/* ─── Inputs / selects ──────────────────────────────────── */
.pp-input {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  appearance: auto;
}
.pp-input:focus {
  border-color: var(--primary, #054EAF);
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.1);
}
.pp-input::placeholder { color: var(--text-3, #94A3B8); }
.pp-input--sm { width: 70px; text-align: center; }

/* ─── Tabla ─────────────────────────────────────────────── */
.pp-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

/* ─── Head ──────────────────────────────────────────────── */
.pp-head-row { background: #EBF3FC; }

.pp-th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2, #64748B);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #E2EBF6;
}
.pp-th-center { text-align: center; }
.pp-th-sort {
  cursor: pointer;
  user-select: none;
  transition: color 0.12s;
}
.pp-th-sort:hover { color: #054EAF; }

.sort-icons {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin-left: 4px;
  vertical-align: middle;
  gap: 0;
  line-height: 0;
}
.sort-active { color: #054EAF; }
.sort-dim    { color: #CBD5E1; }

/* ─── Filas ─────────────────────────────────────────────── */
.pp-row {
  background: #FFFFFF;
  cursor: pointer;
  transition: background 0.15s ease;
}
.pp-row:hover { background: #F0F7FF; }

.pp-td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  border-bottom: 1px solid #EBF3FC;
  vertical-align: middle;
  white-space: nowrap;
}
.pp-td-center { text-align: center; }

.pp-idx { font-size: 12px; color: var(--text-3, #94A3B8); font-weight: 500; }

/* ─── Chevron toggle ────────────────────────────────────── */
.pp-chevron {
  color: var(--text-3, #94A3B8);
  transition: transform 0.2s ease, color 0.15s ease;
  display: block;
  margin: 0 auto;
}
.pp-chevron-open {
  transform: rotate(180deg);
  color: #054EAF;
}

/* ─── Cell: dispositivo ─────────────────────────────────── */
.pp-disp-cell { display: flex; flex-direction: column; gap: 2px; }
.pp-disp-name { font-weight: 600; font-size: 13px; color: var(--text-1, #0F1A2E); }
.pp-disp-sub  { font-size: 11px; color: var(--text-3, #94A3B8); }

.pp-categ  { font-size: 13px; color: var(--text-2, #64748B); }
.pp-bodega { font-size: 13px; color: var(--text-2, #64748B); }

/* ─── Badges ────────────────────────────────────────────── */
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
.badge--blue   { background: #DBEAFE; color: #1D4ED8; }
.badge--red    { background: #FEE2E2; color: #B91C1C; }
.badge--slate  { background: #F1F5F9; color: #64748B; }

/* ─── Botones de acción ─────────────────────────────────── */
.pp-actions { display: flex; align-items: center; gap: 6px; }

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
.act-view       { background: #DBEAFE; color: #1D4ED8; }
.act-view:hover { background: #BFDBFE; }
.act-edit       { background: #FEF3C7; color: #B45309; }
.act-edit:hover { background: #FDE68A; }
.act-del        { background: #FEE2E2; color: #B91C1C; }
.act-del:hover  { background: #FECACA; }

/* ─── Fila expandida ────────────────────────────────────── */
.pp-exp-td {
  padding: 0 !important;
  border-bottom: 1px solid #EBF3FC;
}

.pp-exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}
.pp-exp-open { max-height: 600px; }

.pp-exp-inner {
  background: #F8FBFF;
  border-left: 3px solid #054EAF;
  padding: 16px 24px;
}

.pp-exp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
}
@media (max-width: 768px) { .pp-exp-grid { grid-template-columns: repeat(2, 1fr); } }

.pp-exp-field { display: flex; flex-direction: column; gap: 4px; }
.pp-exp-field--wide { grid-column: span 2; }

.pp-exp-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
}
.pp-exp-val {
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  white-space: normal;
  word-break: break-word;
}

/* ─── Skeleton ──────────────────────────────────────────── */
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

/* ─── Price input (tabla box) ───────────────────────────── */
.price-input {
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  width: 120px;
  outline: none;
}
.price-input:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 3px rgba(5,78,175,.1);
}

/* ─── Paginación ────────────────────────────────────────── */
.pp-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #EBF3FC;
  flex-wrap: wrap;
  gap: 8px;
}
.pg-info {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}
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
.pg-btn:hover:not(:disabled) { background: #EEF4FF; color: #054EAF; border-color: #BFDBFE; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-active { background: #054EAF !important; color: #FFFFFF !important; border-color: #054EAF !important; font-weight: 600; }
.pg-ellipsis { color: #94A3B8; font-size: 13px; padding: 0 4px; }

/* ─── Modal title ───────────────────────────────────────── */
.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}
</style>
