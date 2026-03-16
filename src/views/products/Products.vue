<script setup>
import { ref, computed, onMounted } from 'vue'
import { getProducts, getByName } from '@/services/products.service'
import { getBox }                  from '@/services/suppliers.service'
import BaseTable                   from '@/components/ui/BaseTable.vue'
import ModalReutilizable           from '@/components/modal/ModalReutilizable.vue'
import {
  Search, RefreshCw, ChevronUp, ChevronDown, Inbox,
  Eye, Pencil, Trash2, X,
} from 'lucide-vue-next'

/* ─── state ─────────────────────────────────────────────── */
const products      = ref([])
const boxOptions    = ref([])
const loading       = ref(false)

const search        = ref('')
const categFilter   = ref('')
const condFilter    = ref('')
const selectedBox   = ref('')
const pageSize      = ref(25)

const isFiltering   = ref(false)
const filteredByName = ref([])

// sort
const sortKey = ref('dispositivo')
const sortDir = ref('asc')

// modal precios
const isModalOpen    = ref(false)
const selectedProduct = ref(null)
const modalPrices    = ref([])

// modal delete
const deleteModal   = ref(false)
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

/* ─── columns for BaseTable ─────────────────────────────── */
const columns = [
  { key: '_idx',            label: '#',             width: '44px'  },
  { key: 'dispositivo',     label: 'Dispositivo'                   },
  { key: 'categoria',       label: 'Categoría'                     },
  { key: 'bodega',          label: 'Bodega'                        },
  { key: 'conditionStatus', label: 'Condición'                     },
  { key: 'availabilityStatus', label: 'Disponibilidad'             },
  { key: '_precios',        label: 'Precios',       width: '80px'  },
  { key: '_actions',        label: 'Acciones',      width: '100px' },
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

  return list.map((p, i) => ({ ...p, _idx: i + 1 }))
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
    const res     = await getProducts()
    products.value = res.data || []

    const resBoxes = await getBox()
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
  search.value = ''
  categFilter.value = ''
  condFilter.value = ''
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
  // Wire to DELETE /producto/:id when ready
  products.value = products.value.filter(p => p.id !== productToDelete.value.id)
  deleteModal.value = false
  productToDelete.value = null
}

onMounted(fetchProducts)
</script>

<template>
  <div class="pp-page">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <div class="pp-head">
      <div>
        <h2 class="pp-title">Productos Propios</h2>
        <p class="pp-subtitle">
          {{ isFiltering ? filteredByName.length : filteredSorted.length }} productos encontrados
        </p>
      </div>
      <div class="pp-head-actions">
        <button class="btn-reload" @click="resetTables">
          <RefreshCw :size="13" /> Recargar
        </button>
        <button v-if="isFiltering" class="btn-save-prices" @click="saveFilteredPrices">
          Guardar cambios
        </button>
      </div>
    </div>

    <!-- ── Filters ─────────────────────────────────────────────── -->
    <div class="filter-bar">
      <div class="search-field">
        <Search :size="14" class="s-ico" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar dispositivo, categoría…"
          class="pp-input"
        />
      </div>

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

      <div class="per-page-wrap">
        <span class="per-page-lbl">Por página</span>
        <select v-model="pageSize" class="pp-input pp-input--sm">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>

    <!-- ── TABLA PRINCIPAL ─────────────────────────────────────── -->
    <div v-if="!isFiltering" class="pp-table-wrap">

      <!-- Sort header row (rendered above BaseTable) -->
      <div class="pp-sort-header">
        <table class="pp-sort-table">
          <thead>
            <tr class="pp-head-row">
              <th class="pp-th" style="width:44px">#</th>
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
              <th class="pp-th" style="width:80px">Precios</th>
              <th class="pp-th" style="width:100px">Acciones</th>
            </tr>
          </thead>
        </table>
      </div>

      <!-- BaseTable handles pagination + skeleton + expandable -->
      <BaseTable
        :columns="columns"
        :rows="filteredSorted"
        :loading="loading"
        :page-size="Number(pageSize)"
        :expandable="true"
        empty-text="No se encontraron productos"
      >
        <!-- # -->
        <template #cell-_idx="{ value }">
          <span class="pp-idx">{{ value }}</span>
        </template>

        <!-- Dispositivo -->
        <template #cell-dispositivo="{ row }">
          <div class="pp-disp-cell">
            <span class="pp-disp-name">{{ row.dispositivo || '—' }}</span>
            <span v-if="row.nombre" class="pp-disp-sub">{{ row.nombre }}</span>
          </div>
        </template>

        <!-- Categoría -->
        <template #cell-categoria="{ value }">
          <span class="pp-categ">{{ value || '—' }}</span>
        </template>

        <!-- Bodega -->
        <template #cell-bodega="{ value }">
          <span class="pp-bodega">{{ value || '—' }}</span>
        </template>

        <!-- Condición badge -->
        <template #cell-conditionStatus="{ value }">
          <span :class="condClass(value)">{{ condLabel(value) }}</span>
        </template>

        <!-- Disponibilidad badge -->
        <template #cell-availabilityStatus="{ value }">
          <span :class="availClass(value)">{{ availLabel(value) }}</span>
        </template>

        <!-- Precios -->
        <template #cell-_precios="{ row }">
          <button class="act-btn act-view" @click.stop="openModal(row)">
            <Eye :size="12" /> Ver
          </button>
        </template>

        <!-- Acciones -->
        <template #cell-_actions="{ row }">
          <div class="pp-actions">
            <button class="act-btn act-edit" title="Editar">
              <Pencil :size="12" />
            </button>
            <button class="act-btn act-del" title="Eliminar" @click.stop="confirmDelete(row)">
              <Trash2 :size="12" />
            </button>
          </div>
        </template>

        <!-- Fila expandida: specs técnicas -->
        <template #expanded="{ row }">
          <div class="exp-grid">
            <div v-if="row.amperios != null" class="exp-field">
              <span class="exp-lbl">Amperios</span>
              <span class="exp-val">{{ row.amperios }}</span>
            </div>
            <div v-if="row.medidas" class="exp-field">
              <span class="exp-lbl">Medidas</span>
              <span class="exp-val">{{ row.medidas }}</span>
            </div>
            <div v-if="row.qMotores != null" class="exp-field">
              <span class="exp-lbl">Motores</span>
              <span class="exp-val">{{ row.qMotores }}</span>
            </div>
            <div v-if="row.qOperarios != null" class="exp-field">
              <span class="exp-lbl">Operarios</span>
              <span class="exp-val">{{ row.qOperarios }}</span>
            </div>
            <div v-if="row.m2Dispositivo != null" class="exp-field">
              <span class="exp-lbl">m²</span>
              <span class="exp-val">{{ row.m2Dispositivo }}</span>
            </div>
            <div v-if="row.pesoAproxDisp != null" class="exp-field">
              <span class="exp-lbl">Peso (kg)</span>
              <span class="exp-val">{{ row.pesoAproxDisp }}</span>
            </div>
            <div v-if="row.m3Transporte != null" class="exp-field">
              <span class="exp-lbl">m³ Transporte</span>
              <span class="exp-val">{{ row.m3Transporte }}</span>
            </div>
            <div v-if="row.qHorasOperacion != null" class="exp-field">
              <span class="exp-lbl">Horas Operación</span>
              <span class="exp-val">{{ row.qHorasOperacion }}</span>
            </div>
            <div v-if="row.qHorasMontaje != null" class="exp-field">
              <span class="exp-lbl">Horas Montaje</span>
              <span class="exp-val">{{ row.qHorasMontaje }}</span>
            </div>
            <div v-if="row.qPersonalMontaje != null" class="exp-field">
              <span class="exp-lbl">Personal Montaje</span>
              <span class="exp-val">{{ row.qPersonalMontaje }}</span>
            </div>
            <div v-if="row.anioDispositivo != null" class="exp-field">
              <span class="exp-lbl">Año</span>
              <span class="exp-val">{{ row.anioDispositivo }}</span>
            </div>
            <div v-if="row.montacarga" class="exp-field">
              <span class="exp-lbl">Montacarga</span>
              <span class="exp-val">{{ row.montacarga }}</span>
            </div>
            <div v-if="row.incluyeTransporteBogMde" class="exp-field">
              <span class="exp-lbl">Incluye Transporte</span>
              <span class="exp-val">{{ row.incluyeTransporteBogMde }}</span>
            </div>
            <div v-if="row.descripcion" class="exp-field exp-field--wide">
              <span class="exp-lbl">Descripción</span>
              <span class="exp-val">{{ row.descripcion }}</span>
            </div>
            <div v-if="row.notas" class="exp-field exp-field--wide">
              <span class="exp-lbl">Notas</span>
              <span class="exp-val">{{ row.notas }}</span>
            </div>
          </div>
        </template>

      </BaseTable>
    </div>

    <!-- ── TABLA FILTRADA POR BOX ──────────────────────────────── -->
    <div v-if="isFiltering" class="bg-white rounded-[18px] shadow-[var(--shadow-card)] overflow-hidden mt-2">
      <div class="overflow-x-auto">
        <table class="pp-sort-table">
          <thead>
            <tr class="pp-head-row">
              <th class="pp-th">ID</th>
              <th class="pp-th">Cliente / Box</th>
              <th class="pp-th">Precio</th>
              <th class="pp-th">Producto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredByName" :key="item.id" class="pp-box-row">
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
      <div v-if="!filteredByName.length" class="py-12 flex flex-col items-center gap-3 text-[#94A3B8]">
        <Inbox class="w-9 h-9 opacity-40" />
        <p class="text-[13px]">No se encontraron registros para ese box</p>
      </div>
    </div>

    <!-- ── MODAL: Precios por Box ──────────────────────────────── -->
    <ModalReutilizable :show="isModalOpen" @close="isModalOpen = false">
      <div>
        <h2 class="modal-title">
          Precios — {{ selectedProduct?.dispositivo }}
        </h2>
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

    <!-- ── MODAL: Confirmar eliminación ───────────────────────── -->
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
.pp-page { width: 100%; display: flex; flex-direction: column; gap: 20px; }

/* ─── Header ────────────────────────────────────────────── */
.pp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.pp-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 4px;
  line-height: 1.2;
}
.pp-subtitle {
  font-size: 13px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}
.pp-head-actions { display: flex; align-items: center; gap: 8px; }

.btn-reload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #E5EAF0;
  background: #F8FAFC;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-reload:hover { background: #E5EAF0; }

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

/* ─── Filter bar ────────────────────────────────────────── */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06);
  align-items: center;
}

.search-field {
  position: relative;
  flex: 1;
  min-width: 180px;
}
.s-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}
.search-field .pp-input { padding-left: 34px; width: 100%; }

.pp-input {
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: auto;
}
.pp-input:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 3px rgba(5,78,175,.1);
}
.pp-input--sm { width: 70px; text-align: center; }
.pp-input::placeholder { color: #94A3B8; }

.per-page-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.per-page-lbl {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

/* ─── Table wrapper ─────────────────────────────────────── */
.pp-table-wrap { display: flex; flex-direction: column; gap: 0; }

/* Hide BaseTable's internal thead — we render our own sortable one */
.pp-table-wrap :deep(.bt-head) { display: none; }
/* Remove top border-radius from bt-card since our header sits above */
.pp-table-wrap :deep(.bt-card) { border-radius: 0 0 18px 18px; }

/* ─── Sort header (visual only — aligned to BaseTable columns) ── */
.pp-sort-header {
  background: #EBF3FC;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  border: 1px solid #EEF1F7;
  border-bottom: none;
}
.pp-sort-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}
.pp-head-row { background: #EBF3FC; }
.pp-th {
  padding: 11px 16px;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #E2EBF6;
}
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

/* ─── Box-filter table rows ─────────────────────────────── */
.pp-td {
  padding: 13px 16px;
  font-size: 13px;
  color: #0F1A2E;
  border-bottom: 1px solid #F1F5FA;
  vertical-align: middle;
  white-space: nowrap;
}
.pp-box-row:hover { background: #F0F7FF; }

.price-input {
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
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

/* ─── Cell: dispositivo ─────────────────────────────────── */
.pp-disp-cell { display: flex; flex-direction: column; gap: 2px; }
.pp-disp-name { font-weight: 600; font-size: 13px; color: #0F1A2E; }
.pp-disp-sub  { font-size: 11px; color: #94A3B8; }

.pp-categ  { font-size: 13px; color: #64748B; }
.pp-bodega { font-size: 13px; color: #64748B; }
.pp-idx    { font-size: 12px; color: #94A3B8; font-weight: 500; }

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

/* ─── Action buttons ────────────────────────────────────── */
.pp-actions { display: flex; align-items: center; gap: 6px; }

.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
  line-height: 1;
}
.act-view       { background: #DBEAFE; color: #1D4ED8; }
.act-view:hover { background: #BFDBFE; }
.act-edit       { background: #FEF3C7; color: #B45309; }
.act-edit:hover { background: #FDE68A; }
.act-del        { background: #FEE2E2; color: #B91C1C; }
.act-del:hover  { background: #FECACA; }

/* ─── Expanded row grid ─────────────────────────────────── */
.exp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px 20px;
}
@media (max-width: 768px) { .exp-grid { grid-template-columns: repeat(2, 1fr); } }

.exp-field { display: flex; flex-direction: column; gap: 3px; }
.exp-field--wide { grid-column: span 2; }

.exp-lbl {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}
.exp-val {
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  word-break: break-word;
  white-space: normal;
}

/* ─── Modal title ───────────────────────────────────────── */
.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}
</style>
