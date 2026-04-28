<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ClipboardCheck, ClipboardX, ChevronDown, Search,
  Loader2, CheckCircle2
} from 'lucide-vue-next'
import { useControl } from '@/composables/useControl'
import OperationalListModal from '@/components/quotation/OperationalListModal.vue'

// Directiva local para cerrar el dropdown al hacer click fuera
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el._clickOutside = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) binding.value(e)
    }
    document.addEventListener('click', el._clickOutside, true)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el._clickOutside, true)
  },
}

const { eventos, loading, coordinadores, fetchEventos, fetchCoordinadores, updateEvento, updateCoordinadores } = useControl()

// ── Filtros ────────────────────────────────────────────
const search        = ref('')
const unidadFiltro  = ref('')
const estadoFiltro  = ref('')
const fechaInicio   = ref('')
const fechaFin      = ref('')

const unidades = ['Antioquia', 'Cundinamarca', 'Colombia', 'Israel']
const estados  = ['RESERVA', 'EJECUTADO', 'EN CURSO']

const filteredEventos = computed(() => {
  return eventos.value.filter(e => {
    const q = search.value.toLowerCase()
    const coincideTexto = !q ||
      (e.description ?? '').toLowerCase().includes(q) ||
      (e.empresa ?? '').toLowerCase().includes(q) ||
      (e.cliente?.name ?? '').toLowerCase().includes(q)

    const coincideUnidad = !unidadFiltro.value ||
      e.unidadEjecucion === unidadFiltro.value

    const coincideEstado = !estadoFiltro.value ||
      e.estadoOperativo === estadoFiltro.value

    const fechaEvento = e.operationWindow?.eventStartAt
      ? new Date(e.operationWindow.eventStartAt)
      : null

    const dentroInicio = !fechaInicio.value || !fechaEvento ||
      fechaEvento >= new Date(fechaInicio.value)

    const dentroFin = !fechaFin.value || !fechaEvento ||
      fechaEvento <= new Date(fechaFin.value)

    return coincideTexto && coincideUnidad && coincideEstado && dentroInicio && dentroFin
  })
})

// ── Accordion ──────────────────────────────────────────
const expandedRow = ref(null)
const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

// ── Coordinadores multi-select ─────────────────────────
const savingCoord = ref({})  // { eventId: true }
const coordOpen   = ref({})  // { eventId: true } dropdown visible

const getAssignedIds = (evento) =>
  (evento.coordinadores ?? []).map(c => c.user?.id ?? c.id).filter(Boolean)

const isAssigned = (evento, userId) => getAssignedIds(evento).includes(userId)

const toggleCoord = async (evento, userId) => {
  const current = getAssignedIds(evento)
  const next    = current.includes(userId)
    ? current.filter(id => id !== userId)
    : [...current, userId]

  savingCoord.value = { ...savingCoord.value, [evento.id]: true }
  try {
    await updateCoordinadores(evento.id, next)
  } catch (e) {
    console.error('[Control] Error actualizando coordinadores:', e)
  } finally {
    const s = { ...savingCoord.value }
    delete s[evento.id]
    savingCoord.value = s
  }
}

const toggleCoordDropdown = (eventoId) => {
  coordOpen.value = { ...coordOpen.value, [eventoId]: !coordOpen.value[eventoId] }
}

const closeCoordDropdown = (eventoId) => {
  const s = { ...coordOpen.value }
  delete s[eventoId]
  coordOpen.value = s
}

// ── Checkboxes con spinner por celda ──────────────────
const saving = ref({}) // { "id-campo": true/false }

const handleCheck = async (evento, campo) => {
  const key = `${evento.id}-${campo}`
  saving.value = { ...saving.value, [key]: true }
  try {
    await updateEvento(evento.id, campo, !evento[campo])
  } finally {
    const next = { ...saving.value }
    delete next[key]
    saving.value = next
  }
}

const isSaving = (id, campo) => !!saving.value[`${id}-${campo}`]

// ── Helpers de formato ─────────────────────────────────
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) : '—'

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit',
  }) : '—'

// ── Badges helpers ─────────────────────────────────────
const unidadCls = (u) => ({
  'Antioquia':    'badge-orange',
  'Cundinamarca': 'badge-blue',
  'Colombia':     'badge-green',
  'Israel':       'badge-purple',
}[u] ?? 'badge-gray')

const estadoOpCls = (e) => ({
  'RESERVA':   'badge-yellow',
  'EJECUTADO': 'badge-green',
  'EN CURSO':  'badge-blue',
}[e] ?? 'badge-gray')

const estadoAdminCls = (e) => ({
  'Pagada':     'badge-green',
  'Facturada':  'badge-blue',
}[e] ?? 'badge-gray')

// ── Modal Lista Operativa ──────────────────────────────
const showOpListModal = ref(false)
const selectedEvent   = ref(null)

const openOpList = (evento) => {
  selectedEvent.value = evento
  showOpListModal.value = true
}

const onOpListComplete = async ({ eventId, notes }) => {
  await updateEvento(eventId, 'listadoMaterial', true)
  if (notes?.trim()) {
    await updateEvento(eventId, 'notasOperativas', notes.trim())
  }
}

onMounted(async () => {
  await Promise.all([fetchEventos(), fetchCoordinadores()])
})
</script>

<template>
  <div class="vc-page">

    <!-- ═══════════════════════════════════════════════ -->
    <!-- HEADER                                          -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <ClipboardCheck :size="24" class="text-primary" />
        <div>
          <h2 class="vc-title">Control Operativo</h2>
          <p class="vc-subtitle">
            {{ filteredEventos.length }} evento{{ filteredEventos.length !== 1 ? 's' : '' }} confirmado{{ filteredEventos.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
      <span class="ev-counter">{{ filteredEventos.length }}</span>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- FILTROS                                         -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(5,78,175,.06)] grid grid-cols-1 md:grid-cols-5 gap-3">

      <div class="relative">
        <Search :size="13" class="abs-search-icon" />
        <input
          v-model="search"
          type="text"
          placeholder="Evento o cliente…"
          class="vc-input pl-8"
        />
      </div>

      <select v-model="unidadFiltro" class="vc-input">
        <option value="">Todas las unidades</option>
        <option v-for="u in unidades" :key="u" :value="u">{{ u }}</option>
      </select>

      <select v-model="estadoFiltro" class="vc-input">
        <option value="">Todos los estados op.</option>
        <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
      </select>

      <input v-model="fechaInicio" type="date" class="vc-input" />
      <input v-model="fechaFin"    type="date" class="vc-input" />

    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- TABLA                                           -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(5,78,175,.06),_0_4px_16px_rgba(5,78,175,.08)] overflow-hidden">

      <!-- Skeleton -->
      <div v-if="loading" class="sk-wrap">
        <div v-for="i in 7" :key="i" class="sk-row" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="filteredEventos.length === 0"
        class="py-16 flex flex-col items-center gap-3 text-text-3"
      >
        <ClipboardX :size="40" class="opacity-30" />
        <p class="text-[14px] font-medium text-[#94A3B8]">No hay eventos confirmados en este período</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="vc-table ctrl-table">

          <thead>
            <tr class="vc-head-row">
              <th class="vc-th" style="width:28px"></th>
              <th class="vc-th" style="width:68px">N° Evento</th>
              <th class="vc-th" style="width:110px">Agente</th>
              <th class="vc-th" style="width:100px">Unidad</th>
              <th class="vc-th" style="min-width:160px">Evento</th>
              <th class="vc-th" style="width:100px">Estado Op.</th>
              <th class="vc-th" style="width:110px">Coordinador</th>
              <th class="vc-th" style="width:130px">Cliente</th>
              <th class="vc-th" style="width:90px">F. Inicio</th>
              <th class="vc-th" style="width:90px">F. Fin</th>
              <th class="vc-th vc-th-center" style="width:52px" title="Encuesta">Enc.</th>
              <th class="vc-th vc-th-center" style="width:52px" title="Registro Fotográfico">Foto</th>
              <th class="vc-th vc-th-center" style="width:52px" title="Listado de Material">Mat.</th>
              <th class="vc-th vc-th-center" style="width:52px" title="Planilla de Ejecución">Plan.</th>
              <th class="vc-th vc-th-center" style="width:62px" title="Evento Finalizado">Final.</th>
              <th class="vc-th vc-th-center" style="width:40px" title="Lista Operativa">
                <ClipboardCheck :size="12" />
              </th>
              <th class="vc-th" style="width:90px">Est. Admin.</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="ev in filteredEventos" :key="ev.id">

              <!-- ── Fila principal ── -->
              <tr class="vc-row" @click="toggleRow(ev.id)">

                <!-- Chevron -->
                <td class="vc-td vc-td-center">
                  <ChevronDown
                    :size="13"
                    class="vc-chevron"
                    :class="{ 'vc-chevron-open': expandedRow === ev.id }"
                  />
                </td>

                <!-- N° Evento -->
                <td class="vc-td">
                  <span class="vc-num">{{ ev.numero }}</span>
                </td>

                <!-- Agente -->
                <td class="vc-td ctrl-text-sm">
                  {{ ev.agenteComercial ?? ev.createdBy?.fullName ?? '—' }}
                </td>

                <!-- Unidad Operativa -->
                <td class="vc-td">
                  <span v-if="ev.unidadEjecucion" class="ctrl-badge" :class="unidadCls(ev.unidadEjecucion)">
                    {{ ev.unidadEjecucion }}
                  </span>
                  <span v-else class="ctrl-badge badge-gray">—</span>
                </td>

                <!-- Evento (descripción) -->
                <td class="vc-td ctrl-ev-name" @click.stop>
                  <span>{{ ev.description ?? ev.ubicacion ?? '—' }}</span>
                </td>

                <!-- Estado Operativo -->
                <td class="vc-td" @click.stop>
                  <span class="ctrl-badge" :class="estadoOpCls(ev.estadoOperativo)">
                    {{ ev.estadoOperativo ?? 'Sin asignar' }}
                  </span>
                </td>

                <!-- Coordinador -->
                <td class="vc-td" @click.stop>
                  <div class="coord-cell">
                    <Loader2 v-if="savingCoord[ev.id]" :size="13" class="spin coord-spin" />
                    <template v-else>
                      <!-- Chips de coordinadores asignados -->
                      <div class="coord-chips">
                        <span
                          v-for="c in (ev.coordinadores ?? [])"
                          :key="c.user?.id ?? c.id"
                          class="coord-chip"
                        >
                          {{ c.user?.fullName ?? c.fullName ?? '—' }}
                          <button
                            class="coord-chip-rm"
                            @click.stop="toggleCoord(ev, c.user?.id ?? c.id)"
                            title="Remover"
                          >×</button>
                        </span>
                        <span v-if="!(ev.coordinadores?.length)" class="coord-empty">—</span>
                      </div>
                      <!-- Botón para abrir dropdown -->
                      <div class="coord-dropdown-wrap">
                        <button
                          class="coord-add-btn"
                          @click.stop="toggleCoordDropdown(ev.id)"
                          title="Asignar coordinador"
                        >+</button>
                        <div
                          v-if="coordOpen[ev.id]"
                          class="coord-dropdown"
                          v-click-outside="() => closeCoordDropdown(ev.id)"
                        >
                          <div
                            v-for="c in coordinadores"
                            :key="c.id"
                            class="coord-opt"
                            :class="{ 'coord-opt--active': isAssigned(ev, c.id) }"
                            @click.stop="toggleCoord(ev, c.id)"
                          >
                            <span class="coord-opt-check">{{ isAssigned(ev, c.id) ? '✓' : '' }}</span>
                            {{ c.fullName }}
                          </div>
                          <div v-if="!coordinadores.length" class="coord-opt coord-opt--empty">
                            Sin coordinadores disponibles
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </td>

                <!-- Cliente -->
                <td class="vc-td ctrl-text-sm">
                  {{ ev.cliente?.name ?? ev.empresa ?? '—' }}
                </td>

                <!-- Fecha Inicio -->
                <td class="vc-td ctrl-date">
                  {{ formatDate(ev.operationWindow?.eventStartAt) }}
                </td>

                <!-- Fecha Fin -->
                <td class="vc-td ctrl-date">
                  {{ formatDate(ev.operationWindow?.eventEndAt) }}
                </td>

                <!-- Encuesta -->
                <td class="vc-td vc-td-center" @click.stop>
                  <button
                    class="ctrl-check"
                    :class="ev.encuesta ? 'ctrl-check-on' : 'ctrl-check-off'"
                    :disabled="isSaving(ev.id, 'encuesta')"
                    @click="handleCheck(ev, 'encuesta')"
                  >
                    <Loader2 v-if="isSaving(ev.id, 'encuesta')" :size="12" class="spin" />
                    <span v-else>{{ ev.encuesta ? '✓' : '✗' }}</span>
                  </button>
                </td>

                <!-- Foto -->
                <td class="vc-td vc-td-center" @click.stop>
                  <button
                    class="ctrl-check"
                    :class="ev.registroFotografico ? 'ctrl-check-on' : 'ctrl-check-off'"
                    :disabled="isSaving(ev.id, 'registroFotografico')"
                    @click="handleCheck(ev, 'registroFotografico')"
                  >
                    <Loader2 v-if="isSaving(ev.id, 'registroFotografico')" :size="12" class="spin" />
                    <span v-else>{{ ev.registroFotografico ? '✓' : '✗' }}</span>
                  </button>
                </td>

                <!-- Material -->
                <td class="vc-td vc-td-center" @click.stop>
                  <button
                    class="ctrl-check"
                    :class="ev.listadoMaterial ? 'ctrl-check-done' : 'ctrl-check-off'"
                    :disabled="isSaving(ev.id, 'listadoMaterial')"
                    @click="handleCheck(ev, 'listadoMaterial')"
                    :title="ev.listadoMaterial ? 'Material Completo' : 'Pendiente'"
                  >
                    <Loader2 v-if="isSaving(ev.id, 'listadoMaterial')" :size="12" class="spin" />
                    <template v-else>
                      <span v-if="ev.listadoMaterial" class="flex items-center gap-1">
                        <CheckCircle2 :size="12" />
                        <span class="hidden xl:inline">Completo</span>
                      </span>
                      <span v-else>✗</span>
                    </template>
                  </button>
                </td>

                <!-- Planilla -->
                <td class="vc-td vc-td-center" @click.stop>
                  <button
                    class="ctrl-check"
                    :class="ev.planillaEjecucion ? 'ctrl-check-on' : 'ctrl-check-off'"
                    :disabled="isSaving(ev.id, 'planillaEjecucion')"
                    @click="handleCheck(ev, 'planillaEjecucion')"
                  >
                    <Loader2 v-if="isSaving(ev.id, 'planillaEjecucion')" :size="12" class="spin" />
                    <span v-else>{{ ev.planillaEjecucion ? '✓' : '✗' }}</span>
                  </button>
                </td>

                <!-- Finalizado -->
                <td class="vc-td vc-td-center" @click.stop>
                  <button
                    class="ctrl-check"
                    :class="ev.eventoFinalizado ? 'ctrl-check-on' : 'ctrl-check-off'"
                    :disabled="isSaving(ev.id, 'eventoFinalizado')"
                    @click="handleCheck(ev, 'eventoFinalizado')"
                  >
                    <Loader2 v-if="isSaving(ev.id, 'eventoFinalizado')" :size="12" class="spin" />
                    <span v-else>{{ ev.eventoFinalizado ? '✓' : '✗' }}</span>
                  </button>
                </td>

                <!-- Lista Operativa -->
                <td class="vc-td vc-td-center" @click.stop>
                  <button
                    class="ctrl-check ctrl-check-op"
                    title="Ver Lista Operativa"
                    @click="openOpList(ev)"
                  >
                    <ClipboardCheck :size="13" />
                  </button>
                </td>

                <!-- Estado Admin -->
                <td class="vc-td" @click.stop>
                  <span v-if="ev.estadoAdministrativo" class="ctrl-badge" :class="estadoAdminCls(ev.estadoAdministrativo)">
                    {{ ev.estadoAdministrativo }}
                  </span>
                  <span v-else class="ctrl-badge badge-gray">—</span>
                </td>

              </tr>

              <!-- ── Fila expandida ── -->
              <tr class="vc-exp-tr">
                <td :colspan="17" class="vc-exp-td">
                  <div
                    class="vc-exp-panel"
                    :class="{ 'vc-exp-open': expandedRow === ev.id }"
                  >
                    <div class="vc-exp-inner">
                      <div class="vc-exp-grid">

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Estado Comercial</span>
                          <span class="vc-exp-val">{{ ev.quotationStatus?.name ?? '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Inicio montaje</span>
                          <span class="vc-exp-val">
                            {{ formatDate(ev.operationWindow?.setupStartAt) }}
                            {{ formatTime(ev.operationWindow?.setupStartAt) }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Inicio evento</span>
                          <span class="vc-exp-val">
                            {{ formatDate(ev.operationWindow?.eventStartAt) }}
                            {{ formatTime(ev.operationWindow?.eventStartAt) }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Fin evento</span>
                          <span class="vc-exp-val">
                            {{ formatDate(ev.operationWindow?.eventEndAt) }}
                            {{ formatTime(ev.operationWindow?.eventEndAt) }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Fin desmontaje</span>
                          <span class="vc-exp-val">
                            {{ formatDate(ev.operationWindow?.teardownEndAt) }}
                            {{ formatTime(ev.operationWindow?.teardownEndAt) }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Asistentes</span>
                          <span class="vc-exp-val">{{ ev.asistentes ?? '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Tipo suelo</span>
                          <span class="vc-exp-val">{{ ev.tipoSuelo ?? '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Celular</span>
                          <span class="vc-exp-val">{{ ev.celular ?? '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Correo</span>
                          <span class="vc-exp-val">{{ ev.correo ?? '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Link mapa</span>
                          <span class="vc-exp-val">
                            <a v-if="ev.linkMaps" :href="ev.linkMaps" target="_blank" class="vc-link">
                              Ver mapa
                            </a>
                            <span v-else>—</span>
                          </span>
                        </div>

                        <!-- Items (equipos propios + terceros) -->
                        <div
                          v-if="ev.items?.length || ev.thirdPartyItems?.length"
                          class="vc-exp-field"
                          style="grid-column: span 5"
                        >
                          <div class="mb-2">
                            <span class="vc-exp-label">
                              Equipos / Productos
                              ({{ (ev.items?.length ?? 0) + (ev.thirdPartyItems?.length ?? 0) }})
                            </span>
                          </div>
                          <div class="ctrl-items-list">
                            <span
                              v-for="it in ev.items"
                              :key="`own-${it.id ?? it.productId}`"
                              class="ctrl-item-pill"
                            >
                              {{ it.product?.dispositivo ?? it.dispositivo ?? it.productId }}
                              <span class="ctrl-item-qty">×{{ it.cantidadProducto ?? it.quantity ?? 1 }}</span>
                            </span>
                            <span
                              v-for="it in ev.thirdPartyItems"
                              :key="`3p-${it.id}`"
                              class="ctrl-item-pill ctrl-item-pill--third"
                            >
                              {{ it.dispositivo ?? it.nombre ?? `#${it.id}` }}
                              <span class="ctrl-item-qty">×{{ it.cantidad ?? 1 }}</span>
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </td>
              </tr>

            </template>
          </tbody>

        </table>
      </div>
    </div>

    <!-- ── Modal Lista Operativa ── -->
    <OperationalListModal
      v-if="showOpListModal"
      :show="showOpListModal"
      :event="selectedEvent"
      @close="showOpListModal = false"
      @complete="onOpListComplete"
    />

  </div>
</template>

<style scoped>
/* ── Shared from VerCotizaciones ─────────────────────── */
.vc-page { width: 100%; }

.vc-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 0 0 4px;
  line-height: 1.2;
}

.vc-subtitle {
  font-size: 13px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.vc-input {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  appearance: auto;
}

.vc-input:focus {
  border-color: var(--primary, #054EAF);
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.1);
}

.vc-input::placeholder { color: var(--text-3, #94A3B8); }

.vc-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

.vc-head-row { background: #EBF3FC; }

.vc-th {
  padding: 10px 12px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-2, #64748B);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #E2EBF6;
}

.vc-th-center { text-align: center; }

.vc-row {
  background: #FFFFFF;
  cursor: pointer;
  transition: background 0.15s ease;
}
.vc-row:hover { background: #F0F7FF; }

.vc-td {
  padding: 11px 12px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  border-bottom: 1px solid #EBF3FC;
  vertical-align: middle;
  white-space: nowrap;
}

.vc-td-center { text-align: center; }

.vc-chevron {
  color: var(--text-3, #94A3B8);
  transition: transform 0.2s ease, color 0.15s ease;
  display: block;
  margin: 0 auto;
}
.vc-chevron-open { transform: rotate(180deg); color: #054EAF; }

.vc-num {
  font-weight: 700;
  font-size: 13px;
  color: #054EAF;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}

.vc-exp-td { padding: 0 !important; border-bottom: 1px solid #EBF3FC; }

.vc-exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}
.vc-exp-open { max-height: 500px; }

.vc-exp-inner {
  background: #F8FBFF;
  border-left: 3px solid #054EAF;
  padding: 16px 20px;
}

.vc-exp-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px 20px;
}

@media (max-width: 768px) {
  .vc-exp-grid { grid-template-columns: repeat(2, 1fr); }
}

.vc-exp-field { display: flex; flex-direction: column; gap: 4px; }

.vc-exp-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
}

.vc-exp-val {
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.vc-link { color: #054EAF; text-decoration: underline; font-size: 13px; font-weight: 500; }
.vc-link:hover { color: #0342A0; }

/* ── Control-specific ─────────────────────────────────── */
.text-primary { color: #054EAF; }

.ev-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  background: #EBF3FC;
  color: #054EAF;
  font-size: 15px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  border-radius: 999px;
}

/* Search icon absolute */
.relative { position: relative; }
.abs-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}
.pl-8 { padding-left: 32px !important; }

/* Badges */
.ctrl-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

.badge-orange { background: #FFF7ED; color: #C2410C; }
.badge-blue   { background: #EFF6FF; color: #1D4ED8; }
.badge-green  { background: #F0FDF4; color: #166534; }
.badge-purple { background: #F5F3FF; color: #6D28D9; }
.badge-yellow { background: #FEFCE8; color: #854D0E; }
.badge-gray   { background: #F1F5F9; color: #64748B; }

/* Checkboxes interactivos */
.ctrl-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'Inter', sans-serif;
}

.ctrl-check-on  { background: #DCFCE7; color: #16A34A; }
.ctrl-check-done { background: #054EAF; color: #FFFFFF; min-width: 26px; width: auto; padding: 0 8px; }
.ctrl-check-off { background: #FEE2E2; color: #DC2626; }
.ctrl-check-op  { background: #EBF3FC; color: #054EAF; }
.ctrl-check-op:hover { background: #054EAF; color: #FFFFFF; }
.ctrl-check:hover:not(:disabled) { opacity: 0.75; }
.ctrl-check:disabled { opacity: 0.5; cursor: not-allowed; }

/* Spinner */
.spin {
  animation: spin-anim 0.7s linear infinite;
}
@keyframes spin-anim { to { transform: rotate(360deg); } }

/* Text helpers */
.ctrl-text-sm { font-size: 12px; color: var(--text-2, #64748B); }
.ctrl-date    { font-size: 12px; color: var(--text-2, #64748B); white-space: nowrap; }
.ctrl-ev-name { white-space: normal; max-width: 200px; word-break: break-word; font-weight: 500; }

/* Items list in expanded row */
.ctrl-items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.ctrl-item-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #EBF3FC;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: #054EAF;
  white-space: nowrap;
}

.ctrl-item-qty {
  font-size: 11px;
  color: #64748B;
  font-weight: 400;
}

/* Skeleton loader */
.sk-wrap {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sk-row {
  height: 44px;
  border-radius: 8px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}

/* Dense table override */
.ctrl-table .vc-td { padding: 9px 12px; }

/* Third-party item pill */
.ctrl-item-pill--third {
  background: #F0FDF4;
  color: #166534;
}

/* Coordinator multi-select */
.coord-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.coord-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.coord-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #EBF3FC;
  color: #054EAF;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
}

.coord-chip-rm {
  background: none;
  border: none;
  color: #64748B;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0 1px;
  transition: color 0.12s;
}
.coord-chip-rm:hover { color: #B91C1C; }

.coord-empty {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

.coord-dropdown-wrap {
  position: relative;
}

.coord-add-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px dashed #94A3B8;
  background: transparent;
  color: #94A3B8;
  font-size: 15px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s, background 0.12s;
}
.coord-add-btn:hover {
  border-color: #054EAF;
  color: #054EAF;
  background: #EBF3FC;
}

.coord-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  background: #FFFFFF;
  border: 1px solid #E2EBF6;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(5, 78, 175, 0.12);
  min-width: 180px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px;
}

.coord-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #0F1A2E;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.12s;
}
.coord-opt:hover { background: #F0F7FF; }
.coord-opt--active { color: #054EAF; font-weight: 700; }
.coord-opt--empty { color: #94A3B8; cursor: default; font-style: italic; }
.coord-opt--empty:hover { background: none; }

.coord-opt-check {
  width: 14px;
  font-size: 11px;
  color: #054EAF;
  flex-shrink: 0;
}

.coord-spin {
  color: #94A3B8;
  animation: spin-anim 0.7s linear infinite;
  margin: auto;
}

</style>
