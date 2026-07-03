<template>
  <div class="sedes-page">

    <!-- Header -->
    <div class="sedes-header">
      <div>
        <h1 class="sedes-title">Unidades de Ejecución</h1>
        <p class="sedes-sub">Gestión de equipos, visibilidad financiera y estructura organizacional</p>
      </div>
      <button class="sedes-btn-primary" @click="openCreate">
        <Plus :size="15" /> Nueva unidad
      </button>
    </div>

    <!-- Organigrama Canvas -->
    <div class="sedes-orgchart-section">
      <div class="sedes-orgchart-header">
        <span class="sedes-orgchart-title">Estructura organizacional</span>
        <span class="sedes-orgchart-hint">Hover sobre un nodo para ver detalles</span>
      </div>
      <OrgChart :sedes="sedesConUsuarios" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="sedes-loading">
      <div class="sedes-spinner" /><span>Cargando unidades de ejecución…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="!sedes.length" class="sedes-empty">
      <Building2 :size="48" class="sedes-empty-icon" />
      <h3>Sin unidades de ejecución configuradas</h3>
      <p>Crea la primera unidad para organizar equipos y aislar información financiera.</p>
      <button class="sedes-btn-primary" @click="openCreate"><Plus :size="14" /> Crear primera unidad</button>
    </div>

    <!-- Cards grid -->
    <div v-else class="sedes-grid">
      <div v-for="s in sedes" :key="s.id" class="sede-card" :class="{ 'sede-card--inactive': !s.activa }">

        <div class="sede-card-top">
          <div class="sede-avatar" :style="{ background: sedeColor(s.nombre) }">
            {{ s.nombre.charAt(0).toUpperCase() }}
          </div>
          <div class="sede-card-info">
            <span class="sede-nombre">{{ s.nombre }}</span>
            <span class="sede-ciudad"><MapPin :size="11" /> {{ s.ciudad }}</span>
          </div>
          <span class="sede-badge" :class="s.activa ? 'badge-activa' : 'badge-inactiva'">
            {{ s.activa ? 'Activa' : 'Inactiva' }}
          </span>
        </div>

        <p v-if="s.descripcion" class="sede-desc">{{ s.descripcion }}</p>

        <div class="sede-stats">
          <div class="sede-stat">
            <Users :size="13" />
            <span>{{ s._count.usuarios }} usuario{{ s._count.usuarios !== 1 ? 's' : '' }}</span>
          </div>
          <div class="sede-stat">
            <FileText :size="13" />
            <span>{{ s._count.quotations }} cotizacione{{ s._count.quotations !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <div v-if="s.lider" class="sede-lider">
          <div class="sede-lider-avatar">
            <img v-if="s.lider.avatar" :src="s.lider.avatar" :alt="s.lider.fullName" />
            <span v-else>{{ s.lider.fullName.charAt(0) }}</span>
          </div>
          <div class="sede-lider-info">
            <span class="sede-lider-name">{{ s.lider.fullName }}</span>
            <span class="sede-lider-rol">Líder · {{ s.lider.role }}</span>
          </div>
        </div>
        <div v-else class="sede-lider sede-lider--empty">
          <UserX :size="14" />
          <span>Sin líder asignado</span>
        </div>

        <div class="sede-card-actions">
          <button class="sedes-btn-sm sedes-btn-sm--primary" @click="openDetail(s)">
            <Settings :size="12" /> Gestionar
          </button>
          <button class="sedes-btn-sm" @click="openEdit(s)">
            <Pencil :size="12" /> Editar
          </button>
          <button class="sedes-btn-sm sedes-btn-sm--danger" @click="requestDelete(s)">
            <Trash2 :size="12" />
          </button>
        </div>

      </div>
    </div>

    <!-- ═══════════ MODAL: Crear / Editar sede ════════════ -->
    <Teleport to="body">
      <div v-if="showForm" class="sedes-overlay" @click.self="closeForm">
        <div class="sedes-modal">
          <div class="sedes-modal-header">
            <h2>{{ editingSede ? 'Editar unidad de ejecución' : 'Nueva unidad de ejecución' }}</h2>
            <button class="sedes-modal-close" @click="closeForm"><X :size="18" /></button>
          </div>

          <div class="sedes-modal-body">
            <div class="sedes-field">
              <label>Nombre *</label>
              <input v-model="form.nombre" class="sedes-input" placeholder="Ej. Bogotá Centro" />
            </div>
            <div class="sedes-field">
              <label>Ciudad / Región *</label>
              <input v-model="form.ciudad" class="sedes-input" placeholder="Ej. Medellín, Bogotá, Cali…" />
            </div>
            <div class="sedes-field">
              <label>Descripción</label>
              <textarea v-model="form.descripcion" class="sedes-input sedes-textarea" rows="2" placeholder="Descripción opcional de la unidad de ejecución…" />
            </div>
            <div class="sedes-field">
              <label>Líder de la unidad</label>
              <select v-model="form.liderUserId" class="sedes-input">
                <option :value="null">— Sin líder —</option>
                <option v-for="u in allUsuarios" :key="u.id" :value="u.id">
                  {{ u.fullName }} · {{ u.role }}
                </option>
              </select>
            </div>
            <div class="sedes-field">
              <label>Coordenadas (opcional)</label>
              <div class="sedes-coords-row">
                <input v-model.number="form.latitud" type="number" step="0.000001" class="sedes-input" placeholder="Latitud" />
                <input v-model.number="form.longitud" type="number" step="0.000001" class="sedes-input" placeholder="Longitud" />
                <button type="button" class="sedes-btn-ghost sedes-geo-btn" :disabled="locating" @click="useCurrentLocation">
                  <Loader2 v-if="locating" :size="14" class="spin" />
                  <MapPin v-else :size="14" />
                  Usar mi ubicación
                </button>
              </div>
              <p class="sedes-field-hint">Se usa para detectar automáticamente qué sede ejecutó un checklist según el GPS del dispositivo.</p>
            </div>
            <div v-if="editingSede" class="sedes-field">
              <label>Estado</label>
              <div class="sedes-toggle-row">
                <button
                  class="sedes-toggle-btn"
                  :class="form.activa ? 'toggle-on' : 'toggle-off'"
                  @click="form.activa = !form.activa"
                >
                  <span class="toggle-thumb" />
                </button>
                <span class="toggle-label">{{ form.activa ? 'Activa' : 'Inactiva' }}</span>
              </div>
            </div>
          </div>

          <div class="sedes-modal-footer">
            <button class="sedes-btn-ghost" @click="closeForm">Cancelar</button>
            <button class="sedes-btn-primary" :disabled="saving || !form.nombre || !form.ciudad" @click="saveForm">
              <Loader2 v-if="saving" :size="14" class="spin" />
              <Check v-else :size="14" />
              {{ editingSede ? 'Guardar cambios' : 'Crear unidad' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════ MODAL: Gestionar usuarios ════════════ -->
    <Teleport to="body">
      <div v-if="detailSede" class="sedes-overlay" @click.self="closeDetail">
        <div class="sedes-modal sedes-modal--wide">
          <div class="sedes-modal-header">
            <div>
              <h2>{{ detailSede.nombre }}</h2>
              <p class="sedes-modal-sub"><MapPin :size="12" /> {{ detailSede.ciudad }}</p>
            </div>
            <button class="sedes-modal-close" @click="closeDetail"><X :size="18" /></button>
          </div>

          <div v-if="detailLoading" class="sedes-detail-loading">
            <div class="sedes-spinner" /><span>Cargando…</span>
          </div>

          <div v-else-if="detailData" class="sedes-modal-body">

            <!-- Info rápida -->
            <div class="detail-kpis">
              <div class="detail-kpi">
                <Users :size="16" />
                <div>
                  <span class="detail-kpi-val">{{ detailData.usuarios.length }}</span>
                  <span class="detail-kpi-label">Usuarios asignados</span>
                </div>
              </div>
              <div class="detail-kpi">
                <FileText :size="16" />
                <div>
                  <span class="detail-kpi-val">{{ detailData._count.quotations }}</span>
                  <span class="detail-kpi-label">Cotizaciones</span>
                </div>
              </div>
              <div class="detail-kpi">
                <Shield :size="16" />
                <div>
                  <span class="detail-kpi-val">{{ detailData.lider?.fullName ?? '—' }}</span>
                  <span class="detail-kpi-label">Líder</span>
                </div>
              </div>
            </div>

            <!-- Visibilidad -->
            <div class="detail-vis-section">
              <h3 class="detail-section-title"><Eye :size="14" /> Reglas de visibilidad</h3>
              <div class="detail-vis-grid">
                <div class="detail-vis-row">
                  <span class="vis-icon vis-icon--green"><DollarSign :size="13" /></span>
                  <div>
                    <span class="vis-label">Financiero</span>
                    <span class="vis-desc">Solo visible para el líder de esta unidad y roles ADMIN / DIRECCIÓN</span>
                  </div>
                  <span class="vis-badge vis-badge--restricted">Aislado</span>
                </div>
                <div class="detail-vis-row">
                  <span class="vis-icon vis-icon--blue"><Truck :size="13" /></span>
                  <div>
                    <span class="vis-label">Operativo</span>
                    <span class="vis-desc">Visible para todas las unidades (coordinación entre equipos)</span>
                  </div>
                  <span class="vis-badge vis-badge--shared">Compartido</span>
                </div>
                <div class="detail-vis-row">
                  <span class="vis-icon vis-icon--orange"><Briefcase :size="13" /></span>
                  <div>
                    <span class="vis-label">Administrativo</span>
                    <span class="vis-desc">Visible para ADMIN / DIRECCIÓN globalmente</span>
                  </div>
                  <span class="vis-badge vis-badge--admin">Solo admin</span>
                </div>
              </div>
            </div>

            <!-- Usuarios asignados -->
            <div class="detail-users-section">
              <div class="detail-section-header">
                <h3 class="detail-section-title"><Users :size="14" /> Equipo de la unidad</h3>
              </div>

              <div class="detail-users-list">
                <div v-if="!detailData.usuarios.length" class="detail-empty">
                  <span>Sin usuarios asignados a esta unidad</span>
                </div>
                <div v-for="u in detailData.usuarios" :key="u.id" class="detail-user-row">
                  <div class="detail-user-avatar">
                    <img v-if="u.avatar" :src="u.avatar" :alt="u.fullName" />
                    <span v-else>{{ u.fullName.charAt(0) }}</span>
                  </div>
                  <div class="detail-user-info">
                    <span class="detail-user-name">{{ u.fullName }}</span>
                    <span class="detail-user-meta">{{ u.role }} <template v-if="u.ciudad">· {{ u.ciudad }}</template></span>
                  </div>
                  <span v-if="detailData.lider?.id === u.id" class="detail-lider-tag">Líder</span>
                  <button class="detail-user-remove" @click="removeUser(u)" title="Quitar de esta sede">
                    <X :size="13" />
                  </button>
                </div>
              </div>

              <!-- Agregar usuario -->
              <div class="detail-add-user">
                <h4 class="detail-add-title">Agregar usuario</h4>
                <div class="detail-add-row">
                  <select v-model="selectedUserId" class="sedes-input detail-add-select">
                    <option :value="null">Selecciona un usuario…</option>
                    <option v-for="u in availableUsers" :key="u.id" :value="u.id">
                      {{ u.fullName }} · {{ u.role }}
                    </option>
                  </select>
                  <button
                    class="sedes-btn-primary"
                    :disabled="!selectedUserId || addingUser"
                    @click="addUser"
                  >
                    <Loader2 v-if="addingUser" :size="13" class="spin" />
                    <UserPlus v-else :size="13" />
                    Asignar
                  </button>
                </div>
                <p v-if="!availableUsers.length && !addingUser" class="detail-add-note">
                  Todos los usuarios activos ya pertenecen a esta unidad.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════ MODAL: Confirm delete ════════════ -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="sedes-overlay" @click.self="deleteTarget = null">
        <div class="sedes-modal sedes-modal--sm">
          <div class="sedes-modal-header">
            <h2>Eliminar sede</h2>
            <button class="sedes-modal-close" @click="deleteTarget = null"><X :size="18" /></button>
          </div>
          <div class="sedes-modal-body">
            <p class="sedes-confirm-text">
              ¿Eliminar <strong>{{ deleteTarget.nombre }}</strong>? Los usuarios y cotizaciones
              asignados quedarán sin sede pero no serán eliminados.
            </p>
          </div>
          <div class="sedes-modal-footer">
            <button class="sedes-btn-ghost" @click="deleteTarget = null">Cancelar</button>
            <button class="sedes-btn-danger" :disabled="deleting" @click="confirmDelete">
              <Loader2 v-if="deleting" :size="14" class="spin" />
              <Trash2 v-else :size="14" />
              Eliminar sede
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Plus, X, Pencil, Trash2, Check, Loader2,
  Building2, MapPin, Users, FileText, Settings,
  UserX, UserPlus, Shield, Eye, DollarSign, Truck, Briefcase,
} from 'lucide-vue-next'
import {
  getSedes, getSede, createSede, updateSede, deleteSede,
  asignarUsuario, desasignarUsuario, getUsuariosSinSede, getAllUsuarios,
  getRegionesOperativas,
} from '@/services/sedes.service.js'
import OrgChart from '@/components/configuracion/OrgChart.vue'

// ── Estado ──────────────────────────────────────────────────────
const loading           = ref(true)
const sedes             = ref([])
const allUsuarios       = ref([])
const sinSede           = ref([])
const unidadesEjecucion = ref([])
const ciudadCustom      = ref('')     // valor libre si no está en la lista

// Form modal
const showForm    = ref(false)
const editingSede = ref(null)
const saving      = ref(false)
const form        = ref({ nombre: '', ciudad: '', descripcion: '', liderUserId: null, activa: true, latitud: null, longitud: null })
const locating    = ref(false)

// Detail modal
const detailSede    = ref(null)
const detailData    = ref(null)
const detailLoading = ref(false)
const selectedUserId = ref(null)
const addingUser     = ref(false)

// Delete
const deleteTarget = ref(null)
const deleting     = ref(false)

// ── Computed ─────────────────────────────────────────────────────
const assignedIds = computed(() => new Set((detailData.value?.usuarios ?? []).map(u => u.id)))
const availableUsers = computed(() => allUsuarios.value.filter(u => !assignedIds.value.has(u.id)))

// Sedes enriquecidas con usuarios del detailData si está abierto
const sedesConUsuarios = computed(() => {
  if (!detailData.value) return sedes.value
  return sedes.value.map(s => {
    if (s.id === detailSede.value?.id) {
      return { ...s, usuarios: detailData.value.usuarios, lider: detailData.value.lider }
    }
    return s
  })
})

// ── Mount ────────────────────────────────────────────────────────
onMounted(load)

async function load() {
  loading.value = true
  try {
    const [sedesRes, usersRes, unidadesRes] = await Promise.all([getSedes(), getAllUsuarios(), getRegionesOperativas()])
    sedes.value             = sedesRes.data ?? []
    allUsuarios.value       = usersRes.data ?? []
    unidadesEjecucion.value = unidadesRes.data ?? []
  } catch (_) {}
  finally { loading.value = false }
}

async function refreshSinSede() {
  try {
    const [sinRes, allRes] = await Promise.all([getUsuariosSinSede(), getAllUsuarios()])
    sinSede.value     = sinRes.data  ?? []
    allUsuarios.value = allRes.data  ?? []
  } catch (_) {}
}

// ── Colores de avatar por sede ────────────────────────────────────
const PALETTE = ['#27C8D8','#138E9C','#0F766E','#6D28D9','#BE185D','#D97706','#047857','#B45309']
function sedeColor(nombre) {
  let h = 0
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) & 0xFFFFFF
  return PALETTE[Math.abs(h) % PALETTE.length]
}

// ── Form CRUD ─────────────────────────────────────────────────────
function openCreate() {
  editingSede.value = null
  ciudadCustom.value = ''
  form.value = { nombre: '', ciudad: '', descripcion: '', liderUserId: null, activa: true, latitud: null, longitud: null }
  showForm.value = true
}

function openEdit(s) {
  editingSede.value = s
  const esConocida = unidadesEjecucion.value.includes(s.ciudad)
  ciudadCustom.value = esConocida ? '' : (s.ciudad ?? '')
  form.value = {
    nombre: s.nombre,
    ciudad: esConocida ? s.ciudad : '__custom__',
    descripcion: s.descripcion ?? '',
    liderUserId: s.lider?.id ?? null,
    activa: s.activa,
    latitud: s.latitud ?? null,
    longitud: s.longitud ?? null,
  }
  showForm.value = true
}

function closeForm() { showForm.value = false; editingSede.value = null }

function useCurrentLocation() {
  if (!('geolocation' in navigator)) return
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.value.latitud = pos.coords.latitude
      form.value.longitud = pos.coords.longitude
      locating.value = false
    },
    () => { locating.value = false },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

async function saveForm() {
  const ciudadFinal = form.value.ciudad === '__custom__' ? ciudadCustom.value.trim() : form.value.ciudad
  if (!form.value.nombre.trim() || !ciudadFinal) return
  saving.value = true
  try {
    const dto = {
      nombre: form.value.nombre.trim(),
      ciudad: ciudadFinal,
      descripcion: form.value.descripcion.trim() || undefined,
      liderUserId: form.value.liderUserId || undefined,
      latitud: form.value.latitud !== null && form.value.latitud !== '' ? Number(form.value.latitud) : undefined,
      longitud: form.value.longitud !== null && form.value.longitud !== '' ? Number(form.value.longitud) : undefined,
      ...(editingSede.value && { activa: form.value.activa }),
    }
    if (editingSede.value) {
      const res = await updateSede(editingSede.value.id, dto)
      const idx = sedes.value.findIndex(s => s.id === editingSede.value.id)
      if (idx !== -1) sedes.value[idx] = res.data
    } else {
      const res = await createSede(dto)
      sedes.value.unshift(res.data)
    }
    closeForm()
  } catch (_) {}
  finally { saving.value = false }
}

// ── Delete ────────────────────────────────────────────────────────
function requestDelete(s) { deleteTarget.value = s }

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteSede(deleteTarget.value.id)
    sedes.value = sedes.value.filter(s => s.id !== deleteTarget.value.id)
    deleteTarget.value = null
  } catch (_) {}
  finally { deleting.value = false }
}

// ── Detail / gestión usuarios ─────────────────────────────────────
async function openDetail(s) {
  detailSede.value = s
  detailData.value = null
  selectedUserId.value = null
  detailLoading.value = true
  await refreshSinSede()
  try {
    detailData.value = (await getSede(s.id)).data
  } catch (_) {}
  finally { detailLoading.value = false }
}

function closeDetail() { detailSede.value = null; detailData.value = null }

async function addUser() {
  if (!selectedUserId.value || !detailSede.value) return
  addingUser.value = true
  try {
    const res = await asignarUsuario(detailSede.value.id, selectedUserId.value)
    detailData.value.usuarios.push(res.data)
    sinSede.value = sinSede.value.filter(u => u.id !== selectedUserId.value)
    selectedUserId.value = null
    // Actualiza contador en la card
    const card = sedes.value.find(s => s.id === detailSede.value.id)
    if (card) card._count.usuarios++
  } catch (_) {}
  finally { addingUser.value = false }
}

async function removeUser(u) {
  if (!detailSede.value) return
  try {
    await desasignarUsuario(detailSede.value.id, u.id)
    detailData.value.usuarios = detailData.value.usuarios.filter(x => x.id !== u.id)
    sinSede.value.push(u)
    const card = sedes.value.find(s => s.id === detailSede.value.id)
    if (card) card._count.usuarios--
  } catch (_) {}
}
</script>

<style scoped>
.sedes-page { padding: 24px 28px; width: 100%; box-sizing: border-box; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; gap: 20px; }

/* Header */
.sedes-header { display: flex; align-items: flex-start; justify-content: space-between; }
.sedes-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
.sedes-sub { font-size: 13px; color: #64748B; margin: 3px 0 0; }

/* Loading / empty */
.sedes-loading { display: flex; align-items: center; gap: 10px; padding: 48px; color: #64748B; font-size: 14px; justify-content: center; }
.sedes-spinner { width: 24px; height: 24px; border: 2.5px solid #E2E8F0; border-top-color: #27C8D8; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .8s linear infinite; }
.sedes-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 64px 20px; text-align: center; }
.sedes-empty-icon { color: #CBD5E1; }
.sedes-empty h3 { font-size: 16px; font-weight: 600; color: #374151; margin: 0; }
.sedes-empty p { font-size: 13px; color: #94A3B8; max-width: 400px; margin: 0; }

/* Orgchart section */
.sedes-orgchart-section { display: flex; flex-direction: column; gap: 10px; }
.sedes-orgchart-header { display: flex; align-items: center; justify-content: space-between; }
.sedes-orgchart-title { font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: .05em; }
.sedes-orgchart-hint { font-size: 11px; color: #CBD5E1; }

/* Grid */
.sedes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

/* Card */
.sede-card { background: #fff; border-radius: 16px; box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 2px 10px rgba(39,200,216,.07); padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: box-shadow .15s; }
.sede-card:hover { box-shadow: 0 4px 16px rgba(39,200,216,.12); }
.sede-card--inactive { opacity: .65; }

.sede-card-top { display: flex; align-items: center; gap: 12px; }
.sede-avatar { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 700; flex-shrink: 0; }
.sede-card-info { flex: 1; min-width: 0; }
.sede-nombre { display: block; font-size: 15px; font-weight: 700; color: #0F172A; }
.sede-ciudad { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #64748B; margin-top: 2px; }
.sede-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; white-space: nowrap; }
.badge-activa { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
.badge-inactiva { background: #F1F5F9; color: #64748B; border: 1px solid #E2E8F0; }

.sede-desc { font-size: 12px; color: #64748B; margin: 0; line-height: 1.5; }

.sede-stats { display: flex; gap: 16px; }
.sede-stat { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #64748B; }

.sede-lider { display: flex; align-items: center; gap: 10px; background: #F8FAFC; border-radius: 10px; padding: 10px 12px; }
.sede-lider--empty { color: #94A3B8; font-size: 12px; gap: 6px; }
.sede-lider-avatar { width: 32px; height: 32px; border-radius: 50%; background: #E2E8F0; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #475569; flex-shrink: 0; }
.sede-lider-avatar img { width: 100%; height: 100%; object-fit: cover; }
.sede-lider-name { display: block; font-size: 12px; font-weight: 600; color: #0F172A; }
.sede-lider-rol { display: block; font-size: 10px; color: #94A3B8; }

.sede-card-actions { display: flex; gap: 6px; margin-top: 4px; }

/* Buttons */
.sedes-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #27C8D8; color: #fff; border: none; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }
.sedes-btn-primary:hover:not(:disabled) { background: #0F1A2E; }
.sedes-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.sedes-btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: none; color: #64748B; border: 1.5px solid #E2E8F0; border-radius: 9px; font-size: 13px; font-weight: 500; cursor: pointer; }
.sedes-btn-ghost:hover { background: #F8FAFC; }
.sedes-btn-danger { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #FEF2F2; color: #DC2626; border: 1.5px solid #FCA5A5; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; }
.sedes-btn-danger:hover:not(:disabled) { background: #FEE2E2; }
.sedes-btn-danger:disabled { opacity: .6; cursor: not-allowed; }
.sedes-coords-row { display: flex; gap: 8px; }
.sedes-coords-row .sedes-input { flex: 1; min-width: 0; }
.sedes-geo-btn { white-space: nowrap; flex-shrink: 0; }
.sedes-geo-btn:disabled { opacity: .6; cursor: not-allowed; }
.sedes-field-hint { font-size: 11px; color: #94A3B8; margin: 4px 0 0; }

.sedes-btn-sm { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; font-size: 11px; font-weight: 600; border-radius: 7px; cursor: pointer; border: 1.5px solid #E2E8F0; background: #F8FAFC; color: #374151; }
.sedes-btn-sm:hover { background: #F1F5F9; }
.sedes-btn-sm--primary { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.sedes-btn-sm--primary:hover { background: #CCEFF2; }
.sedes-btn-sm--danger { background: #FEF2F2; color: #DC2626; border-color: #FCA5A5; }
.sedes-btn-sm--danger:hover { background: #FEE2E2; }

/* Modal */
.sedes-overlay { position: fixed; inset: 0; background: rgba(15,26,46,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.sedes-modal { background: #fff; border-radius: 16px; box-shadow: 0 12px 48px rgba(15,26,46,.2); width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.sedes-modal--wide { max-width: 640px; }
.sedes-modal--sm { max-width: 400px; }
.sedes-modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #F1F5F9; }
.sedes-modal-header h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #0F172A; margin: 0; }
.sedes-modal-sub { font-size: 12px; color: #64748B; margin: 3px 0 0; display: flex; align-items: center; gap: 3px; }
.sedes-modal-close { background: none; border: none; color: #94A3B8; cursor: pointer; padding: 2px; border-radius: 6px; }
.sedes-modal-close:hover { background: #F1F5F9; color: #374151; }
.sedes-modal-body { padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.sedes-modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid #F1F5F9; }

/* Fields */
.sedes-field { display: flex; flex-direction: column; gap: 5px; }
.sedes-field label { font-size: 12px; font-weight: 600; color: #374151; }
.sedes-input { border: 1.5px solid #E2E8F0; border-radius: 9px; padding: 9px 12px; font-size: 13px; color: #0F172A; outline: none; width: 100%; box-sizing: border-box; background: #fff; }
.sedes-input:focus { border-color: #27C8D8; }
.sedes-textarea { resize: none; font-family: inherit; }

/* Toggle */
.sedes-toggle-row { display: flex; align-items: center; gap: 10px; }
.sedes-toggle-btn { width: 40px; height: 22px; border-radius: 99px; border: none; cursor: pointer; position: relative; transition: background .2s; }
.toggle-on { background: #22C55E; }
.toggle-off { background: #CBD5E1; }
.toggle-thumb { position: absolute; top: 3px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: left .2s; }
.toggle-on .toggle-thumb { left: 21px; }
.toggle-off .toggle-thumb { left: 3px; }
.toggle-label { font-size: 13px; color: #374151; font-weight: 500; }

/* Confirm */
.sedes-confirm-text { font-size: 14px; color: #374151; line-height: 1.6; margin: 0; }

/* Detail */
.sedes-detail-loading { display: flex; align-items: center; gap: 10px; padding: 32px; justify-content: center; color: #64748B; font-size: 13px; }
.detail-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.detail-kpi { display: flex; align-items: center; gap: 10px; background: #F8FAFC; border-radius: 10px; padding: 12px 14px; }
.detail-kpi svg { color: #27C8D8; flex-shrink: 0; }
.detail-kpi-val { display: block; font-size: 15px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
.detail-kpi-label { display: block; font-size: 10px; color: #94A3B8; font-weight: 500; margin-top: 1px; }

/* Visibility */
.detail-vis-section { border: 1px solid #F1F5F9; border-radius: 12px; overflow: hidden; }
.detail-section-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #374151; margin: 0; padding: 12px 14px; background: #F8FAFC; border-bottom: 1px solid #F1F5F9; }
.detail-vis-grid { display: flex; flex-direction: column; }
.detail-vis-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid #F8FAFC; }
.detail-vis-row:last-child { border-bottom: none; }
.vis-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vis-icon--green { background: #F0FDF4; color: #166534; }
.vis-icon--blue { background: #E0F9FA; color: #27C8D8; }
.vis-icon--orange { background: #FFFBEB; color: #92400E; }
.vis-label { display: block; font-size: 12px; font-weight: 600; color: #0F172A; }
.vis-desc { display: block; font-size: 11px; color: #94A3B8; margin-top: 2px; }
.vis-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; white-space: nowrap; margin-left: auto; }
.vis-badge--restricted { background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; }
.vis-badge--shared { background: #E0F9FA; color: #27C8D8; border: 1px solid #A7EEF5; }
.vis-badge--admin { background: #F5F3FF; color: #6D28D9; border: 1px solid #DDD6FE; }

/* Users section */
.detail-users-section { display: flex; flex-direction: column; gap: 12px; }
.detail-section-header { display: flex; align-items: center; justify-content: space-between; }
.detail-users-list { display: flex; flex-direction: column; gap: 6px; }
.detail-empty { font-size: 12px; color: #94A3B8; padding: 12px 0; }
.detail-user-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #F8FAFC; border-radius: 10px; }
.detail-user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #E2E8F0; overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #475569; flex-shrink: 0; }
.detail-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.detail-user-info { flex: 1; min-width: 0; }
.detail-user-name { display: block; font-size: 13px; font-weight: 600; color: #0F172A; }
.detail-user-meta { display: block; font-size: 11px; color: #94A3B8; }
.detail-lider-tag { font-size: 10px; font-weight: 700; padding: 2px 7px; background: #F5F3FF; color: #6D28D9; border-radius: 99px; border: 1px solid #DDD6FE; white-space: nowrap; }
.detail-user-remove { background: none; border: none; color: #CBD5E1; cursor: pointer; border-radius: 6px; padding: 4px; display: flex; }
.detail-user-remove:hover { background: #FEF2F2; color: #DC2626; }

.detail-add-user { background: #F8FAFC; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.detail-add-title { font-size: 12px; font-weight: 600; color: #374151; margin: 0; }
.detail-add-row { display: flex; gap: 8px; }
.detail-add-select { flex: 1; }
.detail-add-note { font-size: 11px; color: #94A3B8; margin: 0; }
</style>
