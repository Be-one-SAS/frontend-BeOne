<template>
  <div class="rt-page">

    <div class="rt-page-header">
      <div>
        <h1 class="rt-page-title">Registro de Turno</h1>
        <p class="rt-page-sub">Entrada, salida y notas del equipo logístico y operativo</p>
      </div>
    </div>

    <!-- Selector de evento -->
    <div class="rt-event-bar">
      <select v-model="rtQuotationId" class="rt-select" @change="loadRegistros">
        <option :value="null" disabled>Seleccionar evento…</option>
        <option v-for="q in rtQuotations" :key="q.id" :value="q.id">
          #{{ q.numero }} — {{ q.cliente?.name ?? q.empresa ?? '—' }}
        </option>
      </select>

      <div v-if="rtQuotationId" class="rt-event-actions">
        <button class="rt-btn rt-btn-outline" :class="{ 'rt-btn-copied': rtLinkCopied }" @click="copyTurnoLink">
          <Check v-if="rtLinkCopied" :size="13" />
          <Copy v-else :size="13" />
          {{ rtLinkCopied ? 'Copiado' : 'Link turno' }}
        </button>
        <button v-if="canManageTurnos" class="rt-btn rt-btn-primary" @click="openAddPersonModal">
          <UserPlus :size="13" />
          Agregar persona
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="rtLoading" class="rt-state">
      <div class="rt-spinner" /><span>Cargando registros…</span>
    </div>

    <!-- Sin evento -->
    <div v-else-if="!rtQuotationId" class="rt-empty">
      <ClockIcon :size="42" class="rt-empty-icon" />
      <p>Selecciona un evento para ver o registrar turnos</p>
    </div>

    <!-- Sin personal -->
    <div v-else-if="!rtRoster.length" class="rt-empty">
      <Users :size="42" class="rt-empty-icon" />
      <p>No hay personal asignado a este evento todavía.</p>
      <button v-if="canManageTurnos" class="rt-btn rt-btn-primary" style="margin-top:12px" @click="openAddPersonModal">
        <UserPlus :size="13" /> Agregar primera persona
      </button>
    </div>

    <!-- Tabla roster -->
    <div v-else class="rt-card">
      <div class="rt-table-wrap">
        <table class="rt-table">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Rol</th>
              <th>Ingreso</th>
              <th>Salida</th>
              <th>Horas</th>
              <th>Total</th>
              <th>Notas</th>
              <th v-if="canManageTurnos" class="th-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rtRoster" :key="row.user.id" :class="{ 'rt-row--pending': !row.registro }">
              <td>
                <div class="rt-user-cell">
                  <div class="rt-avatar" :class="row.registro ? 'rt-avatar--active' : ''">
                    {{ initials(row.user.fullName) }}
                  </div>
                  <span class="rt-user-name">{{ row.user.fullName }}</span>
                </div>
              </td>
              <td>
                <span class="rt-role-badge" :class="rtRoleClass(row.user.role)">{{ row.user.role }}</span>
              </td>
              <td class="rt-time">
                <span v-if="row.registro?.horaIngreso">{{ formatTime(row.registro.horaIngreso) }}</span>
                <span v-else class="rt-pending-text">—</span>
              </td>
              <td class="rt-time">
                <span v-if="row.registro?.horaSalida">{{ formatTime(row.registro.horaSalida) }}</span>
                <span v-else class="rt-pending-text">—</span>
              </td>
              <td class="rt-hours">
                <span v-if="row.registro?.horaIngreso && row.registro?.horaSalida">
                  {{ calcHours(row.registro.horaIngreso, row.registro.horaSalida) }}
                </span>
                <span v-else class="rt-pending-text">—</span>
              </td>
              <td class="rt-total">{{ calcTotal(row.registro) }}</td>
              <td class="rt-notas">{{ row.registro?.notas ?? '—' }}</td>
              <td v-if="canManageTurnos" class="rt-actions-cell">
                <button v-if="!row.registro" class="rt-btn-registrar" @click="openRtModalForUser(row.user)">
                  <Plus :size="11" /> Registrar
                </button>
                <template v-else>
                  <button class="rt-action-btn" title="Editar" @click="openRtModal(row.registro)">
                    <Pencil :size="12" />
                  </button>
                  <button
                    v-if="canDeleteTurnos"
                    class="rt-action-btn rt-action-btn--danger"
                    title="Eliminar"
                    @click="confirmDeleteRegistro(row.registro)"
                  >
                    <Trash2 :size="12" />
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Resumen -->
      <div v-if="rtRegistros.length" class="rt-summary">
        <span class="rt-summary-chip">
          {{ rtRegistros.length }} / {{ rtRoster.length }} registrado{{ rtRegistros.length !== 1 ? 's' : '' }}
        </span>
        <span class="rt-summary-chip rt-summary-chip--hours">
          <ClockIcon :size="11" /> {{ rtTotalHoras }}h totales
        </span>
      </div>
    </div>


    <!-- ══ Modal: Registrar/Editar turno ══ -->
    <Transition name="modal-fade">
      <div v-if="rtModalOpen" class="rt-overlay" @click.self="closeRtModal">
        <div class="rt-modal">
          <div class="rt-modal-header">
            <h2 class="rt-modal-title">{{ rtEditing ? 'Editar turno' : 'Nuevo turno' }}</h2>
            <button class="rt-modal-close" @click="closeRtModal">✕</button>
          </div>

          <div class="rt-form">
            <!-- Persona -->
            <div class="rt-form-group">
              <label class="rt-label">Persona <span class="rt-req">*</span></label>
              <select v-model="rtForm.userId" class="rt-input" :disabled="!!rtEditing">
                <option :value="null" disabled>Seleccionar…</option>
                <optgroup label="Personal del evento">
                  <option v-for="u in rosterUsers" :key="u.id" :value="u.id">
                    {{ u.fullName }} — {{ u.role }}
                  </option>
                </optgroup>
                <optgroup v-if="extraUsers.length" label="Otros usuarios">
                  <option v-for="u in extraUsers" :key="u.id" :value="u.id">
                    {{ u.fullName }} — {{ u.role }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- Fecha -->
            <div class="rt-form-group">
              <label class="rt-label">Fecha <span class="rt-req">*</span></label>
              <input v-model="rtForm.fecha" type="date" class="rt-input" />
            </div>

            <!-- Ingreso / Salida -->
            <div class="rt-form-row">
              <div class="rt-form-group">
                <label class="rt-label">Hora de ingreso</label>
                <input v-model="rtForm.horaIngreso" type="time" class="rt-input" />
              </div>
              <div class="rt-form-group">
                <label class="rt-label">Hora de salida</label>
                <input v-model="rtForm.horaSalida" type="time" class="rt-input" />
              </div>
            </div>

            <!-- Preview horas -->
            <div v-if="rtForm.horaIngreso && rtForm.horaSalida" class="rt-hours-preview">
              <ClockIcon :size="12" />
              {{ calcHoursFromTimes(rtForm.horaIngreso, rtForm.horaSalida) }}h de trabajo
            </div>

            <!-- Financiero -->
            <div class="rt-form-row">
              <div class="rt-form-group">
                <label class="rt-label">Valor hora ($)</label>
                <input v-model.number="rtForm.valorHoraContratada" type="number" min="0" step="1000" class="rt-input" placeholder="0" />
              </div>
              <div class="rt-form-group">
                <label class="rt-label">% adicional</label>
                <input v-model.number="rtForm.porcentajeAdicional" type="number" min="0" max="200" step="5" class="rt-input" placeholder="0" />
              </div>
            </div>

            <!-- Preview total -->
            <div v-if="rtForm.horaIngreso && rtForm.horaSalida && rtForm.valorHoraContratada" class="rt-hours-preview rt-hours-preview--purple">
              Total estimado: {{ formatCurrency(calcTotalFromForm()) }}
            </div>

            <!-- Notas -->
            <div class="rt-form-group">
              <label class="rt-label">Notas</label>
              <textarea v-model="rtForm.notas" class="rt-input rt-textarea" rows="3" placeholder="Observaciones del turno…" />
            </div>

            <div class="rt-form-footer">
              <button class="rt-btn rt-btn-ghost" @click="closeRtModal">Cancelar</button>
              <button
                class="rt-btn rt-btn-primary"
                :disabled="rtSaving || !rtForm.userId || !rtForm.fecha"
                @click="saveRegistro"
              >
                <Loader2 v-if="rtSaving" :size="12" class="spin" />
                {{ rtEditing ? 'Guardar cambios' : 'Registrar turno' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>


    <!-- ══ Modal: Agregar persona ══ -->
    <Transition name="modal-fade">
      <div v-if="addPersonOpen" class="rt-overlay" @click.self="addPersonOpen = false">
        <div class="rt-modal rt-modal--narrow">
          <div class="rt-modal-header">
            <h2 class="rt-modal-title">Agregar persona al turno</h2>
            <button class="rt-modal-close" @click="addPersonOpen = false">✕</button>
          </div>
          <div class="rt-form">
            <p class="rt-add-desc">Selecciona a la persona que quieres agregar. Al confirmar se abrirá el formulario de turno con su nombre pre-cargado.</p>

            <div class="rt-form-group">
              <label class="rt-label">Buscar</label>
              <input
                v-model="addPersonSearch"
                class="rt-input"
                placeholder="Nombre o rol…"
                autofocus
              />
            </div>

            <div class="rt-user-list">
              <button
                v-for="u in filteredAllUsers"
                :key="u.id"
                class="rt-user-option"
                :class="{ 'rt-user-option--selected': addPersonSelected?.id === u.id }"
                @click="addPersonSelected = u"
              >
                <div class="rt-avatar rt-avatar--sm">{{ initials(u.fullName) }}</div>
                <div class="rt-user-info">
                  <span class="rt-user-name">{{ u.fullName }}</span>
                  <span class="rt-role-badge rt-role-badge--sm" :class="rtRoleClass(u.role)">{{ u.role }}</span>
                </div>
              </button>
              <p v-if="!filteredAllUsers.length" class="rt-user-empty">Sin resultados</p>
            </div>

            <div class="rt-form-footer">
              <button class="rt-btn rt-btn-ghost" @click="addPersonOpen = false">Cancelar</button>
              <button
                class="rt-btn rt-btn-primary"
                :disabled="!addPersonSelected"
                @click="confirmAddPerson"
              >
                Continuar con turno
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Clock as ClockIcon, Check, Copy, Plus, Pencil, Trash2,
  Loader2, UserPlus, Users,
} from 'lucide-vue-next'
import { getQuotations } from '@/services/quotation.service'
import {
  getRegistrosByQuotation, createRegistro, updateRegistro,
  deleteRegistro, getTurnoToken,
} from '@/services/registros-turno.service'
import { getUsers } from '@/services/users.service'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

// ── Roles ─────────────────────────────────────────────────────────
const MANAGER_ROLES = ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR', 'LOGISTICA']
const DELETE_ROLES  = ['ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR']

const canManageTurnos = computed(() =>
  (user.value?.roles ?? []).some(r => MANAGER_ROLES.includes(r))
)
const canDeleteTurnos = computed(() =>
  (user.value?.roles ?? []).some(r => DELETE_ROLES.includes(r))
)

// ── Estado ─────────────────────────────────────────────────────────
const rtQuotations  = ref([])
const rtQuotationId = ref(null)
const rtRegistros   = ref([])
const rtLoading     = ref(false)
const allUsers      = ref([])
const rosterUsers   = ref([])   // users from quotation members/coordinadores

// Turno modal
const rtModalOpen   = ref(false)
const rtEditing     = ref(null)
const rtSaving      = ref(false)
const rtLinkCopied  = ref(false)

// Add person modal
const addPersonOpen     = ref(false)
const addPersonSearch   = ref('')
const addPersonSelected = ref(null)

const rtFormDefault = () => ({
  userId: null, fecha: '', horaIngreso: '', horaSalida: '',
  valorHoraContratada: null, porcentajeAdicional: 0, notas: '',
})
const rtForm = ref(rtFormDefault())

// ── Computed ───────────────────────────────────────────────────────
const rosterUserIds = computed(() => new Set(rosterUsers.value.map(u => u.id)))

const extraUsers = computed(() =>
  allUsers.value.filter(u => !rosterUserIds.value.has(u.id))
)

const filteredAllUsers = computed(() => {
  const q = addPersonSearch.value.toLowerCase().trim()
  return allUsers.value.filter(u =>
    !q ||
    u.fullName?.toLowerCase().includes(q) ||
    u.role?.toLowerCase().includes(q)
  )
})

const rtRoster = computed(() => {
  const byUser = new Map(rtRegistros.value.map(r => [r.userId, r]))
  // Start with roster from quotation
  const rows = rosterUsers.value.map(u => ({ user: u, registro: byUser.get(u.id) ?? null }))
  // Add anyone who has a registro but isn't in the quotation members
  for (const r of rtRegistros.value) {
    if (!rosterUserIds.value.has(r.userId) && r.user) {
      rows.push({ user: r.user, registro: r })
    }
  }
  return rows
})

const rtTotalHoras = computed(() =>
  rtRegistros.value.reduce((sum, r) => {
    if (!r.horaIngreso || !r.horaSalida) return sum
    const h = (new Date(r.horaSalida) - new Date(r.horaIngreso)) / 3_600_000
    return sum + (h > 0 ? h : 0)
  }, 0).toFixed(1)
)

// ── Helpers ────────────────────────────────────────────────────────
const initials = (name) =>
  name ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?'

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'

const calcHours = (inIso, outIso) => {
  if (!inIso || !outIso) return '—'
  const h = (new Date(outIso) - new Date(inIso)) / 3_600_000
  return h > 0 ? h.toFixed(1) + 'h' : '—'
}

const calcHoursFromTimes = (inTime, outTime) => {
  if (!inTime || !outTime) return '0'
  const [ih, im] = inTime.split(':').map(Number)
  const [oh, om] = outTime.split(':').map(Number)
  const h = (oh * 60 + om - ih * 60 - im) / 60
  return h > 0 ? h.toFixed(1) : '0'
}

const calcHoursNum = (inIso, outIso) => {
  if (!inIso || !outIso) return 0
  const h = (new Date(outIso) - new Date(inIso)) / 3_600_000
  return h > 0 ? h : 0
}

const formatCurrency = (val) =>
  val != null && !isNaN(val)
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
    : '—'

const calcTotal = (r) => {
  if (!r?.horaIngreso || !r?.horaSalida || !r?.valorHoraContratada) return '—'
  const horas = calcHoursNum(r.horaIngreso, r.horaSalida)
  const extra = 1 + (r.porcentajeAdicional ?? 0) / 100
  return formatCurrency(horas * Number(r.valorHoraContratada) * extra)
}

const calcTotalFromForm = () => {
  if (!rtForm.value.horaIngreso || !rtForm.value.horaSalida || !rtForm.value.valorHoraContratada) return null
  const horas = parseFloat(calcHoursFromTimes(rtForm.value.horaIngreso, rtForm.value.horaSalida))
  const extra = 1 + (rtForm.value.porcentajeAdicional ?? 0) / 100
  return horas * rtForm.value.valorHoraContratada * extra
}

const rtRoleClass = (role) => ({
  LOGISTICA: 'rt-role--blue', OPERATIVO: 'rt-role--green',
  SUPERVISOR: 'rt-role--purple', COORDINADOR: 'rt-role--orange',
})[role] ?? 'rt-role--gray'

const buildDateTime = (dateStr, timeStr) =>
  dateStr && timeStr ? new Date(`${dateStr}T${timeStr}:00`).toISOString() : null

// ── Acciones ───────────────────────────────────────────────────────
const loadRtQuotations = async () => {
  try {
    const res = await getQuotations()
    const all = res.data ?? []
    rtQuotations.value = all.filter(q =>
      ['Aprobada', 'Pendiente'].includes(q.quotationStatus?.name ?? '')
    )
    if (rtQuotations.value.length && !rtQuotationId.value) {
      rtQuotationId.value = rtQuotations.value[rtQuotations.value.length - 1].id
      await loadRegistros()
    }
  } catch (_) {}
}

const loadRegistros = async () => {
  if (!rtQuotationId.value) return
  rtLoading.value = true
  try {
    const res = await getRegistrosByQuotation(rtQuotationId.value)
    rtRegistros.value = res ?? []
    const q = rtQuotations.value.find(q => q.id === rtQuotationId.value)
    const memberUsers = (q?.members ?? []).map(m => m.user ?? m).filter(Boolean)
    const coordUsers  = (q?.coordinadores ?? []).map(c => c.user ?? c).filter(Boolean)
    const seen = new Set()
    rosterUsers.value = [...memberUsers, ...coordUsers].filter(u => {
      if (!u?.id || seen.has(u.id)) return false
      seen.add(u.id); return true
    })
  } catch (_) { rtRegistros.value = [] }
  finally { rtLoading.value = false }
}

const copyTurnoLink = async () => {
  if (!rtQuotationId.value) return
  try {
    const { token } = await getTurnoToken(rtQuotationId.value)
    await navigator.clipboard.writeText(`${window.location.origin}/turno/${token}`)
    rtLinkCopied.value = true
    setTimeout(() => { rtLinkCopied.value = false }, 2500)
  } catch (_) {}
}

// ── Modal turno ────────────────────────────────────────────────────
const openRtModalForUser = (u) => {
  rtEditing.value = null
  rtForm.value = { ...rtFormDefault(), userId: u.id }
  rtModalOpen.value = true
}

const openRtModal = (registro) => {
  rtEditing.value = registro
  const toDate = (iso) => iso ? new Date(iso).toISOString().slice(0, 10) : ''
  const toTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
  rtForm.value = {
    userId:              registro.userId,
    fecha:               toDate(registro.fecha),
    horaIngreso:         toTime(registro.horaIngreso),
    horaSalida:          toTime(registro.horaSalida),
    valorHoraContratada: registro.valorHoraContratada ? Number(registro.valorHoraContratada) : null,
    porcentajeAdicional: registro.porcentajeAdicional ?? 0,
    notas:               registro.notas ?? '',
  }
  rtModalOpen.value = true
}

const closeRtModal = () => {
  rtModalOpen.value = false
  rtEditing.value   = null
}

const saveRegistro = async () => {
  if (!rtForm.value.userId || !rtForm.value.fecha) return
  rtSaving.value = true
  try {
    const payload = {
      quotationId:         rtQuotationId.value,
      userId:              rtForm.value.userId,
      fecha:               new Date(`${rtForm.value.fecha}T00:00:00`).toISOString(),
      horaIngreso:         buildDateTime(rtForm.value.fecha, rtForm.value.horaIngreso),
      horaSalida:          buildDateTime(rtForm.value.fecha, rtForm.value.horaSalida),
      valorHoraContratada: rtForm.value.valorHoraContratada || null,
      porcentajeAdicional: rtForm.value.porcentajeAdicional ?? 0,
      notas:               rtForm.value.notas || null,
    }
    if (rtEditing.value) {
      await updateRegistro(rtEditing.value.id, payload)
    } else {
      await createRegistro(payload)
    }
    closeRtModal()
    await loadRegistros()
  } catch (_) {}
  finally { rtSaving.value = false }
}

const confirmDeleteRegistro = async (r) => {
  if (!confirm(`¿Eliminar el registro de turno de ${r.user?.fullName ?? 'esta persona'}?`)) return
  try {
    await deleteRegistro(r.id)
    rtRegistros.value = rtRegistros.value.filter(x => x.id !== r.id)
  } catch (_) {}
}

// ── Modal agregar persona ──────────────────────────────────────────
const openAddPersonModal = async () => {
  addPersonSearch.value   = ''
  addPersonSelected.value = null
  addPersonOpen.value     = true
  if (!allUsers.value.length) {
    try {
      const res = await getUsers()
      allUsers.value = res.data ?? []
    } catch (_) {}
  }
}

const confirmAddPerson = () => {
  if (!addPersonSelected.value) return
  addPersonOpen.value = false
  openRtModalForUser(addPersonSelected.value)
}

// ── Mount ──────────────────────────────────────────────────────────
onMounted(() => Promise.all([loadRtQuotations()]))
</script>

<style scoped>
.rt-page {
  padding: 20px 24px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rt-page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.rt-page-title  { font-size: 18px; font-weight: 800; color: #0f1a2e; margin: 0 0 4px; }
.rt-page-sub    { font-size: 13px; color: #64748b; margin: 0; }

/* ── Event bar ── */
.rt-event-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.rt-select {
  border: 1px solid #CBD5E1;
  border-radius: 9px;
  padding: 8px 14px;
  font-size: 13px;
  color: #0F1A2E;
  background: white;
  cursor: pointer;
  min-width: 240px;
  font-family: inherit;
}
.rt-event-actions { display: flex; gap: 8px; align-items: center; }

/* ── Buttons ── */
.rt-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.13s;
  font-family: inherit;
  border: 1px solid transparent;
  white-space: nowrap;
}
.rt-btn-primary  { background: #0f1a2e; color: #fff; border-color: #0f1a2e; }
.rt-btn-primary:hover:not(:disabled) { background: #1a2d4a; }
.rt-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.rt-btn-outline  { background: white; color: #6366F1; border-color: #C7D2FE; }
.rt-btn-outline:hover { background: #EEF2FF; }
.rt-btn-copied   { color: #059669; border-color: #A7F3D0; background: #ECFDF5; }
.rt-btn-ghost    { background: transparent; color: #94a3b8; border-color: transparent; }
.rt-btn-ghost:hover { background: #f8fafc; color: #475569; }

/* ── States ── */
.rt-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  font-size: 13px;
  padding: 20px 0;
}
.rt-spinner {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  border-top-color: #0f3460;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.rt-empty {
  text-align: center;
  padding: 50px 20px;
  color: #94a3b8;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.rt-empty-icon { opacity: 0.3; }

/* ── Card / Table ── */
.rt-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #E8EDF5;
  overflow: hidden;
}
.rt-table-wrap { overflow-x: auto; }
.rt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.rt-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #F8FAFC;
  border-bottom: 1px solid #E8EDF5;
  white-space: nowrap;
}
.th-actions { width: 90px; }
.rt-table td {
  padding: 11px 14px;
  border-bottom: 1px solid #F1F5F9;
  color: #1E293B;
  vertical-align: middle;
}
.rt-table tr:last-child td { border-bottom: none; }
.rt-row--pending td { opacity: 0.7; }

.rt-user-cell  { display: flex; align-items: center; gap: 8px; }
.rt-user-name  { font-weight: 500; white-space: nowrap; }
.rt-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: #EFF6FF; color: #2563EB;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.rt-avatar--sm   { width: 26px; height: 26px; font-size: 9px; }
.rt-avatar--active { background: #D1FAE5; color: #065F46; }

.rt-role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.rt-role-badge--sm { padding: 1px 6px; font-size: 10px; }
.rt-role--blue   { background: #DBEAFE; color: #1D4ED8; }
.rt-role--green  { background: #D1FAE5; color: #065F46; }
.rt-role--purple { background: #EDE9FE; color: #6D28D9; }
.rt-role--orange { background: #FEF3C7; color: #92400E; }
.rt-role--gray   { background: #F1F5F9; color: #475569; }

.rt-time  { font-family: monospace; font-size: 12px; color: #334155; white-space: nowrap; }
.rt-hours { font-weight: 700; color: #0F1A2E; white-space: nowrap; }
.rt-total { font-size: 12px; color: #5B21B6; font-weight: 600; white-space: nowrap; }
.rt-notas { color: #64748B; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rt-pending-text { color: #CBD5E1; font-size: 11px; }

.rt-actions-cell { display: flex; align-items: center; gap: 4px; }
.rt-action-btn {
  width: 28px; height: 28px;
  border-radius: 7px;
  border: 1px solid #E2E8F0;
  background: white; color: #64748B;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.13s;
}
.rt-action-btn:hover { background: #F8FAFC; color: #0F1A2E; }
.rt-action-btn--danger:hover { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }
.rt-btn-registrar {
  display: inline-flex; align-items: center; gap: 4px;
  background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE;
  border-radius: 6px; padding: 5px 9px;
  font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.rt-btn-registrar:hover { background: #DBEAFE; }

.rt-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #F1F5F9;
}
.rt-summary-chip {
  display: inline-flex; align-items: center; gap: 4px;
  background: #F8FAFC; border: 1px solid #E2E8F0;
  border-radius: 99px; padding: 3px 10px;
  font-size: 11px; color: #475569; font-weight: 600;
}
.rt-summary-chip--hours { color: #7C3AED; background: #F5F3FF; border-color: #DDD6FE; }

/* ── Modal ── */
.rt-overlay {
  position: fixed; inset: 0;
  background: rgba(15,26,46,0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.rt-modal {
  background: #fff;
  border-radius: 18px;
  width: 100%; max-width: 480px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.24);
  display: flex; flex-direction: column;
}
.rt-modal--narrow { max-width: 400px; }

.rt-modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px 0;
}
.rt-modal-title { font-size: 15px; font-weight: 800; color: #0f1a2e; margin: 0; }
.rt-modal-close {
  background: none; border: none; font-size: 18px; color: #94a3b8;
  cursor: pointer; padding: 0; line-height: 1;
}
.rt-modal-close:hover { color: #0f1a2e; }

.rt-form {
  padding: 16px 24px 24px;
  display: flex; flex-direction: column; gap: 14px;
}
.rt-form-group { display: flex; flex-direction: column; gap: 5px; }
.rt-form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.rt-label { font-size: 12px; font-weight: 600; color: #374151; }
.rt-req   { color: #EF4444; }
.rt-input {
  border: 1px solid #D1D5DB; border-radius: 8px;
  padding: 8px 10px; font-size: 13px; color: #0F1A2E;
  background: white; width: 100%; box-sizing: border-box; font-family: inherit;
}
.rt-input:focus { outline: none; border-color: #6366F1; box-shadow: 0 0 0 3px #EEF2FF; }
.rt-textarea { resize: vertical; min-height: 68px; }
.rt-hours-preview {
  display: inline-flex; align-items: center; gap: 5px;
  background: #F0FDF4; color: #166534;
  font-size: 11px; font-weight: 600;
  padding: 5px 12px; border-radius: 8px;
}
.rt-hours-preview--purple { background: #F5F3FF; color: #5B21B6; }
.rt-form-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }

/* ── Add person modal ── */
.rt-add-desc { font-size: 12px; color: #64748b; margin: 0; line-height: 1.5; }
.rt-user-list {
  display: flex; flex-direction: column; gap: 4px;
  max-height: 260px; overflow-y: auto;
  border: 1px solid #E2E8F0; border-radius: 10px; padding: 6px;
}
.rt-user-option {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px; border: none;
  background: transparent; cursor: pointer; text-align: left;
  transition: background 0.1s; font-family: inherit;
}
.rt-user-option:hover { background: #F8FAFC; }
.rt-user-option--selected { background: #EFF6FF; }
.rt-user-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.rt-user-empty { font-size: 12px; color: #94a3b8; text-align: center; padding: 12px 0; margin: 0; }

/* ── Transition ── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.spin { animation: spin 0.7s linear infinite; }
</style>
