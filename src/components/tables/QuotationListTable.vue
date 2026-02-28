<template>
  <div class="qlt-wrap">

    <!-- ── KPI chips ────────────────────────────────── -->
    <div class="kpi-row">
      <div v-for="k in kpis" :key="k.label" class="kpi-chip" :class="`kpi-${k.color}`">
        <component :is="k.icon" :size="14" class="kpi-ico" />
        <span class="kpi-val">{{ k.value }}</span>
        <span class="kpi-lbl">{{ k.label }}</span>
      </div>
    </div>

    <!-- ── Filtros ───────────────────────────────────── -->
    <div class="filter-bar">
      <div class="filter-search">
        <Search :size="13" class="fs-ico" />
        <input v-model="search" class="fs-input" placeholder="Buscar cotización, cliente…" />
      </div>
      <select v-model="filterEstado"  class="filter-select">
        <option value="">Todos los estados</option>
        <option value="DRAFT">Borrador</option>
        <option value="SENT">Enviada</option>
        <option value="CONFIRMED">Confirmada</option>
        <option value="IN_PROCESS">En proceso</option>
        <option value="EXPIRED">Vencida</option>
        <option value="CANCELLED">Cancelada</option>
      </select>
      <select v-model="filterCiudad" class="filter-select">
        <option value="">Todas las ciudades</option>
        <option v-for="c in ciudades" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filterMes"    class="filter-select">
        <option value="">Todos los meses</option>
        <option v-for="m in meses" :key="m.value" :value="m.value">{{ m.label }}</option>
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
      empty-text="No se encontraron cotizaciones"
      @row-click="onRowClick"
    >
      <!-- Número -->
      <template #cell-numero="{ value }">
        <span class="mono">{{ value }}</span>
      </template>

      <!-- Cliente (2 líneas) -->
      <template #cell-cliente="{ row }">
        <div class="client-cell">
          <span class="client-name">{{ row.cliente }}</span>
          <span class="client-nit">{{ row.nit }}</span>
        </div>
      </template>

      <!-- Tipo evento pill -->
      <template #cell-tipoEvento="{ value }">
        <span class="tipo-pill">{{ value }}</span>
      </template>

      <!-- Días hasta el evento -->
      <template #cell-diasRestantes="{ value }">
        <span
          class="dias-badge"
          :class="value < 7 ? 'dias-urgent' : value < 30 ? 'dias-warn' : 'dias-ok'"
        >{{ value }}d</span>
      </template>

      <!-- Valor COP -->
      <template #cell-valor="{ value }">
        <span class="valor-cell">{{ formatCOP(value) }}</span>
      </template>

      <!-- Estado -->
      <template #cell-estado="{ value }">
        <BadgeStatus :status="value" type="quotation" />
      </template>

      <!-- Acciones -->
      <template #cell-acciones="{ row }">
        <div class="action-group">
          <button class="act-btn" title="Ver" @click.stop="emit('action', { type: 'view',   row })"><Eye    :size="14" /></button>
          <button class="act-btn" title="Editar" @click.stop="emit('action', { type: 'edit',   row })"><Pencil :size="14" /></button>
          <button class="act-btn" title="Duplicar" @click.stop="emit('action', { type: 'copy',   row })"><Copy   :size="14" /></button>
          <button class="act-btn act-danger" title="Eliminar" @click.stop="emit('action', { type: 'delete', row })"><Trash2 :size="14" /></button>
        </div>
      </template>

      <!-- Fila expandida -->
      <template #expanded="{ row }">
        <div class="exp-grid">
          <div class="exp-field">
            <span class="exp-label">Contacto</span>
            <span class="exp-val">{{ row.contacto }}</span>
          </div>
          <div class="exp-field">
            <span class="exp-label">Agente comercial</span>
            <span class="exp-val">{{ row.agente }}</span>
          </div>
          <div class="exp-field">
            <span class="exp-label">Ciudad evento</span>
            <span class="exp-val">{{ row.ciudad }}</span>
          </div>
          <div class="exp-field">
            <span class="exp-label">Vigencia</span>
            <span class="exp-val">{{ row.vigencia }}</span>
          </div>
          <div class="exp-field">
            <span class="exp-label">Observaciones</span>
            <span class="exp-val">{{ row.observaciones || '—' }}</span>
          </div>
        </div>
        <div class="exp-actions">
          <button class="exp-btn-primary" @click="emit('action', { type: 'view', row })">
            <Eye :size="13" /> Ver cotización completa
          </button>
        </div>
      </template>
    </BaseTable>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, X, Eye, Pencil, Copy, Trash2, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import BaseTable   from '@/components/ui/BaseTable.vue'
import BadgeStatus from '@/components/ui/BadgeStatus.vue'

const emit = defineEmits(['action', 'row-click'])

// ── Props ────────────────────────────────────────────────
const props = defineProps({
  rows:    { type: Array,   default: () => mockRows },
  loading: { type: Boolean, default: false },
})

// ── Columnas ─────────────────────────────────────────────
const columns = [
  { key: 'numero',        label: '#',             width: '110px' },
  { key: 'cliente',       label: 'Cliente',       width: '200px' },
  { key: 'tipoEvento',    label: 'Tipo evento',   width: '140px' },
  { key: 'fechaEvento',   label: 'Fecha evento',  width: '120px' },
  { key: 'diasRestantes', label: 'Faltan',        width: '80px'  },
  { key: 'valor',         label: 'Valor',         width: '130px' },
  { key: 'estado',        label: 'Estado',        width: '130px' },
  { key: 'acciones',      label: '',              width: '120px' },
]

// ── Filtros ──────────────────────────────────────────────
const search       = ref('')
const filterEstado = ref('')
const filterCiudad = ref('')
const filterMes    = ref('')

const hasFilters = computed(() =>
  search.value || filterEstado.value || filterCiudad.value || filterMes.value,
)

const clearFilters = () => {
  search.value = filterEstado.value = filterCiudad.value = filterMes.value = ''
}

const ciudades = computed(() => [...new Set(props.rows.map(r => r.ciudad))])

const meses = [
  { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Sep.' },  { value: '10', label: 'Oct.' },
  { value: '11', label: 'Nov.' },  { value: '12', label: 'Dic.' },
]

const filtered = computed(() => {
  let r = props.rows
  if (search.value) {
    const q = search.value.toLowerCase()
    r = r.filter(x => x.numero.toLowerCase().includes(q) || x.cliente.toLowerCase().includes(q))
  }
  if (filterEstado.value) r = r.filter(x => x.estado === filterEstado.value)
  if (filterCiudad.value) r = r.filter(x => x.ciudad === filterCiudad.value)
  if (filterMes.value)    r = r.filter(x => x.fechaEvento?.slice(5, 7) === filterMes.value)
  return r
})

// ── KPIs ─────────────────────────────────────────────────
const kpis = computed(() => {
  const rows = props.rows
  return [
    { label: 'Total',      value: rows.length,                                        color: 'blue',   icon: FileText     },
    { label: 'Confirmadas',value: rows.filter(r => r.estado === 'CONFIRMED').length,  color: 'green',  icon: CheckCircle2 },
    { label: 'En proceso', value: rows.filter(r => r.estado === 'IN_PROCESS').length, color: 'amber',  icon: Clock        },
    { label: 'Vencidas',   value: rows.filter(r => r.estado === 'EXPIRED').length,    color: 'red',    icon: AlertCircle  },
  ]
})

// ── Helpers ───────────────────────────────────────────────
const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

const onRowClick = (row) => emit('row-click', row)

// ── Mock data ─────────────────────────────────────────────
// TODO: Conectar con GET /api/cotizaciones
const mockRows = [
  { id: 1,  numero: 'COT-2024-001', cliente: 'Grupo Éxito S.A.',       nit: '860.502.060-5', tipoEvento: 'Corporativo',  fechaEvento: '2024-03-15', diasRestantes: 12,  valor: 4800000,  estado: 'CONFIRMED',  ciudad: 'Bogotá',     contacto: 'Laura Reyes',    agente: 'Carlos Mora',    vigencia: '2024-03-05', observaciones: 'Requiere inflables medianos' },
  { id: 2,  numero: 'COT-2024-002', cliente: 'Bancolombia S.A.',        nit: '890.903.938-8', tipoEvento: 'Lanzamiento',  fechaEvento: '2024-03-22', diasRestantes: 19,  valor: 8200000,  estado: 'SENT',       ciudad: 'Medellín',   contacto: 'Jorge Pérez',    agente: 'Ana Gómez',      vigencia: '2024-03-12', observaciones: '' },
  { id: 3,  numero: 'COT-2024-003', cliente: 'Avianca Holdings',        nit: '900.123.456-1', tipoEvento: 'Recreativo',   fechaEvento: '2024-04-01', diasRestantes: 29,  valor: 3100000,  estado: 'IN_PROCESS', ciudad: 'Bogotá',     contacto: 'María López',    agente: 'Carlos Mora',    vigencia: '2024-03-20', observaciones: 'Parque recreativo 2 días' },
  { id: 4,  numero: 'COT-2024-004', cliente: 'Postobón S.A.',           nit: '890.100.279-1', tipoEvento: 'Infantil',     fechaEvento: '2024-04-10', diasRestantes: 38,  valor: 1950000,  estado: 'DRAFT',      ciudad: 'Cali',       contacto: 'Pedro Salcedo',  agente: 'Luisa Torres',   vigencia: '2024-03-30', observaciones: '' },
  { id: 5,  numero: 'COT-2024-005', cliente: 'Colpatria S.A.',          nit: '860.001.274-6', tipoEvento: 'Corporativo',  fechaEvento: '2024-02-20', diasRestantes: -5,  valor: 6700000,  estado: 'EXPIRED',    ciudad: 'Bogotá',     contacto: 'Sandra Ríos',    agente: 'Ana Gómez',      vigencia: '2024-02-10', observaciones: 'Solicitud de extensión' },
  { id: 6,  numero: 'COT-2024-006', cliente: 'Cencosud Colombia',       nit: '900.465.332-2', tipoEvento: 'Recreativo',   fechaEvento: '2024-05-05', diasRestantes: 63,  valor: 5500000,  estado: 'CONFIRMED',  ciudad: 'Bogotá',     contacto: 'Andrés Mora',    agente: 'Carlos Mora',    vigencia: '2024-04-25', observaciones: '' },
  { id: 7,  numero: 'COT-2024-007', cliente: 'Alpina Productos',        nit: '890.200.756-4', tipoEvento: 'Lanzamiento',  fechaEvento: '2024-05-15', diasRestantes: 73,  valor: 7300000,  estado: 'SENT',       ciudad: 'Bogotá',     contacto: 'Valentina Cruz', agente: 'Luisa Torres',   vigencia: '2024-05-05', observaciones: '' },
  { id: 8,  numero: 'COT-2024-008', cliente: 'Cementos Argos',          nit: '890.100.655-5', tipoEvento: 'Corporativo',  fechaEvento: '2024-06-01', diasRestantes: 90,  valor: 9400000,  estado: 'IN_PROCESS', ciudad: 'Barranquilla',contacto: 'Felipe Díaz',    agente: 'Ana Gómez',      vigencia: '2024-05-22', observaciones: 'Evento 500 personas' },
  { id: 9,  numero: 'COT-2024-009', cliente: 'Ecopetrol S.A.',          nit: '899.999.068-1', tipoEvento: 'Infantil',     fechaEvento: '2024-06-15', diasRestantes: 104, valor: 2800000,  estado: 'CONFIRMED',  ciudad: 'Bogotá',     contacto: 'Mónica Vargas',  agente: 'Carlos Mora',    vigencia: '2024-06-05', observaciones: '' },
  { id: 10, numero: 'COT-2024-010', cliente: 'Bavaria S.A.',            nit: '860.034.313-3', tipoEvento: 'Recreativo',   fechaEvento: '2024-07-04', diasRestantes: 123, valor: 11200000, estado: 'SENT',       ciudad: 'Bogotá',     contacto: 'Luis Herrera',   agente: 'Luisa Torres',   vigencia: '2024-06-25', observaciones: '' },
  { id: 11, numero: 'COT-2024-011', cliente: 'ISA Intercolombia',       nit: '811.002.429-6', tipoEvento: 'Corporativo',  fechaEvento: '2024-07-20', diasRestantes: 139, valor: 6100000,  estado: 'DRAFT',      ciudad: 'Medellín',   contacto: 'Clara Ospina',   agente: 'Ana Gómez',      vigencia: '2024-07-10', observaciones: '' },
  { id: 12, numero: 'COT-2024-012', cliente: 'Tecnoquímicas S.A.',      nit: '890.310.995-5', tipoEvento: 'Lanzamiento',  fechaEvento: '2024-08-01', diasRestantes: 151, valor: 4200000,  estado: 'CANCELLED',  ciudad: 'Cali',       contacto: 'Rodrigo Leal',   agente: 'Carlos Mora',    vigencia: '2024-07-22', observaciones: 'Cliente canceló por presupuesto' },
]
</script>

<style scoped>
.qlt-wrap { display: flex; flex-direction: column; gap: 16px; }

/* ── KPI chips ────────────────────────────────────────── */
.kpi-row { display: flex; gap: 10px; flex-wrap: wrap; }

.kpi-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 99px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: default;
}

.kpi-val { font-size: 15px; font-weight: 700; }
.kpi-lbl { font-weight: 500; opacity: 0.85; }

.kpi-blue   { background: #EEF4FF; color: #1D4ED8; }
.kpi-green  { background: #DCFCE7; color: #15803D; }
.kpi-amber  { background: #FEF3C7; color: #B45309; }
.kpi-red    { background: #FEE2E2; color: #B91C1C; }

/* ── Filter bar ───────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-search {
  position: relative;
  flex: 1;
  min-width: 180px;
}

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

/* ── Cell: numero ─────────────────────────────────────── */
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #054EAF; font-weight: 600; }

/* ── Cell: cliente ────────────────────────────────────── */
.client-cell { display: flex; flex-direction: column; gap: 2px; }
.client-name { font-weight: 600; font-size: 13px; color: #0F1A2E; }
.client-nit  { font-size: 11px; color: #94A3B8; }

/* ── Cell: tipo evento ────────────────────────────────── */
.tipo-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  background: #F1F5F9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
}

/* ── Cell: días ───────────────────────────────────────── */
.dias-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.dias-urgent { background: #FEE2E2; color: #B91C1C; }
.dias-warn   { background: #FEF3C7; color: #B45309; }
.dias-ok     { background: #DCFCE7; color: #15803D; }

/* ── Cell: valor ──────────────────────────────────────── */
.valor-cell { font-weight: 600; color: #0F1A2E; font-size: 13px; }

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

.act-btn:hover { background: #EEF4FF; color: #054EAF; border-color: #BFDBFE; }
.act-danger:hover { background: #FEE2E2; color: #B91C1C; border-color: #FCA5A5; }

/* ── Expandido ────────────────────────────────────────── */
.exp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.exp-field { display: flex; flex-direction: column; gap: 4px; }
.exp-label { font-size: 10px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }
.exp-val   { font-size: 13px; color: #0F1A2E; font-weight: 500; }

.exp-actions { display: flex; gap: 8px; }

.exp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: #054EAF;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.exp-btn-primary:hover { background: #0342A0; }
</style>
