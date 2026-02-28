<template>
  <div class="inv-wrap">

    <!-- ── Filtros ───────────────────────────────────── -->
    <div class="filter-bar">
      <div class="filter-search">
        <Search :size="13" class="fs-ico" />
        <input v-model="search" class="fs-input" placeholder="Buscar equipo, código…" />
      </div>
      <select v-model="filterCategoria" class="filter-select">
        <option value="">Todas las categorías</option>
        <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filterEstado" class="filter-select">
        <option value="">Todos los estados</option>
        <option value="AVAILABLE">Disponible</option>
        <option value="IN_USE">En uso</option>
        <option value="MAINTENANCE">Mantenimiento</option>
        <option value="DAMAGED">Dañado</option>
        <option value="RETIRED">Retirado</option>
      </select>
      <button v-if="hasFilters" class="filter-clear" @click="clearFilters">
        <X :size="12" /> Limpiar
      </button>
    </div>

    <!-- ── Tabla ─────────────────────────────────────── -->
    <BaseTable
      :columns="columns"
      :rows="filtered"
      :loading="loading"
      :expandable="true"
      :page-size="10"
      empty-text="No se encontraron equipos"
      @row-click="onRowClick"
    >
      <!-- Foto + nombre -->
      <template #cell-nombre="{ row }">
        <div class="item-cell">
          <div class="item-photo">
            <Package :size="18" color="#054EAF" />
          </div>
          <div class="item-info">
            <span class="item-name">{{ row.nombre }}</span>
            <span class="item-code">{{ row.codigo }}</span>
          </div>
        </div>
      </template>

      <!-- Categoría -->
      <template #cell-categoria="{ value }">
        <span class="cat-pill">{{ value }}</span>
      </template>

      <!-- Disponibilidad -->
      <template #cell-disponibilidad="{ row }">
        <div class="avail-wrap">
          <div class="avail-bar">
            <div
              class="avail-fill avail-green"
              :style="`width:${avail(row)}%`"
            ></div>
            <div
              class="avail-fill avail-blue"
              :style="`width:${inUse(row)}%; left:${avail(row)}%`"
            ></div>
            <div
              class="avail-fill avail-amber"
              :style="`width:${maint(row)}%; left:${avail(row) + inUse(row)}%`"
            ></div>
          </div>
          <span class="avail-text">{{ row.disponibles }}/{{ row.total }}</span>
        </div>
      </template>

      <!-- Estado -->
      <template #cell-estado="{ value }">
        <BadgeStatus :status="value" type="inventory" />
      </template>

      <!-- Precio/día -->
      <template #cell-precioDia="{ value }">
        <span class="precio-cell">{{ formatCOP(value) }}<span class="precio-unit">/día</span></span>
      </template>

      <!-- Acciones -->
      <template #cell-acciones="{ row }">
        <div class="action-group">
          <button class="act-btn" title="Ver"          @click.stop="emit('action', { type: 'view',    row })"><Eye     :size="14" /></button>
          <button class="act-btn" title="Editar"       @click.stop="emit('action', { type: 'edit',    row })"><Pencil  :size="14" /></button>
          <button class="act-btn" title="Historial"    @click.stop="emit('action', { type: 'history', row })"><Clock   :size="14" /></button>
          <button class="act-btn act-danger" title="Archivar" @click.stop="emit('action', { type: 'archive', row })"><Archive :size="14" /></button>
        </div>
      </template>

      <!-- Fila expandida -->
      <template #expanded="{ row }">
        <div class="exp-grid">
          <!-- Especificaciones técnicas -->
          <div class="exp-section">
            <p class="exp-section-title">Especificaciones técnicas</p>
            <div class="spec-list">
              <div v-for="(val, key) in row.specs" :key="key" class="spec-item">
                <span class="spec-key">{{ key }}</span>
                <span class="spec-val">{{ val }}</span>
              </div>
            </div>
          </div>
          <!-- Próximos eventos -->
          <div class="exp-section">
            <p class="exp-section-title">Próximos eventos asignados</p>
            <div class="event-list">
              <div v-for="e in row.proximosEventos" :key="e.fecha" class="event-item">
                <CalendarDays :size="12" class="ev-ico" />
                <span class="ev-fecha">{{ e.fecha }}</span>
                <span class="ev-nombre">{{ e.nombre }}</span>
              </div>
              <p v-if="!row.proximosEventos?.length" class="ev-empty">Sin eventos programados</p>
            </div>
          </div>
        </div>
      </template>
    </BaseTable>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, X, Eye, Pencil, Clock, Archive, Package, CalendarDays } from 'lucide-vue-next'
import BaseTable   from '@/components/ui/BaseTable.vue'
import BadgeStatus from '@/components/ui/BadgeStatus.vue'

const emit = defineEmits(['action', 'row-click'])

const props = defineProps({
  rows:    { type: Array,   default: () => mockRows },
  loading: { type: Boolean, default: false },
})

// ── Columnas ─────────────────────────────────────────────
const columns = [
  { key: 'nombre',         label: 'Equipo',        width: '220px' },
  { key: 'categoria',      label: 'Categoría',     width: '130px' },
  { key: 'disponibilidad', label: 'Disponibilidad',width: '160px' },
  { key: 'ubicacion',      label: 'Ubicación',     width: '120px' },
  { key: 'estado',         label: 'Estado',        width: '130px' },
  { key: 'precioDia',      label: 'Precio/día',    width: '130px' },
  { key: 'acciones',       label: '',              width: '120px' },
]

// ── Filtros ──────────────────────────────────────────────
const search          = ref('')
const filterCategoria = ref('')
const filterEstado    = ref('')

const hasFilters = computed(() =>
  search.value || filterCategoria.value || filterEstado.value,
)
const clearFilters = () => { search.value = filterCategoria.value = filterEstado.value = '' }

const categorias = computed(() => [...new Set(props.rows.map(r => r.categoria))])

const filtered = computed(() => {
  let r = props.rows
  if (search.value) {
    const q = search.value.toLowerCase()
    r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.codigo.toLowerCase().includes(q))
  }
  if (filterCategoria.value) r = r.filter(x => x.categoria === filterCategoria.value)
  if (filterEstado.value)    r = r.filter(x => x.estado    === filterEstado.value)
  return r
})

// ── Disponibilidad ────────────────────────────────────────
const avail = (row) => Math.round((row.disponibles  / row.total) * 100)
const inUse = (row) => Math.round((row.enUso        / row.total) * 100)
const maint = (row) => Math.round((row.mantenimiento/ row.total) * 100)

// ── Helpers ───────────────────────────────────────────────
const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

const onRowClick = (row) => emit('row-click', row)

// ── Mock data ─────────────────────────────────────────────
// TODO: Conectar con GET /api/inventario
const mockRows = [
  {
    id: 1, nombre: 'Castillo Inflable XL', codigo: 'INF-001', categoria: 'Castillos',
    total: 5, disponibles: 3, enUso: 2, mantenimiento: 0,
    ubicacion: 'Bodega A', estado: 'AVAILABLE', precioDia: 350000,
    specs: { 'Dimensiones': '5×5 m', 'Peso máx.': '300 kg', 'Capacidad': '8 niños', 'Material': 'PVC 0.55mm' },
    proximosEventos: [
      { fecha: '2024-03-22', nombre: 'Evento Bancolombia' },
      { fecha: '2024-04-01', nombre: 'Evento Avianca' },
    ],
  },
  {
    id: 2, nombre: 'Tobogán Acuático 8m', codigo: 'TOB-002', categoria: 'Toboganes',
    total: 3, disponibles: 1, enUso: 1, mantenimiento: 1,
    ubicacion: 'Bodega B', estado: 'IN_USE', precioDia: 480000,
    specs: { 'Longitud': '8 m', 'Altura': '3.5 m', 'Peso máx.': '120 kg', 'Presión': '0.3 bar' },
    proximosEventos: [
      { fecha: '2024-04-10', nombre: 'Evento Postobón' },
    ],
  },
  {
    id: 3, nombre: 'Laberinto Inflable 3D', codigo: 'LAB-003', categoria: 'Laberintos',
    total: 2, disponibles: 2, enUso: 0, mantenimiento: 0,
    ubicacion: 'Bodega A', estado: 'AVAILABLE', precioDia: 420000,
    specs: { 'Dimensiones': '10×8 m', 'Altura': '2.5 m', 'Capacidad': '20 personas', 'Peso': '180 kg' },
    proximosEventos: [],
  },
  {
    id: 4, nombre: 'Piscina de Pelotas XL', codigo: 'PIS-004', categoria: 'Piscinas',
    total: 4, disponibles: 0, enUso: 3, mantenimiento: 1,
    ubicacion: 'Bodega C', estado: 'MAINTENANCE', precioDia: 280000,
    specs: { 'Dimensiones': '4×4 m', 'Profundidad': '0.8 m', 'Capacidad': '500 pelotas', 'Peso': '45 kg' },
    proximosEventos: [],
  },
  {
    id: 5, nombre: 'Cama Elástica 5m', codigo: 'CAM-005', categoria: 'Camas elásticas',
    total: 6, disponibles: 4, enUso: 2, mantenimiento: 0,
    ubicacion: 'Bodega B', estado: 'AVAILABLE', precioDia: 200000,
    specs: { 'Diámetro': '5 m', 'Resortes': '72 uds', 'Peso máx.': '150 kg', 'Altura red': '3 m' },
    proximosEventos: [
      { fecha: '2024-05-05', nombre: 'Evento Cencosud' },
    ],
  },
  {
    id: 6, nombre: 'Muro de Escalar 6m', codigo: 'MUR-006', categoria: 'Muros',
    total: 1, disponibles: 0, enUso: 0, mantenimiento: 1,
    ubicacion: 'Bodega A', estado: 'DAMAGED', precioDia: 550000,
    specs: { 'Altura': '6 m', 'Ancho': '3 m', 'Agarraderas': '80 uds', 'Peso': '220 kg' },
    proximosEventos: [],
  },
  {
    id: 7, nombre: 'Castillo Medieval M', codigo: 'INF-007', categoria: 'Castillos',
    total: 3, disponibles: 3, enUso: 0, mantenimiento: 0,
    ubicacion: 'Bodega A', estado: 'AVAILABLE', precioDia: 280000,
    specs: { 'Dimensiones': '4×4 m', 'Peso máx.': '200 kg', 'Capacidad': '6 niños', 'Material': 'PVC 0.45mm' },
    proximosEventos: [
      { fecha: '2024-06-01', nombre: 'Evento Cementos Argos' },
    ],
  },
  {
    id: 8, nombre: 'Hamster Ball Gigante', codigo: 'HAM-008', categoria: 'Especiales',
    total: 2, disponibles: 2, enUso: 0, mantenimiento: 0,
    ubicacion: 'Bodega C', estado: 'AVAILABLE', precioDia: 650000,
    specs: { 'Diámetro': '2 m', 'Peso máx.': '120 kg', 'Material': 'TPU 0.8mm', 'Uso': 'Piscina/tierra' },
    proximosEventos: [],
  },
]
</script>

<style scoped>
.inv-wrap { display: flex; flex-direction: column; gap: 16px; }

/* ── Filter bar ───────────────────────────────────────── */
.filter-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.filter-search { position: relative; flex: 1; min-width: 180px; }

.fs-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}

.fs-input {
  width: 100%;
  padding: 8px 12px 8px 34px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  background: #FFFFFF;
  outline: none;
  transition: border-color 0.15s;
}

.fs-input:focus { border-color: #054EAF; }

.filter-select {
  padding: 8px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  color: #64748B;
  background: #FFFFFF;
  outline: none;
  cursor: pointer;
}

.filter-select:focus { border-color: #054EAF; color: #0F1A2E; }

.filter-clear {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid #FCA5A5;
  border-radius: 10px;
  background: #FEE2E2;
  color: #B91C1C;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  cursor: pointer;
}

.filter-clear:hover { background: #FECACA; }

/* ── Cell: item foto + nombre ─────────────────────────── */
.item-cell { display: flex; align-items: center; gap: 10px; }

.item-photo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #EBF3FC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-info { display: flex; flex-direction: column; gap: 2px; }
.item-name { font-weight: 600; font-size: 13px; color: #0F1A2E; }
.item-code { font-size: 11px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; }

/* ── Cell: categoría ──────────────────────────────────── */
.cat-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  background: #F1F5F9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
}

/* ── Cell: disponibilidad ─────────────────────────────── */
.avail-wrap { display: flex; align-items: center; gap: 10px; min-width: 120px; }

.avail-bar {
  flex: 1;
  height: 4px;
  background: #F1F5F9;
  border-radius: 99px;
  position: relative;
  overflow: hidden;
}

.avail-fill {
  position: absolute;
  height: 100%;
  top: 0;
  border-radius: 99px;
  transition: width 0.4s ease;
}

.avail-green { background: #22C55E; }
.avail-blue  { background: #3B82F6; }
.avail-amber { background: #F59E0B; }

.avail-text { font-size: 12px; font-weight: 600; color: #64748B; white-space: nowrap; }

/* ── Cell: precio ─────────────────────────────────────── */
.precio-cell { font-weight: 600; color: #0F1A2E; font-size: 13px; }
.precio-unit { font-size: 10px; color: #94A3B8; font-weight: 400; }

/* ── Acciones ─────────────────────────────────────────── */
.action-group { display: flex; gap: 4px; }

.act-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid #EEF1F7;
  background: #FFFFFF;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
}

.act-btn:hover    { background: #EEF4FF; color: #054EAF; border-color: #BFDBFE; }
.act-danger:hover { background: #FEE2E2; color: #B91C1C; border-color: #FCA5A5; }

/* ── Expandido ────────────────────────────────────────── */
.exp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 640px) { .exp-grid { grid-template-columns: 1fr; } }

.exp-section { display: flex; flex-direction: column; gap: 10px; }

.exp-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.spec-list { display: flex; flex-direction: column; gap: 6px; }

.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #EEF1F7;
}

.spec-key { font-size: 12px; color: #94A3B8; font-weight: 500; }
.spec-val { font-size: 12px; color: #0F1A2E; font-weight: 600; }

.event-list { display: flex; flex-direction: column; gap: 6px; }

.event-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #EEF1F7;
}

.ev-ico    { color: #054EAF; flex-shrink: 0; }
.ev-fecha  { font-size: 11px; color: #64748B; min-width: 80px; }
.ev-nombre { font-size: 12px; color: #0F1A2E; font-weight: 500; }
.ev-empty  { font-size: 12px; color: #94A3B8; margin: 0; }
</style>
