<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getInventory } from '@/services/inventory.service'
import BaseTable     from '@/components/ui/BaseTable.vue'
import ScanModal     from '@/components/inventory/ScanModal.vue'
import {
  Search, RefreshCw, ChevronUp, ChevronDown,
  QrCode, Wifi, AlertTriangle, Eye, X,
  PackageCheck, PackageSearch, Clock, Wrench,
} from 'lucide-vue-next'

/* ─── state ──────────────────────────────────────────────── */
const items   = ref([])
const loading = ref(false)
const error   = ref(null)
const router  = useRouter()

const search        = ref('')
const availFilter   = ref('')
const condFilter    = ref('')
const bodegaFilter  = ref('')

const sortKey = ref('nombre')
const sortDir = ref('asc')

const showScan    = ref(false)
const alertOpen   = ref(true)

/* ─── options ────────────────────────────────────────────── */
const availOptions = [
  { value: 'DISPONIBLE',    label: 'Disponible'    },
  { value: 'EN_RESERVA',    label: 'En reserva'    },
  { value: 'NO_DISPONIBLE', label: 'No disponible' },
]
const condOptions = [
  { value: 'OPERATIVO_OK',     label: 'Operativo OK'     },
  { value: 'OPERATIVO_70',     label: 'Operativo 70%'    },
  { value: 'OPERATIVO_50',     label: 'Operativo 50%'    },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'DEFECTUOSO',       label: 'Defectuoso'       },
  { value: 'NO_ACTIVO',        label: 'No activo'        },
]

const bodegas = computed(() => {
  const set = new Set(items.value.map(i => i.bodega).filter(Boolean))
  return [...set].sort()
})

/* ─── KPIs ───────────────────────────────────────────────── */
const kpis = computed(() => ({
  total:        items.value.length,
  disponibles:  items.value.filter(i => i.availabilityStatus === 'DISPONIBLE').length,
  enReserva:    items.value.filter(i => i.availabilityStatus === 'EN_RESERVA').length,
  mantenimiento: items.value.filter(i => i.conditionStatus === 'EN_MANTENIMIENTO' || i.conditionStatus === 'DEFECTUOSO').length,
  alertas:      items.value.filter(i => i.hasAlert).length,
}))

/* ─── columns ────────────────────────────────────────────── */
const columns = [
  { key: '_idx',             label: '#',             width: '44px'  },
  { key: '_codes',           label: 'Códigos',       width: '72px'  },
  { key: 'nombre',           label: 'Nombre'                        },
  { key: 'categoria',        label: 'Categoría'                     },
  { key: 'bodega',           label: 'Bodega'                        },
  { key: 'ubicacion',        label: 'Ubicación'                     },
  { key: 'availabilityStatus', label: 'Disponibilidad'              },
  { key: 'conditionStatus',  label: 'Condición'                     },
  { key: 'lastScanAt',       label: 'Último escaneo', width: '130px' },
  { key: '_actions',         label: 'Acciones',       width: '80px' },
]

/* ─── filter + sort ──────────────────────────────────────── */
const filteredSorted = computed(() => {
  const q = search.value.toLowerCase()
  let list = items.value.filter(i => {
    const matchSearch = !q ||
      (i.nombre?.toLowerCase().includes(q))   ||
      (i.categoria?.toLowerCase().includes(q)) ||
      (i.bodega?.toLowerCase().includes(q))    ||
      (i.serialNumber?.toLowerCase().includes(q))
    const matchAvail  = !availFilter.value  || i.availabilityStatus === availFilter.value
    const matchCond   = !condFilter.value   || i.conditionStatus    === condFilter.value
    const matchBodega = !bodegaFilter.value || i.bodega             === bodegaFilter.value
    return matchSearch && matchAvail && matchCond && matchBodega
  })

  if (sortKey.value) {
    const dir = sortDir.value === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const av = (a[sortKey.value] ?? '').toString().toLowerCase()
      const bv = (b[sortKey.value] ?? '').toString().toLowerCase()
      return av < bv ? -dir : av > bv ? dir : 0
    })
  }

  return list.map((i, idx) => ({ ...i, _idx: idx + 1 }))
})

/* ─── sort ───────────────────────────────────────────────── */
const sortBy = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

/* ─── badge helpers ──────────────────────────────────────── */
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

const formatScan = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = Date.now()
  const diff = now - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  if (days < 7)   return `hace ${days}d`
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

/* ─── fetch ──────────────────────────────────────────────── */
const fetchItems = async () => {
  loading.value = true
  error.value   = null
  try {
    const res    = await getInventory()
    items.value  = res.data || res || []
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo cargar el inventario'
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  search.value       = ''
  availFilter.value  = ''
  condFilter.value   = ''
  bodegaFilter.value = ''
}

onMounted(fetchItems)
</script>

<template>
  <div class="inv-page">

    <!-- ── Header ─────────────────────────────────────────────── -->
    <div class="inv-head">
      <div>
        <h2 class="inv-title">Inventario</h2>
        <p class="inv-subtitle">{{ filteredSorted.length }} elementos encontrados</p>
      </div>
      <div class="inv-head-actions">
        <button class="inv-btn-scan" @click="showScan = true">
          <QrCode :size="14" /> Escanear
        </button>
        <button class="inv-btn-reload" @click="fetchItems">
          <RefreshCw :size="13" /> Recargar
        </button>
      </div>
    </div>

    <!-- ── KPI Cards ──────────────────────────────────────────── -->
    <div class="inv-kpis">
      <div class="inv-kpi">
        <div class="inv-kpi-icon inv-kpi-icon--blue">
          <PackageSearch :size="18" />
        </div>
        <div>
          <p class="inv-kpi-val">{{ kpis.total }}</p>
          <p class="inv-kpi-lbl">Total equipos</p>
        </div>
      </div>
      <div class="inv-kpi">
        <div class="inv-kpi-icon inv-kpi-icon--green">
          <PackageCheck :size="18" />
        </div>
        <div>
          <p class="inv-kpi-val">{{ kpis.disponibles }}</p>
          <p class="inv-kpi-lbl">Disponibles</p>
        </div>
      </div>
      <div class="inv-kpi">
        <div class="inv-kpi-icon inv-kpi-icon--yellow">
          <Clock :size="18" />
        </div>
        <div>
          <p class="inv-kpi-val">{{ kpis.enReserva }}</p>
          <p class="inv-kpi-lbl">En reserva</p>
        </div>
      </div>
      <div class="inv-kpi">
        <div class="inv-kpi-icon inv-kpi-icon--orange">
          <Wrench :size="18" />
        </div>
        <div>
          <p class="inv-kpi-val">{{ kpis.mantenimiento }}</p>
          <p class="inv-kpi-lbl">Mantenimiento</p>
        </div>
      </div>
      <div class="inv-kpi inv-kpi--alert" :class="{ 'inv-kpi--alert-active': kpis.alertas > 0 }">
        <div class="inv-kpi-icon inv-kpi-icon--red">
          <AlertTriangle :size="18" />
        </div>
        <div>
          <p class="inv-kpi-val">{{ kpis.alertas }}</p>
          <p class="inv-kpi-lbl">Alertas</p>
        </div>
      </div>
    </div>

    <!-- ── Alert Banner ───────────────────────────────────────── -->
    <div v-if="kpis.alertas > 0 && alertOpen" class="inv-alert-banner">
      <AlertTriangle :size="16" class="inv-alert-icon" />
      <span>
        <strong>{{ kpis.alertas }} equipo{{ kpis.alertas !== 1 ? 's' : '' }}</strong>
        requiere{{ kpis.alertas !== 1 ? 'n' : '' }} atención inmediata
      </span>
      <button class="inv-alert-close" @click="alertOpen = false">
        <X :size="14" />
      </button>
    </div>

    <!-- ── Error ──────────────────────────────────────────────── -->
    <div v-if="error" class="inv-error-card">
      <AlertTriangle :size="18" />
      <span>{{ error }}</span>
      <button class="inv-btn-reload" @click="fetchItems">Reintentar</button>
    </div>

    <!-- ── Filters ────────────────────────────────────────────── -->
    <div class="filter-bar">
      <div class="search-field">
        <Search :size="14" class="s-ico" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar nombre, categoría, N/S…"
          class="pp-input"
        />
      </div>

      <select v-model="availFilter" class="pp-input">
        <option value="">Disponibilidad</option>
        <option v-for="o in availOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <select v-model="condFilter" class="pp-input">
        <option value="">Condición</option>
        <option v-for="o in condOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <select v-model="bodegaFilter" class="pp-input">
        <option value="">Todas las bodegas</option>
        <option v-for="b in bodegas" :key="b" :value="b">{{ b }}</option>
      </select>

      <button
        v-if="search || availFilter || condFilter || bodegaFilter"
        class="inv-btn-clear"
        @click="clearFilters"
      >
        <X :size="13" /> Limpiar
      </button>
    </div>

    <!-- ── Table ──────────────────────────────────────────────── -->
    <div class="inv-table-wrap">

      <!-- Sort header overlay -->
      <div class="pp-sort-header">
        <table class="pp-sort-table">
          <thead>
            <tr class="pp-head-row">
              <th class="pp-th" style="width:44px">#</th>
              <th class="pp-th" style="width:72px">Códigos</th>
              <th class="pp-th pp-th-sort" @click="sortBy('nombre')">
                Nombre
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey === 'nombre' && sortDir === 'asc'  ? 'sort-active' : 'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey === 'nombre' && sortDir === 'desc' ? 'sort-active' : 'sort-dim'" />
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
              <th class="pp-th">Ubicación</th>
              <th class="pp-th">Disponibilidad</th>
              <th class="pp-th">Condición</th>
              <th class="pp-th" style="width:130px">Último escaneo</th>
              <th class="pp-th" style="width:80px">Acciones</th>
            </tr>
          </thead>
        </table>
      </div>

      <BaseTable
        :columns="columns"
        :rows="filteredSorted"
        :loading="loading"
        :page-size="20"
        empty-text="No se encontraron equipos en el inventario"
      >
        <!-- # -->
        <template #cell-_idx="{ value }">
          <span class="pp-idx">{{ value }}</span>
        </template>

        <!-- Códigos (QR / NFC) -->
        <template #cell-_codes="{ row }">
          <div class="inv-codes">
            <QrCode
              :size="15"
              :class="row.qrCode ? 'inv-code-icon inv-code-icon--active' : 'inv-code-icon inv-code-icon--dim'"
              :title="row.qrCode ? `QR: ${row.qrCode}` : 'Sin código QR'"
            />
            <Wifi
              :size="15"
              :class="row.nfcTag ? 'inv-code-icon inv-code-icon--active' : 'inv-code-icon inv-code-icon--dim'"
              :title="row.nfcTag ? `NFC: ${row.nfcTag}` : 'Sin tag NFC'"
            />
            <AlertTriangle
              v-if="row.hasAlert"
              :size="14"
              class="inv-code-icon inv-code-icon--alert"
              title="Requiere atención"
            />
          </div>
        </template>

        <!-- Nombre -->
        <template #cell-nombre="{ row }">
          <div class="inv-name-cell">
            <img
              v-if="row.imageUrl"
              :src="row.imageUrl"
              :alt="row.nombre"
              class="inv-thumb"
            />
            <div v-else class="inv-thumb-placeholder">
              <PackageSearch :size="14" />
            </div>
            <div>
              <p class="inv-name">{{ row.nombre || '—' }}</p>
              <p v-if="row.serialNumber" class="inv-serial">S/N: {{ row.serialNumber }}</p>
            </div>
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

        <!-- Ubicación -->
        <template #cell-ubicacion="{ value }">
          <span class="inv-ubicacion">{{ value || '—' }}</span>
        </template>

        <!-- Disponibilidad badge -->
        <template #cell-availabilityStatus="{ value }">
          <span :class="availClass(value)">{{ availLabel(value) }}</span>
        </template>

        <!-- Condición badge -->
        <template #cell-conditionStatus="{ value }">
          <span :class="condClass(value)">{{ condLabel(value) }}</span>
        </template>

        <!-- Último escaneo -->
        <template #cell-lastScanAt="{ value }">
          <span class="inv-scan-time">{{ formatScan(value) }}</span>
        </template>

        <!-- Acciones -->
        <template #cell-_actions="{ row }">
          <button
            class="act-btn act-view"
            title="Ver detalle"
            @click.stop="router.push(`/inventory/${row.id}`)"
          >
            <Eye :size="12" /> Ver
          </button>
        </template>

      </BaseTable>
    </div>

    <!-- ── Scan Modal ─────────────────────────────────────────── -->
    <ScanModal :show="showScan" @close="showScan = false" />

  </div>
</template>

<style scoped>
/* ─── Page ────────────────────────────────────────────────── */
.inv-page { width: 100%; display: flex; flex-direction: column; gap: 20px; }

/* ─── Header ──────────────────────────────────────────────── */
.inv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.inv-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 4px;
  line-height: 1.2;
}
.inv-subtitle {
  font-size: 13px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}
.inv-head-actions { display: flex; align-items: center; gap: 8px; }

.inv-btn-scan {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
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
.inv-btn-scan:hover { background: #03368A; }

.inv-btn-reload {
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
.inv-btn-reload:hover { background: #E5EAF0; }

.inv-btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #FCA5A5;
  background: #FFF1F2;
  color: #B91C1C;
  cursor: pointer;
  transition: background 0.15s;
}
.inv-btn-clear:hover { background: #FEE2E2; }

/* ─── KPIs ────────────────────────────────────────────────── */
.inv-kpis {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
@media (max-width: 900px) { .inv-kpis { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 560px) { .inv-kpis { grid-template-columns: repeat(2, 1fr); } }

.inv-kpi {
  background: #fff;
  border-radius: var(--r-xl, 16px);
  box-shadow: var(--shadow-card);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.inv-kpi--alert-active { border: 1px solid #FCA5A5; }

.inv-kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.inv-kpi-icon--blue   { background: #EFF6FF; color: #054EAF; }
.inv-kpi-icon--green  { background: #DCFCE7; color: #16A34A; }
.inv-kpi-icon--yellow { background: #FEF9C3; color: #B45309; }
.inv-kpi-icon--orange { background: #FFEDD5; color: #C2410C; }
.inv-kpi-icon--red    { background: #FEE2E2; color: #B91C1C; }

.inv-kpi-val {
  font-size: 24px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin: 0 0 2px;
  line-height: 1;
}
.inv-kpi-lbl {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* ─── Alert Banner ────────────────────────────────────────── */
.inv-alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF7ED;
  border: 1px solid #FED7AA;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #92400E;
}
.inv-alert-icon { color: #C2410C; flex-shrink: 0; }
.inv-alert-banner > span { flex: 1; }
.inv-alert-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #92400E;
  opacity: 0.6;
  padding: 2px;
  display: flex;
  align-items: center;
}
.inv-alert-close:hover { opacity: 1; }

/* ─── Error card ──────────────────────────────────────────── */
.inv-error-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF1F2;
  border: 1px solid #FECDD3;
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 13px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
}

/* ─── Filter bar ──────────────────────────────────────────── */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background: #fff;
  border-radius: var(--r-xl, 16px);
  box-shadow: var(--shadow-card);
  padding: 14px 16px;
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
.pp-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 34px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  background: #F8FAFC;
  color: #0F1A2E;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  -webkit-appearance: none;
  appearance: none;
}
.pp-input:focus { border-color: #054EAF; box-shadow: 0 0 0 3px rgba(5,78,175,0.1); }
select.pp-input { padding-left: 12px; cursor: pointer; }

/* ─── Table wrap ──────────────────────────────────────────── */
.inv-table-wrap {
  background: #fff;
  border-radius: var(--r-xl, 16px);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* Sort header (exact Products.vue pattern) */
.pp-sort-header { overflow-x: auto; }
.pp-sort-table   { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 900px; }
.pp-head-row     { background: #F8FAFC; }
.pp-th {
  padding: 11px 14px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748B;
  text-align: left;
  border-bottom: 1px solid #F1F5FA;
  white-space: nowrap;
}
.pp-th-sort { cursor: pointer; user-select: none; }
.pp-th-sort:hover { color: #054EAF; }
.sort-icons { display: inline-flex; flex-direction: column; margin-left: 4px; vertical-align: middle; gap: 0; }
.sort-active { color: #054EAF; }
.sort-dim    { color: #CBD5E1; }

/* Hide BaseTable's own thead */
:deep(.bt-head) { display: none; }

/* ─── Table cells ─────────────────────────────────────────── */
.pp-idx {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #F1F5FA;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  font-family: 'Inter', sans-serif;
}
.pp-categ  { font-size: 13px; color: #64748B; font-family: 'Inter', sans-serif; }
.pp-bodega { font-size: 13px; color: #64748B; font-family: 'Inter', sans-serif; }

.inv-codes {
  display: flex;
  align-items: center;
  gap: 5px;
}
.inv-code-icon         { flex-shrink: 0; }
.inv-code-icon--active { color: #054EAF; }
.inv-code-icon--dim    { color: #CBD5E1; }
.inv-code-icon--alert  { color: #C2410C; }

.inv-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.inv-thumb {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #E2EBF6;
  flex-shrink: 0;
}
.inv-thumb-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #F1F5FA;
  border: 1px solid #E2EBF6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #CBD5E1;
  flex-shrink: 0;
}
.inv-name {
  font-size: 13px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  margin: 0 0 2px;
}
.inv-serial {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.inv-ubicacion {
  font-size: 12px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
}

.inv-scan-time {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

/* ─── Badges (global pattern) ─────────────────────────────── */
:deep(.badge) {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
:deep(.badge--green)  { background: #DCFCE7; color: #16A34A; }
:deep(.badge--yellow) { background: #FEF9C3; color: #B45309; }
:deep(.badge--orange) { background: #FFEDD5; color: #C2410C; }
:deep(.badge--blue)   { background: #DBEAFE; color: #1D4ED8; }
:deep(.badge--red)    { background: #FEE2E2; color: #B91C1C; }
:deep(.badge--slate)  { background: #F1F5F9; color: #64748B; }

/* ─── Action buttons ──────────────────────────────────────── */
.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s;
}
.act-view { background: #EFF6FF; color: #054EAF; border-color: #BFDBFE; }
.act-view:hover { background: #DBEAFE; }
</style>
