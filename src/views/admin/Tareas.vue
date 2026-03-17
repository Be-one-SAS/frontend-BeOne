<template>
  <div class="page-wrap">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Tareas</h1>
        <p class="page-sub">Asigna y da seguimiento a las tareas del equipo</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <Plus :size="16" />
        Nueva tarea
      </button>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="search-wrap">
        <Search :size="15" class="search-icon" />
        <input v-model="search" placeholder="Buscar por título…" class="search-input" />
      </div>
      <select v-model="filterStatus" class="sel">
        <option value="">Todos los estados</option>
        <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <select v-model="filterPriority" class="sel">
        <option value="">Todas las prioridades</option>
        <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="table-card">
      <table class="sort-header-table">
        <colgroup>
          <col style="width:40px" />
          <col />
          <col style="width:160px" />
          <col style="width:120px" />
          <col style="width:120px" />
          <col style="width:130px" />
          <col style="width:100px" />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th @click="setSort('title')" class="sortable">Título <component :is="sortIcon('title')" :size="13" /></th>
            <th>Asignado a</th>
            <th @click="setSort('status')" class="sortable">Estado <component :is="sortIcon('status')" :size="13" /></th>
            <th @click="setSort('priority')" class="sortable">Prioridad <component :is="sortIcon('priority')" :size="13" /></th>
            <th @click="setSort('dueDate')" class="sortable">Vencimiento <component :is="sortIcon('dueDate')" :size="13" /></th>
            <th>Acciones</th>
          </tr>
        </thead>
      </table>

      <div v-if="loading" class="skeleton-wrap">
        <div v-for="i in 6" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="error" class="empty-state">
        <AlertCircle :size="32" color="#EF4444" />
        <p>{{ error }}</p>
        <button class="btn-ghost" @click="fetchTasks">Reintentar</button>
      </div>

      <div v-else-if="filteredSorted.length === 0" class="empty-state">
        <ClipboardList :size="32" color="#94A3B8" />
        <p>No hay tareas que coincidan con los filtros.</p>
      </div>

      <table v-else class="data-table">
        <colgroup>
          <col style="width:40px" />
          <col />
          <col style="width:160px" />
          <col style="width:120px" />
          <col style="width:120px" />
          <col style="width:130px" />
          <col style="width:100px" />
        </colgroup>
        <tbody>
          <tr v-for="(t, idx) in filteredSorted" :key="t.id">
            <td class="td-num">{{ idx + 1 }}</td>
            <td>
              <div class="task-title">{{ t.title }}</div>
              <div v-if="t.description" class="task-desc">{{ t.description }}</div>
            </td>
            <td class="td-assignee">{{ t.assignedTo?.fullName ?? t.assignedToId ?? '—' }}</td>
            <td>
              <select
                class="status-sel"
                :value="t.status"
                @change="handleStatusChange(t, $event.target.value)"
              >
                <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </td>
            <td><span class="badge" :class="priorityCls(t.priority)">{{ priorityLabel(t.priority) }}</span></td>
            <td class="td-date">{{ formatDate(t.dueDate) }}</td>
            <td>
              <div class="actions">
                <button class="icon-btn" title="Editar" @click="openEdit(t)"><Pencil :size="15" /></button>
                <button class="icon-btn icon-btn--danger" title="Eliminar" @click="openDelete(t)"><Trash2 :size="15" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal crear/editar -->
    <Teleport to="body">
      <Transition name="tp-fade">
        <div v-if="showModal" class="overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <ClipboardList :size="20" color="#054EAF" />
                <h2 class="modal-title">{{ editingTask ? 'Editar tarea' : 'Nueva tarea' }}</h2>
              </div>
              <button class="close-btn" @click="closeModal"><X :size="18" /></button>
            </div>

            <div class="modal-body">
              <div class="field-group">
                <label class="field-label">Título <span class="req">*</span></label>
                <input v-model="form.title" class="field-input" :class="{ 'field-error': submitted && !form.title }" placeholder="Descripción breve de la tarea" />
                <span v-if="submitted && !form.title" class="err-msg">Requerido</span>
              </div>
              <div class="field-group">
                <label class="field-label">Descripción</label>
                <textarea v-model="form.description" class="field-input" rows="3" placeholder="Detalles adicionales…" />
              </div>
              <div class="form-row">
                <div class="field-group">
                  <label class="field-label">Asignar a <span class="req">*</span></label>
                  <select v-model="form.assignedToId" class="field-input" :class="{ 'field-error': submitted && !form.assignedToId }">
                    <option value="">Seleccionar…</option>
                    <option v-for="u in availableUsers" :key="u.id" :value="u.id">
                      {{ u.fullName }} ({{ u.role ?? u.roles?.[0] }})
                    </option>
                  </select>
                  <span v-if="submitted && !form.assignedToId" class="err-msg">Requerido</span>
                </div>
                <div class="field-group">
                  <label class="field-label">Prioridad</label>
                  <select v-model="form.priority" class="field-input">
                    <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="field-group">
                  <label class="field-label">Estado</label>
                  <select v-model="form.status" class="field-input">
                    <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Fecha de vencimiento</label>
                  <input v-model="form.dueDate" type="date" class="field-input" />
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
                <h2 class="modal-title">Eliminar tarea</h2>
              </div>
              <button class="close-btn" @click="showDelete = false"><X :size="18" /></button>
            </div>
            <div class="modal-body">
              <p class="delete-msg">¿Seguro que deseas eliminar <strong>{{ deleteTarget?.title }}</strong>? Esta acción no se puede deshacer.</p>
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
import { ref, computed, onMounted } from 'vue'
import {
  Plus, Search, ClipboardList, AlertCircle,
  Pencil, Trash2, X, ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-vue-next'
import { useTasks } from '@/composables/useTasks'
import { useUsers } from '@/composables/useUsers'
import { useAuth } from '@/composables/useAuth'

const { tasks, loading, error, fetchTasks, addTask, editTask, changeStatus, removeTask } = useTasks()
const { users, fetchUsers } = useUsers()
const { user: authUser } = useAuth()

const statuses = [
  { value: 'PENDIENTE',   label: 'Pendiente' },
  { value: 'EN_PROGRESO', label: 'En progreso' },
  { value: 'COMPLETADA',  label: 'Completada' },
  { value: 'CANCELADA',   label: 'Cancelada' },
]

const priorities = [
  { value: 'BAJA',  label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA',  label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
]

// Filters
const search = ref('')
const filterStatus = ref('')
const filterPriority = ref('')

// Sort
const sortKey = ref('dueDate')
const sortDir = ref('asc')
const setSort = (key) => {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
const sortIcon = (key) => {
  if (sortKey.value !== key) return ChevronsUpDown
  return sortDir.value === 'asc' ? ChevronUp : ChevronDown
}

const filteredSorted = computed(() => {
  let list = tasks.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(t => t.title?.toLowerCase().includes(q))
  }
  if (filterStatus.value) list = list.filter(t => t.status === filterStatus.value)
  if (filterPriority.value) list = list.filter(t => t.priority === filterPriority.value)
  return [...list].sort((a, b) => {
    const av = (a[sortKey.value] ?? '').toString()
    const bv = (b[sortKey.value] ?? '').toString()
    return sortDir.value === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })
})

// Users available for assignment (subordinates or all for ADMIN)
const availableUsers = computed(() => users.value)

// Helpers
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const priorityCls = (p) => ({
  BAJA:    'badge-slate',
  MEDIA:   'badge-blue',
  ALTA:    'badge-orange',
  URGENTE: 'badge-red',
}[p] ?? 'badge-slate')

const priorityLabel = (p) => priorities.find(x => x.value === p)?.label ?? p ?? '—'

// Status change inline
const handleStatusChange = async (task, status) => {
  await changeStatus(task.id, status)
}

// Create/Edit modal
const showModal = ref(false)
const editingTask = ref(null)
const submitted = ref(false)
const saving = ref(false)
const form = ref({ title: '', description: '', assignedToId: '', priority: 'MEDIA', status: 'PENDIENTE', dueDate: '' })

const openCreate = () => {
  editingTask.value = null
  form.value = { title: '', description: '', assignedToId: '', priority: 'MEDIA', status: 'PENDIENTE', dueDate: '' }
  submitted.value = false
  showModal.value = true
}
const openEdit = (t) => {
  editingTask.value = t
  form.value = {
    title: t.title,
    description: t.description ?? '',
    assignedToId: t.assignedToId ?? t.assignedTo?.id ?? '',
    priority: t.priority ?? 'MEDIA',
    status: t.status ?? 'PENDIENTE',
    dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
  }
  submitted.value = false
  showModal.value = true
}
const closeModal = () => { showModal.value = false }

const handleSave = async () => {
  submitted.value = true
  if (!form.value.title || !form.value.assignedToId) return
  saving.value = true
  try {
    const payload = {
      title: form.value.title,
      description: form.value.description,
      assignedToId: form.value.assignedToId,
      priority: form.value.priority,
      status: form.value.status,
      dueDate: form.value.dueDate ? `${form.value.dueDate}T00:00:00.000Z` : undefined,
    }
    if (editingTask.value) {
      await editTask(editingTask.value.id, payload)
    } else {
      await addTask(payload)
    }
    closeModal()
  } finally {
    saving.value = false
  }
}

// Delete modal
const showDelete = ref(false)
const deleteTarget = ref(null)
const openDelete = (t) => { deleteTarget.value = t; showDelete.value = true }
const handleDelete = async () => {
  saving.value = true
  try {
    await removeTask(deleteTarget.value.id)
    showDelete.value = false
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchTasks()
  fetchUsers()
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

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
}
.page-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px;
}
.page-sub { font-size: 13px; color: #64748B; margin: 0; }

.filter-bar { display: flex; gap: 12px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon {
  position: absolute; left: 11px; top: 50%;
  transform: translateY(-50%); color: #94A3B8;
}
.search-input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; color: #0F172A; background: #fff;
  font-family: 'Inter', sans-serif; box-sizing: border-box;
}
.search-input:focus { outline: none; border-color: #054EAF; }
.sel {
  padding: 9px 12px;
  border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; color: #0F172A; background: #fff;
  font-family: 'Inter', sans-serif; cursor: pointer;
}
.sel:focus { outline: none; border-color: #054EAF; }

.table-card {
  background: #fff; border-radius: 18px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  overflow: hidden;
}
.sort-header-table, .data-table {
  width: 100%; border-collapse: collapse; table-layout: fixed;
}
.sort-header-table thead th {
  padding: 13px 14px;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .06em;
  color: #64748B; background: #F8FAFC;
  border-bottom: 1.5px solid #E2E8F0;
  text-align: left; white-space: nowrap; user-select: none;
}
.sortable { cursor: pointer; }
.sortable:hover { color: #054EAF; }
.sortable svg { vertical-align: middle; margin-left: 3px; }

.data-table tbody tr { border-bottom: 1px solid #F1F5F9; transition: background .12s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #F8FAFC; }
.data-table td { padding: 12px 14px; font-size: 13px; color: #334155; vertical-align: middle; }

.td-num { color: #94A3B8; font-size: 12px; font-weight: 600; }
.td-assignee { color: #64748B; font-size: 12px; }
.td-date { color: #64748B; font-size: 12px; }

.task-title { font-weight: 600; color: #0F172A; font-size: 13px; }
.task-desc { font-size: 11px; color: #94A3B8; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }

.status-sel {
  padding: 4px 8px;
  border: 1.5px solid #E2E8F0; border-radius: 8px;
  font-size: 12px; color: #334155; background: #fff;
  font-family: 'Inter', sans-serif; cursor: pointer;
  width: 100%;
}
.status-sel:focus { outline: none; border-color: #054EAF; }

.badge {
  display: inline-block; padding: 3px 10px;
  border-radius: 999px; font-size: 11px; font-weight: 600;
  font-family: 'Inter', sans-serif;
}
.badge-slate  { background: #F1F5F9; color: #475569; }
.badge-blue   { background: #EFF6FF; color: #1D4ED8; }
.badge-orange { background: #FFF7ED; color: #C2410C; }
.badge-red    { background: #FEF2F2; color: #B91C1C; }

.actions { display: flex; gap: 6px; }
.icon-btn {
  padding: 6px; border: 1.5px solid #E2E8F0;
  border-radius: 8px; background: #fff; cursor: pointer;
  color: #64748B; display: flex; align-items: center;
  transition: all .15s;
}
.icon-btn:hover { border-color: #054EAF; color: #054EAF; background: #EFF6FF; }
.icon-btn--danger:hover { border-color: #EF4444; color: #EF4444; background: #FEF2F2; }

.skeleton-wrap { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.skeleton-row {
  height: 44px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200%; border-radius: 8px;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0%{background-position:200%}100%{background-position:-200%} }

.empty-state {
  padding: 48px; display: flex; flex-direction: column;
  align-items: center; gap: 12px; color: #94A3B8; font-size: 14px;
}

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: #054EAF; color: #fff;
  border: none; border-radius: 10px;
  font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif;
  transition: background .15s;
}
.btn-primary:hover:not(:disabled) { background: #043d8a; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-ghost {
  padding: 10px 20px; background: transparent;
  border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 14px; font-weight: 600; color: #475569;
  cursor: pointer; font-family: 'Inter', sans-serif;
  transition: border-color .15s;
}
.btn-ghost:hover { border-color: #94A3B8; }
.btn-danger {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: #EF4444; color: #fff;
  border: none; border-radius: 10px;
  font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif;
  transition: background .15s;
}
.btn-danger:hover:not(:disabled) { background: #DC2626; }
.btn-danger:disabled { opacity: .6; cursor: not-allowed; }

.overlay {
  position: fixed; inset: 0;
  background: rgba(15,26,46,.45);
  backdrop-filter: blur(4px);
  z-index: 9000;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: #fff; border-radius: 20px;
  width: 100%; max-width: 560px;
  box-shadow: 0 20px 60px rgba(5,78,175,.18);
  display: flex; flex-direction: column; overflow: hidden;
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
  padding: 10px 12px;
  border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; color: #0F172A; background: #fff;
  font-family: 'Inter', sans-serif; transition: border-color .15s;
  resize: vertical;
}
.field-input:focus { outline: none; border-color: #054EAF; }
.field-error { border-color: #EF4444 !important; }
.err-msg { font-size: 11px; color: #EF4444; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #F1F5F9;
}

.delete-msg { font-size: 13px; color: #475569; margin: 0; line-height: 1.6; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.tp-fade-enter-active { transition: all .22s ease; }
.tp-fade-leave-active { transition: all .15s ease; }
.tp-fade-enter-from { opacity: 0; transform: translateY(16px); }
.tp-fade-leave-to  { opacity: 0; transform: translateY(8px); }
</style>
