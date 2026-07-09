<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getInventory } from '@/services/inventory.service'
import BaseTable     from '@/components/ui/BaseTable.vue'
import ScanModal     from '@/components/inventory/ScanModal.vue'
import SessionPanel  from '@/components/inventory/SessionPanel.vue'
import SelectLabel   from '@/components/input/SelectLabel.vue'
import { useActionAccess } from '@/composables/useActionAccess'
import {
  Search, RefreshCw, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  QrCode, Wifi, AlertTriangle, Eye, X,
  PackageCheck, PackageSearch, Clock, Wrench, Smartphone, Layers,
} from 'lucide-vue-next'

const { canDo } = useActionAccess()

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

const showScan        = ref(false)
const showSession     = ref(false)
const alertOpen   = ref(true)

/* ─── paginación (server-side) ──────────────────────────── */
const currentPage = ref(1)
const pageSize    = ref(20)
const total       = ref(0)
const totalPages  = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const visiblePages = computed(() => {
  const t = totalPages.value, cur = currentPage.value
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
  if (cur <= 4)      return [1, 2, 3, 4, 5, '...', t]
  if (cur >= t - 3)  return [1, '...', t-4, t-3, t-2, t-1, t]
  return [1, '...', cur-1, cur, cur+1, '...', t]
})

/* ─── KPIs (cuentas reales, independientes de la página actual) ── */
const kpiCounts = ref({ total: 0, disponibles: 0, enReserva: 0, mantenimiento: 0, alertas: 0 })
const bodegas   = ref([])

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
const pageSizeOptions = [
  { value: 10,  label: '10 / pág.'  },
  { value: 20,  label: '20 / pág.'  },
  { value: 50,  label: '50 / pág.'  },
  { value: 100, label: '100 / pág.' },
]

const kpis = computed(() => kpiCounts.value)

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

/* ─── sort (sobre la página actual) ──────────────────────── */
// El backend ya filtra por search/disponibilidad/condición/bodega y pagina
// (ver fetchItems) — aquí solo se ordena la página ya recibida.
const sortedItems = computed(() => {
  let list = items.value
  if (sortKey.value) {
    const dir = sortDir.value === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const av = (a[sortKey.value] ?? '').toString().toLowerCase()
      const bv = (b[sortKey.value] ?? '').toString().toLowerCase()
      return av < bv ? -dir : av > bv ? dir : 0
    })
  }
  const base = (currentPage.value - 1) * pageSize.value
  return list.map((i, idx) => ({ ...i, _idx: base + idx + 1 }))
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

/** Formatea una fecha futura (a diferencia de formatScan, que es solo para fechas pasadas) */
const formatFutureDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ─── fetch ──────────────────────────────────────────────── */
const fetchItems = async () => {
  loading.value = true
  error.value   = null
  try {
    const res = await getInventory({
      search:    search.value || undefined,
      status:    availFilter.value || undefined,
      condition: condFilter.value || undefined,
      bodega:    bodegaFilter.value || undefined,
      page:      currentPage.value,
      limit:     pageSize.value,
    })
    items.value = res.data ?? []
    total.value = res.total ?? items.value.length
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo cargar el inventario'
  } finally {
    loading.value = false
  }
}

/** KPIs reales sobre TODO el inventario (no solo la página cargada) */
const fetchKpis = async () => {
  try {
    const [tot, disp, res, mant, defc] = await Promise.all([
      getInventory({ limit: 1 }),
      getInventory({ status: 'DISPONIBLE', limit: 1 }),
      getInventory({ status: 'EN_RESERVA', limit: 1 }),
      getInventory({ condition: 'EN_MANTENIMIENTO', limit: 1 }),
      getInventory({ condition: 'DEFECTUOSO', limit: 1 }),
    ])
    const mantenimiento = (mant.total ?? 0) + (defc.total ?? 0)
    kpiCounts.value = {
      total:         tot.total ?? 0,
      disponibles:   disp.total ?? 0,
      enReserva:     res.total ?? 0,
      mantenimiento,
      alertas:       mantenimiento, // mismo criterio que hasAlert() en el backend
    }
  } catch (e) {
    console.error(e)
  }
}

/** Opciones de bodega para el filtro (muestreo amplio, no exhaustivo) */
const fetchBodegas = async () => {
  try {
    const res = await getInventory({ limit: 100 })
    const set = new Set((res.data ?? []).map(i => i.bodega).filter(Boolean))
    bodegas.value = [...set].sort()
  } catch (e) {
    console.error(e)
  }
}

const refetchAll = () => Promise.all([fetchItems(), fetchKpis(), fetchBodegas()])

let searchTimer = null
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchItems() }, 350)
})
watch([availFilter, condFilter, bodegaFilter], () => {
  currentPage.value = 1
  fetchItems()
})
watch(pageSize, () => {
  currentPage.value = 1
  fetchItems()
})
watch(currentPage, fetchItems)

const clearFilters = () => {
  search.value       = ''
  availFilter.value  = ''
  condFilter.value   = ''
  bodegaFilter.value = ''
  currentPage.value  = 1
  fetchItems()
}

onMounted(refetchAll)
</script>

<template>
  <div class="inv-page">

    <!-- ── Header ─────────────────────────────────────────────── -->
    <div class="inv-head">
      <div>
        <h2 class="inv-title">Inventario</h2>
        <p class="inv-subtitle">{{ total }} elementos encontrados</p>
      </div>
      <div class="inv-head-actions">
        <button v-if="canDo('InventarioEscanear', ['ADMINISTRADOR', 'SUPERVISOR', 'LOGISTICO'])" class="inv-btn-scan" @click="showScan = true">
          <QrCode :size="14" /> Escanear
        </button>
        <button class="inv-btn-session" @click="showSession = true">
          <Smartphone :size="14" /> Sesión móvil
        </button>
        <button class="inv-btn-materiales" @click="router.push({ name: 'Materiales' })">
          <Layers :size="14" /> Materiales
        </button>
        <button class="inv-btn-reload" @click="refetchAll">
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
      <button class="inv-btn-reload" @click="refetchAll">Reintentar</button>
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

      <SelectLabel
        v-model="availFilter"
        placeholder="Disponibilidad"
        :options="availOptions"
        class="pp-select pp-select--filter"
      />

      <SelectLabel
        v-model="condFilter"
        placeholder="Condición"
        :options="condOptions"
        class="pp-select pp-select--filter"
      />

      <SelectLabel
        v-model="bodegaFilter"
        placeholder="Todas las bodegas"
        :options="bodegas"
        class="pp-select pp-select--filter"
      />

      <SelectLabel
        v-model="pageSize"
        :options="pageSizeOptions"
        class="pp-select pp-select--sm"
      />

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
        :rows="sortedItems"
        :loading="loading"
        :page-size="1000"
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
        <template #cell-availabilityStatus="{ value, row }">
          <span :class="availClass(value)">{{ availLabel(value) }}</span>
          <span
            v-if="row.upcomingReservations > 0"
            class="inv-reserv-flag"
            :title="`${row.upcomingReservations} reserva(s) activa(s) o futura(s) — próxima desde ${formatFutureDate(row.nextReservationAt)}. El estado de disponibilidad de arriba es manual y puede no reflejar esto.`"
          >
            <Clock :size="11" /> {{ row.upcomingReservations }}
          </span>
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

      <div class="pp-pagination">
        <span class="pg-info">
          {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, total) }}
          de {{ total }}
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

    <!-- ── Scan Modal ─────────────────────────────────────────── -->
    <ScanModal :show="showScan" @close="showScan = false" />
    <SessionPanel
      :show="showSession"
      :total-items="kpis.total"
      @close="showSession = false"
    />

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
  background: #27C8D8;
  color: #fff;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  transition: background 0.15s;
}
.inv-btn-scan:hover { background: #1BAEBB; }

.inv-btn-session {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; background: #F0FDF4; color: #16A34A;
  border: 1px solid #86EFAC; border-radius: 10px;
  font-size: 13px; font-weight: 600; font-family: 'Inter',sans-serif;
  cursor: pointer; transition: all 0.2s;
}
.inv-btn-session:hover { background: #16A34A; color: #fff; border-color: #16A34A; }

.inv-btn-materiales {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; background: #F5F3FF; color: #7C3AED;
  border: 1px solid #DDD6FE; border-radius: 10px;
  font-size: 13px; font-weight: 600; font-family: 'Inter',sans-serif;
  cursor: pointer; transition: all 0.2s;
}
.inv-btn-materiales:hover { background: #7C3AED; color: #fff; border-color: #7C3AED; }

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
.inv-kpi-icon--blue   { background: #E0F9FA; color: #27C8D8; }
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
.pp-input:focus { border-color: #27C8D8; box-shadow: 0 0 0 3px rgba(39,200,216,0.1); }

.pp-select { width: auto; }
.pp-select :deep(.sl-trigger) { height: 36px; }
.pp-select--sm { min-width: 110px; flex: none; }
.pp-select--filter { min-width: 140px; max-width: 180px; flex: 0 1 auto; }
@media (max-width: 700px) { .pp-select--filter { max-width: none; flex: 1 1 140px; } }

/* ─── Paginación ──────────────────────────────────────────── */
.pp-pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #F1F5FA; flex-wrap: wrap; gap: 8px; }
.pg-info { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; }
.pg-pages { display: flex; align-items: center; gap: 4px; }
.pg-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #E2EBF6; background: #FFFFFF; color: #64748B; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
.pg-btn:hover:not(:disabled) { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-active { background: #27C8D8 !important; color: #FFFFFF !important; border-color: #27C8D8 !important; font-weight: 600; }
.pg-ellipsis { color: #94A3B8; font-size: 13px; padding: 0 4px; }

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
.pp-th-sort:hover { color: #27C8D8; }
.sort-icons { display: inline-flex; flex-direction: column; margin-left: 4px; vertical-align: middle; gap: 0; }
.sort-active { color: #27C8D8; }
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
.inv-code-icon--active { color: #27C8D8; }
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

.inv-reserv-flag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 6px;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  background: #FEF3C7;
  color: #B45309;
  cursor: help;
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
:deep(.badge--blue)   { background: #CCEFF2; color: #27C8D8; }
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
.act-view { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.act-view:hover { background: #CCEFF2; }
</style>
