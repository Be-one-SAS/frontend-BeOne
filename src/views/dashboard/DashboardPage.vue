<template>
  <div class="dp">

    <!-- ══════════════════════════════════════════════════════
         FILA 1 — KPI CARDS
    ══════════════════════════════════════════════════════ -->
    <div class="dp-kpi-grid">

      <!-- KPI 1: Cotizaciones en curso -->
      <div class="kpi-card">
        <div class="kpi-icon" style="--icon-bg: #EEF4FF">
          <FileText :size="18" color="#054EAF" />
        </div>
        <!-- TODO: conectar con GET /api/dashboard/kpis -->
        <p class="kpi-label">Cotizaciones en curso</p>
        <p class="kpi-number">{{ kpis.cotizaciones.value }}</p>
        <span class="kpi-trend trend-up">↑ {{ kpis.cotizaciones.trend }}% este mes</span>
      </div>

      <!-- KPI 2: Eventos próximos (30 días) -->
      <div class="kpi-card">
        <div class="kpi-icon" style="--icon-bg: #DCFCE7">
          <CalendarDays :size="18" color="#16A34A" />
        </div>
        <!-- TODO: conectar con GET /api/eventos?proximos=30 -->
        <p class="kpi-label">Eventos próximos (30 días)</p>
        <p class="kpi-number">{{ kpis.eventos.value }}</p>
        <span class="kpi-trend trend-up">↑ {{ kpis.eventos.nuevos }} confirmados</span>
      </div>

      <!-- KPI 3: Tareas operacionales pendientes -->
      <div class="kpi-card">
        <div class="kpi-icon" style="--icon-bg: #FEF3C7">
          <ClipboardList :size="18" color="#F59E0B" />
        </div>
        <!-- TODO: conectar con GET /api/tareas?estado=pendiente -->
        <p class="kpi-label">Tareas operacionales pendientes</p>
        <p class="kpi-number">{{ kpis.tareas.value }}</p>
        <span class="kpi-trend trend-down">↓ {{ kpis.tareas.vencidas }} vencidas</span>
      </div>

      <!-- KPI 4: Próximo evento — card primaria destacada (bg #054EAF) -->
      <div class="kpi-card kpi-primary">
        <div class="kpi-icon" style="--icon-bg: rgba(255,255,255,.18)">
          <Zap :size="18" color="white" />
        </div>
        <!-- TODO: conectar con GET /api/eventos/proximo -->
        <p class="kpi-label" style="color: rgba(255,255,255,.65)">Próximo evento</p>
        <p class="kpi-number kpi-number--sm">{{ proximoEvento.nombre }}</p>
        <p class="kpi-sub">{{ proximoEvento.fechaDisplay }} · {{ proximoEvento.ciudad }}</p>
        <span class="kpi-trend" style="background: rgba(255,255,255,.18); color: white">
          {{ proximoEvento.tipo }}
        </span>
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════
         FILA 2 — CALENDARIO (65%) + ALERTAS (35%)
    ══════════════════════════════════════════════════════ -->
    <div class="dp-mid-grid">

      <!-- Calendario -->
      <!-- El componente Calendar gestiona sus propios datos reales vía API.
           Solo se envuelve para aplicar el card del design system. -->
      <div class="card">
        <Calendar />
      </div>

      <!-- Panel de Alertas -->
      <div class="card alerts-card">
        <div class="section-head">
          <h2 class="section-title">Alertas activas</h2>
          <span class="count-badge">{{ alertas.length }}</span>
        </div>

        <!-- TODO: conectar con GET /api/alertas -->
        <div class="alerts-list">
          <div
            v-for="alerta in alertas"
            :key="alerta.id"
            class="alert-item"
            :style="`--ac: ${alerta.color}`"
          >
            <span class="alert-emoji">{{ alerta.icono }}</span>
            <div class="alert-content">
              <p class="alert-desc">{{ alerta.descripcion }}</p>
              <p class="alert-time">{{ alerta.tiempo }}</p>
            </div>
          </div>
        </div>

        <button class="btn-link">Ver todas las alertas →</button>
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════
         FILA 3 — INVENTARIO (40%) · EQUIPO (30%) · ACTIVIDAD (30%)
    ══════════════════════════════════════════════════════ -->
    <div class="dp-bottom-grid">

      <!-- Inventario de Equipos -->
      <div class="card">
        <div class="section-head">
          <h2 class="section-title">Inventario de Equipos</h2>
        </div>
        <!-- TODO: conectar con GET /api/inventario/equipos -->
        <div class="inv-list">
          <div v-for="item in inventario" :key="item.nombre" class="inv-item">
            <div class="inv-row">
              <span class="inv-nombre">{{ item.nombre }}</span>
              <span
                class="status-badge"
                :style="`background: ${item.statusBg}; color: ${item.statusColor}`"
              >{{ item.status }}</span>
            </div>
            <p class="inv-counts">{{ item.disponibles }} / {{ item.total }} disponibles</p>
            <div class="prog-track">
              <div
                class="prog-fill"
                :style="`width: ${Math.round((item.disponibles / item.total) * 100)}%; background: ${item.progressColor}`"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Equipo esta semana -->
      <div class="card">
        <div class="section-head">
          <h2 class="section-title">Equipo esta semana</h2>
        </div>
        <!-- TODO: conectar con GET /api/equipo/semana -->
        <div class="team-list">
          <div v-for="persona in equipo" :key="persona.id" class="team-item">
            <div
              class="team-avatar"
              :style="`background: ${persona.avatarBg}; color: ${persona.avatarColor}`"
            >{{ persona.iniciales }}</div>
            <div class="team-info">
              <p class="team-nombre">{{ persona.nombre }}</p>
              <p class="team-rol">{{ persona.rol }}</p>
              <p class="team-evento">{{ persona.evento }}</p>
            </div>
            <span
              class="status-badge"
              :style="`background: ${persona.badgeBg}; color: ${persona.badgeColor}`"
            >{{ persona.disponibilidad }}</span>
          </div>
        </div>
      </div>

      <!-- Actividad reciente -->
      <div class="card">
        <div class="section-head">
          <h2 class="section-title">Actividad reciente</h2>
        </div>
        <!-- TODO: conectar con GET /api/actividad?limit=8 -->
        <div class="timeline">
          <div v-for="(act, i) in actividad" :key="act.id" class="tl-item">
            <div class="tl-left">
              <div class="tl-dot" :style="`background: ${act.color}`">
                <component :is="act.icono" :size="12" color="white" />
              </div>
              <div v-if="i < actividad.length - 1" class="tl-line"></div>
            </div>
            <div class="tl-body">
              <p class="tl-text">{{ act.texto }}</p>
              <p class="tl-meta">{{ act.usuario }} · {{ act.tiempo }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  FileText,
  CalendarDays,
  ClipboardList,
  Zap,
  FileEdit,
  CheckCircle2,
  PackageCheck,
} from 'lucide-vue-next'
import Calendar from '@/components/calendar/Calendar.vue'

// ── KPI ────────────────────────────────────────────────
// TODO: reemplazar con respuesta de GET /api/dashboard/kpis
const kpis = ref({
  cotizaciones: { value: 8,  trend: 12 },
  eventos:      { value: 5,  nuevos: 3 },
  tareas:       { value: 13, vencidas: 2 },
})

// TODO: reemplazar con GET /api/eventos/proximo
const proximoEvento = ref({
  nombre:       'Team Building Bancolombia',
  fechaDisplay: '3 Mar 2026',
  ciudad:       'Medellín',
  tipo:         'Team Building',
})

// ── ALERTAS ────────────────────────────────────────────
// TODO: reemplazar con GET /api/alertas
const alertas = ref([
  { id: 1, icono: '⚠️', descripcion: 'Stock bajo de Inflable XL — solo 1 disponible',        tiempo: 'hace 30 min', color: '#F59E0B' },
  { id: 2, icono: '📋', descripcion: 'Cotización #124 (EPM) sin respuesta hace 3 días',        tiempo: 'hace 3 días', color: '#3B82F6' },
  { id: 3, icono: '🚛', descripcion: 'Montaje Alpina Bogotá pendiente de confirmar',            tiempo: 'hace 1 día',  color: '#8B5CF6' },
  { id: 4, icono: '📋', descripcion: 'Cotización #121 (Grupo Éxito) vence mañana',             tiempo: 'hace 5h',     color: '#EF4444' },
  { id: 5, icono: '✅', descripcion: 'Evento Team Building Postobón completado con éxito',      tiempo: 'hace 2 días', color: '#10B981' },
])

// ── INVENTARIO ─────────────────────────────────────────
// TODO: reemplazar con GET /api/inventario/equipos
const inventario = ref([
  { nombre: 'Inflable XL',       disponibles: 1, total: 3, status: 'Bajo stock',     statusBg: '#FEE2E2', statusColor: '#B91C1C', progressColor: '#EF4444' },
  { nombre: 'Inflable Mediano',   disponibles: 4, total: 6, status: 'Disponible',     statusBg: '#DCFCE7', statusColor: '#16A34A', progressColor: '#22C55E' },
  { nombre: 'Castillo Inflable',  disponibles: 2, total: 4, status: 'Disponible',     statusBg: '#DCFCE7', statusColor: '#16A34A', progressColor: '#22C55E' },
  { nombre: 'Tobogán Gigante',    disponibles: 1, total: 2, status: 'En evento',      statusBg: '#DBEAFE', statusColor: '#1D4ED8', progressColor: '#F59E0B' },
  { nombre: 'Circuito Ninja',     disponibles: 0, total: 1, status: 'Mantenimiento',  statusBg: '#FEF3C7', statusColor: '#B45309', progressColor: '#EF4444' },
  { nombre: 'Piscina de Pelotas', disponibles: 3, total: 4, status: 'Disponible',     statusBg: '#DCFCE7', statusColor: '#16A34A', progressColor: '#22C55E' },
])

// ── EQUIPO ─────────────────────────────────────────────
// TODO: reemplazar con GET /api/equipo/semana
const equipo = ref([
  { id: 1, nombre: 'Carlos Ruiz',   iniciales: 'CR', rol: 'Coordinador',  evento: 'Team Building Bancolombia', avatarBg: '#DBEAFE', avatarColor: '#1D4ED8', disponibilidad: 'En campo',   badgeBg: '#DBEAFE', badgeColor: '#1D4ED8' },
  { id: 2, nombre: 'Laura Gómez',   iniciales: 'LG', rol: 'Comercial',    evento: 'Cotización EPM',             avatarBg: '#DCFCE7', avatarColor: '#16A34A', disponibilidad: 'Disponible', badgeBg: '#DCFCE7', badgeColor: '#16A34A' },
  { id: 3, nombre: 'Andrés Mora',   iniciales: 'AM', rol: 'Téc. Montaje', evento: 'Feria Alpina Bogotá',        avatarBg: '#FEF3C7', avatarColor: '#B45309', disponibilidad: 'En campo',   badgeBg: '#DBEAFE', badgeColor: '#1D4ED8' },
  { id: 4, nombre: 'Sandra Peña',   iniciales: 'SP', rol: 'Logística',    evento: 'Convención Éxito',           avatarBg: '#EDE9FE', avatarColor: '#7C3AED', disponibilidad: 'Disponible', badgeBg: '#DCFCE7', badgeColor: '#16A34A' },
  { id: 5, nombre: 'Felipe Torres', iniciales: 'FT', rol: 'Téc. Montaje', evento: '—',                          avatarBg: '#F3F4F6', avatarColor: '#6B7280', disponibilidad: 'Libre',      badgeBg: '#F3F4F6', badgeColor: '#6B7280' },
])

// ── ACTIVIDAD RECIENTE ─────────────────────────────────
// TODO: reemplazar con GET /api/actividad?limit=8
const actividad = ref([
  { id: 1, icono: FileEdit,      texto: 'Cotización #126 creada para Postobón — Día de Integración',  usuario: 'Laura G.',  tiempo: 'hace 20 min', color: '#3B82F6' },
  { id: 2, icono: CheckCircle2,  texto: 'Evento Team Building Bancolombia confirmado',                 usuario: 'Carlos R.', tiempo: 'hace 1h',     color: '#10B981' },
  { id: 3, icono: ClipboardList, texto: 'Tarea "Confirmar transporte Cali" completada',                usuario: 'Andrés M.', tiempo: 'hace 2h',     color: '#8B5CF6' },
  { id: 4, icono: PackageCheck,  texto: 'Castillo Inflable regresó de mantenimiento',                  usuario: 'Sandra P.', tiempo: 'hace 3h',     color: '#F59E0B' },
  { id: 5, icono: FileEdit,      texto: 'Cotización #125 enviada a EPM — Feria Corporativa',           usuario: 'Laura G.',  tiempo: 'hace 5h',     color: '#3B82F6' },
  { id: 6, icono: CheckCircle2,  texto: 'Evento Convención Éxito marcado como completado',             usuario: 'Carlos R.', tiempo: 'ayer',        color: '#10B981' },
])
</script>

<style scoped>
/* ─────────────────────────────────────────────
   LAYOUT PRINCIPAL
───────────────────────────────────────────── */
.dp {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* Grid: 4 columnas iguales para KPIs */
.dp-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* Grid: 65% calendario | 35% alertas */
.dp-mid-grid {
  display: grid;
  grid-template-columns: 65fr 35fr;
  gap: 16px;
  align-items: start;
}

/* Grid: 40% inventario | 30% equipo | 30% actividad */
.dp-bottom-grid {
  display: grid;
  grid-template-columns: 40fr 30fr 30fr;
  gap: 16px;
  align-items: start;
}

/* ─────────────────────────────────────────────
   CARD BASE
───────────────────────────────────────────── */
.card {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  border: 1px solid #EEF1F7;
}

/* ─────────────────────────────────────────────
   KPI CARDS
───────────────────────────────────────────── */
.kpi-card {
  position: relative;
  background: #FFFFFF;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  border: 1px solid #EEF1F7;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.2s;
}

.kpi-card:hover {
  box-shadow: 0 2px 8px rgba(5,78,175,.1), 0 8px 24px rgba(5,78,175,.12);
}

.kpi-primary {
  background: #054EAF;
  border-color: transparent;
}

/* Ícono flotante en esquina superior derecha */
.kpi-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--icon-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  padding-right: 48px; /* evita solapar con el ícono */
  line-height: 1.4;
}

.kpi-number {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #0F1A2E;
  line-height: 1;
  margin-top: 2px;
}

/* Versión reducida para nombre del próximo evento */
.kpi-number--sm {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
  color: #FFFFFF;
}

.kpi-sub {
  font-size: 11px;
  color: rgba(255,255,255,.75);
  font-family: 'Inter', sans-serif;
}

.kpi-trend {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  margin-top: 2px;
}

.trend-up   { background: #DCFCE7; color: #16A34A; }
.trend-down { background: #FEE2E2; color: #B91C1C; }

/* ─────────────────────────────────────────────
   SECTION HEADER (compartido)
───────────────────────────────────────────── */
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #0F1A2E;
}

.count-badge {
  background: #EEF4FF;
  color: #054EAF;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
}

/* Badge reutilizable (inventario + equipo) */
.status-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
}

/* ─────────────────────────────────────────────
   PANEL DE ALERTAS
───────────────────────────────────────────── */
.alerts-card {
  display: flex;
  flex-direction: column;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border-left: 3px solid var(--ac);
  background: #FAFBFE;
  transition: background 0.15s;
}

.alert-item:hover { background: #F4F7FD; }

.alert-emoji   { font-size: 16px; flex-shrink: 0; line-height: 1.3; }
.alert-content { flex: 1; min-width: 0; }

.alert-desc {
  font-size: 12px;
  color: #0F1A2E;
  font-weight: 500;
  line-height: 1.4;
  font-family: 'Inter', sans-serif;
}

.alert-time {
  font-size: 11px;
  color: #94A3B8;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
}

.btn-link {
  margin-top: 14px;
  font-size: 12px;
  font-weight: 600;
  color: #054EAF;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  font-family: 'Inter', sans-serif;
  transition: opacity 0.15s;
}

.btn-link:hover { opacity: 0.7; }

/* ─────────────────────────────────────────────
   INVENTARIO
───────────────────────────────────────────── */
.inv-list { display: flex; flex-direction: column; }

.inv-item {
  padding: 12px 0;
  border-bottom: 1px solid #F1F5FA;
}

.inv-item:last-child { border-bottom: none; }

.inv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.inv-nombre {
  font-size: 13px;
  font-weight: 500;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}

.inv-counts {
  font-size: 11px;
  color: #94A3B8;
  margin-bottom: 6px;
  font-family: 'Inter', sans-serif;
}

.prog-track {
  height: 5px;
  background: #F1F5FA;
  border-radius: 99px;
  overflow: hidden;
}

.prog-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s ease;
}

/* ─────────────────────────────────────────────
   EQUIPO
───────────────────────────────────────────── */
.team-list { display: flex; flex-direction: column; }

.team-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #F1F5FA;
}

.team-item:last-child { border-bottom: none; }

.team-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.team-info { flex: 1; min-width: 0; }

.team-nombre {
  font-size: 13px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}

.team-rol {
  font-size: 11px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
}

.team-evento {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─────────────────────────────────────────────
   TIMELINE ACTIVIDAD
───────────────────────────────────────────── */
.timeline {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
}

.timeline::-webkit-scrollbar { width: 4px; }
.timeline::-webkit-scrollbar-track { background: transparent; }
.timeline::-webkit-scrollbar-thumb { background: #E5EAF0; border-radius: 99px; }

.tl-item { display: flex; gap: 12px; }

.tl-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.tl-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tl-line {
  width: 2px;
  flex: 1;
  min-height: 12px;
  background: #E5EAF0;
  margin: 3px 0;
}

.tl-body {
  padding-bottom: 16px;
  flex: 1;
  min-width: 0;
}

.tl-text {
  font-size: 12px;
  color: #0F1A2E;
  line-height: 1.5;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
}

.tl-meta {
  font-size: 11px;
  color: #94A3B8;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
}

/* ─────────────────────────────────────────────
   RESPONSIVE
───────────────────────────────────────────── */
@media (max-width: 1280px) {
  .dp-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dp-kpi-grid,
  .dp-mid-grid,
  .dp-bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
