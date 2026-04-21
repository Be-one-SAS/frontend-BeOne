<template>
  <div class="page-wrap">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Usuarios</h1>
        <p class="page-sub">Administra los usuarios y sus roles en el sistema</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <UserPlus :size="16" />
        Nuevo usuario
      </button>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="search-wrap">
        <Search :size="15" class="search-icon" />
        <input v-model="search" placeholder="Buscar por nombre o email…" class="search-input" />
      </div>
      <select v-model="filterRole" class="sel">
        <option value="">Todos los roles</option>
        <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
      </select>
      <select v-model="filterActive" class="sel">
        <option value="">Todos los estados</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>

    <!-- Error de operaciones -->
    <Transition name="error-fade">
      <div v-if="actionError" class="action-error-banner">
        <AlertOctagon :size="15" class="flex-shrink-0" />
        <span>{{ actionError }}</span>
        <button class="action-error-close" @click="actionError = ''">×</button>
      </div>
    </Transition>

    <!-- Table -->
    <div class="table-card">
      <!-- Sort header -->
      <table class="sort-header-table">
        <colgroup>
          <col style="width:40px" />
          <col style="width:220px" />
          <col style="width:200px" />
          <col style="width:120px" />
          <col style="width:100px" />
          <col style="width:120px" />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th @click="setSort('fullName')" class="sortable">
              Nombre
              <component :is="sortIcon('fullName')" :size="13" />
            </th>
            <th @click="setSort('email')" class="sortable">
              Email
              <component :is="sortIcon('email')" :size="13" />
            </th>
            <th @click="setSort('role')" class="sortable">
              Rol
              <component :is="sortIcon('role')" :size="13" />
            </th>
            <th>Estado</th>
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
        <button class="btn-ghost" @click="fetchUsers">Reintentar</button>
      </div>

      <div v-else-if="filteredSorted.length === 0" class="empty-state">
        <Users :size="32" color="#94A3B8" />
        <p>No hay usuarios que coincidan con los filtros.</p>
      </div>

      <table v-else class="data-table">
        <colgroup>
          <col style="width:40px" />
          <col style="width:220px" />
          <col style="width:200px" />
          <col style="width:120px" />
          <col style="width:100px" />
          <col style="width:120px" />
        </colgroup>
        <tbody>
          <tr v-for="(u, idx) in filteredSorted" :key="u.id">
            <td class="td-num">{{ idx + 1 }}</td>
            <td>
              <div class="user-cell">
                <div class="avatar" :style="{ background: avatarBg(u.fullName) }">
                  {{ initials(u.fullName) }}
                </div>
                <span class="user-name">{{ u.fullName }}</span>
              </div>
            </td>
            <td class="td-email">{{ u.email }}</td>
            <td><span class="badge" :class="roleCls(u.role ?? u.roles?.[0])">{{ u.role ?? u.roles?.[0] }}</span></td>
            <td>
              <span class="badge" :class="u.isActive !== false ? 'badge-green' : 'badge-red'">
                {{ u.isActive !== false ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="icon-btn" title="Editar" @click="openEdit(u)"><Pencil :size="15" /></button>
                <button
                  class="icon-btn"
                  :title="u.isActive !== false ? 'Desactivar' : 'Activar'"
                  @click="handleToggle(u)"
                >
                  <component :is="u.isActive !== false ? UserX : UserCheck" :size="15" />
                </button>
                <button v-if="canReassign" class="icon-btn" title="Reasignar" @click="openReassign(u)">
                  <ArrowLeftRight :size="15" />
                </button>
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
                <UserCog :size="20" color="#054EAF" />
                <h2 class="modal-title">{{ editingUser ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
              </div>
              <button class="close-btn" @click="closeModal"><X :size="18" /></button>
            </div>

            <div class="modal-body">
              <Transition name="error-fade">
                <div v-if="actionError" class="action-error-banner" style="margin-bottom:4px">
                  <AlertOctagon :size="14" class="flex-shrink-0" />
                  <span>{{ actionError }}</span>
                </div>
              </Transition>
              <div class="field-group">
                <label class="field-label">Nombre completo <span class="req">*</span></label>
                <input v-model="form.fullName" class="field-input" :class="{ 'field-error': submitted && !form.fullName }" placeholder="Juan García" />
                <span v-if="submitted && !form.fullName" class="err-msg">Requerido</span>
              </div>
              <div class="field-group">
                <label class="field-label">Email <span class="req">*</span></label>
                <input v-model="form.email" type="email" class="field-input" :class="{ 'field-error': submitted && !form.email }" placeholder="juan@empresa.com" />
                <span v-if="submitted && !form.email" class="err-msg">Requerido</span>
              </div>
              <div v-if="!editingUser" class="field-group">
                <label class="field-label">Contraseña <span class="req">*</span></label>
                <input v-model="form.password" type="password" class="field-input" :class="{ 'field-error': submitted && !form.password }" placeholder="••••••••" />
                <span v-if="submitted && !form.password" class="err-msg">Requerido</span>
              </div>
              <div class="field-group">
                <label class="field-label">Rol <span class="req">*</span></label>
                <select v-model="form.role" class="field-input" :class="{ 'field-error': submitted && !form.role }">
                  <option value="">Seleccionar rol…</option>
                  <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
                </select>
                <span v-if="submitted && !form.role" class="err-msg">Requerido</span>
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

    <!-- Modal reasignar -->
    <Teleport to="body">
      <Transition name="tp-fade">
        <div v-if="showReassign" class="overlay" @click.self="showReassign = false">
          <div class="modal-box modal-box--sm">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <ArrowLeftRight :size="20" color="#054EAF" />
                <h2 class="modal-title">Reasignar usuario</h2>
              </div>
              <button class="close-btn" @click="showReassign = false"><X :size="18" /></button>
            </div>
            <div class="modal-body">
              <p class="reassign-info">Reasignando: <strong>{{ reassignTarget?.fullName }}</strong></p>
              <div class="field-group">
                <label class="field-label">Nuevo superior <span class="req">*</span></label>
                <select v-model="newParentId" class="field-input">
                  <option value="">Seleccionar usuario…</option>
                  <option v-for="u in users.filter(x => x.id !== reassignTarget?.id)" :key="u.id" :value="u.id">
                    {{ u.fullName }} ({{ u.role ?? u.roles?.[0] }})
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="showReassign = false">Cancelar</button>
              <button class="btn-primary" :disabled="!newParentId || saving" @click="handleReassign">
                <span v-if="saving" class="spinner" />
                {{ saving ? 'Guardando…' : 'Reasignar' }}
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
  UserPlus, Search, Users, AlertCircle, Pencil,
  UserX, UserCheck, ArrowLeftRight, UserCog, X,
  ChevronUp, ChevronDown, ChevronsUpDown, AlertOctagon,
} from 'lucide-vue-next'
import { useUsers } from '@/composables/useUsers'
import { useAuth } from '@/composables/useAuth'

const { users, loading, error, fetchUsers, addUser, editUser, toggleActive, reassign } = useUsers()
const { user: authUser } = useAuth()

const roles = ['ADMIN', 'COMERCIAL', 'SUPERVISOR', 'LOGISTICA', 'COORDINADOR', 'FINANCIERO', 'SOPORTE']

// Filters
const search = ref('')
const filterRole = ref('')
const filterActive = ref('')

// Sort
const sortKey = ref('fullName')
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
  let list = users.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(u =>
      u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  }
  if (filterRole.value) list = list.filter(u => (u.role ?? u.roles?.[0]) === filterRole.value)
  if (filterActive.value !== '') list = list.filter(u => String(u.isActive !== false) === filterActive.value)
  return [...list].sort((a, b) => {
    const av = (a[sortKey.value] ?? '').toString().toLowerCase()
    const bv = (b[sortKey.value] ?? '').toString().toLowerCase()
    return sortDir.value === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })
})

// Role check
const canReassign = computed(() => {
  const r = authUser.value?.roles?.[0]
  return r === 'ADMIN'
})

// Helpers
const roleCls = (role) => ({
  ADMIN:        'badge-indigo',
  COMERCIAL:    'badge-blue',
  SUPERVISOR:   'badge-purple',
  LOGISTICA:    'badge-orange',
  COORDINADOR:  'badge-teal',
  FINANCIERO:   'badge-green',
  SOPORTE:      'badge-slate',
}[role] ?? 'badge-slate')

const avatarColors = ['#054EAF','#7C3AED','#0891B2','#059669','#D97706','#DB2777']
const avatarBg = (name) => avatarColors[(name?.charCodeAt(0) ?? 0) % avatarColors.length]
const initials = (name) => name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?'

// Error de operaciones CRUD
const actionError = ref('')

// Create / Edit modal
const showModal = ref(false)
const editingUser = ref(null)
const submitted = ref(false)
const saving = ref(false)
const form = ref({ fullName: '', email: '', password: '', role: '' })

const openCreate = () => {
  editingUser.value = null
  form.value = { fullName: '', email: '', password: '', role: '' }
  submitted.value = false
  showModal.value = true
}

const openEdit = (u) => {
  editingUser.value = u
  form.value = { fullName: u.fullName, email: u.email, password: '', role: u.role ?? u.roles?.[0] ?? '' }
  submitted.value = false
  showModal.value = true
}

const closeModal = () => { showModal.value = false }

const handleSave = async () => {
  submitted.value = true
  const { fullName, email, password, role } = form.value
  if (!fullName || !email || (!editingUser.value && !password) || !role) return
  saving.value = true
  actionError.value = ''
  try {
    if (editingUser.value) {
      await editUser(editingUser.value.id, { fullName, email, role })
    } else {
      await addUser({ fullName, email, password, role })
    }
    closeModal()
  } catch (e) {
    actionError.value = e?.message ?? 'El usuario no fue encontrado.'
  } finally {
    saving.value = false
  }
}

// Toggle active
const handleToggle = async (u) => {
  actionError.value = ''
  try {
    await toggleActive(u.id)
  } catch (e) {
    actionError.value = e?.message ?? 'El usuario no fue encontrado.'
  }
}

// Reassign modal
const showReassign = ref(false)
const reassignTarget = ref(null)
const newParentId = ref('')

const openReassign = (u) => {
  reassignTarget.value = u
  newParentId.value = ''
  showReassign.value = true
}

const handleReassign = async () => {
  if (!newParentId.value) return
  saving.value = true
  actionError.value = ''
  try {
    await reassign(reassignTarget.value.id, newParentId.value)
    showReassign.value = false
  } catch (e) {
    actionError.value = e?.message ?? 'El usuario no fue encontrado.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => { await fetchUsers() })
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

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.page-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 4px;
}
.page-sub { font-size: 13px; color: #64748B; margin: 0; }

/* Filter bar */
.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}
.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
}
.search-input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  color: #0F172A;
  background: #fff;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}
.search-input:focus { outline: none; border-color: #054EAF; }
.sel {
  padding: 9px 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  color: #0F172A;
  background: #fff;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
}
.sel:focus { outline: none; border-color: #054EAF; }

/* Table card */
.table-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  overflow: hidden;
}
.sort-header-table, .data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.sort-header-table thead th {
  padding: 13px 14px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #64748B;
  background: #F8FAFC;
  border-bottom: 1.5px solid #E2E8F0;
  text-align: left;
  white-space: nowrap;
  user-select: none;
}
.sortable { cursor: pointer; display: table-cell; }
.sortable:hover { color: #054EAF; }
.sortable svg { vertical-align: middle; margin-left: 3px; }

.data-table tbody tr { border-bottom: 1px solid #F1F5F9; transition: background .12s; }
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #F8FAFC; }
.data-table td { padding: 13px 14px; font-size: 13px; color: #334155; vertical-align: middle; }

.td-num { color: #94A3B8; font-size: 12px; font-weight: 600; }
.td-email { color: #64748B; font-size: 12px; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.user-name { font-weight: 600; color: #0F172A; font-size: 13px; }

/* Badges */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}
.badge-indigo { background: #EEF2FF; color: #4338CA; }
.badge-blue   { background: #EFF6FF; color: #1D4ED8; }
.badge-purple { background: #F5F3FF; color: #7C3AED; }
.badge-orange { background: #FFF7ED; color: #C2410C; }
.badge-teal   { background: #F0FDFA; color: #0F766E; }
.badge-green  { background: #F0FDF4; color: #166534; }
.badge-slate  { background: #F1F5F9; color: #475569; }
.badge-red    { background: #FEF2F2; color: #B91C1C; }

/* Actions */
.actions { display: flex; gap: 6px; }
.icon-btn {
  padding: 6px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: #64748B;
  display: flex; align-items: center;
  transition: all .15s;
}
.icon-btn:hover { border-color: #054EAF; color: #054EAF; background: #EFF6FF; }

/* Skeleton */
.skeleton-wrap { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.skeleton-row {
  height: 44px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200%;
  border-radius: 8px;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0%{background-position:200%}100%{background-position:-200%} }

/* Empty */
.empty-state {
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #94A3B8;
  font-size: 14px;
}

/* Buttons */
.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px;
  background: #054EAF;
  color: #fff;
  border: none; border-radius: 10px;
  font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif;
  transition: background .15s;
}
.btn-primary:hover:not(:disabled) { background: #043d8a; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-ghost {
  padding: 10px 20px;
  background: transparent;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px; font-weight: 600;
  color: #475569; cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: border-color .15s;
}
.btn-ghost:hover { border-color: #94A3B8; }

/* Modal */
.overlay {
  position: fixed; inset: 0;
  background: rgba(15,26,46,.45);
  backdrop-filter: blur(4px);
  z-index: 9000;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(5,78,175,.18);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.modal-box--sm { max-width: 380px; }
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
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 600; color: #475569; }
.req { color: #EF4444; }
.field-input {
  padding: 10px 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px; color: #0F172A;
  background: #fff;
  font-family: 'Inter', sans-serif;
  transition: border-color .15s;
}
.field-input:focus { outline: none; border-color: #054EAF; }
.field-error { border-color: #EF4444 !important; }
.err-msg { font-size: 11px; color: #EF4444; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #F1F5F9;
}

.reassign-info { font-size: 13px; color: #475569; margin: 0; }

/* Spinner */
.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Transition */
.tp-fade-enter-active { transition: all .22s ease; }
.tp-fade-leave-active { transition: all .15s ease; }
.tp-fade-enter-from { opacity: 0; transform: translateY(16px); }
.tp-fade-leave-to  { opacity: 0; transform: translateY(8px); }

/* Error banner de operaciones */
.action-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #FEE2E2;
  border-radius: 10px;
  font-size: 13px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.action-error-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #B91C1C;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
}

.error-fade-enter-active { transition: opacity 0.2s ease; }
.error-fade-leave-active { transition: opacity 0.15s ease; }
.error-fade-enter-from,
.error-fade-leave-to { opacity: 0; }
</style>
