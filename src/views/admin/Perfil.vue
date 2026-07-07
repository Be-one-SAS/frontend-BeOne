<template>
  <div class="perfil-page">

    <!-- ── Hero ─────────────────────────────────────────── -->
    <div class="perfil-hero" :class="{ 'perfil-hero--editing': editingInfo }">
      <div class="hero-avatar-wrap">
        <div class="hero-avatar" :style="{ background: avatarColor }">
          <img v-if="user?.avatar" :src="user.avatar" alt="Foto de perfil" class="hero-avatar-img" />
          <template v-else>{{ userInitials }}</template>
        </div>
        <div class="hero-avatar-ring" :style="{ borderColor: avatarColor + '40' }" />
        <label class="hero-avatar-edit" title="Cambiar foto de perfil">
          <Loader2 v-if="uploadingAvatar" :size="13" class="hero-avatar-spin" />
          <Camera v-else :size="13" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            class="hero-avatar-input"
            :disabled="uploadingAvatar"
            @change="onAvatarSelected"
          />
        </label>
      </div>
      <div class="hero-info">
        <h1 class="hero-name">{{ displayName }}</h1>
        <p class="hero-email">{{ user?.email }}</p>
        <div class="hero-badges">
          <span class="role-badge" :style="roleBadgeStyle">{{ userRole ?? '—' }}</span>
          <span v-if="isOrgAdmin" class="sede-chip sede-chip--org" title="Nivel organización">🏢 Organización</span>
          <span v-else-if="sedeName" class="sede-chip sede-chip--sede" title="Unidad de Ejecución">📍 {{ sedeName }}</span>
        </div>
      </div>
      <button v-if="!editingInfo" class="btn-edit" @click="startEdit">
        <Pencil :size="13" />
        Editar perfil
      </button>
    </div>

    <!-- ── Feedback global ────────────────────────────────── -->
    <Transition name="fb">
      <div v-if="feedback.show" class="feedback-banner" :class="`fb-${feedback.type}`">
        <CheckCircle v-if="feedback.type === 'success'" :size="14" />
        <AlertCircle v-else :size="14" />
        {{ feedback.message }}
      </div>
    </Transition>

    <!-- ── Información personal ───────────────────────────── -->
    <div class="perfil-card">
      <div class="card-head">
        <div class="card-title-row">
          <div class="card-icon-wrap">
            <UserRound :size="15" />
          </div>
          <h2 class="card-title">Información personal</h2>
        </div>
      </div>

      <!-- Lectura -->
      <div v-if="!editingInfo" class="fields-grid">
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
          <span class="pf-label">Ciudad</span>
          <span class="pf-value">{{ user?.ciudad || '—' }}</span>
        </div>
        <div class="pf-field">
          <span class="pf-label">Zona / Región</span>
          <span class="pf-value">{{ user?.zona || '—' }}</span>
        </div>
        <div class="pf-field">
          <span class="pf-label">Rol</span>
          <span class="role-badge" :style="roleBadgeStyle">{{ userRole ?? '—' }}</span>
        </div>
        <div class="pf-field pf-field--full">
          <span class="pf-label">Unidad de Ejecución</span>
          <span v-if="user?.unidadEjecucion" class="pf-unidad-chip">
            <span class="pf-unidad-dot" />
            {{ user.unidadEjecucion.nombre }}
            <span v-if="user.unidadEjecucion.ciudad" class="pf-unidad-city">— {{ user.unidadEjecucion.ciudad }}</span>
          </span>
          <span v-else class="pf-value pf-value--muted">Sin unidad asignada</span>
        </div>
      </div>

      <!-- Edición -->
      <div v-else class="edit-form">
        <div class="fields-grid">
          <div class="field-wrap">
            <label class="field-lbl">Nombre completo <span class="req">*</span></label>
            <input
              v-model="infoForm.fullName"
              type="text"
              class="field-input"
              :class="{ 'field-error': infoErrors.fullName }"
              placeholder="Ej. Juan Pérez"
              @blur="validateInfo('fullName')"
            />
            <p v-if="infoErrors.fullName" class="err-msg">{{ infoErrors.fullName }}</p>
          </div>

          <div class="field-wrap">
            <label class="field-lbl">Email <span class="readonly-tag">No editable</span></label>
            <input type="email" :value="user?.email" class="field-input field-readonly" disabled />
          </div>

          <div class="field-wrap">
            <label class="field-lbl">Teléfono</label>
            <input v-model="infoForm.telefono" type="tel" class="field-input" placeholder="310 456 7890" />
          </div>

          <div class="field-wrap">
            <label class="field-lbl">Ciudad</label>
            <input v-model="infoForm.ciudad" type="text" class="field-input" placeholder="Medellín" />
          </div>

          <div class="field-wrap">
            <label class="field-lbl">Zona / Región</label>
            <input v-model="infoForm.zona" type="text" class="field-input" placeholder="Antioquia" />
          </div>

          <div class="field-wrap">
            <label class="field-lbl">Rol <span class="readonly-tag">No editable</span></label>
            <div class="field-input field-readonly" style="display:flex;align-items:center;">
              <span class="role-badge" :style="roleBadgeStyle">{{ userRole ?? '—' }}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-cancel" @click="cancelEdit" :disabled="savingInfo">Cancelar</button>
          <button class="btn-save" @click="guardarInfo" :disabled="savingInfo || !!infoErrors.fullName">
            <span v-if="savingInfo" class="spinner" />
            <Save v-else :size="13" />
            {{ savingInfo ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Seguridad ──────────────────────────────────────── -->
    <div class="perfil-card">
      <div class="card-head">
        <div class="card-title-row">
          <div class="card-icon-wrap card-icon-wrap--sec">
            <ShieldCheck :size="15" />
          </div>
          <h2 class="card-title">Seguridad</h2>
        </div>
        <p class="card-subtitle">Cambia tu contraseña periódicamente para mantener tu cuenta segura.</p>
      </div>

      <div class="pwd-form">
        <!-- Contraseña actual -->
        <div class="field-wrap">
          <label class="field-lbl">Contraseña actual <span class="req">*</span></label>
          <div class="field-pwd-wrap">
            <input
              v-model="pwdForm.current"
              :type="showPwd.current ? 'text' : 'password'"
              class="field-input"
              :class="{ 'field-error': pwdErrors.current }"
              placeholder="Tu contraseña actual"
              autocomplete="current-password"
            />
            <button type="button" class="pwd-toggle" @click="showPwd.current = !showPwd.current">
              <Eye v-if="!showPwd.current" :size="15" />
              <EyeOff v-else :size="15" />
            </button>
          </div>
          <p v-if="pwdErrors.current" class="err-msg">{{ pwdErrors.current }}</p>
        </div>

        <!-- Nueva contraseña -->
        <div class="field-wrap">
          <label class="field-lbl">Nueva contraseña <span class="req">*</span></label>
          <div class="field-pwd-wrap">
            <input
              v-model="pwdForm.newPwd"
              :type="showPwd.newPwd ? 'text' : 'password'"
              class="field-input"
              :class="{ 'field-error': pwdErrors.newPwd }"
              placeholder="Mínimo 6 caracteres"
              autocomplete="new-password"
            />
            <button type="button" class="pwd-toggle" @click="showPwd.newPwd = !showPwd.newPwd">
              <Eye v-if="!showPwd.newPwd" :size="15" />
              <EyeOff v-else :size="15" />
            </button>
          </div>
          <p v-if="pwdErrors.newPwd" class="err-msg">{{ pwdErrors.newPwd }}</p>
          <!-- Strength bar -->
          <div v-if="pwdForm.newPwd" class="pwd-strength">
            <div class="pwd-strength-bar">
              <div class="pwd-strength-fill" :style="{ width: pwdStrength.pct + '%', background: pwdStrength.color }" />
            </div>
            <span class="pwd-strength-label" :style="{ color: pwdStrength.color }">{{ pwdStrength.label }}</span>
          </div>
        </div>

        <!-- Confirmar contraseña -->
        <div class="field-wrap">
          <label class="field-lbl">Confirmar nueva contraseña <span class="req">*</span></label>
          <div class="field-pwd-wrap">
            <input
              v-model="pwdForm.confirm"
              :type="showPwd.confirm ? 'text' : 'password'"
              class="field-input"
              :class="{ 'field-error': pwdErrors.confirm }"
              placeholder="Repite la nueva contraseña"
              autocomplete="new-password"
            />
            <button type="button" class="pwd-toggle" @click="showPwd.confirm = !showPwd.confirm">
              <Eye v-if="!showPwd.confirm" :size="15" />
              <EyeOff v-else :size="15" />
            </button>
          </div>
          <p v-if="pwdErrors.confirm" class="err-msg">{{ pwdErrors.confirm }}</p>
        </div>

        <div class="card-actions">
          <button class="btn-cancel" @click="resetPwdForm" :disabled="savingPwd">Limpiar</button>
          <button class="btn-save" @click="guardarPassword" :disabled="savingPwd">
            <span v-if="savingPwd" class="spinner" />
            <Lock v-else :size="13" />
            {{ savingPwd ? 'Cambiando...' : 'Cambiar contraseña' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Pencil, Save, CheckCircle, AlertCircle, UserRound, ShieldCheck, Eye, EyeOff, Lock, Camera, Loader2 } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useSidebarPermissions } from '@/composables/useSidebarPermissions'
import { getMe, updateProfile, changePassword, uploadAvatar } from '@/services/user.service'

const { user, updateUserData } = useAuth()
const { userRole, roleBadgeStyle, userInitials, avatarColor, displayName, sedeName, isOrgAdmin } = useSidebarPermissions()

// ── Foto de perfil ──────────────────────────────────────
const uploadingAvatar = ref(false)

const onAvatarSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  uploadingAvatar.value = true
  try {
    const res = await uploadAvatar(user.value.id, file)
    const updated = res.data ?? res
    updateUserData({ ...user.value, avatar: updated.avatar })
    showFeedback('success', 'Foto de perfil actualizada correctamente.')
  } catch (err) {
    showFeedback('error', err?.response?.data?.message || 'No se pudo subir la foto de perfil.')
  } finally {
    uploadingAvatar.value = false
    event.target.value = ''
  }
}

// ── Info edit ──────────────────────────────────────────
const editingInfo = ref(false)
const savingInfo  = ref(false)

const infoForm = reactive({ fullName: '', telefono: '', ciudad: '', zona: '' })
const infoErrors = reactive({})

const startEdit = () => {
  infoForm.fullName = user.value?.fullName ?? ''
  infoForm.telefono = user.value?.telefono ?? ''
  infoForm.ciudad   = user.value?.ciudad   ?? ''
  infoForm.zona     = user.value?.zona     ?? ''
  Object.keys(infoErrors).forEach(k => delete infoErrors[k])
  editingInfo.value = true
}

const cancelEdit = () => {
  editingInfo.value = false
  Object.keys(infoErrors).forEach(k => delete infoErrors[k])
}

const validateInfo = (field) => {
  delete infoErrors[field]
  if (field === 'fullName' && !infoForm.fullName.trim()) {
    infoErrors.fullName = 'El nombre es requerido.'
  }
}

const guardarInfo = async () => {
  validateInfo('fullName')
  if (infoErrors.fullName) return

  savingInfo.value = true
  const payload = {}
  if (infoForm.fullName.trim()) payload.fullName = infoForm.fullName.trim()
  if (infoForm.telefono.trim()) payload.telefono = infoForm.telefono.trim()
  if (infoForm.ciudad.trim())   payload.ciudad   = infoForm.ciudad.trim()
  if (infoForm.zona.trim())     payload.zona     = infoForm.zona.trim()

  try {
    const res = await updateProfile(user.value.id, payload)
    const updated = res.data ?? res
    updateUserData({ ...user.value, ...updated })
    editingInfo.value = false
    showFeedback('success', 'Perfil actualizado correctamente.')
  } catch {
    showFeedback('error', 'No se pudo guardar. Intenta de nuevo.')
  } finally {
    savingInfo.value = false
  }
}

// ── Password change ────────────────────────────────────
const savingPwd = ref(false)
const pwdForm   = reactive({ current: '', newPwd: '', confirm: '' })
const pwdErrors = reactive({})
const showPwd   = reactive({ current: false, newPwd: false, confirm: false })

const pwdStrength = computed(() => {
  const p = pwdForm.newPwd
  if (!p) return { pct: 0, color: '#E2EBF6', label: '' }
  let score = 0
  if (p.length >= 8)            score++
  if (/[A-Z]/.test(p))         score++
  if (/[0-9]/.test(p))         score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  const map = [
    { pct: 20,  color: '#B91C1C', label: 'Muy débil' },
    { pct: 40,  color: '#D97706', label: 'Débil' },
    { pct: 65,  color: '#CA8A04', label: 'Regular' },
    { pct: 85,  color: '#16A34A', label: 'Fuerte' },
    { pct: 100, color: '#0EA5E9', label: 'Muy fuerte' },
  ]
  return map[score] ?? map[0]
})

const resetPwdForm = () => {
  pwdForm.current = ''
  pwdForm.newPwd  = ''
  pwdForm.confirm = ''
  Object.keys(pwdErrors).forEach(k => delete pwdErrors[k])
}

const guardarPassword = async () => {
  Object.keys(pwdErrors).forEach(k => delete pwdErrors[k])
  let valid = true
  if (!pwdForm.current) { pwdErrors.current = 'Ingresa tu contraseña actual.'; valid = false }
  if (!pwdForm.newPwd || pwdForm.newPwd.length < 6) { pwdErrors.newPwd = 'Mínimo 6 caracteres.'; valid = false }
  if (pwdForm.newPwd !== pwdForm.confirm) { pwdErrors.confirm = 'Las contraseñas no coinciden.'; valid = false }
  if (!valid) return

  savingPwd.value = true
  try {
    await changePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.newPwd })
    resetPwdForm()
    showFeedback('success', 'Contraseña cambiada correctamente.')
  } catch (err) {
    const msg = err?.response?.data?.message
    if (msg?.toLowerCase().includes('incorrecta') || msg?.toLowerCase().includes('incorrect')) {
      pwdErrors.current = 'La contraseña actual no es correcta.'
    } else {
      showFeedback('error', 'No se pudo cambiar la contraseña. Intenta de nuevo.')
    }
  } finally {
    savingPwd.value = false
  }
}

// ── Feedback ───────────────────────────────────────────
const feedback = reactive({ show: false, type: 'success', message: '' })
let fbTimer = null
const showFeedback = (type, message) => {
  if (fbTimer) clearTimeout(fbTimer)
  feedback.type    = type
  feedback.message = message
  feedback.show    = true
  fbTimer = setTimeout(() => { feedback.show = false }, 4000)
}

// ── Init ───────────────────────────────────────────────
onMounted(async () => {
  if (!user.value?.id) return
  try {
    const res = await getMe(user.value.id)
    const data = res.data ?? res
    updateUserData({
      ...user.value,
      ...data,
      unidadEjecucion: data.unidadEjecucion ?? data.sede ?? null,
    })
  } catch { /* fallback to cached */ }
})
</script>

<style scoped>
.perfil-page {
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: auto auto 1fr;
  gap: 16px;
  padding: 4px 0 40px;
  align-items: start;
}

/* Hero ocupa la columna izquierda, filas 1-2 */
.perfil-hero {
  grid-column: 1;
  grid-row: 1;
}

/* Feedback ocupa ambas columnas */
.feedback-banner {
  grid-column: 1 / -1;
  grid-row: 2;
}

/* Cards van en columna derecha, apiladas */
.perfil-card {
  grid-column: 2;
}

/* ── Hero ────────────────────────────────────────────── */
.perfil-hero {
  background: linear-gradient(160deg, #0F1A2E 0%, #1a2d4a 100%);
  border-radius: 20px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
  align-self: start;
  position: sticky;
  top: 0;
}

.perfil-hero::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -40px;
  transform: translateX(-50%);
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(39,200,216,0.15) 0%, transparent 70%);
  pointer-events: none;
}

.hero-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.hero-avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  position: relative;
  z-index: 1;
}

.hero-avatar-ring {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2px solid;
  opacity: 0.5;
  pointer-events: none;
}

.hero-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.hero-avatar-edit {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #27C8D8;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #0F1A2E;
  cursor: pointer;
  z-index: 2;
  transition: background 0.15s;
}
.hero-avatar-edit:hover { background: #1BAEBB; }
.hero-avatar-input { display: none; }
.hero-avatar-spin { animation: spin 0.8s linear infinite; }

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.hero-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  word-break: break-word;
}

.hero-email {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  font-family: 'Inter', sans-serif;
  margin: 0;
  word-break: break-all;
}

.hero-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* ── Feedback ────────────────────────────────────────── */
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
.fb-success { background: #DCFCE7; color: #16A34A; border: 1px solid #BBF7D0; }
.fb-error   { background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; }
.fb-enter-active, .fb-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fb-enter-from, .fb-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Card ────────────────────────────────────────────── */
.perfil-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 28px;
  box-shadow: 0 1px 4px rgba(15,26,46,.04), 0 4px 16px rgba(15,26,46,.06);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #E0F9FA;
  color: #27C8D8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon-wrap--sec {
  background: #EDE9FE;
  color: #7C3AED;
}

.card-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}

.card-subtitle {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding-left: 40px;
}

/* ── Fields grid ─────────────────────────────────────── */
.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 28px;
}

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
  letter-spacing: 0.05em;
}

.pf-value {
  font-size: 14px;
  font-weight: 500;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}
.pf-value--muted { color: #94A3B8; font-style: italic; }

.pf-field--full { grid-column: 1 / -1; }

.pf-unidad-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  background: #E0F9FA;
  border: 1.5px solid #27C8D8;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #0F7A89;
  font-family: 'Inter', sans-serif;
  width: fit-content;
}
.pf-unidad-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #27C8D8;
  flex-shrink: 0;
}
.pf-unidad-city {
  font-weight: 400;
  color: #64748B;
}

/* ── Edit form ───────────────────────────────────────── */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pwd-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  padding: 9px 12px;
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
.field-input:focus { border-color: #27C8D8; box-shadow: 0 0 0 3px rgba(39,200,216,0.1); }
.field-input.field-error { border-color: #B91C1C; box-shadow: 0 0 0 3px rgba(185,28,28,0.08); }
.field-readonly { background: #F1F5FA; color: #94A3B8; cursor: not-allowed; }

/* Password field */
.field-pwd-wrap {
  position: relative;
}

.field-pwd-wrap .field-input {
  padding-right: 40px;
}

.pwd-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #94A3B8;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.pwd-toggle:hover { color: #27C8D8; }

/* Strength bar */
.pwd-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.pwd-strength-bar {
  flex: 1;
  height: 4px;
  background: #F1F5FA;
  border-radius: 99px;
  overflow: hidden;
}
.pwd-strength-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease, background 0.3s ease;
}
.pwd-strength-label {
  font-size: 10px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

.err-msg {
  font-size: 11px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* ── Actions ─────────────────────────────────────────── */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #F0FAFB;
}

.role-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 2px 10px;
  border-radius: 99px;
  white-space: nowrap;
}

.sede-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 2px 10px;
  border-radius: 99px;
  white-space: nowrap;
}
.sede-chip--sede { background: rgba(39,200,216,0.2); color: #27C8D8; }
.sede-chip--org  { background: rgba(124,58,237,0.2); color: #C4B5FD; }

.btn-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 9px 16px;
  background: rgba(39,200,216,0.15);
  color: #27C8D8;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 4px;
}
.btn-edit:hover { background: rgba(39,200,216,0.25); }

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

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: #27C8D8;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  box-shadow: 0 2px 8px rgba(39,200,216,0.22);
}
.btn-save:hover:not(:disabled) { background: #1BAEBB; }
.btn-save:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

/* ── Spinner ─────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 768px) {
  .perfil-page {
    grid-template-columns: 1fr;
  }
  .perfil-hero {
    grid-row: auto;
    position: static;
    flex-direction: row;
    text-align: left;
    align-items: center;
    padding: 20px;
  }
  .hero-badges { justify-content: flex-start; }
  .hero-avatar { width: 56px; height: 56px; font-size: 20px; }
  .feedback-banner { grid-column: 1; }
  .perfil-card { grid-column: 1; }
  .fields-grid { grid-template-columns: 1fr; }
  .btn-edit { width: auto; }
}
</style>
