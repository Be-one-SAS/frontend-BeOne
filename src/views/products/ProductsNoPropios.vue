<script setup>
import { ref, computed, onMounted } from 'vue'
import { getThirdPartyCatalog } from '@/services/products.service'
import BaseTable          from '@/components/ui/BaseTable.vue'
import ModalReutilizable  from '@/components/modal/ModalReutilizable.vue'
import {
  Search, RefreshCw, ChevronUp, ChevronDown,
  Pencil, Trash2,
} from 'lucide-vue-next'

/* ─── state ─────────────────────────────────────────────── */
const products  = ref([])
const loading   = ref(false)

const search      = ref('')
const categFilter = ref('')
const pageSize    = ref(25)

// sort
const sortKey = ref('dispositivo')
const sortDir = ref('asc')

// delete modal
const deleteModal     = ref(false)
const productToDelete = ref(null)

/* ─── options ────────────────────────────────────────────── */
const categorias = computed(() => {
  const set = new Set(products.value.map(p => p.categoria).filter(Boolean))
  return [...set].sort()
})

/* ─── columns ────────────────────────────────────────────── */
const columns = [
  { key: '_idx',       label: '#',            width: '44px'  },
  { key: 'dispositivo',label: 'Dispositivo'                  },
  { key: 'descripcion',label: 'Descripción'                  },
  { key: 'categoria',  label: 'Categoría'                    },
  { key: 'bodega',     label: 'Bodega'                       },
  { key: 'valorBase',  label: 'Valor Base',   width: '110px' },
  { key: '_actions',   label: 'Acciones',     width: '100px' },
]

/* ─── filter + sort ─────────────────────────────────────── */
const filteredSorted = computed(() => {
  const q = search.value.toLowerCase()
  let list = products.value.filter(p => {
    const matchSearch = !q ||
      (p.dispositivo?.toLowerCase().includes(q)) ||
      (p.descripcion?.toLowerCase().includes(q)) ||
      (p.categoria?.toLowerCase().includes(q))
    const matchCateg = !categFilter.value || p.categoria === categFilter.value
    return matchSearch && matchCateg
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

/* ─── currency format ───────────────────────────────────── */
const formatCOP = (val) =>
  val != null
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
    : '—'

/* ─── fetch ─────────────────────────────────────────────── */
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
  fetchProducts()
}

/* ─── delete ────────────────────────────────────────────── */
function confirmDelete(product) {
  productToDelete.value = product
  deleteModal.value = true
}
function executeDelete() {
  // Wire to DELETE /third-party-catalog/:id when ready
  products.value = products.value.filter(p => p.id !== productToDelete.value.id)
  deleteModal.value = false
  productToDelete.value = null
}

onMounted(fetchProducts)
</script>

<template>
  <div class="np-page">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <div class="np-head">
      <div>
        <h2 class="np-title">Productos de Terceros</h2>
        <p class="np-subtitle">{{ filteredSorted.length }} productos encontrados</p>
      </div>
      <div class="np-head-actions">
        <button class="btn-reload" @click="reset">
          <RefreshCw :size="13" /> Recargar
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
          placeholder="Buscar dispositivo, descripción, categoría…"
          class="np-input"
        />
      </div>

      <select v-model="categFilter" class="np-input">
        <option value="">Todas las categorías</option>
        <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
      </select>

      <div class="per-page-wrap">
        <span class="per-page-lbl">Por página</span>
        <select v-model="pageSize" class="np-input np-input--sm">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>

    <!-- ── Table ───────────────────────────────────────────────── -->
    <div class="np-table-wrap">

      <!-- Sort header row -->
      <div class="np-sort-header">
        <table class="np-sort-table">
          <thead>
            <tr class="np-head-row">
              <th class="np-th" style="width:44px">#</th>
              <th class="np-th np-th-sort" @click="sortBy('dispositivo')">
                Dispositivo
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey === 'dispositivo' && sortDir === 'asc'  ? 'sort-active' : 'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey === 'dispositivo' && sortDir === 'desc' ? 'sort-active' : 'sort-dim'" />
                </span>
              </th>
              <th class="np-th">Descripción</th>
              <th class="np-th np-th-sort" @click="sortBy('categoria')">
                Categoría
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey === 'categoria' && sortDir === 'asc'  ? 'sort-active' : 'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey === 'categoria' && sortDir === 'desc' ? 'sort-active' : 'sort-dim'" />
                </span>
              </th>
              <th class="np-th np-th-sort" @click="sortBy('bodega')">
                Bodega
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey === 'bodega' && sortDir === 'asc'  ? 'sort-active' : 'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey === 'bodega' && sortDir === 'desc' ? 'sort-active' : 'sort-dim'" />
                </span>
              </th>
              <th class="np-th np-th-sort" style="width:110px" @click="sortBy('valorBase')">
                Valor Base
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey === 'valorBase' && sortDir === 'asc'  ? 'sort-active' : 'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey === 'valorBase' && sortDir === 'desc' ? 'sort-active' : 'sort-dim'" />
                </span>
              </th>
              <th class="np-th" style="width:100px">Acciones</th>
            </tr>
          </thead>
        </table>
      </div>

      <BaseTable
        :columns="columns"
        :rows="filteredSorted"
        :loading="loading"
        :page-size="Number(pageSize)"
        :expandable="true"
        empty-text="No se encontraron productos de terceros"
      >
        <!-- # -->
        <template #cell-_idx="{ value }">
          <span class="np-idx">{{ value }}</span>
        </template>

        <!-- Dispositivo -->
        <template #cell-dispositivo="{ value }">
          <span class="np-disp">{{ value || '—' }}</span>
        </template>

        <!-- Descripción -->
        <template #cell-descripcion="{ value }">
          <span class="np-desc">{{ value || '—' }}</span>
        </template>

        <!-- Categoría -->
        <template #cell-categoria="{ value }">
          <span class="np-categ">{{ value || '—' }}</span>
        </template>

        <!-- Bodega -->
        <template #cell-bodega="{ value }">
          <span class="np-categ">{{ value || '—' }}</span>
        </template>

        <!-- Valor Base -->
        <template #cell-valorBase="{ value }">
          <span class="np-price">{{ formatCOP(value) }}</span>
        </template>

        <!-- Acciones -->
        <template #cell-_actions="{ row }">
          <div class="np-actions">
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
            <div v-if="row.porcentajeAmortizacion != null" class="exp-field">
              <span class="exp-lbl">Amortización %</span>
              <span class="exp-val">{{ row.porcentajeAmortizacion }}</span>
            </div>
            <div v-if="row.notas" class="exp-field exp-field--wide">
              <span class="exp-lbl">Notas</span>
              <span class="exp-val">{{ row.notas }}</span>
            </div>
          </div>
        </template>

      </BaseTable>
    </div>

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
.np-page { width: 100%; display: flex; flex-direction: column; gap: 20px; }

/* ─── Header ────────────────────────────────────────────── */
.np-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
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
  border: 1px solid #E5EAF0;
  background: #F8FAFC;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-reload:hover { background: #E5EAF0; }

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
  min-width: 200px;
}
.s-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}
.search-field .np-input { padding-left: 34px; width: 100%; }

.np-input {
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
.np-input:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 3px rgba(5,78,175,.1);
}
.np-input--sm { width: 70px; text-align: center; }
.np-input::placeholder { color: #94A3B8; }

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
.np-table-wrap { display: flex; flex-direction: column; gap: 0; }

/* Hide BaseTable's internal thead — we render our own sortable one */
.np-table-wrap :deep(.bt-head) { display: none; }
/* Remove top border-radius from bt-card since our header sits above */
.np-table-wrap :deep(.bt-card) { border-radius: 0 0 18px 18px; }

.np-sort-header {
  background: #EBF3FC;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  border: 1px solid #EEF1F7;
  border-bottom: none;
}
.np-sort-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}
.np-head-row { background: #EBF3FC; }
.np-th {
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
.np-th-sort {
  cursor: pointer;
  user-select: none;
  transition: color 0.12s;
}
.np-th-sort:hover { color: #054EAF; }

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

/* ─── Cell styles ───────────────────────────────────────── */
.np-idx   { font-size: 12px; color: #94A3B8; font-weight: 500; }
.np-disp  { font-weight: 600; font-size: 13px; color: #0F1A2E; }
.np-desc  { font-size: 13px; color: #64748B; max-width: 240px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.np-categ { font-size: 13px; color: #64748B; }
.np-price { font-size: 13px; font-weight: 600; color: #16A34A; font-family: 'Inter', sans-serif; }

/* ─── Action buttons ────────────────────────────────────── */
.np-actions { display: flex; align-items: center; gap: 6px; }

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
  line-height: 1;
}
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
