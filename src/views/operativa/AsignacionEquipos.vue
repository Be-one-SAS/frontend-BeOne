<template>
  <div class="ae-page">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="ae-header-icon"><Users :size="20" /></div>
        <div>
          <h2 class="ae-title">Asignación de Equipos</h2>
          <p class="ae-subtitle">
            {{ filteredEventos.length }} evento{{ filteredEventos.length !== 1 ? 's' : '' }} confirmado{{ filteredEventos.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="ae-tabs">
      <button
        class="ae-tab"
        :class="{ 'ae-tab--active': activeTab === 'eventos' }"
        @click="activeTab = 'eventos'"
      >
        <CalendarDays :size="14" />
        Por evento
      </button>
      <button
        class="ae-tab"
        :class="{ 'ae-tab--active': activeTab === 'personas' }"
        @click="activeTab = 'personas'"
      >
        <Users :size="14" />
        Por persona
      </button>
    </div>

    <!-- ═══════ TAB: POR EVENTO ═══════ -->
    <template v-if="activeTab === 'eventos'">

      <!-- Filtros -->
      <div class="ae-filters">
        <div class="ae-search-wrap">
          <Search :size="13" class="ae-search-icon" />
          <input v-model="search" type="text" placeholder="Evento, cliente…" class="ae-input ae-input--search" />
        </div>
        <select v-model="estadoFiltro" class="ae-input">
          <option value="">Todos los estados</option>
          <option value="RESERVA">Reserva</option>
          <option value="EN CURSO">En curso</option>
          <option value="EJECUTADO">Ejecutado</option>
        </select>
        <select v-model="coordFiltro" class="ae-input">
          <option value="">Todos los coordinadores</option>
          <option v-for="c in coordsInEvents" :key="c.id" :value="c.id">{{ c.fullName }}</option>
        </select>
        <input v-model="fechaInicio" type="date" class="ae-input" />
        <input v-model="fechaFin"    type="date" class="ae-input" />
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="ae-skeleton">
        <div v-for="i in 6" :key="i" class="ae-sk-row" />
      </div>

      <!-- Empty -->
      <div v-else-if="filteredEventos.length === 0" class="ae-empty">
        <CalendarDays :size="36" class="ae-empty-icon" />
        <p>No hay eventos que coincidan con los filtros</p>
      </div>

      <!-- Table -->
      <div v-else class="ae-table-wrap">
        <table class="ae-table">
          <thead>
            <tr class="ae-thead-row">
              <th class="ae-th" style="width:68px">N°</th>
              <th class="ae-th" style="min-width:180px">Evento</th>
              <th class="ae-th" style="width:130px">Cliente</th>
              <th class="ae-th" style="width:110px">Fecha</th>
              <th class="ae-th" style="width:100px">Estado Op.</th>
              <th class="ae-th" style="width:160px">Coordinador(es)</th>
              <th class="ae-th" style="width:100px">Apoyo</th>
              <th class="ae-th" style="width:80px">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ev in filteredEventos"
              :key="ev.id"
              class="ae-row"
            >
              <!-- N° -->
              <td class="ae-td">
                <span class="ae-num">{{ ev.numero }}</span>
              </td>

              <!-- Evento -->
              <td class="ae-td">
                <div class="ae-ev-name">{{ ev.description ?? ev.ubicacion ?? '—' }}</div>
                <div class="ae-ev-empresa">{{ ev.empresa ?? ev.cliente?.name ?? '' }}</div>
                <div class="ae-mini-track">
                  <div
                    class="ae-mini-fill"
                    :class="miniBarCls(eventPct(ev))"
                    :style="{ width: eventPct(ev) + '%' }"
                  />
                </div>
              </td>

              <!-- Cliente -->
              <td class="ae-td ae-text-muted">{{ ev.cliente?.name ?? ev.empresa ?? '—' }}</td>

              <!-- Fecha -->
              <td class="ae-td ae-text-muted ae-nowrap">
                {{ formatDate(ev.operationWindow?.eventStartAt) }}
              </td>

              <!-- Estado -->
              <td class="ae-td">
                <span class="ae-badge" :class="estadoCls(ev.estadoOperativo)">
                  {{ ev.estadoOperativo ?? '—' }}
                </span>
              </td>

              <!-- Coordinadores -->
              <td class="ae-td">
                <div v-if="ev.coordinadores?.length" class="ae-coord-list">
                  <span
                    v-for="c in ev.coordinadores"
                    :key="c.user?.id ?? c.id"
                    class="ae-coord-chip"
                  >
                    <span class="ae-avatar-sm">{{ initials(c.user?.fullName) }}</span>
                    {{ c.user?.fullName ?? '—' }}
                  </span>
                </div>
                <span v-else class="ae-no-team">Sin asignar</span>
              </td>

              <!-- Miembros de apoyo -->
              <td class="ae-td">
                <div v-if="ev.members?.length" class="ae-members-wrap">
                  <span
                    v-for="m in ev.members.slice(0, 3)"
                    :key="m.user?.id ?? m.id"
                    class="ae-member-avatar"
                    :title="m.user?.fullName"
                  >
                    {{ initials(m.user?.fullName) }}
                  </span>
                  <span v-if="ev.members.length > 3" class="ae-member-more">
                    +{{ ev.members.length - 3 }}
                  </span>
                </div>
                <span v-else class="ae-no-team">—</span>
              </td>

              <!-- Acciones -->
              <td class="ae-td">
                <div class="ae-actions">
                  <button class="ae-btn-manage" @click="openTeamModal(ev)">
                    <UserCog :size="13" />
                    Equipo
                  </button>
                  <button class="ae-btn-flujo" @click="openFlujoModal(ev)" title="Ver flujo del evento">
                    <Activity :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </template>

    <!-- ═══════ TAB: POR PERSONA ═══════ -->
    <template v-if="activeTab === 'personas'">

      <div v-if="loading" class="ae-skeleton">
        <div v-for="i in 4" :key="i" class="ae-sk-row" />
      </div>

      <div v-else-if="personaRows.length === 0" class="ae-empty">
        <Users :size="36" class="ae-empty-icon" />
        <p>No hay personas asignadas a eventos confirmados</p>
      </div>

      <div v-else class="ae-persona-grid">
        <div v-for="persona in personaRows" :key="persona.id" class="ae-persona-card">
          <div class="ae-persona-header">
            <span class="ae-persona-avatar">{{ initials(persona.fullName) }}</span>
            <div>
              <div class="ae-persona-name">{{ persona.fullName }}</div>
              <div class="ae-persona-role">{{ persona.role }}</div>
            </div>
            <span class="ae-persona-count">{{ persona.eventos.length }} evento{{ persona.eventos.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="ae-persona-events">
            <div
              v-for="ev in persona.eventos"
              :key="ev.id"
              class="ae-persona-ev"
            >
              <span class="ae-persona-ev-num">#{{ ev.numero }}</span>
              <span class="ae-persona-ev-name">{{ ev.description ?? ev.empresa ?? '—' }}</span>
              <span class="ae-persona-ev-date">{{ formatDate(ev.operationWindow?.eventStartAt) }}</span>
              <span class="ae-badge ae-badge-sm" :class="ev.rolEnEvento === 'coord' ? 'badge-blue' : 'badge-green'">
                {{ ev.rolEnEvento === 'coord' ? 'Coord.' : 'Apoyo' }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- Team Modal -->
    <TeamModal
      v-if="showTeamModal"
      :show="showTeamModal"
      :event="selectedEvent"
      @close="showTeamModal = false"
      @updated="onTeamUpdated"
    />

    <!-- Flujo Modal -->
    <ModalFlujoEvento
      v-if="showFlujoModal"
      :show="showFlujoModal"
      :event="selectedFlujoEvent"
      @close="showFlujoModal = false"
      @open-team="onFlujoOpenTeam"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Users, UserCog, Search, CalendarDays, Activity } from 'lucide-vue-next'
import { useControl } from '@/composables/useControl'
import TeamModal from '@/components/quotation/TeamModal.vue'
import ModalFlujoEvento from '@/components/quotation/ModalFlujoEvento.vue'

const { eventos, loading, fetchEventos, fetchCoordinadores, refreshEventTeam } = useControl()

// ── Team modal ──────────────────────────────────────
const showTeamModal  = ref(false)
const selectedEvent  = ref(null)

const openTeamModal = (evento) => {
  selectedEvent.value = evento
  showTeamModal.value = true
}

const onTeamUpdated = async () => {
  if (selectedEvent.value?.id) {
    await refreshEventTeam(selectedEvent.value.id)
  }
}

// ── Flujo modal ─────────────────────────────────────
const showFlujoModal   = ref(false)
const selectedFlujoEvent = ref(null)

const openFlujoModal = (evento) => {
  selectedFlujoEvent.value = evento
  showFlujoModal.value = true
}

const onFlujoOpenTeam = () => {
  showFlujoModal.value = false
  selectedEvent.value  = selectedFlujoEvent.value
  showTeamModal.value  = true
}

// ── Progress helpers ────────────────────────────────
const eventPct = (ev) => {
  let s = 0
  if ((ev.coordinadores?.length ?? 0) > 0) s += 20
  if ((ev.members?.length ?? 0) > 0)       s += 15
  if (ev.listadoMaterial)                   s += 20
  if (ev.planillaEjecucion)                 s += 20
  if (ev.estadoAdministrativo === 'Pagada' || ev.estadoAdministrativo === 'Facturada') s += 25
  return s
}

const miniBarCls = (pct) => {
  if (pct === 100) return 'mini-green'
  if (pct >= 80)   return 'mini-blue'
  if (pct >= 41)   return 'mini-amber'
  return 'mini-red'
}

// ── Tabs ────────────────────────────────────────────
const activeTab = ref<'eventos' | 'personas'>('eventos')

// ── Filtros ─────────────────────────────────────────
const search       = ref('')
const estadoFiltro = ref('')
const coordFiltro  = ref<number | ''>('')
const fechaInicio  = ref('')
const fechaFin     = ref('')

// Unique coordinators present in events (for filter dropdown)
const coordsInEvents = computed(() => {
  const map = new Map<number, any>()
  for (const ev of eventos.value) {
    for (const c of (ev.coordinadores ?? [])) {
      const u = c.user ?? c
      if (u?.id) map.set(u.id, u)
    }
  }
  return [...map.values()]
})

const filteredEventos = computed(() => {
  return eventos.value.filter(ev => {
    const q = search.value.toLowerCase()
    if (q && !(
      (ev.description ?? '').toLowerCase().includes(q) ||
      (ev.empresa ?? '').toLowerCase().includes(q) ||
      (ev.cliente?.name ?? '').toLowerCase().includes(q)
    )) return false

    if (estadoFiltro.value && ev.estadoOperativo !== estadoFiltro.value) return false

    if (coordFiltro.value) {
      const hasCoord = (ev.coordinadores ?? []).some(
        c => (c.user?.id ?? c.id) === coordFiltro.value
      )
      if (!hasCoord) return false
    }

    const fecha = ev.operationWindow?.eventStartAt
      ? new Date(ev.operationWindow.eventStartAt)
      : null

    if (fechaInicio.value && fecha && fecha < new Date(fechaInicio.value)) return false
    if (fechaFin.value   && fecha && fecha > new Date(fechaFin.value))     return false

    return true
  })
})

// ── Por persona tab ─────────────────────────────────
const personaRows = computed(() => {
  const map = new Map<number, { id: number; fullName: string; role: string; eventos: any[] }>()

  for (const ev of eventos.value) {
    for (const c of (ev.coordinadores ?? [])) {
      const u = c.user ?? c
      if (!u?.id) continue
      if (!map.has(u.id)) map.set(u.id, { id: u.id, fullName: u.fullName, role: u.role, eventos: [] })
      map.get(u.id)!.eventos.push({ ...ev, rolEnEvento: 'coord' })
    }
    for (const m of (ev.members ?? [])) {
      const u = m.user ?? m
      if (!u?.id) continue
      if (!map.has(u.id)) map.set(u.id, { id: u.id, fullName: u.fullName, role: u.role, eventos: [] })
      const existing = map.get(u.id)!.eventos.find(e => e.id === ev.id)
      if (!existing) map.get(u.id)!.eventos.push({ ...ev, rolEnEvento: 'apoyo' })
    }
  }

  return [...map.values()].sort((a, b) => b.eventos.length - a.eventos.length)
})

// ── Helpers ─────────────────────────────────────────
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

const estadoCls = (e) => ({
  'RESERVA':   'badge-yellow',
  'EJECUTADO': 'badge-green',
  'EN CURSO':  'badge-blue',
}[e] ?? 'badge-gray')

onMounted(async () => {
  await Promise.all([fetchEventos(), fetchCoordinadores()])
})
</script>

<style scoped>
.ae-page { width: 100%; }

/* Header */
.ae-header-icon {
  width: 40px; height: 40px;
  background: #EBF3FC; color: #054EAF;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.ae-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px; font-weight: 700;
  color: #0F1A2E; margin: 0 0 4px; line-height: 1.2;
}

.ae-subtitle {
  font-size: 13px; color: #94A3B8;
  font-family: 'Inter', sans-serif; margin: 0;
}

/* Tabs */
.ae-tabs {
  display: flex; gap: 4px;
  background: #F1F5F9;
  border-radius: 12px; padding: 4px;
  width: fit-content;
  margin-bottom: 20px;
}

.ae-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 16px;
  border-radius: 9px; border: none;
  font-size: 13px; font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #64748B; background: transparent;
  cursor: pointer; transition: all 0.2s;
}

.ae-tab:hover { color: #0F1A2E; background: rgba(255,255,255,.6); }
.ae-tab--active { background: #FFFFFF; color: #054EAF; box-shadow: 0 1px 4px rgba(15,26,46,.1); }

/* Filters */
.ae-filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .ae-filters { grid-template-columns: 1fr 1fr; }
}

.ae-search-wrap { position: relative; }
.ae-search-icon {
  position: absolute; left: 12px; top: 50%;
  transform: translateY(-50%);
  color: #94A3B8; pointer-events: none;
}

.ae-input {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px; color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: auto;
}
.ae-input:focus { border-color: #054EAF; box-shadow: 0 0 0 3px rgba(5,78,175,.1); }
.ae-input::placeholder { color: #94A3B8; }
.ae-input--search { padding-left: 34px; }

/* Table */
.ae-table-wrap {
  background: #FFFFFF;
  border-radius: 18px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  overflow: hidden;
}

.ae-table {
  width: 100%; border-collapse: separate; border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

.ae-thead-row { background: #EBF3FC; }

.ae-th {
  padding: 10px 14px;
  font-size: 10px; font-weight: 600;
  color: #64748B; text-transform: uppercase;
  letter-spacing: 0.5px; text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #E2EBF6;
}

.ae-row {
  background: #FFFFFF;
  transition: background 0.15s;
}
.ae-row:hover { background: #F0F7FF; }

.ae-td {
  padding: 12px 14px;
  font-size: 13px; color: #0F1A2E;
  border-bottom: 1px solid #EBF3FC;
  vertical-align: middle;
}

.ae-text-muted { font-size: 12px; color: #64748B; }
.ae-nowrap { white-space: nowrap; }

/* Event num */
.ae-num {
  font-weight: 700; font-size: 13px; color: #054EAF;
  font-family: 'JetBrains Mono', monospace;
}

/* Event name / empresa */
.ae-ev-name {
  font-weight: 600; font-size: 13px; color: #0F1A2E;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;
}
.ae-ev-empresa { font-size: 11px; color: #94A3B8; }

/* Badges */
.ae-badge {
  display: inline-block; padding: 3px 9px;
  border-radius: 999px; font-size: 11px; font-weight: 600;
  white-space: nowrap;
}
.ae-badge-sm { padding: 2px 7px; font-size: 10px; }

.badge-yellow { background: #FEFCE8; color: #854D0E; }
.badge-green  { background: #F0FDF4; color: #166534; }
.badge-blue   { background: #EFF6FF; color: #1D4ED8; }
.badge-gray   { background: #F1F5F9; color: #64748B; }

/* Coord chips */
.ae-coord-list { display: flex; flex-direction: column; gap: 3px; }

.ae-coord-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500; color: #0F1A2E;
  white-space: nowrap;
}

.ae-avatar-sm {
  width: 20px; height: 20px; border-radius: 50%;
  background: #EBF3FC; color: #054EAF;
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 800; flex-shrink: 0;
}

.ae-no-team { font-size: 12px; color: #94A3B8; font-style: italic; }

/* Members avatars */
.ae-members-wrap { display: flex; align-items: center; gap: 2px; }

.ae-member-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: #F0FDF4; color: #16A34A;
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 800;
  border: 2px solid #fff;
  margin-left: -4px;
  cursor: default;
}
.ae-members-wrap > .ae-member-avatar:first-child { margin-left: 0; }

.ae-member-more {
  font-size: 10px; font-weight: 700; color: #64748B;
  margin-left: 4px;
}

/* Mini progress bar */
.ae-mini-track {
  margin-top: 5px;
  height: 3px; background: #F1F5F9; border-radius: 999px; overflow: hidden;
  width: 100%; max-width: 180px;
}
.ae-mini-fill { height: 100%; border-radius: 999px; transition: width .4s ease; }
.mini-red   { background: #F97316; }
.mini-amber { background: #EAB308; }
.mini-blue  { background: #3B82F6; }
.mini-green { background: #22C55E; }

/* Action buttons */
.ae-actions { display: flex; align-items: center; gap: 6px; }

.ae-btn-manage {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 11px;
  background: #EBF3FC; color: #054EAF;
  border: none; border-radius: 8px;
  font-size: 12px; font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer; transition: all 0.15s;
}
.ae-btn-manage:hover { background: #054EAF; color: #FFFFFF; }

.ae-btn-flujo {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  background: #F8FAFC; color: #64748B;
  border: 1px solid #E2EBF6; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
}
.ae-btn-flujo:hover { background: #F0FDF4; color: #16A34A; border-color: #86EFAC; }

/* Skeleton */
.ae-skeleton { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.ae-sk-row {
  height: 52px; border-radius: 10px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }

/* Empty */
.ae-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; min-height: 200px;
  color: #94A3B8; font-size: 13px; font-family: 'Inter', sans-serif;
}
.ae-empty-icon { opacity: 0.3; }

/* Por persona */
.ae-persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.ae-persona-card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 12px rgba(5,78,175,.06);
  overflow: hidden;
}

.ae-persona-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #F1F5F9;
  background: #F8FBFF;
}

.ae-persona-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: #EBF3FC; color: #054EAF;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
}

.ae-persona-name {
  font-size: 13px; font-weight: 700; color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}
.ae-persona-role { font-size: 11px; color: #94A3B8; }

.ae-persona-count {
  margin-left: auto;
  font-size: 11px; font-weight: 700;
  color: #054EAF;
  background: #EBF3FC;
  padding: 3px 10px; border-radius: 999px;
}

.ae-persona-events { padding: 8px 0; }

.ae-persona-ev {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #F8FAFC;
  font-family: 'Inter', sans-serif;
}
.ae-persona-ev:last-child { border-bottom: none; }

.ae-persona-ev-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; font-weight: 700; color: #054EAF;
  flex-shrink: 0;
}
.ae-persona-ev-name {
  flex: 1; font-size: 12px; color: #0F1A2E; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ae-persona-ev-date { font-size: 11px; color: #94A3B8; flex-shrink: 0; white-space: nowrap; }
</style>
