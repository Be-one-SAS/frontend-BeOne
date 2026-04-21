<template>
  <div class="perfil-page">

    <!-- ── Header card ─────────────────────────────────── -->
    <div class="perfil-hero">
      <div class="perfil-hero-avatar" :style="{ background: avatarColor }">
        {{ userInitials }}
      </div>
      <div class="perfil-hero-info">
        <h1 class="perfil-hero-name">{{ displayName }}</h1>
        <span class="perfil-hero-email">{{ user?.email }}</span>
        <span class="role-badge" :style="roleBadgeStyle">{{ userRole ?? '—' }}</span>
      </div>
      <button v-if="!editing" class="btn-edit" @click="startEdit">
        <Pencil :size="14" />
        Editar perfil
      </button>
    </div>

    <!-- ── Feedback ────────────────────────────────────── -->
    <Transition name="fb-fade">
      <div v-if="feedback.show" class="feedback-banner" :class="feedback.type === 'success' ? 'fb-success' : 'fb-error'">
        <CheckCircle v-if="feedback.type === 'success'" :size="15" />
        <AlertCircle v-else :size="15" />
        {{ feedback.message }}
      </div>
    </Transition>

    <!-- ── Info card ───────────────────────────────────── -->
    <div class="perfil-card">
      <div class="perfil-card-header">
        <h2 class="perfil-section-title">Información personal</h2>
      </div>

      <!-- Vista lectura -->
      <div v-if="!editing" class="perfil-fields-grid">
        <div class="pf-field">
          <span class="pf-label">Nombre completo</span>
          <span class="pf-value">{{ user?.fullName || '—' }}</span>
        </div>
        <div class="pf-field">
          <span class="pf-label">Email</span>
          <span class="pf-value">{{ user?.email || '—' }}</span>
        </div>
        <div class="pf-field">
          <span class="pf-label">Teléfono</span>
          <span class="pf-value">{{ user?.telefono || '—' }}</span>
        </div>
        <div class="pf-field">
          <span class="pf-label">Rol</span>
          <span class="role-badge" :style="roleBadgeStyle">{{ userRole ?? '—' }}</span>
        </div>
        <div class="pf-field">
          <span class="pf-label">Ciudad</span>
          <span class="pf-value">{{ user?.ciudad || '—' }}</span>
        </div>
        <div class="pf-field">
          <span class="pf-label">Zona / Región</span>
          <span class="pf-value">{{ user?.zona || '—' }}</span>
        </div>
      </div>

      <!-- Vista edición -->
      <div v-else class="perfil-edit-form">
        <div class="perfil-fields-grid">
          <!-- Nombre completo -->
          <div class="field-wrap">
            <label class="field-lbl">Nombre completo <span class="req">*</span></label>
            <input
              v-model="form.fullName"
              type="text"
              class="field-input"
              :class="{ 'field-error': errors.fullName }"
              placeholder="Nombre completo"
              @blur="validateField('fullName')"
            />
            <p v-if="errors.fullName" class="err-msg">{{ errors.fullName }}</p>
          </div>

          <!-- Email (solo lectura) -->
          <div class="field-wrap">
            <label class="field-lbl">Email <span class="readonly-tag">No editable</span></label>
            <input type="email" :value="user?.email" class="field-input field-readonly" disabled />
          </div>

          <!-- Teléfono -->
          <div class="field-wrap">
            <label class="field-lbl">Teléfono</label>
            <input
              v-model="form.telefono"
              type="tel"
              class="field-input"
              placeholder="310 456 7890"
            />
          </div>

          <!-- Rol (solo lectura) -->
          <div class="field-wrap">
            <label class="field-lbl">Rol <span class="readonly-tag">No editable</span></label>
            <div class="field-input field-readonly flex items-center gap-2">
              <span class="role-badge" :style="roleBadgeStyle">{{ userRole ?? '—' }}</span>
            </div>
          </div>

          <!-- Ciudad -->
          <div class="field-wrap">
            <label class="field-lbl">Ciudad</label>
            <input
              v-model="form.ciudad"
              type="text"
              class="field-input"
              placeholder="Medellín"
            />
          </div>

          <!-- Zona -->
          <div class="field-wrap">
            <label class="field-lbl">Zona / Región</label>
            <input
              v-model="form.zona"
              type="text"
              class="field-input"
              placeholder="Antioquia"
            />
          </div>
        </div>

        <!-- Acciones -->
        <div class="edit-actions">
          <button class="btn-cancel" @click="cancelEdit" :disabled="saving">Cancelar</button>
          <button class="btn-save" @click="guardar" :disabled="saving || !!errors.fullName">
            <span v-if="saving" class="spinner" />
            <Save v-else :size="14" />
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Cargando datos iniciales ────────────────────── -->
    <div v-if="loadingProfile" class="perfil-loading">
      <span class="spinner spinner--lg" />
      <span>Cargando perfil...</span>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Pencil, Save, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useSidebarPermissions } from '@/composables/useSidebarPermissions'
import { getMe, updateProfile } from '@/services/user.service'

const { user, updateUserData } = useAuth()
const { userRole, roleBadgeStyle, userInitials, avatarColor, displayName } = useSidebarPermissions()

const editing = ref(false)
const saving = ref(false)
const loadingProfile = ref(false)

const feedback = reactive({ show: false, type: 'success', message: '' })

const form = reactive({
  fullName: '',
  telefono: '',
  ciudad: '',
  zona: '',
})

const errors = reactive({})

// ── Fetch fresh user data ─────────────────────────────
onMounted(async () => {
  if (!user.value?.id) return
  loadingProfile.value = true
  try {
    const res = await getMe(user.value.id)
    const data = res.data ?? res
    updateUserData({ ...user.value, ...data })
  } catch {
    // silently fallback to cached data
  } finally {
    loadingProfile.value = false
  }
})

// ── Edit mode ─────────────────────────────────────────
const startEdit = () => {
  form.fullName = user.value?.fullName ?? ''
  form.telefono = user.value?.telefono ?? ''
  form.ciudad   = user.value?.ciudad   ?? ''
  form.zona     = user.value?.zona     ?? ''
  Object.keys(errors).forEach(k => delete errors[k])
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
  Object.keys(errors).forEach(k => delete errors[k])
}

// ── Validation ────────────────────────────────────────
const validateField = (field) => {
  delete errors[field]
  if (field === 'fullName' && !form.fullName.trim()) {
    errors.fullName = 'El nombre es requerido.'
  }
}

// ── Save ──────────────────────────────────────────────
const guardar = async () => {
  validateField('fullName')
  if (errors.fullName) return

  saving.value = true
  feedback.show = false

  const payload = {}
  if (form.fullName.trim())  payload.fullName = form.fullName.trim()
  if (form.telefono.trim())  payload.telefono = form.telefono.trim()
  if (form.ciudad.trim())    payload.ciudad   = form.ciudad.trim()
  if (form.zona.trim())      payload.zona     = form.zona.trim()

  try {
    const res = await updateProfile(user.value.id, payload)
    const updated = res.data ?? res
    updateUserData({ ...user.value, ...updated })
    editing.value = false
    showFeedback('success', 'Perfil actualizado correctamente.')
  } catch {
    showFeedback('error', 'No se pudo guardar. Intenta de nuevo.')
  } finally {
    saving.value = false
  }
}

const showFeedback = (type, message) => {
  feedback.type    = type
  feedback.message = message
  feedback.show    = true
  setTimeout(() => { feedback.show = false }, 4000)
}
</script>

<style scoped>
.perfil-page {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 32px;
}

/* ── Hero ────────────────────────────────────────────── */
.perfil-hero {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06), 0 4px 16px rgba(5, 78, 175, .08);
}

.perfil-hero-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.perfil-hero-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.perfil-hero-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}

.perfil-hero-email {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
}

/* ── Feedback banner ─────────────────────────────────── */
.feedback-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
}

.fb-success {
  background: #DCFCE7;
  color: #16A34A;
  border: 1px solid #BBF7D0;
}

.fb-error {
  background: #FEE2E2;
  color: #B91C1C;
  border: 1px solid #FECACA;
}

.fb-fade-enter-active, .fb-fade-leave-active { transition: opacity 0.2s ease; }
.fb-fade-enter-from, .fb-fade-leave-to       { opacity: 0; }

/* ── Card ────────────────────────────────────────────── */
.perfil-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 28px;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06), 0 4px 16px rgba(5, 78, 175, .08);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.perfil-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.perfil-section-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}

/* ── Fields grid ─────────────────────────────────────── */
.perfil-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}

/* Read-only view */
.pf-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pf-label {
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pf-value {
  font-size: 14px;
  font-weight: 500;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}

/* Role badge */
.role-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 2px 10px;
  border-radius: 99px;
  white-space: nowrap;
  align-self: flex-start;
}

/* ── Edit form ───────────────────────────────────────── */
.perfil-edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  font-family: 'Inter', sans-serif;
}

.req { color: #B91C1C; }

.readonly-tag {
  font-size: 10px;
  font-weight: 400;
  color: #94A3B8;
  margin-left: 4px;
}

.field-input {
  padding: 8px 12px;
  background: #F8FAFC;
  border: 1.5px solid #E2EBF6;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 2px rgba(5, 78, 175, 0.1);
}

.field-input.field-error {
  border-color: #B91C1C;
  box-shadow: 0 0 0 2px rgba(185, 28, 28, 0.08);
}

.field-readonly {
  background: #F1F5FA;
  color: #94A3B8;
  cursor: not-allowed;
}

.err-msg {
  font-size: 11px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* ── Actions ─────────────────────────────────────────── */
.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #EBF3FC;
}

.btn-cancel {
  padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid #E2EBF6;
  background: transparent;
  color: #64748B;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover:not(:disabled) { background: #F8FAFC; color: #0F172A; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  padding: 8px 18px;
  background: #EEF4FF;
  color: #054EAF;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.btn-edit:hover { background: #DBEAFE; }

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: #054EAF;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  box-shadow: 0 2px 8px rgba(5, 78, 175, 0.22);
}

.btn-save:hover:not(:disabled) { background: #03368A; }
.btn-save:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

/* ── Spinner ─────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spinner--lg {
  width: 24px;
  height: 24px;
  border-color: rgba(5, 78, 175, 0.2);
  border-top-color: #054EAF;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Loading overlay ─────────────────────────────────── */
.perfil-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  color: #64748B;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 600px) {
  .perfil-hero { flex-wrap: wrap; }
  .perfil-fields-grid { grid-template-columns: 1fr; }
  .btn-edit { width: 100%; justify-content: center; margin-left: 0; margin-top: 4px; }
}
</style>
