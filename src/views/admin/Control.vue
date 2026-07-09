<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  ClipboardCheck, ClipboardX, ChevronDown, Search,
  Loader2, CheckCircle2, Users, Activity, Truck, CornerDownLeft,
  ClipboardList, Link2, Copy, Check,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-vue-next'
import { useControl } from '@/composables/useControl'
import OperationalListModal from '@/components/quotation/OperationalListModal.vue'
import TeamModal from '@/components/quotation/TeamModal.vue'
import ModalFlujoEvento from '@/components/quotation/ModalFlujoEvento.vue'
import AsignacionEquipos from '@/views/operativa/AsignacionEquipos.vue'
import NotasCotizacionPanel from '@/components/quotation/NotasCotizacionPanel.vue'
import ExtraCostsPanel from '@/components/quotation/ExtraCostsPanel.vue'
import { createEncuesta, getEncuestas } from '@/services/encuestas.service'
import { getChecklistEvento } from '@/services/checklist-evento.service.js'
import { uploadPlanimetria, deletePlanimetria } from '@/services/administracion.service.js'
import { useAuth } from '@/composables/useAuth'
import { useActionAccess } from '@/composables/useActionAccess'
import ThumbHoverPreview from '@/components/shared/ThumbHoverPreview.vue'
import { useThumbHoverPreview } from '@/composables/useThumbHoverPreview'

// ── Preview ampliado al hover sobre el nombre del equipo (sin miniatura visible) ──
const { preview: thumbPreview, showPreview: showThumbPreview, hidePreview: hideThumbPreview } = useThumbHoverPreview()

// Debe coincidir con EXTRA_COST_READ_ROLES en el backend (quotations.controller.ts)
const EXTRA_COST_READ_ROLES = ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO']
const { user } = useAuth()
const { canDo } = useActionAccess()
const canSeeExtraCosts = computed(() => (user.value?.roles ?? []).some(r => EXTRA_COST_READ_ROLES.includes(r)))

const activeTab = ref<'control' | 'equipo'>('control')

const { eventos, loading, fetchEventos, updateEvento, refreshEventTeam, patchEventLocal } = useControl()

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

// ── Paginación ────────────────────────────────────────
const currentPage  = ref(1)
const pageSize     = ref(25)

const pagedEventos = computed(() => {
  const start = (currentPage.value - 1) * Number(pageSize.value)
  return filteredEventos.value.slice(start, start + Number(pageSize.value))
})
const totalPages = computed(() => Math.ceil(filteredEventos.value.length / Number(pageSize.value)))
const visiblePages = computed(() => {
  const total = totalPages.value, cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)          return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3)  return [1, '...', total-4, total-3, total-2, total-1, total]
  return [1, '...', cur-1, cur, cur+1, '...', total]
})
watch([search, unidadFiltro, estadoFiltro, fechaInicio, fechaFin], () => { currentPage.value = 1 })

// ── Accordion ──────────────────────────────────────────
const expandedRow = ref(null)
const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

// ── Team modal ─────────────────────────────────────────
const showTeamModal    = ref(false)
const selectedTeamEvent = ref(null)

const openTeamModal = (evento) => {
  selectedTeamEvent.value = evento
  showTeamModal.value = true
}

const onTeamUpdated = async (payload?: any) => {
  if (!selectedTeamEvent.value?.id) return
  if (payload?.type === 'responsables' && payload.users) {
    patchEventLocal(selectedTeamEvent.value.id, payload.users)
  } else {
    await refreshEventTeam(selectedTeamEvent.value.id)
  }
}

// ── Flujo modal ────────────────────────────────────────
const showFlujoModal   = ref(false)
const selectedFlujoEventId = ref<number | null>(null)
const selectedFlujoEvent = computed(() =>
  eventos.value.find(e => e.id === selectedFlujoEventId.value) ?? null
)

const openFlujoModal = (evento) => {
  selectedFlujoEventId.value = evento.id
  showFlujoModal.value = true
}

const onFlujoOpenTeam = () => {
  showFlujoModal.value = false
  selectedTeamEvent.value = selectedFlujoEvent.value
  showTeamModal.value = true
}

// ── Spinner por celda (usado por handleEncuesta) ──────
const saving = ref({}) // { "id-campo": true/false }

const isSaving = (id, campo) => !!saving.value[`${id}-${campo}`]

// ── Encuestas ──────────────────────────────────────────
const encuestasMap  = ref<Record<number, any>>({})  // quotationId → encuesta
const copiedId      = ref<number | null>(null)

const loadEncuestas = async () => {
  try {
    const res = await getEncuestas()
    const list = res.data ?? []
    encuestasMap.value = Object.fromEntries(list.map((e: any) => [e.quotationId, e]))
  } catch (_) {}
}

const encuestaUrl = (token: string) => {
  const base = window.location.origin
  return `${base}/encuesta/${token}`
}

const copyLink = async (token: string, id: number) => {
  await navigator.clipboard.writeText(encuestaUrl(token))
  copiedId.value = id
  setTimeout(() => { copiedId.value = null }, 2000)
}

const handleEncuesta = async (ev: any) => {
  const key = `${ev.id}-encuesta`
  saving.value = { ...saving.value, [key]: true }
  try {
    if (ev.encuesta && encuestasMap.value[ev.id]) {
      // Ya tiene encuesta → desactivar/activar toggle en panel de reporte
      // Desde control solo habilitamos; la gestión completa es en Reporte
    } else if (!ev.encuesta) {
      // Crear encuesta y marcar flag
      const res = await createEncuesta(ev.id, ev.empresa ?? ev.cliente?.name)
      encuestasMap.value[ev.id] = res.data
      await updateEvento(ev.id, 'encuesta', true)
      ev.encuesta = true
    }
  } finally {
    const next = { ...saving.value }
    delete next[key]
    saving.value = next
  }
}

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

// ── % Ejecución ───────────────────────────────────────
const calcEjec = (ev) => {
  const flags = [ev.planillaEjecucion, ev.listadoMaterial, ev.registroFotografico, ev.despachado, ev.retorno, ev.eventoFinalizado, ev.validadoAdministrativamente]
  return Math.round((flags.filter(Boolean).length / flags.length) * 100)
}

// ── LQ: estado real de la lista de chequeo, desde el backend ──────────
// (antes se leía de localStorage['be1_chk_v1'], una clave que solo
// llenaba una vista local de CheckIns.vue y nunca reflejaba el checklist
// público real que llena el equipo de campo vía /checklist/evento/:id)
const checklistCompletion = ref<Record<number, true | { done: number; total: number }>>({})

const loadChecklistCompletion = async () => {
  const pendientes = eventos.value.filter(ev => {
    const all = [...(ev.items ?? []), ...(ev.thirdPartyItems ?? [])]
    return all.some(i => i.requiereChecklist)
  })
  const resultados = await Promise.all(
    pendientes.map(ev => getChecklistEvento(ev.id).catch(() => null)),
  )
  const map: Record<number, true | { done: number; total: number }> = {}
  pendientes.forEach((ev, idx) => {
    const data = resultados[idx]
    const aspectos = data?.aspectos ?? []
    const needed = (data?.juegos ?? []).filter((j: any) => j.requiereChecklist)
    if (!data || aspectos.length === 0 || needed.length === 0) return
    const done = needed.filter((j: any) => aspectos.every((a: any) => j.state?.[a.id] === true)).length
    map[ev.id] = done === needed.length ? true : { done, total: needed.length }
  })
  checklistCompletion.value = map
}

// Retorna: null = sin items con checklist | true = todos completos | { done, total } = parcial
const lqStatus = (ev) => {
  const all = [...(ev.items ?? []), ...(ev.thirdPartyItems ?? [])]
  const needed = all.filter(i => i.requiereChecklist)
  if (needed.length === 0) return null
  return checklistCompletion.value[ev.id] ?? { done: 0, total: needed.length }
}

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
  await fetchEventos()
  await loadEncuestas()
  loadChecklistCompletion()
})

// ── Modal Planimetría ────────────────────────────────────
const showPlanModal    = ref(false)
const planModalEvento  = ref<any>(null)
const planReplacing    = ref(false)
const planDragOver     = ref(false)
const planUploading    = ref(false)
const planDeleting     = ref(false)
const planUploadError  = ref<string | null>(null)
const planFileInput    = ref<HTMLInputElement | null>(null)

const openPlanimetriaModal = (ev: any) => {
  planModalEvento.value = ev
  planReplacing.value   = false
  planUploadError.value = null
  showPlanModal.value   = true
}
const closePlanModal = () => { showPlanModal.value = false }

const isPlanImage = (url: string) => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)

const handlePlanUpload = async (file: File) => {
  planUploadError.value = null
  planUploading.value   = true
  try {
    const res = await uploadPlanimetria(planModalEvento.value.id, file)
    // Update local event
    const ev = eventos.value.find((e: any) => e.id === planModalEvento.value.id)
    if (ev) {
      (ev as any).planimetriaUrl = res.planimetriaUrl
      ;(ev as any).planimetriaKey = res.planimetriaKey
      planModalEvento.value = { ...planModalEvento.value, planimetriaUrl: res.planimetriaUrl }
    }
    planReplacing.value = false
  } catch (e: any) {
    planUploadError.value = e?.response?.data?.message ?? 'Error al subir el archivo'
  } finally {
    planUploading.value = false
  }
}

const onPlanFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handlePlanUpload(file)
}

const onPlanDrop = (e: DragEvent) => {
  planDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handlePlanUpload(file)
}

const handleDeletePlan = async () => {
  planDeleting.value = true
  try {
    await deletePlanimetria(planModalEvento.value.id)
    const ev = eventos.value.find((e: any) => e.id === planModalEvento.value.id)
    if (ev) {
      (ev as any).planimetriaUrl = null
      ;(ev as any).planimetriaKey = null
    }
    planModalEvento.value = { ...planModalEvento.value, planimetriaUrl: null }
    closePlanModal()
  } catch {
    planUploadError.value = 'Error al eliminar'
  } finally {
    planDeleting.value = false
  }
}
</script>

<template>
  <div class="vc-page">

    <!-- ═══════════════════════════════════════════════ -->
    <!-- TABS                                            -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="ctrl-tabs-bar">
      <button
        class="ctrl-tab"
        :class="{ 'ctrl-tab--active': activeTab === 'control' }"
        @click="activeTab = 'control'"
      >
        <ClipboardCheck :size="14" />
        Control
      </button>
      <button
        class="ctrl-tab"
        :class="{ 'ctrl-tab--active': activeTab === 'equipo' }"
        @click="activeTab = 'equipo'"
      >
        <Users :size="14" />
        Equipo
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- TAB: EQUIPO                                     -->
    <!-- ═══════════════════════════════════════════════ -->
    <AsignacionEquipos v-if="activeTab === 'equipo'" />

    <template v-if="activeTab === 'control'">

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
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(39,200,216,.06)] grid grid-cols-1 md:grid-cols-5 gap-3">

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
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(39,200,216,.06),_0_4px_16px_rgba(39,200,216,.08)] overflow-hidden">

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
              <th class="vc-th" style="width:32px">#</th>
              <th class="vc-th" style="width:68px">N° Evento</th>
              <th class="vc-th" style="width:110px">Agente</th>
              <th class="vc-th" style="width:100px">Unidad Operativa</th>
              <th class="vc-th" style="min-width:160px">Evento</th>
              <th class="vc-th" style="width:140px">Equipo</th>
              <th class="vc-th vc-th-center" style="width:40px" title="Flujo del Evento">
                <Activity :size="12" />
              </th>
              <th class="vc-th" style="width:130px">Cliente</th>
              <th class="vc-th" style="width:90px">F. Inicio</th>
              <th class="vc-th" style="width:90px">F. Fin</th>
              <th class="vc-th vc-th-center" style="width:60px" title="Encuesta de satisfacción"><ClipboardList :size="12" /></th>
              <th class="vc-th vc-th-center" style="width:52px" title="Lista de Chequeo">LQ</th>
              <th class="vc-th vc-th-center" style="width:52px" title="Registro Fotográfico">Foto</th>
              <th class="vc-th vc-th-center" style="width:52px" title="Listado de Material">Mat.</th>
              <th class="vc-th vc-th-center" style="width:90px" title="Despacho y Retorno de vehículo">Vehículo</th>
              <th class="vc-th vc-th-center" style="width:52px" title="Planimetría">Plani.</th>
              <th class="vc-th vc-th-center" style="width:52px" title="Planilla de Ejecución">Plan.</th>
              <th class="vc-th vc-th-center" style="width:62px" title="Evento Finalizado">Final.</th>
              <th class="vc-th vc-th-center" style="width:40px" title="Lista Operativa">
                <ClipboardCheck :size="12" />
              </th>
              <th class="vc-th" style="width:90px">Est. Admin.</th>
              <th class="vc-th vc-th-center" style="width:72px" title="Validación Administrativa">VAL ADM</th>
              <th class="vc-th vc-th-center" style="width:80px">% Ejec.</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="(ev, idx) in pagedEventos" :key="ev.id">

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

                <!-- # -->
                <td class="vc-td vc-td-center vc-row-num">
                  {{ idx + 1 + (currentPage - 1) * Number(pageSize) }}
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

                <!-- Equipo -->
                <td class="vc-td" @click.stop>
                  <div class="equipo-cell">
                    <div class="equipo-info">
                      <template v-if="ev.coordinadores?.length">
                        <span class="equipo-coord-name">
                          {{ ev.coordinadores[0]?.user?.fullName ?? '—' }}
                        </span>
                        <span v-if="ev.coordinadores.length > 1" class="equipo-extra-badge">
                          +{{ ev.coordinadores.length - 1 }}
                        </span>
                      </template>
                      <span v-else class="equipo-empty">Sin coord.</span>
                      <span v-if="ev.responsableOperativo" class="equipo-resp-op-badge" :title="`Resp. Operativo: ${ev.responsableOperativo.fullName}`">
                        Op: {{ ev.responsableOperativo.fullName.split(' ')[0] }}
                      </span>
                      <span v-if="ev.members?.length" class="equipo-members-badge">
                        {{ ev.members.length }} logístico
                      </span>
                    </div>
                    <button
                      v-if="canDo('QuotationMiembros', ['ADMINISTRADOR', 'LIDER', 'SUPERVISOR'])"
                      class="equipo-edit-btn"
                      @click.stop="openTeamModal(ev)"
                      title="Gestionar equipo"
                    >
                      <Users :size="12" />
                    </button>
                  </div>
                </td>

                <!-- Flujo del Evento -->
                <td class="vc-td vc-td-center" @click.stop>
                  <button
                    class="ctrl-check ctrl-check-op"
                    title="Ver flujo del evento"
                    @click.stop="openFlujoModal(ev)"
                  >
                    <Activity :size="13" />
                  </button>
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

                <!-- Encuesta de satisfacción -->
                <td class="vc-td vc-td-center enc-cell" @click.stop>
                  <Loader2 v-if="isSaving(ev.id, 'encuesta')" :size="12" class="spin" />
                  <template v-else>
                    <!-- Sin encuesta: botón crear -->
                    <button
                      v-if="!ev.encuesta"
                      class="ctrl-check ctrl-check-off enc-btn"
                      title="Crear encuesta de satisfacción"
                      @click="handleEncuesta(ev)"
                    >
                      <ClipboardList :size="12" />
                    </button>
                    <!-- Con encuesta: badge + copiar link -->
                    <div v-else class="enc-active-wrap">
                      <span class="enc-active-dot" title="Encuesta activa" />
                      <button
                        class="enc-copy-btn"
                        :title="copiedId === ev.id ? 'Link copiado!' : 'Copiar link de encuesta'"
                        @click="encuestasMap[ev.id] && copyLink(encuestasMap[ev.id].token, ev.id)"
                      >
                        <Check v-if="copiedId === ev.id" :size="11" style="color:#16a34a" />
                        <Copy v-else :size="11" />
                      </button>
                    </div>
                  </template>
                </td>

                <!-- LQ (automático — refleja la lista de chequeo real completada por el equipo de campo) -->
                <td class="vc-td vc-td-center" @click.stop>
                  <span v-if="lqStatus(ev) === null" class="ctrl-dispatch-empty">—</span>
                  <div
                    v-else
                    class="ctrl-check ctrl-check-auto"
                    :class="lqStatus(ev) === true ? 'ctrl-check-on' : 'ctrl-check-done'"
                    :title="lqStatus(ev) === true ? 'Checklist completo' : `${lqStatus(ev).done}/${lqStatus(ev).total} ítems verificados`"
                  >
                    <span>{{ lqStatus(ev) === true ? '✓' : `${lqStatus(ev).done}/${lqStatus(ev).total}` }}</span>
                  </div>
                </td>

                <!-- Foto (automático — se marca solo con check-in de campo que incluya fotos) -->
                <td class="vc-td vc-td-center" @click.stop>
                  <div
                    class="ctrl-check ctrl-check-auto"
                    :class="ev.registroFotografico ? 'ctrl-check-on' : 'ctrl-check-off'"
                    title="Automático: se marca al recibir un check-in de campo con fotos"
                  >
                    <span>{{ ev.registroFotografico ? '✓' : '✗' }}</span>
                  </div>
                </td>

                <!-- Material (automático — se marca al completar la Lista Operativa) -->
                <td class="vc-td vc-td-center" @click.stop>
                  <div
                    class="ctrl-check ctrl-check-auto"
                    :class="ev.listadoMaterial ? 'ctrl-check-done' : 'ctrl-check-off'"
                    :title="ev.listadoMaterial ? 'Material Completo (automático desde Lista Operativa)' : 'Pendiente — se completa desde Lista Operativa'"
                  >
                    <span v-if="ev.listadoMaterial" class="flex items-center gap-1">
                      <CheckCircle2 :size="12" />
                      <span class="hidden xl:inline">Completo</span>
                    </span>
                    <span v-else>✗</span>
                  </div>
                </td>

                <!-- Vehículo: Despacho + Retorno -->
                <td class="vc-td vc-td-center" @click.stop>
                  <div v-if="!ev.despachado && !ev.retorno" class="ctrl-dispatch-empty">—</div>
                  <div v-else class="ctrl-vehicle-steps">
                    <span
                      class="ctrl-vstep"
                      :class="ev.despachado ? 'ctrl-vstep--desp' : 'ctrl-vstep--off'"
                      title="Despacho"
                    >
                      <Truck :size="10" />
                    </span>
                    <span class="ctrl-vstep-sep">›</span>
                    <span
                      class="ctrl-vstep"
                      :class="ev.retorno ? 'ctrl-vstep--ret' : 'ctrl-vstep--off'"
                      title="Retorno"
                    >
                      <CornerDownLeft :size="10" />
                    </span>
                  </div>
                </td>

                <!-- Planimetría -->
                <td class="vc-td vc-td-center" @click.stop>
                  <button
                    class="ctrl-check"
                    :class="ev.planimetriaUrl ? 'ctrl-check-on' : 'ctrl-check-off'"
                    @click="openPlanimetriaModal(ev)"
                    :title="ev.planimetriaUrl ? 'Ver / reemplazar planimetría' : 'Subir planimetría'"
                  >
                    <span>{{ ev.planimetriaUrl ? '✓' : '✗' }}</span>
                  </button>
                </td>

                <!-- Planilla (automático — se marca al completar el montaje en Montajes) -->
                <td class="vc-td vc-td-center" @click.stop>
                  <div
                    class="ctrl-check ctrl-check-auto"
                    :class="ev.planillaEjecucion ? 'ctrl-check-on' : 'ctrl-check-off'"
                    title="Automático: se marca al completar el montaje en Montajes"
                  >
                    <span>{{ ev.planillaEjecucion ? '✓' : '✗' }}</span>
                  </div>
                </td>

                <!-- Finalizado (automático — se marca al cerrar el check-in del evento) -->
                <td class="vc-td vc-td-center" @click.stop>
                  <div
                    class="ctrl-check ctrl-check-auto"
                    :class="ev.eventoFinalizado ? 'ctrl-check-on' : 'ctrl-check-off'"
                    title="Automático: se marca al cerrar el check-in del evento"
                  >
                    <span>{{ ev.eventoFinalizado ? '✓' : '✗' }}</span>
                  </div>
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

                <!-- VAL ADM -->
                <td class="vc-td vc-td-center" @click.stop>
                  <span class="ctrl-valadm-badge" :class="ev.validadoAdministrativamente ? 'valadm-ok' : 'valadm-no'">
                    {{ ev.validadoAdministrativamente ? 'OK' : 'Pdte.' }}
                  </span>
                </td>

                <!-- % Ejecución -->
                <td class="vc-td vc-td-center" @click.stop>
                  <div class="ctrl-ejec-wrap">
                    <div class="ctrl-ejec-bar">
                      <div class="ctrl-ejec-fill" :style="{ width: calcEjec(ev) + '%' }"
                        :class="{ 'ctrl-ejec-full': calcEjec(ev) === 100 }" />
                    </div>
                    <span class="ctrl-ejec-pct">{{ calcEjec(ev) }}%</span>
                  </div>
                </td>

              </tr>

              <!-- ── Fila expandida ── -->
              <tr class="vc-exp-tr">
                <td :colspan="21" class="vc-exp-td">
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
                              :title="it.product?.nombre || it.product?.dispositivo || `Producto #${it.productId}`"
                              @mouseenter="showThumbPreview($event, it.product?.linkFotoDispositivo)"
                              @mouseleave="hideThumbPreview"
                            >
                              {{ it.product?.nombre || it.product?.dispositivo || `Producto #${it.productId}` }}
                              <span class="ctrl-item-qty">×{{ it.cantidadProducto ?? it.quantity ?? 1 }}</span>
                            </span>
                            <span
                              v-for="it in ev.thirdPartyItems"
                              :key="`3p-${it.id}`"
                              class="ctrl-item-pill ctrl-item-pill--third"
                              :title="it.catalogProduct?.nombre || it.catalogProduct?.dispositivo || it.nombre || it.dispositivo || it.producto?.nombre || 'Producto de tercero'"
                              @mouseenter="showThumbPreview($event, it.catalogProduct?.linkFotoDispositivo)"
                              @mouseleave="hideThumbPreview"
                            >
                              <template v-if="it.catalogProduct?.nombre || it.catalogProduct?.dispositivo">
                                {{ it.catalogProduct.nombre || it.catalogProduct.dispositivo }}
                              </template>
                              <template v-else-if="it.nombre || it.dispositivo">
                                {{ it.nombre || it.dispositivo }}
                              </template>
                              <template v-else-if="it.producto?.nombre">
                                {{ it.producto.nombre }}
                              </template>
                              <template v-else>
                                #{{ it.id }}
                              </template>
                              <span class="ctrl-item-qty">×{{ it.cantidad ?? 1 }}</span>
                            </span>
                          </div>
                        </div>

                      </div>

                      <!-- Notas Operativo + Logístico -->
                      <NotasCotizacionPanel
                        :quotationId="ev.id"
                        :areasFiltro="['Operativo', 'Logístico']"
                      />

                      <!-- Cuadro de costos (gastos adicionales del evento) -->
                      <ExtraCostsPanel v-if="canSeeExtraCosts" :quotationId="ev.id" />

                    </div>
                  </div>
                </td>
              </tr>

            </template>
          </tbody>

        </table>
      </div>

      <!-- Paginación -->
      <div class="pp-pagination">
        <span class="pg-info">
          {{ (currentPage - 1) * Number(pageSize) + 1 }}–{{ Math.min(currentPage * Number(pageSize), filteredEventos.length) }}
          de {{ filteredEventos.length }}
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

    </template><!-- /control tab -->

    <!-- ── Modal Lista Operativa ── -->
    <OperationalListModal
      v-if="showOpListModal"
      :show="showOpListModal"
      :event="selectedEvent"
      @close="showOpListModal = false"
      @complete="onOpListComplete"
    />

    <!-- ── Modal Equipo ── -->
    <TeamModal
      v-if="showTeamModal"
      :show="showTeamModal"
      :event="selectedTeamEvent"
      @close="showTeamModal = false"
      @updated="onTeamUpdated"
    />

    <!-- ── Modal Flujo del Evento ── -->
    <ModalFlujoEvento
      v-if="showFlujoModal"
      :show="showFlujoModal"
      :event="selectedFlujoEvent"
      @close="showFlujoModal = false"
      @open-team="onFlujoOpenTeam"
    />

    <!-- ── Modal Planimetría ── -->
    <Teleport to="body">
      <div v-if="showPlanModal" class="plani-overlay">
        <div class="plani-modal">
          <!-- Header -->
          <div class="plani-header">
            <div class="plani-header-info">
              <span class="plani-header-label">Planimetría</span>
              <span class="plani-header-sub">COT-{{ planModalEvento?.numero }} · {{ planModalEvento?.empresa }}</span>
            </div>
            <button class="plani-close" @click="closePlanModal">✕</button>
          </div>

          <!-- Body -->
          <div class="plani-body">

            <!-- Archivo actual -->
            <template v-if="planModalEvento?.planimetriaUrl && !planReplacing">
              <div class="plani-current">
                <!-- Preview imagen -->
                <div v-if="isPlanImage(planModalEvento.planimetriaUrl)" class="plani-img-wrap">
                  <img :src="planModalEvento.planimetriaUrl" class="plani-img" alt="Planimetría" />
                </div>
                <!-- Preview PDF -->
                <div v-else class="plani-pdf-wrap">
                  <div class="plani-pdf-icon">PDF</div>
                  <span class="plani-pdf-name">Planimetría adjunta</span>
                </div>

                <a :href="planModalEvento.planimetriaUrl" target="_blank" class="plani-view-btn">
                  Abrir archivo
                </a>
              </div>

              <div class="plani-actions">
                <button class="plani-btn plani-btn-sec" @click="planReplacing = true">Reemplazar</button>
                <button v-if="canDo('CotizacionPlanimetriaEliminar', ['ADMINISTRADOR', 'DIRECCION'])" class="plani-btn plani-btn-del" :disabled="planDeleting" @click="handleDeletePlan">
                  <span v-if="planDeleting" class="plani-spin" />
                  <span v-else>Eliminar</span>
                </button>
              </div>
            </template>

            <!-- Drop zone de upload -->
            <template v-else>
              <div
                class="plani-drop"
                :class="{ 'plani-drop-over': planDragOver, 'plani-drop-uploading': planUploading }"
                @dragover.prevent="planDragOver = true"
                @dragleave="planDragOver = false"
                @drop.prevent="onPlanDrop"
                @click="$refs.planFileInput.click()"
              >
                <input
                  ref="planFileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  class="plani-file-input"
                  @change="onPlanFileChange"
                />
                <template v-if="planUploading">
                  <div class="plani-spin plani-spin-lg" />
                  <p class="plani-drop-text">Subiendo archivo…</p>
                </template>
                <template v-else>
                  <div class="plani-drop-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                      <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <p class="plani-drop-text">Arrastra aquí o toca para seleccionar</p>
                  <p class="plani-drop-hint">Imagen (JPG, PNG, WEBP) o PDF · máx 20 MB</p>
                </template>
              </div>

              <div v-if="planReplacing" class="plani-cancel-replace">
                <button class="plani-btn plani-btn-sec" @click="planReplacing = false">Cancelar</button>
              </div>

              <div v-if="planUploadError" class="plani-error">{{ planUploadError }}</div>
            </template>

          </div>
        </div>
      </div>
    </Teleport>

  </div>

  <ThumbHoverPreview :preview="thumbPreview" />
</template>

<style scoped>
/* ── Shared from VerCotizaciones ─────────────────────── */
.vc-page { width: 100%; }

/* ── Tabs bar ────────────────────────────────────────── */
.ctrl-tabs-bar {
  display: flex;
  gap: 4px;
  background: #F1F5F9;
  border-radius: 12px;
  padding: 4px;
  width: fit-content;
  margin-bottom: 24px;
}

.ctrl-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 9px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #64748B;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-tab:hover { color: #0F1A2E; background: rgba(255,255,255,.6); }
.ctrl-tab--active { background: #FFFFFF; color: #27C8D8; box-shadow: 0 1px 4px rgba(15,26,46,.1); }

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
  border-color: var(--primary, #27C8D8);
  box-shadow: 0 0 0 3px rgba(39,200,216, 0.1);
}

.vc-input::placeholder { color: var(--text-3, #94A3B8); }

.vc-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

.vc-head-row { background: #F0FAFB; }

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
  border-bottom: 1px solid #F0FAFB;
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
.vc-chevron-open { transform: rotate(180deg); color: #27C8D8; }

.vc-num {
  font-weight: 700;
  font-size: 13px;
  color: #27C8D8;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}

.vc-exp-td { padding: 0 !important; border-bottom: 1px solid #F0FAFB; }

.vc-exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}
.vc-exp-open { max-height: 900px; }

.vc-exp-inner {
  background: #F8FBFF;
  border-left: 3px solid #27C8D8;
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

.vc-link { color: #27C8D8; text-decoration: underline; font-size: 13px; font-weight: 500; }
.vc-link:hover { color: #1BAEBB; }

/* ── Control-specific ─────────────────────────────────── */
.text-primary { color: #27C8D8; }

.ev-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  background: #F0FAFB;
  color: #27C8D8;
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
.badge-blue   { background: #E0F9FA; color: #27C8D8; }
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
.ctrl-check-done { background: #27C8D8; color: #FFFFFF; min-width: 26px; width: auto; padding: 0 8px; }
.ctrl-check-off { background: #FEE2E2; color: #DC2626; }
.ctrl-check-op  { background: #F0FAFB; color: #27C8D8; }
.ctrl-check-op:hover { background: #27C8D8; color: #FFFFFF; }
.ctrl-check:hover:not(:disabled) { opacity: 0.75; }

/* Estados automáticos (Foto, Material, Planilla, Finalizado) — solo lectura,
   no se pueden marcar con clic; reflejan el estado real de otros flujos. */
.ctrl-check-auto { cursor: default; }
.ctrl-check-auto:hover { opacity: 1; }
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
  background: #F0FAFB;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: #27C8D8;
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

/* Dispatch badge */
.ctrl-dispatch-empty {
  font-size: 13px;
  color: #CBD5E1;
  font-weight: 400;
}

/* Vehículo: pasos despacho + retorno */
.ctrl-vehicle-steps {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.ctrl-vstep {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px; height: 22px;
  border-radius: 6px;
  border: 1.5px solid transparent;
}
.ctrl-vstep--desp {
  background: #E0F9FA;
  border-color: #8EEAF3;
  color: #27C8D8;
}
.ctrl-vstep--ret {
  background: #F0FDF4;
  border-color: #86EFAC;
  color: #15803D;
}
.ctrl-vstep--off {
  background: #F8FAFC;
  border-color: #E2E8F0;
  color: #CBD5E1;
}
.ctrl-vstep-sep {
  font-size: 10px;
  color: #D1D5DB;
  line-height: 1;
}

/* VAL ADM badge */
.ctrl-valadm-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px; font-weight: 700; padding: 3px 7px; border-radius: 6px; white-space: nowrap;
}
.valadm-ok { background: #F0FDF4; color: #166534; }
.valadm-no { background: #FEF2F2; color: #991B1B; }

/* % Ejecución */
.ctrl-ejec-wrap { display: flex; align-items: center; gap: 5px; }
.ctrl-ejec-bar  { width: 40px; height: 5px; background: #E2E8F0; border-radius: 99px; overflow: hidden; }
.ctrl-ejec-fill { height: 100%; background: #27C8D8; border-radius: 99px; transition: width 0.3s; }
.ctrl-ejec-full { background: #16A34A; }
.ctrl-ejec-pct  { font-size: 11px; color: #64748B; white-space: nowrap; }

/* Third-party item pill */
.ctrl-item-pill--third {
  background: #F0FDF4;
  color: #166534;
}

/* Equipo cell */
.equipo-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 130px;
}

.equipo-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.equipo-coord-name {
  font-size: 12px;
  font-weight: 600;
  color: #0F1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.equipo-empty {
  font-size: 12px;
  color: #94A3B8;
  font-style: italic;
}

.equipo-extra-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  background: #E2E8F0;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
}

.equipo-members-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  background: #F0FDF4;
  color: #16A34A;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  white-space: nowrap;
}

.equipo-resp-op-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  background: #D1FAE5;
  color: #065F46;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  white-space: nowrap;
}

.equipo-edit-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid #E2EBF6;
  background: #F8FAFC;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.equipo-edit-btn:hover {
  background: #F0FAFB;
  border-color: #27C8D8;
  color: #27C8D8;
}

/* Row number */
.vc-row-num {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}

/* ── Paginación ──────────────────────────────────────── */
.pp-pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #F0FAFB; flex-wrap: wrap; gap: 8px; }
.pg-info { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; }
.pg-pages { display: flex; align-items: center; gap: 4px; }
.pg-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #E2EBF6; background: #FFFFFF; color: #64748B; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
.pg-btn:hover:not(:disabled) { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-active { background: #27C8D8 !important; color: #FFFFFF !important; border-color: #27C8D8 !important; font-weight: 600; }
.pg-ellipsis { color: #94A3B8; font-size: 13px; padding: 0 4px; }

/* ── Encuesta ────────────────────────────────────────── */
.enc-cell { min-width: 60px; }
.enc-btn { width: 28px; height: 28px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; }
.enc-active-wrap { display: flex; align-items: center; justify-content: center; gap: 4px; }
.enc-active-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; flex-shrink: 0; }
.enc-copy-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 5px; border: 1px solid #e2e8f0;
  background: #f8faff; color: #64748b; cursor: pointer;
  transition: background 0.13s, color 0.13s;
}
.enc-copy-btn:hover { background: #E0F9FA; color: #27C8D8; }

/* ── Modal Planimetría ─────────────────────────────────── */
.plani-overlay {
  position: fixed; inset: 0; z-index: 1200;
  background: rgba(15,23,42,0.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.plani-modal {
  background: #fff; border-radius: 18px; width: 100%; max-width: 480px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.22); overflow: hidden;
  animation: planiIn 0.18s ease;
}
@keyframes planiIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.plani-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #F1F5F9;
}
.plani-header-label { font-size: 16px; font-weight: 700; color: #0F172A; display: block; }
.plani-header-sub   { font-size: 12px; color: #64748B; }
.plani-close {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: #F1F5F9; color: #64748B; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.plani-close:hover { background: #E2E8F0; }

.plani-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

/* Archivo actual */
.plani-current { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.plani-img-wrap { width: 100%; border-radius: 10px; overflow: hidden; border: 1px solid #E2E8F0; }
.plani-img      { width: 100%; max-height: 300px; object-fit: contain; display: block; }
.plani-pdf-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 32px 20px; background: #F8FAFC; border-radius: 12px;
  border: 1.5px dashed #CBD5E1; width: 100%;
}
.plani-pdf-icon {
  width: 56px; height: 56px; border-radius: 12px; background: #EF4444;
  color: #fff; font-size: 13px; font-weight: 800; letter-spacing: 0.5px;
  display: flex; align-items: center; justify-content: center;
}
.plani-pdf-name { font-size: 13px; color: #475569; font-weight: 500; }
.plani-view-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: #E0F9FA; color: #27C8D8; border-radius: 8px;
  padding: 8px 18px; font-size: 13px; font-weight: 600;
  text-decoration: none; transition: background 0.15s;
}
.plani-view-btn:hover { background: #CCEFF2; }

.plani-actions { display: flex; gap: 8px; width: 100%; }
.plani-btn {
  flex: 1; padding: 9px 14px; border-radius: 9px; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.plani-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.plani-btn-sec { background: #F1F5F9; color: #475569; }
.plani-btn-sec:hover:not(:disabled) { background: #E2E8F0; }
.plani-btn-del { background: #FEF2F2; color: #DC2626; }
.plani-btn-del:hover:not(:disabled) { background: #FEE2E2; }

/* Drop zone */
.plani-drop {
  border: 2px dashed #CBD5E1; border-radius: 14px;
  padding: 40px 20px; display: flex; flex-direction: column; align-items: center;
  gap: 10px; cursor: pointer; transition: all 0.18s; background: #F8FAFC;
  -webkit-tap-highlight-color: transparent;
}
.plani-drop:hover, .plani-drop-over { border-color: #27C8D8; background: #E0F9FA; }
.plani-drop-uploading { border-color: #27C8D8; background: #E0F9FA; pointer-events: none; }
.plani-drop-icon { color: #94A3B8; }
.plani-drop:hover .plani-drop-icon, .plani-drop-over .plani-drop-icon { color: #27C8D8; }
.plani-drop-text { font-size: 14px; font-weight: 600; color: #334155; margin: 0; }
.plani-drop-hint { font-size: 12px; color: #94A3B8; margin: 0; }
.plani-file-input { display: none; }

.plani-cancel-replace { display: flex; justify-content: center; }

.plani-error {
  background: #FEF2F2; border: 1px solid #FECACA;
  color: #DC2626; border-radius: 8px; padding: 10px 14px;
  font-size: 13px; text-align: center;
}

/* Spinner */
.plani-spin {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.15); border-top-color: currentColor;
  animation: plani-rot 0.7s linear infinite; display: inline-block;
}
.plani-spin-lg { width: 32px; height: 32px; border-width: 3px; color: #27C8D8; }
@keyframes plani-rot { to { transform: rotate(360deg); } }

</style>
