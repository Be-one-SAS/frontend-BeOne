<template>
  <div class="page-wrap">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Desafíos Comerciales</h1>
        <p class="page-sub">Asigna metas de cierre a tu equipo comercial y da seguimiento a su comisión</p>
      </div>
      <button v-if="canManage" class="btn-primary" @click="openCreate">
        <Plus :size="16" />
        Nuevo desafío
      </button>
    </div>

    <!-- Resumen por supervisor -->
    <div v-if="resumen.length" class="summary-grid">
      <div v-for="r in resumen" :key="r.userId" class="summary-card">
        <div class="summary-name">{{ r.fullName }}</div>
        <div class="summary-row">
          <span class="summary-stat">{{ r.cumplidos }}/{{ r.asignados }}</span>
          <span class="summary-label">cumplidos</span>
        </div>
        <div class="summary-bar-wrap">
          <div class="summary-bar" :style="{ width: r.tasaCumplimiento + '%' }" />
        </div>
        <div class="summary-row">
          <span class="summary-stat summary-stat--money">{{ formatCOP(r.comisionGanada) }}</span>
          <span class="summary-label">comisión ganada</span>
        </div>
        <div v-if="r.comisionPendientePago > 0" class="summary-pending">
          {{ formatCOP(r.comisionPendientePago) }} pendiente de pago
        </div>
      </div>
    </div>

    <!-- Selector de tablero por supervisor + filtros -->
    <div class="board-toolbar">
      <div v-if="supervisorTabs.length > 1" class="board-tabs">
        <button
          v-for="s in supervisorTabs"
          :key="s.id"
          class="board-tab"
          :class="{ 'board-tab--active': s.id === selectedSupervisorId }"
          @click="selectedSupervisorId = s.id"
        >
          {{ s.fullName }}
        </button>
      </div>
      <div v-else-if="supervisorTabs.length === 1" class="board-title-single">
        Tablero de {{ supervisorTabs[0].fullName }}
      </div>

      <div class="filter-bar">
        <div class="search-wrap">
          <Search :size="15" class="search-icon" />
          <input v-model="search" placeholder="Buscar por título…" class="search-input" />
        </div>
        <select v-model="filterTipo" class="sel">
          <option value="">Todos los tipos</option>
          <option v-for="t in tipos" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
    </div>

    <!-- Kanban board -->
    <div v-if="loading" class="skeleton-wrap">
      <div v-for="i in 6" :key="i" class="skeleton-row" />
    </div>

    <div v-else-if="error" class="empty-state">
      <AlertCircle :size="32" color="#EF4444" />
      <p>{{ error }}</p>
      <button class="btn-ghost" @click="fetchDesafios">Reintentar</button>
    </div>

    <div v-else-if="!selectedSupervisorId" class="empty-state">
      <Target :size="32" color="#94A3B8" />
      <p>{{ supervisorTabs.length ? 'Selecciona un supervisor para ver su tablero.' : 'No hay supervisores disponibles todavía.' }}</p>
    </div>

    <div v-else class="kanban-board">
      <div v-for="col in estados" :key="col.value" class="kanban-col">
        <div class="kanban-col-header">
          <span class="kanban-col-title">{{ col.label }}</span>
          <span class="kanban-col-count">{{ columnsData[col.value]?.length ?? 0 }}</span>
        </div>
        <draggable
          v-model="columnsData[col.value]"
          :group="'desafios'"
          item-key="id"
          class="kanban-list"
          ghost-class="kanban-ghost"
          :move="checkMove"
          @change="(evt) => onColumnChange(evt, col.value)"
        >
          <template #item="{ element: d }">
            <div class="kanban-card" :class="{ 'kanban-card--locked': !canDragCard(d) }">
              <div class="task-title">{{ d.titulo }}</div>
              <div v-if="d.descripcion" class="task-desc">{{ d.descripcion }}</div>
              <div v-if="d.quotation" class="task-quotation">
                Cotización #{{ d.quotation.numero }} — {{ d.quotation.empresa ?? 'Sin empresa' }}
              </div>
              <div class="kanban-card-meta">
                <span class="badge badge-slate">{{ tipoLabel(d.tipo) }}</span>
                <span v-if="d.tipo !== 'TAREA_EVENTO'" class="progreso-txt">{{ d.progreso }}/{{ d.metaObjetivo }}</span>
              </div>
              <div class="kanban-card-footer">
                <div class="comision-monto">{{ d.comisionGanada != null ? formatCOP(d.comisionGanada) : '—' }}</div>
                <button
                  v-if="canManage && d.comisionGanada != null"
                  class="comision-pagada comision-pagada--btn"
                  :class="{ 'comision-pagada--ok': d.comisionPagada }"
                  :disabled="pagoBusyId === d.id"
                  @click.stop="handleTogglePago(d)"
                >
                  {{ d.comisionPagada ? 'Pagada' : 'Pendiente de pago' }}
                </button>
                <div v-else-if="d.comisionGanada != null" class="comision-pagada" :class="{ 'comision-pagada--ok': d.comisionPagada }">
                  {{ d.comisionPagada ? 'Pagada' : 'Pendiente de pago' }}
                </div>
              </div>
              <div class="kanban-card-bottom">
                <span class="td-date">{{ formatDate(d.fechaLimite) }}</span>
                <div v-if="canManage" class="actions">
                  <button class="icon-btn" title="Editar" @click.stop="openEdit(d)"><Pencil :size="14" /></button>
                  <button class="icon-btn icon-btn--danger" title="Eliminar" @click.stop="openDelete(d)"><Trash2 :size="14" /></button>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <Teleport to="body">
      <Transition name="tp-fade">
        <div v-if="showModal" class="overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <Target :size="20" color="#27C8D8" />
                <h2 class="modal-title">{{ editingDesafio ? 'Editar desafío' : 'Nuevo desafío comercial' }}</h2>
              </div>
              <button class="close-btn" @click="closeModal"><X :size="18" /></button>
            </div>

            <div class="modal-body">
              <div class="field-group">
                <label class="field-label">Título <span class="req">*</span></label>
                <input v-model="form.titulo" class="field-input" :class="{ 'field-error': submitted && !form.titulo }" placeholder="Ej: Cerrar el evento de fin de año" />
                <span v-if="submitted && !form.titulo" class="err-msg">Requerido</span>
              </div>
              <div class="field-group">
                <label class="field-label">Descripción</label>
                <textarea v-model="form.descripcion" class="field-input" rows="2" placeholder="Detalles adicionales…" />
              </div>

              <div class="field-group">
                <label class="field-label">Tipo de desafío <span class="req">*</span></label>
                <select v-model="form.tipo" class="field-input">
                  <option v-for="t in tipos" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </div>

              <div v-if="form.tipo === 'CIERRE_TRATO'" class="field-group">
                <label class="field-label">Cotización a cerrar <span class="req">*</span></label>
                <select v-model="form.quotationId" class="field-input" :class="{ 'field-error': submitted && !form.quotationId }">
                  <option value="">Seleccionar…</option>
                  <option v-for="q in quotations" :key="q.id" :value="q.id">
                    #{{ q.numero }} — {{ q.empresa ?? 'Sin empresa' }}
                  </option>
                </select>
                <span v-if="submitted && !form.quotationId" class="err-msg">Requerido</span>
                <span class="hint-msg">Se marca cumplido automáticamente cuando esta cotización pase a "Aprobada".</span>
              </div>

              <div v-if="form.tipo === 'CIERRE_MULTIPLE'" class="form-row">
                <div class="field-group">
                  <label class="field-label">Meta de tratos a cerrar <span class="req">*</span></label>
                  <input v-model.number="form.metaObjetivo" type="number" min="1" class="field-input" />
                </div>
                <div class="field-group">
                  <label class="field-label">Fecha límite del periodo <span class="req">*</span></label>
                  <input v-model="form.fechaLimite" type="date" class="field-input" :class="{ 'field-error': submitted && !form.fechaLimite }" />
                  <span v-if="submitted && !form.fechaLimite" class="err-msg">Requerido para acotar el periodo de conteo</span>
                </div>
              </div>
              <p v-if="form.tipo === 'CIERRE_MULTIPLE'" class="hint-msg">
                El progreso se calcula contando las cotizaciones de este supervisor que pasen a "Aprobada" entre hoy y la fecha límite.
              </p>

              <div v-if="form.tipo === 'TAREA_EVENTO'" class="field-group">
                <label class="field-label">Cotización relacionada (opcional)</label>
                <select v-model="form.quotationId" class="field-input">
                  <option value="">— Sin cotización —</option>
                  <option v-for="q in quotations" :key="q.id" :value="q.id">
                    #{{ q.numero }} — {{ q.empresa ?? 'Sin empresa' }}
                  </option>
                </select>
                <span class="hint-msg">Este tipo siempre se marca cumplido/no cumplido manualmente.</span>
              </div>

              <div class="form-row">
                <div class="field-group">
                  <label class="field-label">Asignar a (SUPERVISOR) <span class="req">*</span></label>
                  <select v-model="form.assignedToId" class="field-input" :class="{ 'field-error': submitted && !form.assignedToId }">
                    <option value="">Seleccionar…</option>
                    <option v-for="u in supervisores" :key="u.id" :value="u.id">{{ u.fullName }}</option>
                  </select>
                  <span v-if="submitted && !form.assignedToId" class="err-msg">Requerido</span>
                </div>
                <div v-if="form.tipo !== 'CIERRE_MULTIPLE'" class="field-group">
                  <label class="field-label">Fecha límite</label>
                  <input v-model="form.fechaLimite" type="date" class="field-input" />
                </div>
              </div>

              <div class="form-row">
                <div class="field-group">
                  <label class="field-label">Tipo de comisión <span class="req">*</span></label>
                  <select v-model="form.comisionTipo" class="field-input" :disabled="form.tipo === 'TAREA_EVENTO'">
                    <option v-for="c in comisionTipos" :key="c.value" :value="c.value">{{ c.label }}</option>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">
                    {{ form.comisionTipo === 'PORCENTAJE' ? 'Porcentaje (%)' : 'Monto fijo (COP)' }} <span class="req">*</span>
                  </label>
                  <input v-model.number="form.comisionValor" type="number" min="0" step="any" class="field-input" :class="{ 'field-error': submitted && !form.comisionValor }" />
                  <span v-if="submitted && !form.comisionValor" class="err-msg">Requerido</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-ghost" @click="closeModal">Cancelar</button>
              <button class="btn-primary" :disabled="saving" @click="handleSave">
                <span v-if="saving" class="spinner" />
                {{ saving ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal confirmar eliminación -->
    <Teleport to="body">
      <Transition name="tp-fade">
        <div v-if="showDelete" class="overlay" @click.self="showDelete = false">
          <div class="modal-box modal-box--sm">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <Trash2 :size="20" color="#EF4444" />
                <h2 class="modal-title">Eliminar desafío</h2>
              </div>
              <button class="close-btn" @click="showDelete = false"><X :size="18" /></button>
            </div>
            <div class="modal-body">
              <p class="delete-msg">¿Seguro que deseas eliminar <strong>{{ deleteTarget?.titulo }}</strong>? Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="showDelete = false">Cancelar</button>
              <button class="btn-danger" :disabled="saving" @click="handleDelete">
                <span v-if="saving" class="spinner" />
                {{ saving ? 'Eliminando…' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import draggable from 'vuedraggable'
import {
  Plus, Search, Target, AlertCircle, Pencil, Trash2, X,
} from 'lucide-vue-next'
import { useDesafiosComerciales } from '@/composables/useDesafiosComerciales'
import { useUsers } from '@/composables/useUsers'
import { useAuth } from '@/composables/useAuth'
import { getQuotations } from '@/services/quotation.service'
import { formatCOP } from '@/utils/currency'

const {
  desafios, resumen, loading, error,
  fetchDesafios, fetchResumen, addDesafio, editDesafio, changeEstado, removeDesafio, marcarPago,
} = useDesafiosComerciales()
const { users, loadUsers } = useUsers()
const { user: authUser } = useAuth()

const quotations = ref([])

const tipos = [
  { value: 'CIERRE_TRATO',    label: 'Cierre de trato específico' },
  { value: 'CIERRE_MULTIPLE', label: 'Meta de cierres múltiples' },
  { value: 'TAREA_EVENTO',    label: 'Tarea de evento' },
]

const estados = [
  { value: 'PENDIENTE',    label: 'Pendiente' },
  { value: 'EN_PROGRESO',  label: 'En progreso' },
  { value: 'CUMPLIDA',     label: 'Cumplida' },
  { value: 'NO_CUMPLIDA',  label: 'No cumplida' },
]

const comisionTipos = [
  { value: 'FIJA',       label: 'Monto fijo (COP)' },
  { value: 'PORCENTAJE', label: 'Porcentaje del trato' },
]

const canManage = computed(() =>
  ['ADMIN', 'ADMINISTRADOR', 'LIDER'].some(r => authUser.value?.roles?.includes(r)),
)
// Quién puede ver los tableros de otros supervisores (además del suyo propio)
const canBrowseAll = computed(() =>
  ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER'].some(r => authUser.value?.roles?.includes(r)),
)

const supervisores = computed(() => users.value.filter(u => u.role === 'SUPERVISOR'))

// Un tablero Trello por supervisor — pestañas para elegir cuál ver
const supervisorTabs = computed(() => {
  if (!canBrowseAll.value) {
    return authUser.value ? [{ id: authUser.value.id, fullName: authUser.value.fullName ?? 'Mi tablero' }] : []
  }
  return supervisores.value.map(u => ({ id: u.id, fullName: u.fullName }))
})

const selectedSupervisorId = ref(null)
watch(supervisorTabs, (tabs) => {
  if (tabs.length && !tabs.some(t => t.id === selectedSupervisorId.value)) {
    selectedSupervisorId.value = tabs[0].id
  }
}, { immediate: true })

// Filters
const search     = ref('')
const filterTipo = ref('')

const filteredSorted = computed(() => {
  let list = desafios.value
  if (selectedSupervisorId.value) list = list.filter(d => d.assignedToId === selectedSupervisorId.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(d => d.titulo?.toLowerCase().includes(q))
  }
  if (filterTipo.value) list = list.filter(d => d.tipo === filterTipo.value)
  return list
})

// Agrupación en columnas del tablero — se resincroniza cada vez que cambian
// los desafíos filtrados (tras cada fetch, incluido el que sigue a un drag).
const columnsData = reactive(Object.fromEntries(estados.map(e => [e.value, []])))
watch(filteredSorted, (list) => {
  for (const e of estados) {
    columnsData[e.value] = list.filter(d => d.estado === e.value)
  }
}, { immediate: true })

// Helpers
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const tipoLabel = (t) => tipos.find(x => x.value === t)?.label ?? t

const handleEstadoChange = async (d, estado) => {
  try {
    await changeEstado(d.id, estado)
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo actualizar el estado'
  }
}

// Reglas de permisos para arrastrar una tarjeta (calcan al backend updateEstado()):
// ADMIN/ADMINISTRADOR/LIDER pueden mover cualquiera que gestionen; un SUPERVISOR
// solo puede mover sus propias tarjetas de tipo TAREA_EVENTO.
const canDragCard = (d) =>
  canManage.value || (d.tipo === 'TAREA_EVENTO' && d.assignedToId === authUser.value?.id)

const checkMove = (evt) => canDragCard(evt.draggedContext.element)

const onColumnChange = async (evt, estado) => {
  if (!evt.added) return
  await handleEstadoChange(evt.added.element, estado)
}

const pagoBusyId = ref(null)
const handleTogglePago = async (d) => {
  pagoBusyId.value = d.id
  try {
    await marcarPago(d.id, !d.comisionPagada)
    await fetchResumen()
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo actualizar el pago de la comisión'
  } finally {
    pagoBusyId.value = null
  }
}

// Create/Edit modal
const emptyForm = () => ({
  titulo: '', descripcion: '', tipo: 'CIERRE_TRATO',
  quotationId: '', assignedToId: '', metaObjetivo: 1,
  fechaInicio: '', fechaLimite: '',
  comisionTipo: 'FIJA', comisionValor: 0,
})

const showModal     = ref(false)
const editingDesafio = ref(null)
const submitted      = ref(false)
const saving         = ref(false)
const form           = ref(emptyForm())

watch(() => form.value.tipo, (tipo) => {
  if (tipo === 'TAREA_EVENTO') form.value.comisionTipo = 'FIJA'
})

const openCreate = () => {
  editingDesafio.value = null
  form.value = emptyForm()
  submitted.value = false
  showModal.value = true
}
const openEdit = (d) => {
  editingDesafio.value = d
  form.value = {
    titulo: d.titulo,
    descripcion: d.descripcion ?? '',
    tipo: d.tipo,
    quotationId: d.quotationId ?? '',
    assignedToId: d.assignedToId ?? d.assignedTo?.id ?? '',
    metaObjetivo: d.metaObjetivo ?? 1,
    fechaInicio: d.fechaInicio ? d.fechaInicio.split('T')[0] : '',
    fechaLimite: d.fechaLimite ? d.fechaLimite.split('T')[0] : '',
    comisionTipo: d.comisionTipo,
    comisionValor: d.comisionValor,
  }
  submitted.value = false
  showModal.value = true
}
const closeModal = () => { showModal.value = false }

const handleSave = async () => {
  submitted.value = true
  const f = form.value
  if (!f.titulo || !f.assignedToId || !f.comisionValor) return
  if (f.tipo === 'CIERRE_TRATO' && !f.quotationId) return
  if (f.tipo === 'CIERRE_MULTIPLE' && !f.fechaLimite) return

  saving.value = true
  try {
    const payload = {
      titulo: f.titulo,
      descripcion: f.descripcion || undefined,
      tipo: f.tipo,
      assignedToId: Number(f.assignedToId),
      comisionTipo: f.tipo === 'TAREA_EVENTO' ? 'FIJA' : f.comisionTipo,
      comisionValor: Number(f.comisionValor),
      fechaInicio: f.fechaInicio ? `${f.fechaInicio}T00:00:00.000Z` : undefined,
      fechaLimite: f.fechaLimite ? `${f.fechaLimite}T23:59:59.000Z` : undefined,
      quotationId: f.tipo !== 'CIERRE_MULTIPLE' && f.quotationId ? Number(f.quotationId) : undefined,
      metaObjetivo: f.tipo === 'CIERRE_MULTIPLE' ? Number(f.metaObjetivo) || 1 : undefined,
    }
    if (editingDesafio.value) {
      await editDesafio(editingDesafio.value.id, payload)
    } else {
      await addDesafio(payload)
    }
    await fetchResumen()
    closeModal()
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al guardar el desafío'
  } finally {
    saving.value = false
  }
}

// Delete modal
const showDelete   = ref(false)
const deleteTarget = ref(null)
const openDelete = (d) => { deleteTarget.value = d; showDelete.value = true }
const handleDelete = async () => {
  saving.value = true
  try {
    await removeDesafio(deleteTarget.value.id)
    await fetchResumen()
    showDelete.value = false
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  fetchDesafios()
  fetchResumen()
  loadUsers()
  try {
    const res = await getQuotations()
    quotations.value = res.data ?? []
  } catch (e) {
    console.error('Error al cargar cotizaciones para el selector:', e)
  }
})
</script>

<style scoped>
.page-wrap {
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100vh;
  background: #F8FAFC;
}

.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px;
}
.page-sub { font-size: 13px; color: #64748B; margin: 0; }

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.summary-card {
  background: #fff; border-radius: 14px; padding: 16px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
}
.summary-name { font-weight: 700; font-size: 13px; color: #0F172A; margin-bottom: 8px; }
.summary-row { display: flex; align-items: baseline; gap: 6px; margin-top: 4px; }
.summary-stat { font-size: 16px; font-weight: 700; color: #27C8D8; }
.summary-stat--money { font-size: 13px; color: #0F172A; }
.summary-label { font-size: 11px; color: #94A3B8; }
.summary-bar-wrap { height: 6px; background: #F1F5F9; border-radius: 99px; margin-top: 6px; overflow: hidden; }
.summary-bar { height: 100%; background: #27C8D8; border-radius: 99px; transition: width .3s ease; }
.summary-pending { font-size: 11px; color: #C2410C; margin-top: 6px; font-weight: 600; }

.board-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.board-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.board-tab {
  padding: 8px 16px; border-radius: 999px; border: 1.5px solid #E2E8F0;
  background: #fff; color: #475569; font-size: 13px; font-weight: 600;
  font-family: 'Inter', sans-serif; cursor: pointer; transition: all .15s;
}
.board-tab:hover { border-color: #27C8D8; color: #27C8D8; }
.board-tab--active { background: #27C8D8; border-color: #27C8D8; color: #fff; }
.board-title-single { font-size: 14px; font-weight: 700; color: #0F172A; }

.filter-bar { display: flex; gap: 12px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
.search-input {
  width: 100%; padding: 9px 12px 9px 34px;
  border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; color: #0F172A; background: #fff;
  font-family: 'Inter', sans-serif; box-sizing: border-box;
}
.search-input:focus { outline: none; border-color: #27C8D8; }
.sel {
  padding: 9px 12px; border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; color: #0F172A; background: #fff;
  font-family: 'Inter', sans-serif; cursor: pointer;
}
.sel:focus { outline: none; border-color: #27C8D8; }

.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(240px, 1fr));
  gap: 16px;
  align-items: start;
}
.kanban-col {
  background: #F1F5F9; border-radius: 16px; padding: 12px;
  display: flex; flex-direction: column; gap: 10px; min-height: 200px;
}
.kanban-col-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 4px; }
.kanban-col-title { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
.kanban-col-count {
  font-size: 11px; font-weight: 700; color: #94A3B8; background: #fff;
  border-radius: 999px; padding: 2px 8px;
}
.kanban-list { display: flex; flex-direction: column; gap: 10px; min-height: 60px; }
.kanban-ghost { opacity: .4; }

.kanban-card {
  background: #fff; border-radius: 12px; padding: 12px;
  box-shadow: 0 1px 3px rgba(15,23,42,.08); cursor: grab;
  display: flex; flex-direction: column; gap: 6px;
}
.kanban-card:active { cursor: grabbing; }
.kanban-card--locked { cursor: default; opacity: .75; }
.kanban-card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
.kanban-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kanban-card-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }

.task-title { font-weight: 600; color: #0F172A; font-size: 13px; }
.task-desc { font-size: 11px; color: #94A3B8; margin-top: 2px; }
.task-quotation { font-size: 11px; color: #27C8D8; margin-top: 2px; }

.progreso-txt { font-weight: 600; color: #0F172A; font-size: 12px; }

.comision-monto { font-weight: 600; color: #0F172A; font-size: 12px; }
.comision-pagada { font-size: 11px; color: #C2410C; }
.comision-pagada--ok { color: #16A34A; }
.comision-pagada--btn {
  background: none; border: none; padding: 0;
  font-family: 'Inter', sans-serif; cursor: pointer; text-decoration: underline;
  text-underline-offset: 2px;
}
.comision-pagada--btn:disabled { opacity: .5; cursor: not-allowed; }

.td-date { color: #64748B; font-size: 11px; }

.badge {
  display: inline-block; padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 600; font-family: 'Inter', sans-serif;
}
.badge-slate { background: #F1F5F9; color: #475569; }

.actions { display: flex; gap: 6px; }
.icon-btn {
  padding: 5px; border: 1.5px solid #E2E8F0; border-radius: 7px;
  background: #fff; cursor: pointer; color: #64748B;
  display: flex; align-items: center; transition: all .15s;
}
.icon-btn:hover { border-color: #27C8D8; color: #27C8D8; background: #E0F9FA; }
.icon-btn--danger:hover { border-color: #EF4444; color: #EF4444; background: #FEF2F2; }

.skeleton-wrap { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.skeleton-row {
  height: 44px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200%; border-radius: 8px; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0%{background-position:200%}100%{background-position:-200%} }

.empty-state {
  padding: 48px; display: flex; flex-direction: column;
  align-items: center; gap: 12px; color: #94A3B8; font-size: 14px;
}

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: #27C8D8; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s;
}
.btn-primary:hover:not(:disabled) { background: #1BAEBB; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-ghost {
  padding: 10px 20px; background: transparent; border: 1.5px solid #E2E8F0;
  border-radius: 10px; font-size: 14px; font-weight: 600; color: #475569;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: border-color .15s;
}
.btn-ghost:hover { border-color: #94A3B8; }
.btn-danger {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: #EF4444; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s;
}
.btn-danger:hover:not(:disabled) { background: #DC2626; }
.btn-danger:disabled { opacity: .6; cursor: not-allowed; }

.overlay {
  position: fixed; inset: 0; background: rgba(15,26,46,.45);
  backdrop-filter: blur(4px); z-index: 9000;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: #fff; border-radius: 20px; width: 100%; max-width: 560px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(39,200,216,.18);
  display: flex; flex-direction: column;
}
.modal-box--sm { max-width: 400px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 0;
}
.modal-title-wrap { display: flex; align-items: center; gap: 10px; }
.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px; font-weight: 700; color: #0F172A; margin: 0;
}
.close-btn {
  padding: 6px; background: transparent; border: none;
  cursor: pointer; color: #94A3B8; border-radius: 8px;
  display: flex; transition: background .12s;
}
.close-btn:hover { background: #F1F5F9; color: #475569; }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 600; color: #475569; }
.req { color: #EF4444; }
.field-input {
  padding: 10px 12px; border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; color: #0F172A; background: #fff;
  font-family: 'Inter', sans-serif; transition: border-color .15s; resize: vertical;
}
.field-input:focus { outline: none; border-color: #27C8D8; }
.field-input:disabled { background: #F1F5F9; color: #94A3B8; cursor: not-allowed; }
.field-error { border-color: #EF4444 !important; }
.err-msg { font-size: 11px; color: #EF4444; }
.hint-msg { font-size: 11px; color: #94A3B8; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #F1F5F9;
}

.delete-msg { font-size: 13px; color: #475569; margin: 0; line-height: 1.6; }

.spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.tp-fade-enter-active { transition: all .22s ease; }
.tp-fade-leave-active { transition: all .15s ease; }
.tp-fade-enter-from { opacity: 0; transform: translateY(16px); }
.tp-fade-leave-to  { opacity: 0; transform: translateY(8px); }
</style>
