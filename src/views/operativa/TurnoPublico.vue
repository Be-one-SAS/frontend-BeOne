<template>
  <div class="tp-root">

    <!-- Header -->
    <div class="tp-header">
      <div class="tp-brand">BeOne</div>
      <div v-if="data" class="tp-event-info">
        <span class="tp-event-num">#{{ data.numero }}</span>
        <span class="tp-event-name">{{ data.cliente?.name ?? data.empresa ?? '—' }}</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="tp-loading">
      <div class="tp-spinner" />
      <p>Cargando…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="tp-error">
      <p class="tp-error-icon">⚠️</p>
      <p class="tp-error-title">Link no válido</p>
      <p class="tp-error-sub">{{ error }}</p>
    </div>

    <!-- Contenido -->
    <template v-else-if="data">
      <div class="tp-title-row">
        <h1 class="tp-title">Registro de Turno</h1>
        <p class="tp-sub">Registra tu ingreso y salida del evento</p>
      </div>

      <!-- Roster -->
      <div class="tp-roster">
        <div
          v-for="row in roster"
          :key="row.isExternal ? `ext-${row.registro.id}` : row.user.id"
          class="tp-card"
          :class="{
            'tp-card--in':   row.registro?.horaIngreso && !row.registro?.horaSalida,
            'tp-card--done': row.registro?.horaIngreso && row.registro?.horaSalida,
          }"
        >
          <!-- Avatar + nombre -->
          <div class="tp-card-person">
            <div class="tp-avatar">{{ initials(row.isExternal ? row.registro.nombreExterno : row.user.fullName) }}</div>
            <div>
              <div class="tp-person-name">{{ row.isExternal ? row.registro.nombreExterno : row.user.fullName }}</div>
              <div class="tp-person-role">{{ row.isExternal ? (row.registro.telefonoExterno ?? 'Externo') : row.user.role }}</div>
            </div>
            <div class="tp-status-chip" :class="statusChipClass(row)">{{ statusLabel(row) }}</div>
          </div>

          <!-- Tiempos -->
          <div class="tp-times">
            <div class="tp-time-block">
              <span class="tp-time-label">Ingreso</span>
              <span class="tp-time-value" :class="{ 'tp-time--pending': !row.registro?.horaIngreso }">
                {{ row.registro?.horaIngreso ? formatTime(row.registro.horaIngreso) : '—' }}
              </span>
              <span v-if="row.registro?.horaIngresoOriginal && row.registro?.horaIngreso !== row.registro?.horaIngresoOriginal" class="tp-time-original">
                orig. {{ formatTime(row.registro.horaIngresoOriginal) }}
              </span>
            </div>
            <div class="tp-time-sep">→</div>
            <div class="tp-time-block">
              <span class="tp-time-label">Salida</span>
              <span class="tp-time-value" :class="{ 'tp-time--pending': !row.registro?.horaSalida }">
                {{ row.registro?.horaSalida ? formatTime(row.registro.horaSalida) : '—' }}
              </span>
              <span v-if="row.registro?.horaSalidaOriginal && row.registro?.horaSalida !== row.registro?.horaSalidaOriginal" class="tp-time-original">
                orig. {{ formatTime(row.registro.horaSalidaOriginal) }}
              </span>
            </div>
            <div v-if="row.registro?.horaIngreso && row.registro?.horaSalida" class="tp-time-block tp-time-block--hours">
              <span class="tp-time-label">Horas</span>
              <span class="tp-time-value tp-time--hours">{{ calcHours(row.registro.horaIngreso, row.registro.horaSalida) }}</span>
            </div>
          </div>

          <!-- Notas -->
          <div v-if="row.registro?.notas" class="tp-notas">{{ row.registro.notas }}</div>

          <!-- Cumplido -->
          <label
            class="tp-cumplido"
            :class="{ 'tp-cumplido--disabled': !puedeMarcarCumplido(row) }"
            :title="puedeMarcarCumplido(row) ? '' : 'Requiere ingreso y salida registrados'"
          >
            <input
              type="checkbox"
              :checked="!!row.registro?.cumplido"
              :disabled="!puedeMarcarCumplido(row) || savingCumplidoId === row.registro?.id"
              @change="toggleCumplido(row, $event.target.checked)"
            />
            Turno cumplido
          </label>

          <!-- Botones de acción -->
          <div class="tp-actions">
            <button
              class="tp-btn tp-btn--ingreso"
              :class="{ 'tp-btn--done': !!row.registro?.horaIngreso }"
              @click="openModal(row, 'ingreso')"
            >
              <span class="tp-btn-icon">↓</span>
              {{ row.registro?.horaIngreso ? 'Editar ingreso' : 'Registrar ingreso' }}
            </button>
            <button
              class="tp-btn tp-btn--salida"
              :class="{ 'tp-btn--done': !!row.registro?.horaSalida }"
              @click="openModal(row, 'salida')"
            >
              <span class="tp-btn-icon">↑</span>
              {{ row.registro?.horaSalida ? 'Editar salida' : 'Registrar salida' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal hora -->
    <Transition name="tp-modal-fade">
      <div v-if="modal" class="tp-modal-overlay" @click.self="modal = null">
        <div class="tp-modal">
          <div class="tp-modal-header">
            <div>
              <div class="tp-modal-title">
                {{ modal.tipo === 'ingreso' ? 'Ingreso' : 'Salida' }} — {{ modalPersonName }}
              </div>
              <div v-if="originalForModal" class="tp-modal-original">
                Hora configurada: {{ originalForModal }}
              </div>
            </div>
            <button class="tp-modal-close" @click="modal = null">✕</button>
          </div>

          <div class="tp-modal-body">
            <label class="tp-modal-label">
              {{ modal.tipo === 'ingreso' ? 'Hora de ingreso' : 'Hora de salida' }}
            </label>
            <input v-model="modalTime" type="time" class="tp-modal-input" />
          </div>

          <div class="tp-modal-footer">
            <button class="tp-modal-btn tp-modal-btn--ghost" @click="modal = null">Cancelar</button>
            <button
              class="tp-modal-btn"
              :class="modal.tipo === 'ingreso' ? 'tp-modal-btn--ingreso' : 'tp-modal-btn--salida'"
              :disabled="!modalTime || saving"
              @click="confirmarRegistro"
            >
              <span v-if="saving" class="tp-modal-spinner" />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTurnoPublico, registrarTurnoPublico, registrarTurnoExternoPublico, marcarCumplidoTurnoPublico } from '@/services/registros-turno.service'

const RT_OP_ROLES = ['LOGISTICO', 'OPERATIVO']

const route   = useRoute()
const token   = route.params.token
const loading = ref(true)
const error   = ref(null)
const data    = ref(null)
const saving  = ref(false)

const modal     = ref(null)  // { row, tipo: 'ingreso'|'salida' }
const modalTime = ref('')
const savingCumplidoId = ref(null)

const roster = computed(() => {
  if (!data.value) return []
  const registroByUser = new Map(
    (data.value.registrosTurno ?? []).filter(r => r.userId).map(r => [r.userId, r])
  )
  const seen = new Set()
  const rows = []

  // Miembros de la cotización con rol operativo
  for (const m of (data.value.members ?? [])) {
    const u = m.user ?? m
    if (!u?.id || !RT_OP_ROLES.includes(u.role) || seen.has(u.id)) continue
    seen.add(u.id)
    rows.push({ user: u, registro: registroByUser.get(u.id) ?? null, isExternal: false })
  }

  // Usuarios del sistema con registro pero no en members
  for (const r of (data.value.registrosTurno ?? [])) {
    if (r.userId && !seen.has(r.userId) && r.user) {
      seen.add(r.userId)
      rows.push({ user: r.user, registro: r, isExternal: false })
    }
  }

  // Personas externas
  for (const r of (data.value.registrosTurno ?? [])) {
    if (!r.userId && r.nombreExterno) {
      rows.push({ user: null, registro: r, isExternal: true })
    }
  }

  return rows
})

const modalPersonName = computed(() => {
  if (!modal.value) return ''
  const row = modal.value.row
  return row.isExternal ? row.registro.nombreExterno : row.user.fullName
})

const originalForModal = computed(() => {
  const registro = modal.value?.row?.registro
  if (!registro) return null
  const iso = modal.value.tipo === 'ingreso'
    ? registro.horaIngresoOriginal
    : registro.horaSalidaOriginal
  return iso ? formatTime(iso) : null
})

onMounted(async () => {
  try {
    data.value = await getTurnoPublico(token)
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar el turno'
  } finally {
    loading.value = false
  }
})

const initials = (name) => {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const formatTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const calcHours = (inIso, outIso) => {
  if (!inIso || !outIso) return '—'
  const h = (new Date(outIso) - new Date(inIso)) / 3600000
  return h > 0 ? h.toFixed(1) + 'h' : '—'
}

const statusLabel = (row) => {
  if (!row.registro?.horaIngreso) return 'Sin iniciar'
  if (!row.registro?.horaSalida)  return 'En turno'
  return 'Completado'
}

const statusChipClass = (row) => {
  if (!row.registro?.horaIngreso) return 'tp-chip--gray'
  if (!row.registro?.horaSalida)  return 'tp-chip--green'
  return 'tp-chip--blue'
}

const puedeMarcarCumplido = (row) => !!(row.registro?.horaIngreso && row.registro?.horaSalida)

const toggleCumplido = async (row, checked) => {
  const registroId = row.registro?.id
  if (!registroId) return
  savingCumplidoId.value = registroId
  try {
    const updated = await marcarCumplidoTurnoPublico(token, registroId, checked)
    const registros = data.value.registrosTurno ?? []
    const idx = registros.findIndex(r => r.id === registroId)
    if (idx >= 0) data.value.registrosTurno[idx] = { ...registros[idx], ...updated }
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Error al actualizar el turno')
  } finally {
    savingCumplidoId.value = null
  }
}

const openModal = (row, tipo) => {
  const registro = row.registro
  const currentIso = tipo === 'ingreso' ? registro?.horaIngreso : registro?.horaSalida
  if (currentIso) {
    const d = new Date(currentIso)
    modalTime.value = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  } else {
    const now = new Date()
    modalTime.value = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
  modal.value = { row, tipo }
}

const confirmarRegistro = async () => {
  if (!modalTime.value || !modal.value) return
  saving.value = true
  try {
    const [h, m] = modalTime.value.split(':').map(Number)
    const now = new Date()
    now.setHours(h, m, 0, 0)

    const { row, tipo } = modal.value
    let updated

    if (row.isExternal) {
      updated = await registrarTurnoExternoPublico(token, {
        registroId: row.registro.id,
        tipo,
        hora: now.toISOString(),
      })
      // Update local state for external
      const registros = data.value.registrosTurno ?? []
      const idx = registros.findIndex(r => r.id === row.registro.id)
      if (idx >= 0) data.value.registrosTurno[idx] = { ...registros[idx], ...updated }
    } else {
      updated = await registrarTurnoPublico(token, {
        userId: row.user.id,
        tipo,
        hora:   now.toISOString(),
      })
      // Update local state for system user
      const registros = data.value.registrosTurno ?? []
      const idx = registros.findIndex(r => r.userId === row.user.id)
      if (idx >= 0) {
        data.value.registrosTurno[idx] = updated
      } else {
        data.value.registrosTurno = [...registros, updated]
      }
    }

    modal.value = null
  } catch (e) {
    alert(e?.response?.data?.message ?? 'Error al registrar')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.tp-root {
  min-height: 100vh;
  background: #F8FAFC;
  font-family: system-ui, -apple-system, sans-serif;
}

.tp-header {
  background: #0F1A2E;
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tp-brand { font-size: 18px; font-weight: 800; letter-spacing: -.5px; }
.tp-event-info { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.tp-event-num { background: rgba(255,255,255,.15); padding: 3px 8px; border-radius: 6px; font-weight: 700; }
.tp-event-name { opacity: .8; }

.tp-loading {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 80px 0; color: #64748B;
}
.tp-spinner {
  width: 28px; height: 28px; border: 3px solid #E2E8F0;
  border-top-color: #6366F1; border-radius: 50%;
  animation: tp-spin .8s linear infinite;
}
@keyframes tp-spin { to { transform: rotate(360deg); } }

.tp-error {
  text-align: center; padding: 80px 20px;
}
.tp-error-icon { font-size: 40px; margin-bottom: 12px; }
.tp-error-title { font-size: 18px; font-weight: 700; color: #0F1A2E; margin-bottom: 6px; }
.tp-error-sub { color: #64748B; font-size: 14px; }

.tp-title-row { text-align: center; padding: 28px 20px 16px; }
.tp-title { font-size: 22px; font-weight: 800; color: #0F1A2E; margin: 0 0 4px; }
.tp-sub { color: #64748B; font-size: 14px; margin: 0; }

.tp-roster {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px 32px;
  max-width: 640px;
  margin: 0 auto;
}

.tp-card {
  background: white;
  border-radius: 14px;
  border: 2px solid #E8EDF5;
  padding: 18px;
  transition: border-color .2s;
}
.tp-card--in   { border-color: #BBF7D0; }
.tp-card--done { border-color: #A7EEF5; }

.tp-card-person {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.tp-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: #E0F9FA; color: #27C8D8;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.tp-person-name { font-size: 15px; font-weight: 700; color: #0F1A2E; }
.tp-person-role { font-size: 11px; color: #64748B; margin-top: 1px; }
.tp-status-chip {
  margin-left: auto;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
}
.tp-chip--gray  { background: #F1F5F9; color: #64748B; }
.tp-chip--green { background: #D1FAE5; color: #065F46; }
.tp-chip--blue  { background: #CCEFF2; color: #27C8D8; }

.tp-times {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  background: #F8FAFC;
  border-radius: 10px;
  padding: 12px 14px;
}
.tp-time-block { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.tp-time-block--hours { margin-left: auto; }
.tp-time-sep { color: #CBD5E1; font-size: 18px; }
.tp-time-label { font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: .05em; }
.tp-time-value { font-size: 20px; font-weight: 800; color: #0F1A2E; font-variant-numeric: tabular-nums; }
.tp-time--pending { color: #CBD5E1; font-size: 16px; }
.tp-time--hours { color: #6366F1; font-size: 16px; }
.tp-time-original { font-size: 10px; color: #F59E0B; font-style: italic; }

.tp-notas {
  font-size: 12px; color: #64748B;
  background: #FFFBEB; border-radius: 8px; padding: 8px 12px;
  margin-bottom: 14px; border-left: 3px solid #FCD34D;
}

.tp-cumplido {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #166534;
  margin-bottom: 14px;
  cursor: pointer;
  user-select: none;
}
.tp-cumplido input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #16A34A;
  cursor: pointer;
}
.tp-cumplido--disabled {
  color: #94A3B8;
  cursor: not-allowed;
}
.tp-cumplido--disabled input[type="checkbox"] { cursor: not-allowed; }

.tp-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.tp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 12px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
  letter-spacing: -.01em;
}
.tp-btn-icon { font-size: 16px; font-weight: 900; }
.tp-btn--ingreso { background: #DCFCE7; color: #166534; }
.tp-btn--ingreso:hover { background: #BBF7D0; }
.tp-btn--ingreso.tp-btn--done { background: #D1FAE5; color: #065F46; }
.tp-btn--salida { background: #FEE2E2; color: #991B1B; }
.tp-btn--salida:hover { background: #FECACA; }
.tp-btn--salida.tp-btn--done { background: #FEE2E2; color: #991B1B; }

/* Modal */
.tp-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  display: flex; align-items: flex-end; justify-content: center;
  z-index: 1000;
  padding: 0;
}
@media (min-width: 480px) {
  .tp-modal-overlay { align-items: center; }
}
.tp-modal {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}
@media (min-width: 480px) {
  .tp-modal { border-radius: 16px; }
}
.tp-modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 20px 12px;
  border-bottom: 1px solid #F1F5F9;
}
.tp-modal-title { font-size: 17px; font-weight: 700; color: #0F1A2E; }
.tp-modal-original { font-size: 11px; color: #F59E0B; margin-top: 2px; }
.tp-modal-close {
  background: #F1F5F9; border: none; border-radius: 50%;
  width: 28px; height: 28px; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.tp-modal-body { padding: 20px; }
.tp-modal-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
.tp-modal-input {
  width: 100%; border: 2px solid #E2E8F0; border-radius: 10px;
  padding: 12px 14px; font-size: 22px; font-weight: 700;
  color: #0F1A2E; text-align: center; box-sizing: border-box;
}
.tp-modal-input:focus { outline: none; border-color: #6366F1; }
.tp-modal-footer {
  display: grid; grid-template-columns: 1fr 2fr; gap: 10px;
  padding: 0 20px 20px;
}
.tp-modal-btn {
  padding: 14px; border-radius: 12px; border: none;
  font-size: 15px; font-weight: 700; cursor: pointer;
  transition: all .15s;
}
.tp-modal-btn:disabled { opacity: .5; cursor: not-allowed; }
.tp-modal-btn--ghost { background: #F1F5F9; color: #64748B; }
.tp-modal-btn--ingreso { background: #16A34A; color: white; }
.tp-modal-btn--ingreso:hover:not(:disabled) { background: #15803D; }
.tp-modal-btn--salida { background: #DC2626; color: white; }
.tp-modal-btn--salida:hover:not(:disabled) { background: #B91C1C; }
.tp-modal-spinner {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.4); border-top-color: white;
  border-radius: 50%; animation: tp-spin .8s linear infinite;
}

/* Transitions */
.tp-modal-fade-enter-active, .tp-modal-fade-leave-active { transition: opacity .2s; }
.tp-modal-fade-enter-from, .tp-modal-fade-leave-to { opacity: 0; }
</style>
