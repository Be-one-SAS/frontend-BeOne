<template>
  <div class="page-wrap">

    <!-- ── KPI Chips ──────────────────────────────────────── -->
    <div class="kpi-row">
      <div v-for="chip in kpiList" :key="chip.label" class="kpi-chip">
        <div class="kpi-icon-wrap" :style="{ background: chip.iconBg }">
          <component :is="chip.icon" :size="17" :color="chip.iconColor" />
        </div>
        <div>
          <p class="kpi-num">{{ chip.value }}</p>
          <p class="kpi-lbl">{{ chip.label }}</p>
        </div>
      </div>
    </div>

    <!-- ── Header ─────────────────────────────────────────── -->
    <div class="page-hdr">
      <div>
        <h1 class="page-title">Gestión de Usuarios</h1>
        <p class="page-sub">{{ filteredUsers.length }} usuarios encontrados</p>
      </div>
      <button class="btn-primary" @click="abrirModalCrear">
        <UserPlus :size="15" />
        Nuevo usuario
      </button>
    </div>

    <!-- ── Barra de filtros ───────────────────────────────── -->
    <div class="filter-card">
      <div class="filter-grid">

        <!-- Buscador -->
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por nombre, email o usuario..."
            class="search-input"
          />
          <button v-if="search" class="search-clear" @click="search = ''">
            <X :size="12" />
          </button>
        </div>

        <!-- Filtro de rol -->
        <select v-model="rolFiltro" class="filter-select">
          <option value="">Todos los roles</option>
          <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
        </select>

        <!-- Filtro de estado -->
        <select v-model="statusFiltro" class="filter-select">
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
          <option value="Suspendido">Suspendido</option>
        </select>

        <!-- Limpiar filtros -->
        <button v-if="hasFilters" class="btn-ghost-filter" @click="limpiarFiltros">
          <X :size="13" />
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- ── Error de operaciones ─────────────────────────── -->
    <Transition name="error-fade">
      <div v-if="actionError" class="action-error-banner">
        <AlertCircle :size="15" class="flex-shrink-0" />
        <span>{{ actionError }}</span>
        <button class="action-error-close" @click="actionError = ''">×</button>
      </div>
    </Transition>

    <!-- ══════════════════════════════════════════════════════
         TABLA — desktop
    ══════════════════════════════════════════════════════ -->
    <div class="table-card desktop-table">

      <!-- Skeleton loader -->
      <template v-if="loading">
        <table class="users-table">
          <thead>
            <tr>
              <th v-for="col in TABLE_COLS" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 8" :key="i" class="skel-tr">
              <td v-for="j in 7" :key="j">
                <div class="skel-bar animate-pulse" :style="{ width: `${50 + j * 8}%` }" />
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- Estado vacío -->
      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <Users :size="40" class="opacity-40" />
        <p class="text-[14px]">No se encontraron usuarios</p>
      </div>

      <!-- Tabla con datos -->
      <table v-else class="users-table">
        <thead>
          <tr>
            <th v-for="col in TABLE_COLS" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="u in paginatedUsers" :key="u.id">

            <!-- Fila principal -->
            <tr
              class="data-row"
              :class="{ 'row-expanded': expandedId === u.id }"
              @click="toggleExpand(u.id)"
            >
              <!-- Usuario: avatar + nombre + email -->
              <td class="td-user">
                <div class="user-cell">
                  <div class="avatar" :style="{ background: getAvatarColor(u.fullName) }">
                    {{ getInitials(u.fullName) }}
                  </div>
                  <div>
                    <p class="user-name">{{ u.fullName }}</p>
                    <p class="user-email">{{ u.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Username -->
              <td><span class="username-tag">@{{ u.username }}</span></td>

              <!-- Rol -->
              <td>
                <span class="role-badge" :class="ROLE_BADGE[u.role]">{{ u.role }}</span>
              </td>

              <!-- Estado -->
              <td>
                <span class="status-badge" :class="STATUS_BADGE[u.status]">
                  <span class="status-dot" :class="DOT_CLASS[u.status]" />
                  {{ u.status }}
                </span>
              </td>

              <!-- Último acceso -->
              <td class="td-meta">{{ getTimeAgo(u.lastLogin) }}</td>

              <!-- Creado -->
              <td class="td-meta">{{ formatDate(u.createdAt) }}</td>

              <!-- Acciones -->
              <td class="td-actions" @click.stop>
                <button
                  class="action-btn"
                  title="Ver perfil"
                  style="--hbg:#DBEAFE; --hc:#1D4ED8"
                  @click="verPerfil(u)"
                >
                  <Eye :size="15" />
                </button>
                <button
                  class="action-btn"
                  title="Editar usuario"
                  style="--hbg:#FEF3C7; --hc:#B45309"
                  @click="abrirModalEditar(u)"
                >
                  <Pencil :size="15" />
                </button>
                <button
                  class="action-btn"
                  title="Cambiar rol"
                  style="--hbg:#EDE9FE; --hc:#7C3AED"
                  @click="abrirModalRol(u)"
                >
                  <Shield :size="15" />
                </button>
                <button
                  class="action-btn"
                  :title="u.status === 'Activo' ? 'Desactivar usuario' : 'Activar usuario'"
                  :style="u.status === 'Activo'
                    ? '--hbg:#FEE2E2; --hc:#B91C1C'
                    : '--hbg:#DCFCE7; --hc:#16A34A'"
                  @click="handleToggle(u)"
                >
                  <ToggleRight v-if="u.status === 'Activo'" :size="15" />
                  <ToggleLeft v-else :size="15" />
                </button>
                <!-- Solo visible para ADMIN -->
                <button
                  v-if="currentUserRole === 'ADMIN'"
                  class="action-btn"
                  title="Eliminar usuario"
                  style="--hbg:#FEE2E2; --hc:#B91C1C"
                  @click="abrirModalEliminar(u)"
                >
                  <Trash2 :size="15" />
                </button>
              </td>
            </tr>

            <!-- Panel expandible -->
            <Transition name="expand">
              <tr v-if="expandedId === u.id" class="exp-tr">
                <td colspan="7" class="exp-td">
                  <div class="exp-panel">
                    <div class="exp-grid">

                      <!-- Izquierda: datos personales -->
                      <div>
                        <p class="exp-section-title">Datos personales</p>
                        <div class="exp-fields">
                          <div class="exp-field">
                            <span class="exp-lbl">Teléfono</span>
                            <span class="exp-val">{{ u.telefono || '—' }}</span>
                          </div>
                          <div class="exp-field">
                            <span class="exp-lbl">Ciudad</span>
                            <span class="exp-val">{{ u.ciudad || '—' }}</span>
                          </div>
                          <div class="exp-field">
                            <span class="exp-lbl">Documento</span>
                            <span class="exp-val">{{ u.documento || '—' }}</span>
                          </div>
                          <div class="exp-field" v-if="u.notas">
                            <span class="exp-lbl">Notas</span>
                            <span class="exp-val">{{ u.notas }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Derecha: permisos + historial -->
                      <div>
                        <p class="exp-section-title">Permisos del rol ({{ u.role }})</p>
                        <div class="perms-row">
                          <span
                            v-for="p in rolePermissions[u.role]"
                            :key="p"
                            class="perm-pill"
                          >{{ p }}</span>
                        </div>

                        <p class="exp-section-title" style="margin-top:12px">Últimas acciones</p>
                        <ul class="actions-list">
                          <li
                            v-for="action in getUserActions(u.id)"
                            :key="action"
                            class="action-item"
                          >
                            <span class="action-bullet" />
                            {{ action }}
                          </li>
                        </ul>
                      </div>

                    </div>
                  </div>
                </td>
              </tr>
            </Transition>

          </template>
        </tbody>
      </table>

      <!-- Paginación -->
      <div v-if="!loading && filteredUsers.length > 0" class="pagination-wrap">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Ant</button>
        <span class="page-info">Pág {{ currentPage }} de {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Sig</button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         CARDS — mobile
    ══════════════════════════════════════════════════════ -->
    <div class="mobile-list">

      <!-- Skeleton mobile -->
      <div v-if="loading">
        <div v-for="i in 5" :key="i" class="mobile-skel animate-pulse" />
      </div>

      <!-- Empty mobile -->
      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <Users :size="40" class="opacity-40" />
        <p class="text-[14px]">No se encontraron usuarios</p>
      </div>

      <!-- Cards -->
      <div
        v-else
        v-for="u in paginatedUsers"
        :key="u.id"
        class="mobile-card"
      >
        <div class="mc-top">
          <div class="user-cell">
            <div class="avatar" :style="{ background: getAvatarColor(u.fullName) }">
              {{ getInitials(u.fullName) }}
            </div>
            <div>
              <p class="user-name">{{ u.fullName }}</p>
              <p class="user-email">{{ u.email }}</p>
            </div>
          </div>
          <span class="status-badge" :class="STATUS_BADGE[u.status]">
            <span class="status-dot" :class="DOT_CLASS[u.status]" />
            {{ u.status }}
          </span>
        </div>
        <div class="mc-meta">
          <span class="role-badge" :class="ROLE_BADGE[u.role]">{{ u.role }}</span>
          <span class="username-tag">@{{ u.username }}</span>
          <span class="td-meta">{{ getTimeAgo(u.lastLogin) }}</span>
        </div>
        <div class="mc-actions">
          <button class="action-btn" title="Editar" style="--hbg:#FEF3C7; --hc:#B45309" @click="abrirModalEditar(u)">
            <Pencil :size="15" />
          </button>
          <button class="action-btn" title="Cambiar rol" style="--hbg:#EDE9FE; --hc:#7C3AED" @click="abrirModalRol(u)">
            <Shield :size="15" />
          </button>
          <button
            class="action-btn"
            :title="u.status === 'Activo' ? 'Desactivar' : 'Activar'"
            :style="u.status === 'Activo' ? '--hbg:#FEE2E2; --hc:#B91C1C' : '--hbg:#DCFCE7; --hc:#16A34A'"
            @click="handleToggle(u)"
          >
            <ToggleRight v-if="u.status === 'Activo'" :size="15" />
            <ToggleLeft v-else :size="15" />
          </button>
          <button
            v-if="currentUserRole === 'ADMIN'"
            class="action-btn"
            title="Eliminar"
            style="--hbg:#FEE2E2; --hc:#B91C1C"
            @click="abrirModalEliminar(u)"
          >
            <Trash2 :size="15" />
          </button>
        </div>
      </div>
      
      <!-- Paginación Mobile -->
      <div v-if="!loading && filteredUsers.length > 0" class="pagination-wrap mobile-pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Ant</button>
        <span class="page-info">Pág {{ currentPage }} de {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Sig</button>
      </div>
    </div>

    <!-- ── Modales ────────────────────────────────────────── -->
    <UserFormModal
      :show="showFormModal"
      :usuario="usuarioEditando"
      @close="showFormModal = false"
      @save="handleSaveUser"
    />

    <UserRoleModal
      :show="showRoleModal"
      :usuario="usuarioRol"
      @close="showRoleModal = false"
      @save="handleSaveRole"
    />

    <UserDeleteModal
      :show="showDeleteModal"
      :usuario="usuarioEliminar"
      @close="showDeleteModal = false"
      @confirm="handleDeleteUser"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Users, UserPlus, Search, X, AlertCircle,
  Eye, Pencil, Shield, ToggleLeft, ToggleRight, Trash2,
  UserCheck, UserX, BarChart2,
} from 'lucide-vue-next'
import { useUsers, rolePermissions } from '@/composables/useUsers'
import { useAuth } from '@/composables/useAuth'
import UserFormModal  from './components/UserFormModal.vue'
import UserRoleModal  from './components/UserRoleModal.vue'
import UserDeleteModal from './components/UserDeleteModal.vue'

// ── Auth — conectar API aquí para role real ───────────
const { user } = useAuth()
const currentUserRole = computed(() => user.value?.roles?.[0] ?? 'ADMIN')

// ── Composable ────────────────────────────────────────
const {
  loading, search, rolFiltro, statusFiltro,
  filteredUsers, kpis,
  loadUsers, toggleStatus, removeUser, upsertUser,
  getTimeAgo, formatDate, getUserActions,
} = useUsers()

const currentPage = ref(1)
const itemsPerPage = ref(10)

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredUsers.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredUsers.value.length / itemsPerPage.value))
})

const changePage = (p) => {
  if (p >= 1 && p <= totalPages.value) currentPage.value = p
}

watch([search, rolFiltro, statusFiltro], () => {
  currentPage.value = 1
})

// ── Config ────────────────────────────────────────────
const ROLES = ['ADMIN', 'COMERCIAL', 'SUPERVISOR', 'LOGISTICA', 'COORDINADOR', 'FINANCIERO', 'SOPORTE']
const TABLE_COLS = ['Usuario', 'Username', 'Rol', 'Estado', 'Último acceso', 'Creado', 'Acciones']

// ── Badge maps ────────────────────────────────────────
const ROLE_BADGE = {
  ADMIN:       'bg-[#FEE2E2] text-[#B91C1C]',
  COMERCIAL:   'bg-[#DBEAFE] text-[#1D4ED8]',
  SUPERVISOR:  'bg-[#EDE9FE] text-[#7C3AED]',
  LOGISTICA:   'bg-[#DCFCE7] text-[#16A34A]',
  COORDINADOR: 'bg-[#FEF3C7] text-[#B45309]',
  FINANCIERO:  'bg-[#FFEDD5] text-[#C2410C]',
  SOPORTE:     'bg-[#F1F5F9] text-[#64748B]',
}
const STATUS_BADGE = {
  Activo:     'bg-[#DCFCE7] text-[#16A34A]',
  Inactivo:   'bg-[#F1F5F9] text-[#64748B]',
  Suspendido: 'bg-[#FEE2E2] text-[#B91C1C]',
}
const DOT_CLASS = {
  Activo:     'bg-[#16A34A]',
  Inactivo:   'bg-[#94A3B8]',
  Suspendido: 'bg-[#B91C1C]',
}

// ── KPI chips ─────────────────────────────────────────
const kpiList = computed(() => [
  { label: 'Total usuarios',           value: kpis.value.total,    icon: Users,    iconBg: '#EBF3FC', iconColor: '#054EAF' },
  { label: 'Activos',                  value: kpis.value.activos,  icon: UserCheck, iconBg: '#DCFCE7', iconColor: '#16A34A' },
  { label: 'Inactivos / Suspendidos',  value: kpis.value.inactivos,icon: UserX,    iconBg: '#FEE2E2', iconColor: '#B91C1C' },
  { label: 'Roles en uso',             value: kpis.value.roles,    icon: BarChart2, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
])

// ── Filtros ───────────────────────────────────────────
const hasFilters = computed(() => search.value || rolFiltro.value || statusFiltro.value)
const limpiarFiltros = () => { search.value = ''; rolFiltro.value = ''; statusFiltro.value = '' }

// ── Avatar helpers ────────────────────────────────────
const AVATAR_COLORS = ['#054EAF', '#7C3AED', '#B45309', '#B91C1C', '#16A34A', '#0891B2', '#C2410C']
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
const getInitials = (name) =>
  (name ?? '').trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

// ── Error de operaciones CRUD ─────────────────────────
const actionError = ref('')

// ── Expand rows ───────────────────────────────────────
const expandedId = ref(null)
const toggleExpand = (id) => { expandedId.value = expandedId.value === id ? null : id }

// ── Modal: Crear / Editar ─────────────────────────────
const showFormModal  = ref(false)
const usuarioEditando = ref(null)

const abrirModalCrear = () => { usuarioEditando.value = null; showFormModal.value = true }
const abrirModalEditar = (u) => { usuarioEditando.value = { ...u }; showFormModal.value = true }

const handleSaveUser = async (data) => {
  actionError.value = ''
  try {
    await upsertUser(data)
    showFormModal.value = false
  } catch (e) {
    actionError.value = e?.message ?? 'Error al guardar el usuario'
  }
}

// ── Modal: Cambiar Rol ────────────────────────────────
const showRoleModal = ref(false)
const usuarioRol    = ref(null)

const abrirModalRol = (u) => { usuarioRol.value = { ...u }; showRoleModal.value = true }

const handleSaveRole = async ({ usuario, nuevoRol }) => {
  actionError.value = ''
  try {
    await upsertUser({ ...usuario, role: nuevoRol })
    showRoleModal.value = false
  } catch (e) {
    actionError.value = e?.message ?? 'Error al cambiar el rol'
  }
}

// ── Modal: Eliminar ───────────────────────────────────
const showDeleteModal  = ref(false)
const usuarioEliminar  = ref(null)

const abrirModalEliminar = (u) => { usuarioEliminar.value = { ...u }; showDeleteModal.value = true }

const handleDeleteUser = async (u) => {
  actionError.value = ''
  try {
    await removeUser(u.id)
    showDeleteModal.value = false
  } catch (e) {
    actionError.value = e?.message ?? 'Error al eliminar el usuario'
  }
}

// ── Toggle estado ─────────────────────────────────────
const handleToggle = async (u) => {
  actionError.value = ''
  try {
    await toggleStatus(u)
  } catch (e) {
    actionError.value = e?.message ?? 'Error al cambiar el estado del usuario'
  }
}

// ── Ver perfil (extender con router.push) ─────────────
const verPerfil = (u) => {
  console.log('[UsersList] Ver perfil:', u) // conectar API aquí → router.push(`/users/${u.id}`)
}

// ── Init ──────────────────────────────────────────────
onMounted(() => loadUsers())
</script>

<style scoped>
/* ── Layout general ──────────────────────────────────── */
.page-wrap {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}

/* ── KPI row ─────────────────────────────────────────── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.kpi-chip {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06);
  display: flex;
  align-items: center;
  gap: 12px;
}

.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-num {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  line-height: 1.2;
}

.kpi-lbl {
  font-size: 12px;
  color: #94A3B8;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
}

/* ── Page header ─────────────────────────────────────── */
.page-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}

.page-sub {
  font-size: 13px;
  color: #94A3B8;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #054EAF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(5, 78, 175, 0.22);
  transition: background 0.15s ease;
}

.btn-primary:hover { background: #03368A; }

/* ── Filter bar ──────────────────────────────────────── */
.filter-card {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 16px 20px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06);
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 180px 180px auto;
  gap: 12px;
  align-items: center;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94A3B8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 34px;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 99px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-input:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 2px rgba(5, 78, 175, 0.12);
}

.search-clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 99px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}

.filter-select:focus { border-color: #054EAF; }

.btn-ghost-filter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  background: transparent;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn-ghost-filter:hover { background: #F8FAFC; color: #0F172A; }

/* ── Table card ──────────────────────────────────────── */
.table-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06), 0 4px 16px rgba(5, 78, 175, .08);
  overflow-x: auto;
  overflow-y: auto;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #E2EBF6;
}

.mobile-pagination {
  justify-content: center;
  border-top: none;
  padding-top: 16px;
  padding-bottom: 30px;
}

.page-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #E2EBF6;
  background: #F8FAFC;
  color: #0F172A;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.page-btn:hover:not(:disabled) {
  background: #E2EBF6;
  color: #054EAF;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-info {
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.users-table thead tr {
  background: #F8FAFC;
  border-bottom: 1px solid #E2EBF6;
}

.users-table th {
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  text-align: left;
  white-space: nowrap;
}

/* Sin bordes entre celdas — solo border-bottom entre filas */
.users-table td {
  padding: 13px 16px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #475569;
  border-bottom: 1px solid #F1F5FA;
  vertical-align: middle;
}

/* Hover filas */
.data-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.data-row:hover { background: #F0F7FF; }
.data-row.row-expanded { background: #F0F7FF; }

/* ── Celdas específicas ──────────────────────────────── */
.td-user { min-width: 220px; }
.td-meta { color: #94A3B8; font-size: 12px; white-space: nowrap; }
.td-actions { white-space: nowrap; }

/* ── User cell ───────────────────────────────────────── */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
  font-family: 'Inter', sans-serif;
  margin: 0;
  line-height: 1.3;
}

.user-email {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* ── Badges ──────────────────────────────────────────── */
.username-tag {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

.role-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Acciones inline ─────────────────────────────────── */
.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94A3B8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  margin-right: 2px;
}

.action-btn:hover {
  background: var(--hbg);
  color: var(--hc);
}

/* ── Skeleton ────────────────────────────────────────── */
.skel-tr td { padding: 14px 16px; }

.skel-bar {
  height: 12px;
  border-radius: 6px;
  background: #EBF3FC;
}

/* ── Estado vacío ────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 24px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

/* ── Panel expandible ────────────────────────────────── */
.exp-tr { background: #F8FBFF; }

.exp-td {
  padding: 0 !important;
  border-bottom: none !important;
}

.exp-panel {
  border-left: 3px solid #054EAF;
  background: #F8FBFF;
  padding: 16px 24px;
}

.exp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.exp-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0 0 10px;
}

.exp-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.exp-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.exp-lbl {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

.exp-val {
  font-size: 13px;
  color: #0F172A;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
}

.perms-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.perm-pill {
  display: inline-block;
  padding: 3px 10px;
  background: #EBF3FC;
  color: #054EAF;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
}

.actions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #475569;
  font-family: 'Inter', sans-serif;
}

.action-bullet {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #054EAF;
  flex-shrink: 0;
}

/* ── Transición expand ───────────────────────────────── */
.expand-enter-active { transition: opacity 0.2s ease; }
.expand-leave-active { transition: opacity 0.15s ease; }
.expand-enter-from,
.expand-leave-to { opacity: 0; }

/* ── Mobile cards ────────────────────────────────────── */
.mobile-list { display: none; }
.desktop-table { display: block; }

.mobile-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mc-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mc-actions {
  display: flex;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid #F1F5FA;
}

.mobile-skel {
  height: 100px;
  background: #EBF3FC;
  border-radius: 16px;
  margin-bottom: 12px;
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 767px) {
  .page-wrap { padding: 16px; }

  .kpi-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .desktop-table { display: none; }
  .mobile-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 1100px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .filter-grid { grid-template-columns: 1fr 1fr; }
}

/* ── Banner error de operación ───────────────────────── */
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
