<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="tm-overlay" @click.self="$emit('close')">
        <div class="tm-card">

          <!-- Header -->
          <div class="tm-header">
            <div class="tm-header-icon"><Users :size="18" /></div>
            <div>
              <h3 class="tm-title">Equipo del evento</h3>
              <p class="tm-subtitle">Evento #{{ event?.numero }} — {{ event?.empresa || event?.description }}</p>
            </div>
            <button class="tm-close" @click="$emit('close')"><X :size="18" /></button>
          </div>

          <div class="tm-body">

            <!-- ── Coordinadores ───────────────────────────────── -->
            <section class="tm-section">
              <h4 class="tm-section-title">
                <Star :size="13" />
                Coordinadores
              </h4>

              <!-- Chips asignados -->
              <div class="tm-chips" v-if="assignedCoords.length">
                <div v-for="u in assignedCoords" :key="u.id" class="tm-chip tm-chip--coord">
                  <span class="tm-chip-avatar">{{ initials(u.fullName) }}</span>
                  <span class="tm-chip-name">{{ u.fullName }}</span>
                  <button class="tm-chip-rm" @click="removeCoord(u.id)" title="Quitar">
                    <X :size="10" />
                  </button>
                </div>
              </div>
              <p v-else class="tm-empty-hint">Sin coordinadores asignados</p>

              <!-- Selector coordinadores -->
              <div class="tm-selector">
                <div class="tm-selector-label">Agregar coordinador</div>
                <div class="tm-user-list">
                  <div v-if="loadingUsers" class="tm-loading-row">
                    <Loader2 :size="14" class="spin" /> Cargando…
                  </div>
                  <template v-else>
                    <div
                      v-for="u in availableCoords"
                      :key="u.id"
                      class="tm-user-row"
                      :class="{ 'tm-user-row--assigned': isCoord(u.id) }"
                      @click="toggleCoord(u.id)"
                    >
                      <span class="tm-user-avatar">{{ initials(u.fullName) }}</span>
                      <div class="tm-user-info">
                        <span class="tm-user-name">{{ u.fullName }}</span>
                        <span class="tm-user-role">{{ u.role }}</span>
                      </div>
                      <div class="tm-avail" v-if="availability[u.id]">
                        <span v-if="availability[u.id].available" class="avail-ok">✅ Disponible</span>
                        <span v-else class="avail-busy" :title="conflictTitle(availability[u.id].conflictos)">
                          ⚠️ Ocupado
                        </span>
                      </div>
                      <Loader2 v-else-if="checkingAvail[u.id]" :size="12" class="spin avail-spin" />
                      <Check v-if="isCoord(u.id)" :size="14" class="tm-check-icon" />
                    </div>
                    <div v-if="availableCoords.length === 0" class="tm-empty-hint">Sin usuarios disponibles</div>
                  </template>
                </div>
              </div>
            </section>

            <!-- ── Equipo de apoyo ─────────────────────────────── -->
            <section class="tm-section">
              <h4 class="tm-section-title">
                <Users :size="13" />
                Equipo de apoyo
              </h4>

              <div class="tm-chips" v-if="assignedMembers.length">
                <div v-for="u in assignedMembers" :key="u.id" class="tm-chip tm-chip--member">
                  <span class="tm-chip-avatar">{{ initials(u.fullName) }}</span>
                  <span class="tm-chip-name">{{ u.fullName }}</span>
                  <button class="tm-chip-rm" @click="removeMember(u.id)" title="Quitar">
                    <X :size="10" />
                  </button>
                </div>
              </div>
              <p v-else class="tm-empty-hint">Sin miembros de apoyo asignados</p>

              <div class="tm-selector">
                <div class="tm-selector-label">Agregar miembro de apoyo</div>
                <div class="tm-user-list">
                  <div v-if="loadingUsers" class="tm-loading-row">
                    <Loader2 :size="14" class="spin" /> Cargando…
                  </div>
                  <template v-else>
                    <div
                      v-for="u in availableSupport"
                      :key="u.id"
                      class="tm-user-row"
                      :class="{ 'tm-user-row--assigned': isMember(u.id) }"
                      @click="toggleMember(u.id)"
                    >
                      <span class="tm-user-avatar">{{ initials(u.fullName) }}</span>
                      <div class="tm-user-info">
                        <span class="tm-user-name">{{ u.fullName }}</span>
                        <span class="tm-user-role">{{ u.role }}</span>
                      </div>
                      <div class="tm-avail" v-if="availability[u.id]">
                        <span v-if="availability[u.id].available" class="avail-ok">✅ Disponible</span>
                        <span v-else class="avail-busy" :title="conflictTitle(availability[u.id].conflictos)">
                          ⚠️ Ocupado
                        </span>
                      </div>
                      <Loader2 v-else-if="checkingAvail[u.id]" :size="12" class="spin avail-spin" />
                      <Check v-if="isMember(u.id)" :size="14" class="tm-check-icon" />
                    </div>
                    <div v-if="availableSupport.length === 0" class="tm-empty-hint">Sin usuarios disponibles</div>
                  </template>
                </div>
              </div>
            </section>

          </div>

          <!-- Footer -->
          <div class="tm-footer">
            <Loader2 v-if="saving" :size="14" class="spin" />
            <span v-if="saving" class="tm-saving-text">Guardando…</span>
            <button class="tm-btn-sec" @click="$emit('close')">Cerrar</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X, Users, Star, Check, Loader2 } from 'lucide-vue-next'
import api from '@/services/api'
import { setCoordinadores, addQuotationMember, removeQuotationMember } from '@/services/quotation.service'

const props = defineProps({ show: Boolean, event: Object })
const emit = defineEmits(['close', 'updated'])

// ── State ────────────────────────────────────────────────
const allUsers    = ref([])
const loadingUsers = ref(false)
const saving      = ref(false)
const availability   = ref({})  // { userId: { available, conflictos } }
const checkingAvail  = ref({})  // { userId: true }

// Local copies — mutate optimistically
const coordIds  = ref([])   // array of user IDs
const memberIds = ref([])   // array of user IDs

// ── Computed ─────────────────────────────────────────────
const assignedCoords  = computed(() => allUsers.value.filter(u => coordIds.value.includes(u.id)))
const assignedMembers = computed(() => allUsers.value.filter(u => memberIds.value.includes(u.id)))

const availableCoords  = computed(() =>
  allUsers.value.filter(u => ['COORDINADOR', 'SUPERVISOR', 'ADMIN'].includes(u.role))
)
const availableSupport = computed(() =>
  allUsers.value.filter(u => ['LOGISTICA', 'COORDINADOR', 'SUPERVISOR'].includes(u.role))
)

const isCoord  = (id) => coordIds.value.includes(id)
const isMember = (id) => memberIds.value.includes(id)

// ── Load ─────────────────────────────────────────────────
watch(() => props.show, async (val) => {
  if (!val || !props.event?.id) return

  coordIds.value  = (props.event.coordinadores ?? []).map(c => c.user?.id ?? c.id)
  memberIds.value = (props.event.members ?? []).map(m => m.user?.id ?? m.id)
  availability.value   = {}
  checkingAvail.value  = {}

  loadingUsers.value = true
  try {
    const { data } = await api.get('/users')
    allUsers.value = Array.isArray(data) ? data : (data.data ?? [])
    checkAllAvailability()
  } finally {
    loadingUsers.value = false
  }
}, { immediate: true })

async function checkAllAvailability() {
  const startAt = props.event?.operationWindow?.setupStartAt
  const endAt   = props.event?.operationWindow?.teardownEndAt
  if (!startAt || !endAt) return

  const candidates = [
    ...availableCoords.value.map(u => u.id),
    ...availableSupport.value.map(u => u.id),
  ]
  const unique = [...new Set(candidates)]

  for (const uid of unique) {
    checkingAvail.value = { ...checkingAvail.value, [uid]: true }
    try {
      const { data } = await api.get('/users/availability', {
        params: { userId: uid, startAt, endAt },
      })
      availability.value = { ...availability.value, [uid]: data }
    } catch {
      // silently skip
    } finally {
      const next = { ...checkingAvail.value }
      delete next[uid]
      checkingAvail.value = next
    }
  }
}

// ── Actions ───────────────────────────────────────────────
async function toggleCoord(userId) {
  const next = isCoord(userId)
    ? coordIds.value.filter(id => id !== userId)
    : [...coordIds.value, userId]
  coordIds.value = next
  saving.value = true
  try {
    await setCoordinadores(props.event.id, next)
    emit('updated', { type: 'coordinadores', ids: next })
  } finally {
    saving.value = false
  }
}

async function removeCoord(userId) {
  await toggleCoord(userId)
}

async function toggleMember(userId) {
  if (isMember(userId)) {
    memberIds.value = memberIds.value.filter(id => id !== userId)
    saving.value = true
    try {
      await removeQuotationMember(props.event.id, userId)
      emit('updated', { type: 'members', ids: memberIds.value })
    } finally {
      saving.value = false
    }
  } else {
    memberIds.value = [...memberIds.value, userId]
    saving.value = true
    try {
      await addQuotationMember(props.event.id, userId)
      emit('updated', { type: 'members', ids: memberIds.value })
    } finally {
      saving.value = false
    }
  }
}

async function removeMember(userId) {
  await toggleMember(userId)
}

// ── Helpers ───────────────────────────────────────────────
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

const conflictTitle = (conflictos) =>
  conflictos.map(c => `#${c.numero} ${c.empresa ?? ''}`).join(', ')
</script>

<style scoped>
.tm-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 26, 46, 0.45);
  backdrop-filter: blur(6px);
  z-index: 1100;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.tm-card {
  background: #fff;
  border-radius: 20px;
  width: 100%; max-width: 560px;
  max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(15,26,46,.22);
  overflow: hidden;
}

/* Header */
.tm-header {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}
.tm-header-icon {
  width: 36px; height: 36px;
  background: #EBF3FC; color: #054EAF;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tm-title { font-family: 'Plus Jakarta Sans',sans-serif; font-size: 15px; font-weight: 700; color: #0F1A2E; margin: 0; }
.tm-subtitle { font-size: 11px; color: #94A3B8; margin: 2px 0 0; }
.tm-close {
  margin-left: auto; background: none; border: none; color: #94A3B8;
  cursor: pointer; padding: 6px; border-radius: 50%; transition: all .2s;
}
.tm-close:hover { background: #F1F5F9; color: #0F1A2E; }

/* Body */
.tm-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 24px; }

/* Section */
.tm-section { display: flex; flex-direction: column; gap: 12px; }
.tm-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .08em; color: #94A3B8; margin: 0;
}

/* Chips */
.tm-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tm-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px 4px 6px;
  border-radius: 20px; font-size: 12px; font-weight: 600;
}
.tm-chip--coord  { background: #EBF3FC; color: #054EAF; }
.tm-chip--member { background: #F0FDF4; color: #16A34A; }
.tm-chip-avatar {
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(255,255,255,.6);
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 800;
}
.tm-chip-name { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tm-chip-rm {
  background: none; border: none; cursor: pointer;
  color: inherit; opacity: .6; padding: 2px;
  border-radius: 50%; display: flex; transition: opacity .15s;
}
.tm-chip-rm:hover { opacity: 1; }

/* Selector */
.tm-selector { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
.tm-selector-label { padding: 8px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94A3B8; border-bottom: 1px solid #F1F5F9; }
.tm-user-list { max-height: 200px; overflow-y: auto; scrollbar-width: thin; }
.tm-user-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; cursor: pointer; transition: background .15s;
  border-bottom: 1px solid #F8FAFC;
}
.tm-user-row:last-child { border-bottom: none; }
.tm-user-row:hover { background: #F0F7FF; }
.tm-user-row--assigned { background: #EBF3FC; }
.tm-user-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: #E2E8F0; color: #475569;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; flex-shrink: 0;
}
.tm-user-row--assigned .tm-user-avatar { background: #054EAF; color: #fff; }
.tm-user-info { flex: 1; min-width: 0; }
.tm-user-name { display: block; font-size: 12px; font-weight: 600; color: #0F1A2E; }
.tm-user-role { display: block; font-size: 10px; color: #94A3B8; }
.tm-check-icon { color: #054EAF; flex-shrink: 0; }
.tm-loading-row { display: flex; align-items: center; gap: 8px; padding: 12px; font-size: 12px; color: #94A3B8; }

/* Availability */
.tm-avail { font-size: 10px; font-weight: 600; flex-shrink: 0; }
.avail-ok   { color: #16A34A; }
.avail-busy { color: #D97706; cursor: help; }
.avail-spin { color: #94A3B8; }

/* Empty hint */
.tm-empty-hint { font-size: 12px; color: #94A3B8; padding: 4px 0; }

/* Footer */
.tm-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 20px; border-top: 1px solid #F1F5F9; flex-shrink: 0;
}
.tm-saving-text { font-size: 12px; color: #94A3B8; flex: 1; }
.tm-btn-sec {
  padding: 8px 20px; background: #F1F5F9; color: #475569;
  border-radius: 10px; font-size: 13px; font-weight: 600;
  border: none; cursor: pointer; transition: background .2s;
}
.tm-btn-sec:hover { background: #E2E8F0; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity .25s ease, transform .25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(.96); }

/* Spin */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .8s linear infinite; }
</style>
