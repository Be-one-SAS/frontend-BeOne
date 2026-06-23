<template>
  <Teleport to="body">
    <Transition name="tm-fade">
      <div v-if="show" class="tm-overlay" @click.self="$emit('close')">
        <div class="tm-card">

          <!-- Header -->
          <div class="tm-header">
            <div class="tm-header-icon">
              <Users :size="16" />
            </div>
            <div class="tm-header-text">
              <p class="tm-title">Equipo del evento</p>
              <p class="tm-subtitle">Evento #{{ event?.numero }} — {{ event?.empresa || event?.description }}</p>
            </div>
            <button class="tm-close" @click="$emit('close')" aria-label="Cerrar">
              <X :size="16" />
            </button>
          </div>

          <!-- Tabs -->
          <div class="tm-tabs">
            <button
              v-for="tab in TABS" :key="tab.key"
              class="tm-tab" :class="{ 'tm-tab--active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <component :is="tab.icon" :size="13" />
              {{ tab.label }}
              <span v-if="tab.count() > 0" class="tm-tab-badge">{{ tab.count() }}</span>
            </button>
          </div>

          <!-- Body -->
          <div class="tm-body">

            <!-- ── Tab: Responsables ─────────────────────────── -->
            <div v-if="activeTab === 'responsables'" class="tm-pane">
              <div
                v-for="area in AREAS" :key="area.key"
                class="tm-resp-row"
                :class="{ 'tm-resp-row--open': openArea === area.key }"
              >
                <!-- Fila principal -->
                <div class="tm-resp-main">
                  <div v-if="respIds[area.key]" class="tm-resp-avatar" :style="{ background: area.avatarBg, color: area.avatarColor }">
                    {{ initials(getUserName(respIds[area.key])) }}
                  </div>
                  <div v-else class="tm-resp-avatar tm-resp-avatar--empty">
                    <UserPlus :size="12" />
                  </div>
                  <div class="tm-resp-info">
                    <p class="tm-resp-name">{{ respIds[area.key] ? getUserName(respIds[area.key]) : 'Sin asignar' }}</p>
                    <p class="tm-resp-label">{{ area.label }}</p>
                  </div>
                  <span v-if="respIds[area.key] && availability[respIds[area.key]]" class="tm-avail-dot" :class="availability[respIds[area.key]].available ? 'avail-ok' : 'avail-busy'">
                    {{ availability[respIds[area.key]].available ? '● Disponible' : '⚠ Ocupado' }}
                  </span>
                  <button
                    class="tm-resp-btn"
                    :class="{ 'tm-resp-btn--active': openArea === area.key }"
                    @click="toggleArea(area.key)"
                  >
                    {{ openArea === area.key ? 'Cerrar' : (respIds[area.key] ? 'Cambiar' : 'Asignar') }}
                    <ChevronDown :size="11" :class="{ 'rotate-180': openArea === area.key }" />
                  </button>
                </div>

                <!-- Dropdown inline -->
                <Transition name="slide">
                  <div v-if="openArea === area.key" class="tm-resp-dropdown">
                    <div class="tm-search-wrap">
                      <Search :size="12" class="tm-search-icon" />
                      <input
                        v-model="areaSearch"
                        class="tm-search-input"
                        placeholder="Buscar..."
                        @input="areaSearch = $event.target.value"
                        ref="searchRef"
                      />
                    </div>
                    <div class="tm-dropdown-list">
                      <div v-if="loadingUsers" class="tm-loading-row">
                        <Loader2 :size="13" class="spin" /> Cargando…
                      </div>
                      <template v-else>
                        <div
                          v-if="respIds[area.key]"
                          class="tm-dropdown-item tm-dropdown-item--clear"
                          @click="setResp(area.key, null)"
                        >
                          <X :size="12" />
                          Quitar asignación
                        </div>
                        <div
                          v-for="u in filteredAreaUsers(area)"
                          :key="u.id"
                          class="tm-dropdown-item"
                          :class="{ 'tm-dropdown-item--selected': respIds[area.key] === u.id }"
                          @click="setResp(area.key, u.id)"
                        >
                          <div class="tm-drop-avatar" :style="{ background: area.avatarBg, color: area.avatarColor }">
                            {{ initials(u.fullName) }}
                          </div>
                          <div class="tm-drop-info">
                            <span class="tm-drop-name">{{ u.fullName }}</span>
                            <span class="tm-drop-role">{{ u.role }}</span>
                          </div>
                          <span v-if="availability[u.id]" class="tm-avail-dot" :class="availability[u.id].available ? 'avail-ok' : 'avail-busy'">
                            {{ availability[u.id].available ? '● Libre' : '⚠ Ocupado' }}
                          </span>
                          <Check v-if="respIds[area.key] === u.id" :size="13" class="tm-drop-check" />
                        </div>
                        <div v-if="filteredAreaUsers(area).length === 0" class="tm-empty">Sin resultados</div>
                      </template>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- ── Tab: Coordinadores ─────────────────────────── -->
            <div v-if="activeTab === 'coordinadores'" class="tm-pane">
              <div v-if="assignedCoords.length" class="tm-chips">
                <div v-for="u in assignedCoords" :key="u.id" class="tm-chip tm-chip--coord">
                  <span class="tm-chip-av">{{ initials(u.fullName) }}</span>
                  <span class="tm-chip-name">{{ u.fullName }}</span>
                  <span v-if="availability[u.id]" class="tm-chip-avail" :class="availability[u.id].available ? 'avail-ok' : 'avail-busy'">
                    {{ availability[u.id].available ? '●' : '⚠' }}
                  </span>
                  <button class="tm-chip-rm" @click="toggleCoord(u.id)"><X :size="9" /></button>
                </div>
              </div>
              <p v-else class="tm-empty">Sin coordinadores asignados</p>

              <div class="tm-selector">
                <div class="tm-search-wrap tm-search-wrap--flat">
                  <Search :size="12" class="tm-search-icon" />
                  <input v-model="coordSearch" class="tm-search-input" placeholder="Agregar coordinador..." />
                </div>
                <div class="tm-dropdown-list tm-dropdown-list--flat">
                  <div v-if="loadingUsers" class="tm-loading-row"><Loader2 :size="13" class="spin" /> Cargando…</div>
                  <template v-else>
                    <div
                      v-for="u in filteredCoords"
                      :key="u.id"
                      class="tm-dropdown-item"
                      :class="{ 'tm-dropdown-item--selected': isCoord(u.id) }"
                      @click="toggleCoord(u.id)"
                    >
                      <div class="tm-drop-avatar tm-drop-avatar--blue">{{ initials(u.fullName) }}</div>
                      <div class="tm-drop-info">
                        <span class="tm-drop-name">{{ u.fullName }}</span>
                        <span class="tm-drop-role">{{ u.role }}</span>
                      </div>
                      <span v-if="availability[u.id]" class="tm-avail-dot" :class="availability[u.id].available ? 'avail-ok' : 'avail-busy'">
                        {{ availability[u.id].available ? '● Libre' : '⚠ Ocupado' }}
                      </span>
                      <Check v-if="isCoord(u.id)" :size="13" class="tm-drop-check" />
                    </div>
                    <div v-if="filteredCoords.length === 0" class="tm-empty">Sin resultados</div>
                  </template>
                </div>
              </div>
            </div>

            <!-- ── Tab: Equipo logístico ──────────────────────── -->
            <div v-if="activeTab === 'equipo'" class="tm-pane">
              <div v-if="assignedMembers.length" class="tm-chips">
                <div v-for="u in assignedMembers" :key="u.id" class="tm-chip tm-chip--member">
                  <span class="tm-chip-av">{{ initials(u.fullName) }}</span>
                  <span class="tm-chip-name">{{ u.fullName }}</span>
                  <span v-if="availability[u.id]" class="tm-chip-avail" :class="availability[u.id].available ? 'avail-ok' : 'avail-busy'">
                    {{ availability[u.id].available ? '●' : '⚠' }}
                  </span>
                  <button class="tm-chip-rm" @click="toggleMember(u.id)"><X :size="9" /></button>
                </div>
              </div>
              <p v-else class="tm-empty">Sin equipo asignado</p>

              <div class="tm-selector">
                <div class="tm-search-wrap tm-search-wrap--flat">
                  <Search :size="12" class="tm-search-icon" />
                  <input v-model="memberSearch" class="tm-search-input" placeholder="Agregar miembro..." />
                </div>
                <div class="tm-dropdown-list tm-dropdown-list--flat">
                  <div v-if="loadingUsers" class="tm-loading-row"><Loader2 :size="13" class="spin" /> Cargando…</div>
                  <template v-else>
                    <div
                      v-for="u in filteredMembers"
                      :key="u.id"
                      class="tm-dropdown-item"
                      :class="{ 'tm-dropdown-item--selected': isMember(u.id) }"
                      @click="toggleMember(u.id)"
                    >
                      <div class="tm-drop-avatar tm-drop-avatar--green">{{ initials(u.fullName) }}</div>
                      <div class="tm-drop-info">
                        <span class="tm-drop-name">{{ u.fullName }}</span>
                        <span class="tm-drop-role">{{ u.role }}</span>
                      </div>
                      <span v-if="availability[u.id]" class="tm-avail-dot" :class="availability[u.id].available ? 'avail-ok' : 'avail-busy'">
                        {{ availability[u.id].available ? '● Libre' : '⚠ Ocupado' }}
                      </span>
                      <Check v-if="isMember(u.id)" :size="13" class="tm-drop-check" />
                    </div>
                    <div v-if="filteredMembers.length === 0" class="tm-empty">Sin resultados</div>
                  </template>
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="tm-footer">
            <div class="tm-footer-status">
              <Loader2 v-if="saving" :size="13" class="spin" />
              <span v-if="saving" class="tm-status-text">Guardando…</span>
              <span v-else-if="saveOk" class="tm-status-ok"><Check :size="12" /> Guardado</span>
              <span v-else-if="saveError" class="tm-status-err">Error al guardar</span>
            </div>
            <button class="tm-btn-close" @click="$emit('close')">Cerrar</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { X, Users, Star, Check, Loader2, UserPlus, Search, ChevronDown, UserCheck, Truck } from 'lucide-vue-next'
import api from '@/services/api'
import { setCoordinadores, addQuotationMember, removeQuotationMember } from '@/services/quotation.service'
import { updateResponsables } from '@/services/administracion.service'

const props = defineProps({ show: Boolean, event: Object })
const emit  = defineEmits(['close', 'updated'])

// ── Config ────────────────────────────────────────────────
const AREAS = [
  { key: 'comercial',      label: 'Comercial',      roles: ['ADMIN', 'ADMINISTRADOR', 'LIDER', 'DIRECCION'], avatarBg: '#FEF3C7', avatarColor: '#B45309' },
  { key: 'administrativo', label: 'Administrativo',  roles: ['ADMIN', 'ADMINISTRADOR'],                       avatarBg: '#DBEAFE', avatarColor: '#1D4ED8' },
  { key: 'operativo',      label: 'Operativo',       roles: ['ADMIN', 'ADMINISTRADOR', 'OPERATIVO', 'LOGISTICO', 'SUPERVISOR', 'COORDINADOR'], avatarBg: '#D1FAE5', avatarColor: '#065F46' },
]

const TABS = [
  { key: 'responsables',  label: 'Responsables',  icon: UserCheck, count: () => Object.values(respIds.value).filter(Boolean).length },
  { key: 'coordinadores', label: 'Coordinadores', icon: Star,      count: () => coordIds.value.length },
  { key: 'equipo',        label: 'Equipo',         icon: Truck,     count: () => memberIds.value.length },
]

// ── State ─────────────────────────────────────────────────
const activeTab    = ref('responsables')
const allUsers     = ref([])
const loadingUsers = ref(false)
const saving       = ref(false)
const saveOk       = ref(false)
const saveError    = ref(false)
const availability = ref({})
const checkingAvail= ref({})

const openArea   = ref(null)
const areaSearch = ref('')
const coordSearch  = ref('')
const memberSearch = ref('')
const searchRef  = ref(null)

const respIds  = ref({ comercial: null, administrativo: null, operativo: null })
const coordIds  = ref([])
const memberIds = ref([])

// ── Computed ──────────────────────────────────────────────
const assignedCoords  = computed(() => allUsers.value.filter(u => coordIds.value.includes(u.id)))
const assignedMembers = computed(() => allUsers.value.filter(u => memberIds.value.includes(u.id)))

const filteredCoords = computed(() => {
  const roles = ['COORDINADOR', 'SUPERVISOR', 'ADMIN', 'ADMINISTRADOR', 'LOGISTICO', 'OPERATIVO']
  const q = coordSearch.value.toLowerCase()
  return allUsers.value.filter(u => roles.includes(u.role) && (!q || u.fullName.toLowerCase().includes(q)))
})

const filteredMembers = computed(() => {
  const roles = ['LOGISTICO', 'OPERATIVO', 'COORDINADOR', 'SUPERVISOR', 'ADMINISTRADOR', 'ADMIN']
  const q = memberSearch.value.toLowerCase()
  return allUsers.value.filter(u => roles.includes(u.role) && (!q || u.fullName.toLowerCase().includes(q)))
})

const filteredAreaUsers = (area) => {
  const q = areaSearch.value.toLowerCase()
  return allUsers.value.filter(u => area.roles.includes(u.role) && (!q || u.fullName.toLowerCase().includes(q)))
}

const isCoord  = (id) => coordIds.value.includes(id)
const isMember = (id) => memberIds.value.includes(id)
const getUserName = (id) => allUsers.value.find(u => u.id === id)?.fullName ?? '—'
const initials = (name = '') => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
const conflictTitle = (c) => c.map(x => `#${x.numero} ${x.empresa ?? ''}`).join(', ')

// ── Load ──────────────────────────────────────────────────
watch(() => props.show, async (val) => {
  if (!val || !props.event?.id) return
  activeTab.value   = 'responsables'
  openArea.value    = null
  areaSearch.value  = ''
  coordSearch.value = ''
  memberSearch.value= ''
  saveOk.value      = false
  saveError.value   = false

  coordIds.value  = (props.event.coordinadores ?? []).map(c => c.user?.id ?? c.id)
  memberIds.value = (props.event.members ?? []).map(m => m.user?.id ?? m.id)
  respIds.value = {
    comercial:      props.event.responsableComercialId      ?? props.event.responsableComercial?.id      ?? null,
    administrativo: props.event.responsableAdministrativoId ?? props.event.responsableAdministrativo?.id ?? null,
    operativo:      props.event.responsableOperativoId      ?? props.event.responsableOperativo?.id      ?? null,
  }
  availability.value  = {}
  checkingAvail.value = {}

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
  const unique = [...new Set(allUsers.value.map(u => u.id))]
  for (const uid of unique) {
    checkingAvail.value = { ...checkingAvail.value, [uid]: true }
    try {
      const { data } = await api.get('/users/availability', { params: { userId: uid, startAt, endAt } })
      availability.value = { ...availability.value, [uid]: data }
    } catch { /* skip */ }
    finally {
      const next = { ...checkingAvail.value }; delete next[uid]
      checkingAvail.value = next
    }
  }
}

// ── Area toggle ───────────────────────────────────────────
async function toggleArea(key) {
  openArea.value = openArea.value === key ? null : key
  areaSearch.value = ''
  if (openArea.value) {
    await nextTick()
    searchRef.value?.focus()
  }
}

// ── Responsables ──────────────────────────────────────────
async function setResp(area, userId) {
  respIds.value = { ...respIds.value, [area]: userId }
  openArea.value = null
  flashSave(async () => {
    await updateResponsables(props.event.id, {
      responsableComercialId:      respIds.value.comercial,
      responsableAdministrativoId: respIds.value.administrativo,
      responsableOperativoId:      respIds.value.operativo,
    })
    const getUser = (id) => id ? allUsers.value.find(u => u.id === id) ?? null : null
    emit('updated', {
      type: 'responsables',
      ids: respIds.value,
      users: {
        responsableComercial:      getUser(respIds.value.comercial),
        responsableAdministrativo: getUser(respIds.value.administrativo),
        responsableOperativo:      getUser(respIds.value.operativo),
      },
    })
  })
}

// ── Coordinadores ─────────────────────────────────────────
async function toggleCoord(userId) {
  const next = isCoord(userId) ? coordIds.value.filter(id => id !== userId) : [...coordIds.value, userId]
  coordIds.value = next
  flashSave(async () => {
    await setCoordinadores(props.event.id, next)
    emit('updated', { type: 'coordinadores', ids: next })
  })
}

// ── Equipo ────────────────────────────────────────────────
async function toggleMember(userId) {
  if (isMember(userId)) {
    memberIds.value = memberIds.value.filter(id => id !== userId)
    flashSave(async () => {
      await removeQuotationMember(props.event.id, userId)
      emit('updated', { type: 'members', ids: memberIds.value })
    })
  } else {
    memberIds.value = [...memberIds.value, userId]
    flashSave(async () => {
      await addQuotationMember(props.event.id, userId)
      emit('updated', { type: 'members', ids: memberIds.value })
    })
  }
}

// ── Save helper ───────────────────────────────────────────
async function flashSave(fn) {
  saving.value   = true
  saveOk.value   = false
  saveError.value= false
  try {
    await fn()
    saveOk.value = true
    setTimeout(() => { saveOk.value = false }, 2000)
  } catch {
    saveError.value = true
    setTimeout(() => { saveError.value = false }, 3000)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.tm-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 26, 46, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.tm-card {
  background: var(--color-background-primary, #fff);
  border-radius: 16px;
  border: 0.5px solid var(--color-border-tertiary, #e2e8f0);
  width: 100%; max-width: 480px;
  max-height: 88vh;
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* Header */
.tm-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px;
  border-bottom: 0.5px solid var(--color-border-tertiary, #e2e8f0);
  flex-shrink: 0;
}
.tm-header-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--color-background-info, #EBF3FC);
  color: var(--color-text-info, #054EAF);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tm-header-text { flex: 1; min-width: 0; }
.tm-title  { margin: 0; font-size: 13px; font-weight: 600; color: var(--color-text-primary, #0f1a2e); }
.tm-subtitle { margin: 1px 0 0; font-size: 11px; color: var(--color-text-tertiary, #94a3b8); }
.tm-close {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-tertiary, #94a3b8); padding: 5px;
  border-radius: 6px; display: flex; transition: background .15s, color .15s;
}
.tm-close:hover { background: var(--color-background-secondary, #f8fafc); color: var(--color-text-primary, #0f1a2e); }

/* Tabs */
.tm-tabs {
  display: flex; border-bottom: 0.5px solid var(--color-border-tertiary, #e2e8f0);
  padding: 0 18px; gap: 0; flex-shrink: 0;
}
.tm-tab {
  background: none; border: none; border-bottom: 2px solid transparent;
  padding: 9px 14px 7px; font-size: 12px; font-weight: 500;
  color: var(--color-text-tertiary, #94a3b8); cursor: pointer;
  display: flex; align-items: center; gap: 5px; transition: color .15s;
  white-space: nowrap;
}
.tm-tab:hover { color: var(--color-text-secondary, #475569); }
.tm-tab--active { color: var(--color-text-info, #054EAF); border-bottom-color: var(--color-text-info, #054EAF); }
.tm-tab-badge {
  background: var(--color-background-secondary, #f1f5f9);
  color: var(--color-text-secondary, #475569);
  font-size: 10px; font-weight: 600;
  padding: 1px 5px; border-radius: 99px;
}

/* Body */
.tm-body { flex: 1; overflow-y: auto; padding: 16px 18px; }

/* Pane */
.tm-pane { display: flex; flex-direction: column; gap: 8px; }

/* Responsables */
.tm-resp-row {
  border: 0.5px solid var(--color-border-tertiary, #e2e8f0);
  border-radius: 10px; overflow: hidden;
  transition: border-color .2s;
}
.tm-resp-row--open { border-color: var(--color-border-info, #93c5fd); }
.tm-resp-main {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
}
.tm-resp-avatar {
  width: 30px; height: 30px; border-radius: 99px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.tm-resp-avatar--empty {
  background: var(--color-background-secondary, #f8fafc);
  color: var(--color-text-tertiary, #94a3b8);
  border: 0.5px dashed var(--color-border-secondary, #cbd5e1);
}
.tm-resp-info { flex: 1; min-width: 0; }
.tm-resp-name { margin: 0; font-size: 12px; font-weight: 500; color: var(--color-text-primary, #0f1a2e); }
.tm-resp-label { margin: 0; font-size: 10px; color: var(--color-text-tertiary, #94a3b8); }
.tm-resp-btn {
  display: flex; align-items: center; gap: 4px;
  background: none; border: 0.5px solid var(--color-border-tertiary, #e2e8f0);
  border-radius: 6px; padding: 4px 10px; font-size: 11px;
  color: var(--color-text-secondary, #475569); cursor: pointer; transition: all .15s;
  white-space: nowrap;
}
.tm-resp-btn:hover { border-color: var(--color-border-info, #93c5fd); color: var(--color-text-info, #054EAF); }
.tm-resp-btn--active { border-color: var(--color-border-info, #93c5fd); color: var(--color-text-info, #054EAF); background: var(--color-background-info, #EBF3FC); }
.tm-resp-btn svg { transition: transform .2s; }
.rotate-180 { transform: rotate(180deg); }

/* Dropdown */
.tm-resp-dropdown { border-top: 0.5px solid var(--color-border-tertiary, #e2e8f0); }

/* Search */
.tm-search-wrap {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-bottom: 0.5px solid var(--color-border-tertiary, #e2e8f0);
  background: var(--color-background-secondary, #f8fafc);
}
.tm-search-wrap--flat { background: var(--color-background-secondary, #f8fafc); border-radius: 8px; border: 0.5px solid var(--color-border-tertiary, #e2e8f0); }
.tm-search-icon { color: var(--color-text-tertiary, #94a3b8); flex-shrink: 0; }
.tm-search-input { flex: 1; border: none; background: none; outline: none; font-size: 12px; color: var(--color-text-primary, #0f1a2e); }
.tm-search-input::placeholder { color: var(--color-text-tertiary, #94a3b8); }

/* Dropdown list */
.tm-dropdown-list { max-height: 180px; overflow-y: auto; scrollbar-width: thin; }
.tm-dropdown-list--flat { max-height: 200px; border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-top: none; border-radius: 0 0 8px 8px; }
.tm-dropdown-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 12px; cursor: pointer; transition: background .12s;
  border-bottom: 0.5px solid var(--color-border-tertiary, #f1f5f9);
}
.tm-dropdown-item:last-child { border-bottom: none; }
.tm-dropdown-item:hover { background: var(--color-background-secondary, #f8fafc); }
.tm-dropdown-item--selected { background: var(--color-background-info, #EBF3FC); }
.tm-dropdown-item--clear {
  font-size: 11px; color: var(--color-text-danger, #b91c1c);
  gap: 6px; padding: 7px 12px;
}
.tm-dropdown-item--clear:hover { background: var(--color-background-danger, #fef2f2); }
.tm-drop-avatar {
  width: 26px; height: 26px; border-radius: 99px;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; flex-shrink: 0;
}
.tm-drop-avatar--blue { background: #DBEAFE; color: #1D4ED8; }
.tm-drop-avatar--green { background: #D1FAE5; color: #065F46; }
.tm-drop-info { flex: 1; min-width: 0; }
.tm-drop-name { display: block; font-size: 12px; font-weight: 500; color: var(--color-text-primary, #0f1a2e); }
.tm-drop-role { display: block; font-size: 10px; color: var(--color-text-tertiary, #94a3b8); }
.tm-drop-check { color: var(--color-text-info, #054EAF); flex-shrink: 0; }

/* Availability */
.tm-avail-dot { font-size: 10px; font-weight: 600; flex-shrink: 0; white-space: nowrap; }
.avail-ok   { color: #16A34A; }
.avail-busy { color: #D97706; }

/* Chips */
.tm-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.tm-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 8px 4px 5px; border-radius: 99px; font-size: 11px; font-weight: 600;
}
.tm-chip--coord  { background: #EBF3FC; color: #054EAF; }
.tm-chip--member { background: #D1FAE5; color: #065F46; }
.tm-chip-av {
  width: 18px; height: 18px; border-radius: 99px;
  background: rgba(255,255,255,.5); display: flex; align-items: center;
  justify-content: center; font-size: 8px; font-weight: 800;
}
.tm-chip-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tm-chip-avail { font-size: 9px; }
.tm-chip-rm {
  background: none; border: none; cursor: pointer; color: inherit;
  opacity: .55; padding: 1px; border-radius: 99px; display: flex; transition: opacity .12s;
}
.tm-chip-rm:hover { opacity: 1; }

/* Selector (for coord/equipo tabs) */
.tm-selector { display: flex; flex-direction: column; }

/* Empty */
.tm-empty { font-size: 12px; color: var(--color-text-tertiary, #94a3b8); padding: 10px 12px; }

/* Loading */
.tm-loading-row { display: flex; align-items: center; gap: 7px; padding: 12px; font-size: 12px; color: var(--color-text-tertiary, #94a3b8); }

/* Footer */
.tm-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; border-top: 0.5px solid var(--color-border-tertiary, #e2e8f0); flex-shrink: 0;
}
.tm-footer-status { display: flex; align-items: center; gap: 6px; min-height: 20px; }
.tm-status-text { font-size: 11px; color: var(--color-text-tertiary, #94a3b8); }
.tm-status-ok  { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #16A34A; font-weight: 500; }
.tm-status-err { font-size: 11px; color: var(--color-text-danger, #b91c1c); font-weight: 500; }
.tm-btn-close {
  background: none; border: 0.5px solid var(--color-border-secondary, #cbd5e1);
  border-radius: 8px; padding: 6px 16px; font-size: 12px; font-weight: 500;
  color: var(--color-text-secondary, #475569); cursor: pointer; transition: background .15s;
}
.tm-btn-close:hover { background: var(--color-background-secondary, #f8fafc); }

/* Transitions */
.tm-fade-enter-active, .tm-fade-leave-active { transition: opacity .22s ease, transform .22s ease; }
.tm-fade-enter-from, .tm-fade-leave-to { opacity: 0; transform: scale(.97); }

.slide-enter-active, .slide-leave-active { transition: max-height .2s ease, opacity .2s ease; max-height: 300px; overflow: hidden; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .7s linear infinite; }
</style>
