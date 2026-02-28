<template>
  <div class="elt-wrap">

    <!-- ── Filtros ───────────────────────────────────── -->
    <div class="filter-bar">
      <div class="filter-search">
        <Search :size="13" class="fs-ico" />
        <input v-model="search" class="fs-input" placeholder="Buscar evento, cliente…" />
      </div>
      <select v-model="filterTipo"   class="filter-select">
        <option value="">Todos los tipos</option>
        <option value="Corporativo">Corporativo</option>
        <option value="Infantil">Infantil</option>
        <option value="Recreativo">Recreativo</option>
        <option value="Lanzamiento">Lanzamiento</option>
      </select>
      <select v-model="filterEstado" class="filter-select">
        <option value="">Todos los estados</option>
        <option value="PLANNING">Planificación</option>
        <option value="CONFIRMED">Confirmado</option>
        <option value="IN_PROCESS">En proceso</option>
        <option value="COMPLETED">Completado</option>
        <option value="CANCELLED">Cancelado</option>
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
      empty-text="No se encontraron eventos"
      @row-click="onRowClick"
    >
      <!-- Nombre evento -->
      <template #cell-nombre="{ row }">
        <div class="ev-name-cell">
          <span class="ev-name">{{ row.nombre }}</span>
          <span class="ev-client">{{ row.cliente }}</span>
        </div>
      </template>

      <!-- Tipo -->
      <template #cell-tipo="{ value }">
        <span class="tipo-pill">{{ value }}</span>
      </template>

      <!-- Fecha -->
      <template #cell-fecha="{ value }">
        <span class="fecha-cell">{{ value }}</span>
      </template>

      <!-- Ciudad -->
      <template #cell-ciudad="{ value }">
        <div class="ciudad-cell"><MapPin :size="11" />{{ value }}</div>
      </template>

      <!-- Equipo (stacked avatars) -->
      <template #cell-equipo="{ row }">
        <div class="avatar-stack">
          <div
            v-for="(m, i) in row.equipo.slice(0, 3)"
            :key="m.nombre"
            class="stack-avatar"
            :style="{ ...avatarStyle(m.nombre), zIndex: 10 - i, left: `${i * 20}px` }"
            :title="m.nombre"
          >
            {{ initials(m.nombre) }}
          </div>
          <div
            v-if="row.equipo.length > 3"
            class="stack-avatar stack-more"
            :style="{ left: `${3 * 20}px`, zIndex: 7 }"
          >
            +{{ row.equipo.length - 3 }}
          </div>
          <span class="stack-spacer" :style="`width:${Math.min(row.equipo.length, 4) * 20 + 8}px`"></span>
        </div>
      </template>

      <!-- Estado -->
      <template #cell-estado="{ value }">
        <BadgeStatus :status="value" type="event" />
      </template>

      <!-- Acciones -->
      <template #cell-acciones="{ row }">
        <div class="action-group">
          <button class="act-btn" title="Ver"      @click.stop="emit('action', { type: 'view',  row })"><Eye         :size="14" /></button>
          <button class="act-btn" title="Editar"   @click.stop="emit('action', { type: 'edit',  row })"><Pencil      :size="14" /></button>
          <button class="act-btn" title="Equipo"   @click.stop="emit('action', { type: 'team',  row })"><Users       :size="14" /></button>
          <button class="act-btn act-success" title="Completar" @click.stop="emit('action', { type: 'complete', row })"><CheckCircle :size="14" /></button>
        </div>
      </template>

      <!-- Fila expandida: timeline de hitos -->
      <template #expanded="{ row }">
        <div class="exp-content">
          <p class="exp-section-title">Línea de tiempo del evento</p>
          <div class="milestone-track">
            <div
              v-for="(ms, i) in milestones"
              :key="ms.key"
              class="milestone"
              :class="{
                'ms-done':    isMsDone(row, ms.key),
                'ms-current': isMsCurrent(row, ms.key),
                'ms-pending': !isMsDone(row, ms.key) && !isMsCurrent(row, ms.key),
              }"
            >
              <div class="ms-dot-wrap">
                <div class="ms-dot">
                  <Check v-if="isMsDone(row, ms.key)" :size="10" />
                  <span v-else-if="isMsCurrent(row, ms.key)" class="ms-pulse"></span>
                </div>
                <div v-if="i < milestones.length - 1" class="ms-line" :class="{ 'ms-line-done': isMsDone(row, ms.key) }"></div>
              </div>
              <span class="ms-label">{{ ms.label }}</span>
              <span class="ms-date">{{ row.hitos?.[ms.key] || '—' }}</span>
            </div>
          </div>

          <!-- Equipo completo -->
          <div class="exp-team-section">
            <p class="exp-section-title">Equipo asignado</p>
            <div class="exp-team-list">
              <div v-for="m in row.equipo" :key="m.nombre" class="exp-team-member">
                <div class="exp-avatar" :style="avatarStyle(m.nombre)">{{ initials(m.nombre) }}</div>
                <div class="exp-member-info">
                  <span class="exp-member-name">{{ m.nombre }}</span>
                  <span class="exp-member-role">{{ m.rol }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </BaseTable>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, X, Eye, Pencil, Users, CheckCircle, MapPin, Check } from 'lucide-vue-next'
import BaseTable   from '@/components/ui/BaseTable.vue'
import BadgeStatus from '@/components/ui/BadgeStatus.vue'

const emit = defineEmits(['action', 'row-click'])

const props = defineProps({
  rows:    { type: Array,   default: () => mockRows },
  loading: { type: Boolean, default: false },
})

// ── Columnas ─────────────────────────────────────────────
const columns = [
  { key: 'nombre',   label: 'Evento',    width: '220px' },
  { key: 'tipo',     label: 'Tipo',      width: '120px' },
  { key: 'fecha',    label: 'Fecha',     width: '120px' },
  { key: 'ciudad',   label: 'Ciudad',    width: '120px' },
  { key: 'equipo',   label: 'Equipo',    width: '130px' },
  { key: 'estado',   label: 'Estado',    width: '130px' },
  { key: 'acciones', label: '',          width: '120px' },
]

// ── Filtros ──────────────────────────────────────────────
const search       = ref('')
const filterTipo   = ref('')
const filterEstado = ref('')
const filterMes    = ref('')

const hasFilters = computed(() =>
  search.value || filterTipo.value || filterEstado.value || filterMes.value,
)
const clearFilters = () => { search.value = filterTipo.value = filterEstado.value = filterMes.value = '' }

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
    r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.cliente.toLowerCase().includes(q))
  }
  if (filterTipo.value)   r = r.filter(x => x.tipo   === filterTipo.value)
  if (filterEstado.value) r = r.filter(x => x.estado === filterEstado.value)
  if (filterMes.value)    r = r.filter(x => x.fecha?.slice(5, 7) === filterMes.value)
  return r
})

// ── Milestones ────────────────────────────────────────────
const milestones = [
  { key: 'cotizacion', label: 'Cotización'  },
  { key: 'confirmado', label: 'Confirmado'  },
  { key: 'montaje',    label: 'Montaje'     },
  { key: 'evento',     label: 'Evento'      },
  { key: 'desmontaje', label: 'Desmontaje'  },
]

const msOrder = { cotizacion: 1, confirmado: 2, montaje: 3, evento: 4, desmontaje: 5 }
const estadoMs = { PLANNING: 1, CONFIRMED: 2, IN_PROCESS: 3, COMPLETED: 5, CANCELLED: 0 }

const isMsDone    = (row, key) => (estadoMs[row.estado] ?? 0) > msOrder[key]
const isMsCurrent = (row, key) => (estadoMs[row.estado] ?? 0) === msOrder[key]

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

const avatarStyle = (name) => ({ background: hashColor(name), color: '#FFFFFF' })

const onRowClick = (row) => emit('row-click', row)

// ── Mock data ─────────────────────────────────────────────
// TODO: Conectar con GET /api/eventos
const mockRows = [
  {
    id: 1, nombre: 'Convención Anual 2024', cliente: 'Grupo Éxito S.A.',
    tipo: 'Corporativo', fecha: '2024-03-15', ciudad: 'Bogotá', estado: 'CONFIRMED',
    equipo: [
      { nombre: 'Carlos Mora',    rol: 'Coordinador'    },
      { nombre: 'Ana Gómez',      rol: 'Logística'      },
      { nombre: 'Pedro Ramos',    rol: 'Instalación'    },
      { nombre: 'Diana Torres',   rol: 'Apoyo'          },
    ],
    hitos: { cotizacion: '2024-02-15', confirmado: '2024-03-01', montaje: '2024-03-14', evento: '2024-03-15', desmontaje: '2024-03-16' },
  },
  {
    id: 2, nombre: 'Lanzamiento Producto X', cliente: 'Bancolombia S.A.',
    tipo: 'Lanzamiento', fecha: '2024-03-22', ciudad: 'Medellín', estado: 'IN_PROCESS',
    equipo: [
      { nombre: 'Luisa Torres',   rol: 'Coordinadora'   },
      { nombre: 'Marcos Ríos',    rol: 'Instalación'    },
    ],
    hitos: { cotizacion: '2024-02-20', confirmado: '2024-03-05', montaje: '2024-03-21', evento: '2024-03-22', desmontaje: '2024-03-23' },
  },
  {
    id: 3, nombre: 'Día de la Familia Avianca', cliente: 'Avianca Holdings',
    tipo: 'Recreativo', fecha: '2024-04-01', ciudad: 'Bogotá', estado: 'CONFIRMED',
    equipo: [
      { nombre: 'Carlos Mora',    rol: 'Coordinador'    },
      { nombre: 'Sara Vargas',    rol: 'Logística'      },
      { nombre: 'Luis Ospina',    rol: 'Instalación'    },
    ],
    hitos: { cotizacion: '2024-02-28', confirmado: '2024-03-10', montaje: '', evento: '2024-04-01', desmontaje: '' },
  },
  {
    id: 4, nombre: 'Fiesta Infantil Ecopetrol', cliente: 'Ecopetrol S.A.',
    tipo: 'Infantil', fecha: '2024-06-15', ciudad: 'Bogotá', estado: 'PLANNING',
    equipo: [
      { nombre: 'Ana Gómez',      rol: 'Coordinadora'   },
    ],
    hitos: { cotizacion: '2024-03-12', confirmado: '', montaje: '', evento: '2024-06-15', desmontaje: '' },
  },
  {
    id: 5, nombre: 'Copa Bavaria Summer', cliente: 'Bavaria S.A.',
    tipo: 'Recreativo', fecha: '2024-07-04', ciudad: 'Bogotá', estado: 'PLANNING',
    equipo: [
      { nombre: 'Luisa Torres',   rol: 'Coordinadora'   },
      { nombre: 'Felipe Díaz',    rol: 'Instalación'    },
      { nombre: 'Natalia Cruz',   rol: 'Apoyo'          },
      { nombre: 'Andrés Mora',    rol: 'Logística'      },
      { nombre: 'Camila Ruiz',    rol: 'Apoyo'          },
    ],
    hitos: { cotizacion: '2024-03-15', confirmado: '', montaje: '', evento: '2024-07-04', desmontaje: '' },
  },
  {
    id: 6, nombre: 'Team Building Argos', cliente: 'Cementos Argos',
    tipo: 'Corporativo', fecha: '2024-06-01', ciudad: 'Barranquilla', estado: 'CONFIRMED',
    equipo: [
      { nombre: 'Carlos Mora',    rol: 'Coordinador'    },
      { nombre: 'Jorge Pérez',    rol: 'Logística'      },
      { nombre: 'Sandra Ríos',    rol: 'Instalación'    },
    ],
    hitos: { cotizacion: '2024-03-10', confirmado: '2024-03-20', montaje: '', evento: '2024-06-01', desmontaje: '' },
  },
  {
    id: 7, nombre: 'Celebración 30 Años Alpina', cliente: 'Alpina Productos',
    tipo: 'Corporativo', fecha: '2024-05-15', ciudad: 'Bogotá', estado: 'IN_PROCESS',
    equipo: [
      { nombre: 'Ana Gómez',      rol: 'Coordinadora'   },
      { nombre: 'Pedro Ramos',    rol: 'Instalación'    },
    ],
    hitos: { cotizacion: '2024-03-05', confirmado: '2024-03-18', montaje: '2024-05-14', evento: '2024-05-15', desmontaje: '' },
  },
  {
    id: 8, nombre: 'Carnaval Cencosud Kids', cliente: 'Cencosud Colombia',
    tipo: 'Infantil', fecha: '2024-05-05', ciudad: 'Bogotá', estado: 'CONFIRMED',
    equipo: [
      { nombre: 'Luisa Torres',   rol: 'Coordinadora'   },
      { nombre: 'Marcos Ríos',    rol: 'Instalación'    },
      { nombre: 'Diana Torres',   rol: 'Apoyo'          },
    ],
    hitos: { cotizacion: '2024-03-01', confirmado: '2024-03-15', montaje: '', evento: '2024-05-05', desmontaje: '' },
  },
]
</script>

<style scoped>
.elt-wrap { display: flex; flex-direction: column; gap: 16px; }

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

/* ── Cell: nombre evento ──────────────────────────────── */
.ev-name-cell { display: flex; flex-direction: column; gap: 2px; }
.ev-name   { font-weight: 600; font-size: 13px; color: #0F1A2E; }
.ev-client { font-size: 11px; color: #94A3B8; }

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

/* ── Cell: fecha ──────────────────────────────────────── */
.fecha-cell { font-size: 13px; color: #0F1A2E; }

/* ── Cell: ciudad ─────────────────────────────────────── */
.ciudad-cell {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #64748B;
  font-size: 13px;
}

/* ── Cell: equipo (stacked avatars) ───────────────────── */
.avatar-stack {
  display: flex;
  align-items: center;
  position: relative;
  height: 28px;
}

.stack-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  position: absolute;
  top: 0;
  cursor: default;
}

.stack-more {
  background: #EEF4FF;
  color: #054EAF;
  border-color: #BFDBFE;
  font-size: 9px;
}

.stack-spacer { display: inline-block; height: 1px; }

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
.act-success:hover { background: #DCFCE7; color: #15803D; border-color: #86EFAC; }

/* ── Expandido: milestone timeline ────────────────────── */
.exp-content { display: flex; flex-direction: column; gap: 20px; }

.exp-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0 0 8px 0;
}

.milestone-track {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.milestone {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 6px;
  font-family: 'Inter', sans-serif;
}

.ms-dot-wrap {
  display: flex;
  align-items: center;
  width: 100%;
}

.ms-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #E2E8F0;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #FFFFFF;
  font-size: 10px;
  transition: all 0.25s;
  z-index: 1;
}

.ms-line {
  flex: 1;
  height: 2px;
  background: #E2E8F0;
  transition: background 0.25s;
}

.ms-done .ms-dot {
  background: #054EAF;
  border-color: #054EAF;
}

.ms-current .ms-dot {
  border-color: #054EAF;
  background: #EEF4FF;
  position: relative;
}

.ms-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #054EAF;
  animation: pulse 1.6s ease infinite;
  display: block;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.6); }
}

.ms-line-done { background: #054EAF; }

.ms-label {
  font-size: 10px;
  font-weight: 600;
  color: #94A3B8;
  text-align: center;
  margin-top: 2px;
}

.ms-done    .ms-label,
.ms-current .ms-label { color: #054EAF; }

.ms-date {
  font-size: 10px;
  color: #CBD5E1;
  text-align: center;
}

.ms-done    .ms-date,
.ms-current .ms-date { color: #64748B; }

/* ── Equipo expandido ─────────────────────────────────── */
.exp-team-section { }

.exp-team-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.exp-team-member {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #FFFFFF;
  border: 1px solid #EEF1F7;
  border-radius: 10px;
}

.exp-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.exp-member-info { display: flex; flex-direction: column; gap: 1px; }
.exp-member-name { font-size: 12px; font-weight: 600; color: #0F1A2E; }
.exp-member-role { font-size: 10px; color: #94A3B8; }
</style>
