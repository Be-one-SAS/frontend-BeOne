<template>
  <div class="clt-wrap">

    <!-- ── Filtros ───────────────────────────────────── -->
    <div class="filter-bar">
      <div class="filter-search">
        <Search :size="13" class="fs-ico" />
        <input v-model="search" class="fs-input" placeholder="Buscar cliente, NIT…" />
      </div>
      <select v-model="filterTipo"   class="filter-select">
        <option value="">Todos los tipos</option>
        <option value="EMPRESA">Empresa</option>
        <option value="PERSONA">Persona natural</option>
      </select>
      <select v-model="filterEstado" class="filter-select">
        <option value="">Todos los estados</option>
        <option value="ACTIVE">Activo</option>
        <option value="INACTIVE">Inactivo</option>
        <option value="PROSPECT">Prospecto</option>
        <option value="VIP">VIP</option>
      </select>
      <select v-model="filterCiudad" class="filter-select">
        <option value="">Todas las ciudades</option>
        <option v-for="c in ciudades" :key="c" :value="c">{{ c }}</option>
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
      empty-text="No se encontraron clientes"
      @row-click="onRowClick"
    >
      <!-- Avatar + nombre -->
      <template #cell-nombre="{ row }">
        <div class="name-cell">
          <div class="avatar" :style="avatarStyle(row.nombre)">
            {{ initials(row.nombre) }}
          </div>
          <div class="name-info">
            <span class="name-main">{{ row.nombre }}</span>
            <span class="name-sub">{{ row.nit }}</span>
          </div>
        </div>
      </template>

      <!-- Tipo -->
      <template #cell-tipo="{ value }">
        <span class="tipo-pill">{{ value === 'EMPRESA' ? 'Empresa' : 'Persona' }}</span>
      </template>

      <!-- Ciudad -->
      <template #cell-ciudad="{ value }">
        <span class="ciudad-cell"><MapPin :size="11" /> {{ value }}</span>
      </template>

      <!-- Cotizaciones -->
      <template #cell-cotizaciones="{ value }">
        <span class="num-badge">{{ value }}</span>
      </template>

      <!-- Valor total -->
      <template #cell-valorTotal="{ value }">
        <span class="valor-cell">{{ formatCOP(value) }}</span>
      </template>

      <!-- Estado -->
      <template #cell-estado="{ value }">
        <BadgeStatus :status="value" type="client" />
      </template>

      <!-- Acciones -->
      <template #cell-acciones="{ row }">
        <div class="action-group">
          <button class="act-btn" title="Ver"           @click.stop="emit('action', { type: 'view',     row })"><Eye      :size="14" /></button>
          <button class="act-btn" title="Editar"        @click.stop="emit('action', { type: 'edit',     row })"><Pencil   :size="14" /></button>
          <button class="act-btn" title="Cotizaciones"  @click.stop="emit('action', { type: 'quotes',   row })"><FileText :size="14" /></button>
          <button class="act-btn act-danger" title="Eliminar" @click.stop="emit('action', { type: 'delete',  row })"><Trash2   :size="14" /></button>
        </div>
      </template>

      <!-- Fila expandida -->
      <template #expanded="{ row }">
        <div class="exp-content">
          <p class="exp-section-title">Últimas cotizaciones</p>
          <div class="exp-quotes">
            <div v-for="q in row.ultimasCotizaciones" :key="q.numero" class="exp-quote-row">
              <span class="eq-num">{{ q.numero }}</span>
              <span class="eq-fecha">{{ q.fecha }}</span>
              <span class="eq-val">{{ formatCOP(q.valor) }}</span>
              <BadgeStatus :status="q.estado" type="quotation" />
            </div>
          </div>
          <div class="exp-summary">
            <span class="exp-label">Valor total acumulado</span>
            <span class="exp-total">{{ formatCOP(row.valorTotal) }}</span>
          </div>
        </div>
      </template>
    </BaseTable>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, X, Eye, Pencil, FileText, Trash2, MapPin } from 'lucide-vue-next'
import BaseTable   from '@/components/ui/BaseTable.vue'
import BadgeStatus from '@/components/ui/BadgeStatus.vue'

const emit = defineEmits(['action', 'row-click'])

const props = defineProps({
  rows:    { type: Array,   default: () => mockRows },
  loading: { type: Boolean, default: false },
})

// ── Columnas ─────────────────────────────────────────────
const columns = [
  { key: 'nombre',       label: 'Cliente',       width: '220px' },
  { key: 'tipo',         label: 'Tipo',          width: '110px' },
  { key: 'ciudad',       label: 'Ciudad',        width: '130px' },
  { key: 'contacto',     label: 'Contacto',      width: '150px' },
  { key: 'telefono',     label: 'Teléfono',      width: '120px' },
  { key: 'cotizaciones', label: 'Cotizaciones',  width: '110px' },
  { key: 'valorTotal',   label: 'Valor total',   width: '140px' },
  { key: 'estado',       label: 'Estado',        width: '120px' },
  { key: 'acciones',     label: '',              width: '120px' },
]

// ── Filtros ──────────────────────────────────────────────
const search       = ref('')
const filterTipo   = ref('')
const filterEstado = ref('')
const filterCiudad = ref('')

const hasFilters = computed(() =>
  search.value || filterTipo.value || filterEstado.value || filterCiudad.value,
)

const clearFilters = () => {
  search.value = filterTipo.value = filterEstado.value = filterCiudad.value = ''
}

const ciudades = computed(() => [...new Set(props.rows.map(r => r.ciudad))])

const filtered = computed(() => {
  let r = props.rows
  if (search.value) {
    const q = search.value.toLowerCase()
    r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.nit.toLowerCase().includes(q))
  }
  if (filterTipo.value)   r = r.filter(x => x.tipo   === filterTipo.value)
  if (filterEstado.value) r = r.filter(x => x.estado === filterEstado.value)
  if (filterCiudad.value) r = r.filter(x => x.ciudad === filterCiudad.value)
  return r
})

// ── Avatar helpers ────────────────────────────────────────
const PALETTE = ['#054EAF', '#6D28D9', '#0F766E', '#B45309', '#9D174D', '#065F46']

const initials = (name) => {
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

const hashColor = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

const avatarStyle = (name) => {
  const bg = hashColor(name)
  return { background: bg, color: '#FFFFFF' }
}

// ── Helpers ───────────────────────────────────────────────
const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

const onRowClick = (row) => emit('row-click', row)

// ── Mock data ─────────────────────────────────────────────
// TODO: Conectar con GET /api/clientes
const mockRows = [
  {
    id: 1, nombre: 'Grupo Éxito S.A.', nit: '860.502.060-5', tipo: 'EMPRESA',
    ciudad: 'Bogotá', contacto: 'Laura Reyes', telefono: '310 456 7890',
    cotizaciones: 8, valorTotal: 42000000, estado: 'VIP',
    ultimasCotizaciones: [
      { numero: 'COT-2024-001', fecha: '2024-03-01', valor: 4800000, estado: 'CONFIRMED' },
      { numero: 'COT-2023-045', fecha: '2023-11-15', valor: 7200000, estado: 'CONFIRMED' },
      { numero: 'COT-2023-031', fecha: '2023-09-08', valor: 3900000, estado: 'EXPIRED'   },
    ],
  },
  {
    id: 2, nombre: 'Bancolombia S.A.', nit: '890.903.938-8', tipo: 'EMPRESA',
    ciudad: 'Medellín', contacto: 'Jorge Pérez', telefono: '320 789 1234',
    cotizaciones: 5, valorTotal: 31500000, estado: 'ACTIVE',
    ultimasCotizaciones: [
      { numero: 'COT-2024-002', fecha: '2024-03-05', valor: 8200000, estado: 'SENT'      },
      { numero: 'COT-2023-062', fecha: '2023-12-20', valor: 5100000, estado: 'CONFIRMED' },
      { numero: 'COT-2023-050', fecha: '2023-10-30', valor: 4800000, estado: 'CONFIRMED' },
    ],
  },
  {
    id: 3, nombre: 'Avianca Holdings', nit: '900.123.456-1', tipo: 'EMPRESA',
    ciudad: 'Bogotá', contacto: 'María López', telefono: '315 234 5678',
    cotizaciones: 3, valorTotal: 12400000, estado: 'ACTIVE',
    ultimasCotizaciones: [
      { numero: 'COT-2024-003', fecha: '2024-02-28', valor: 3100000, estado: 'IN_PROCESS' },
      { numero: 'COT-2023-040', fecha: '2023-10-10', valor: 5200000, estado: 'CONFIRMED'  },
      { numero: 'COT-2023-025', fecha: '2023-07-22', valor: 4100000, estado: 'CONFIRMED'  },
    ],
  },
  {
    id: 4, nombre: 'Postobón S.A.', nit: '890.100.279-1', tipo: 'EMPRESA',
    ciudad: 'Cali', contacto: 'Pedro Salcedo', telefono: '300 123 9876',
    cotizaciones: 2, valorTotal: 4900000, estado: 'PROSPECT',
    ultimasCotizaciones: [
      { numero: 'COT-2024-004', fecha: '2024-03-08', valor: 1950000, estado: 'DRAFT'     },
      { numero: 'COT-2023-058', fecha: '2023-12-01', valor: 2950000, estado: 'CANCELLED' },
    ],
  },
  {
    id: 5, nombre: 'Ecopetrol S.A.', nit: '899.999.068-1', tipo: 'EMPRESA',
    ciudad: 'Bogotá', contacto: 'Mónica Vargas', telefono: '311 987 6543',
    cotizaciones: 6, valorTotal: 38700000, estado: 'VIP',
    ultimasCotizaciones: [
      { numero: 'COT-2024-009', fecha: '2024-03-12', valor: 2800000, estado: 'CONFIRMED' },
      { numero: 'COT-2023-071', fecha: '2024-01-15', valor: 9600000, estado: 'CONFIRMED' },
      { numero: 'COT-2023-055', fecha: '2023-11-28', valor: 7400000, estado: 'CONFIRMED' },
    ],
  },
  {
    id: 6, nombre: 'Colpatria S.A.', nit: '860.001.274-6', tipo: 'EMPRESA',
    ciudad: 'Bogotá', contacto: 'Sandra Ríos', telefono: '318 345 2109',
    cotizaciones: 1, valorTotal: 6700000, estado: 'INACTIVE',
    ultimasCotizaciones: [
      { numero: 'COT-2024-005', fecha: '2024-02-01', valor: 6700000, estado: 'EXPIRED' },
    ],
  },
  {
    id: 7, nombre: 'Bavaria S.A.', nit: '860.034.313-3', tipo: 'EMPRESA',
    ciudad: 'Bogotá', contacto: 'Luis Herrera', telefono: '312 567 8901',
    cotizaciones: 4, valorTotal: 28900000, estado: 'ACTIVE',
    ultimasCotizaciones: [
      { numero: 'COT-2024-010', fecha: '2024-03-15', valor: 11200000, estado: 'SENT'      },
      { numero: 'COT-2023-068', fecha: '2024-01-08', valor:  7300000, estado: 'CONFIRMED' },
      { numero: 'COT-2023-052', fecha: '2023-11-10', valor:  6100000, estado: 'CONFIRMED' },
    ],
  },
  {
    id: 8, nombre: 'Cementos Argos', nit: '890.100.655-5', tipo: 'EMPRESA',
    ciudad: 'Barranquilla', contacto: 'Felipe Díaz', telefono: '317 890 1234',
    cotizaciones: 2, valorTotal: 14500000, estado: 'ACTIVE',
    ultimasCotizaciones: [
      { numero: 'COT-2024-008', fecha: '2024-03-10', valor: 9400000, estado: 'IN_PROCESS' },
      { numero: 'COT-2023-060', fecha: '2023-12-05', valor: 5100000, estado: 'CONFIRMED'  },
    ],
  },
]
</script>

<style scoped>
.clt-wrap { display: flex; flex-direction: column; gap: 16px; }

/* ── Filter bar ───────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

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
  transition: border-color 0.15s;
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
  transition: all 0.12s;
}

.filter-clear:hover { background: #FECACA; }

/* ── Cell: avatar + nombre ────────────────────────────── */
.name-cell { display: flex; align-items: center; gap: 10px; }

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.name-info { display: flex; flex-direction: column; gap: 2px; }
.name-main { font-weight: 600; font-size: 13px; color: #0F1A2E; }
.name-sub  { font-size: 11px; color: #94A3B8; }

/* ── Cell: tipo ───────────────────────────────────────── */
.tipo-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  background: #F1F5F9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
}

/* ── Cell: ciudad ─────────────────────────────────────── */
.ciudad-cell {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #64748B;
  font-size: 13px;
}

/* ── Cell: num badge ──────────────────────────────────── */
.num-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  background: #EEF4FF;
  color: #054EAF;
  font-size: 12px;
  font-weight: 700;
}

/* ── Cell: valor ──────────────────────────────────────── */
.valor-cell { font-weight: 600; color: #0F1A2E; }

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
.exp-content { display: flex; flex-direction: column; gap: 12px; }

.exp-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.exp-quotes { display: flex; flex-direction: column; gap: 8px; }

.exp-quote-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #EEF1F7;
}

.eq-num   { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #054EAF; font-weight: 600; min-width: 120px; }
.eq-fecha { font-size: 12px; color: #64748B; min-width: 90px; }
.eq-val   { font-size: 13px; font-weight: 600; color: #0F1A2E; flex: 1; }

.exp-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #EEF1F7;
}

.exp-label { font-size: 12px; color: #94A3B8; font-weight: 500; }
.exp-total { font-size: 15px; font-weight: 700; color: #054EAF; }
</style>
