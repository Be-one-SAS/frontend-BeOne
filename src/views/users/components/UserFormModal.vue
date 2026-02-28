<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="overlay"
        @click.self="$emit('close')"
      >
        <Transition name="modal-scale">
          <div v-if="show" class="modal-card">

            <!-- ── Header ──────────────────────────────── -->
            <div class="modal-header">
              <div class="flex items-center gap-3">
                <h2 class="modal-title">
                  {{ isEdit ? 'Editar usuario' : 'Nuevo usuario' }}
                </h2>
                <span class="mode-badge" :class="isEdit ? 'badge-edit' : 'badge-create'">
                  {{ isEdit ? 'Editando' : 'Creando' }}
                </span>
              </div>
              <button class="btn-close" @click="$emit('close')">
                <X :size="18" />
              </button>
            </div>

            <!-- ── Formulario ──────────────────────────── -->
            <div class="form-body">
              <div class="form-grid">

                <!-- Nombre completo -->
                <div class="field-wrap">
                  <label class="field-lbl">Nombre completo <span class="req">*</span></label>
                  <input
                    v-model="form.fullName"
                    type="text"
                    class="field-input"
                    :class="{ 'field-error': errors.fullName, 'field-ok': form.fullName && !errors.fullName }"
                    placeholder="Ej: Santiago Restrepo"
                    @blur="validateField('fullName')"
                  />
                  <p v-if="errors.fullName" class="err-msg">{{ errors.fullName }}</p>
                </div>

                <!-- Email corporativo -->
                <div class="field-wrap">
                  <label class="field-lbl">Email corporativo <span class="req">*</span></label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="field-input"
                    :class="{ 'field-error': errors.email, 'field-ok': form.email && !errors.email }"
                    placeholder="usuario@beone.co"
                    @blur="validateField('email')"
                  />
                  <p v-if="errors.email" class="err-msg">{{ errors.email }}</p>
                </div>

                <!-- Username -->
                <div class="field-wrap">
                  <label class="field-lbl">Username <span class="req">*</span></label>
                  <div class="input-prefix-wrap">
                    <span class="input-prefix">@</span>
                    <input
                      v-model="form.username"
                      type="text"
                      class="field-input has-prefix"
                      :class="{ 'field-error': errors.username, 'field-ok': form.username && !errors.username }"
                      placeholder="srestrepo"
                      @blur="validateField('username')"
                      @input="form.username = form.username.toLowerCase().replace(/\s/g, '')"
                    />
                  </div>
                  <p v-if="errors.username" class="err-msg">{{ errors.username }}</p>
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

                <!-- Rol -->
                <div class="field-wrap">
                  <label class="field-lbl">Rol <span class="req">*</span></label>
                  <div class="select-wrap">
                    <select
                      v-model="form.role"
                      class="field-input"
                      :class="{ 'field-error': errors.role }"
                      @blur="validateField('role')"
                    >
                      <option value="" disabled>Selecciona un rol</option>
                      <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
                    </select>
                    <!-- Badge preview del rol seleccionado -->
                    <span
                      v-if="form.role"
                      class="role-preview-badge"
                      :class="ROLE_BADGE[form.role]"
                    >{{ form.role }}</span>
                  </div>
                  <p v-if="errors.role" class="err-msg">{{ errors.role }}</p>
                </div>

                <!-- Estado -->
                <div class="field-wrap">
                  <label class="field-lbl">Estado <span class="req">*</span></label>
                  <select v-model="form.status" class="field-input">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Suspendido">Suspendido</option>
                  </select>
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

                <!-- Documento -->
                <div class="field-wrap">
                  <label class="field-lbl">Documento de identidad</label>
                  <input
                    v-model="form.documento"
                    type="text"
                    class="field-input"
                    placeholder="71234567"
                  />
                </div>

              </div><!-- /form-grid -->

              <!-- Contraseña (solo en modo crear) -->
              <div v-if="!isEdit" class="field-wrap mt-4">
                <label class="field-lbl">Contraseña <span class="req">*</span></label>
                <div class="pw-wrap">
                  <input
                    v-model="form.password"
                    :type="showPw ? 'text' : 'password'"
                    class="field-input"
                    :class="{ 'field-error': errors.password, 'field-ok': form.password && !errors.password }"
                    placeholder="Mínimo 8 caracteres"
                    @blur="validateField('password')"
                  />
                  <button
                    type="button"
                    class="pw-toggle"
                    @click="showPw = !showPw"
                    :title="showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  >
                    <EyeOff v-if="showPw" :size="15" />
                    <Eye v-else :size="15" />
                  </button>
                </div>
                <p v-if="errors.password" class="err-msg">{{ errors.password }}</p>

                <!-- Indicador de fortaleza -->
                <div v-if="form.password" class="pw-strength-wrap">
                  <div class="pw-bars">
                    <div
                      v-for="i in 4"
                      :key="i"
                      class="pw-bar"
                      :class="getStrengthBarClass(i)"
                    />
                  </div>
                  <span class="pw-strength-label" :class="strengthLabelClass">
                    {{ strengthLabel }}
                  </span>
                </div>
              </div>

              <!-- Notas internas -->
              <div class="field-wrap mt-4">
                <label class="field-lbl">Notas internas <span class="optional">(opcional)</span></label>
                <textarea
                  v-model="form.notas"
                  class="field-textarea"
                  rows="2"
                  placeholder="Información adicional sobre el usuario..."
                />
              </div>

            </div><!-- /form-body -->

            <!-- ── Footer ──────────────────────────────── -->
            <div class="modal-footer">
              <button class="btn-ghost" @click="$emit('close')">Cancelar</button>
              <button
                class="btn-save"
                :disabled="!isFormValid"
                @click="guardar"
              >
                <Save :size="14" />
                {{ isEdit ? 'Guardar cambios' : 'Crear usuario' }}
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { X, Eye, EyeOff, Save } from 'lucide-vue-next'

// ── Props & Emits ─────────────────────────────────────
const props = defineProps({
  show:    { type: Boolean, required: true },
  usuario: { type: Object, default: null },  // null = crear, objeto = editar
})
const emit = defineEmits(['close', 'save'])

// ── Config ────────────────────────────────────────────
const ROLES = ['ADMIN', 'COMERCIAL', 'SUPERVISOR', 'LOGISTICA', 'COORDINADOR', 'FINANCIERO', 'SOPORTE']

const ROLE_BADGE = {
  ADMIN:       'bg-[#FEE2E2] text-[#B91C1C]',
  COMERCIAL:   'bg-[#DBEAFE] text-[#1D4ED8]',
  SUPERVISOR:  'bg-[#EDE9FE] text-[#7C3AED]',
  LOGISTICA:   'bg-[#DCFCE7] text-[#16A34A]',
  COORDINADOR: 'bg-[#FEF3C7] text-[#B45309]',
  FINANCIERO:  'bg-[#FFEDD5] text-[#C2410C]',
  SOPORTE:     'bg-[#F1F5F9] text-[#64748B]',
}

// ── Modo ──────────────────────────────────────────────
const isEdit = computed(() => !!props.usuario)

// ── Formulario ────────────────────────────────────────
const form = reactive({
  fullName: '', email: '', username: '',
  telefono: '', role: '', status: 'Activo',
  ciudad: '', documento: '', password: '', notas: '',
})

const errors  = reactive({})
const showPw  = ref(false)

// Llenar formulario al abrir en modo editar o limpiar al crear
watch(() => props.show, (val) => {
  if (!val) return
  showPw.value = false
  Object.keys(errors).forEach(k => delete errors[k])
  if (props.usuario) {
    Object.assign(form, {
      fullName: props.usuario.fullName ?? '',
      email:    props.usuario.email    ?? '',
      username: props.usuario.username ?? '',
      telefono: props.usuario.telefono ?? '',
      role:     props.usuario.role     ?? '',
      status:   props.usuario.status   ?? 'Activo',
      ciudad:   props.usuario.ciudad   ?? '',
      documento:props.usuario.documento?? '',
      notas:    props.usuario.notas    ?? '',
      password: '',
    })
  } else {
    Object.assign(form, {
      fullName: '', email: '', username: '',
      telefono: '', role: '', status: 'Activo',
      ciudad: '', documento: '', password: '', notas: '',
    })
  }
})

// ── Validaciones ──────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateField = (field) => {
  delete errors[field]
  if (field === 'fullName' && !form.fullName.trim())
    errors.fullName = 'El nombre completo es requerido.'
  if (field === 'email') {
    if (!form.email.trim()) errors.email = 'El email es requerido.'
    else if (!EMAIL_RE.test(form.email)) errors.email = 'Ingresa un email válido.'
  }
  if (field === 'username') {
    if (!form.username.trim()) errors.username = 'El username es requerido.'
    else if (/\s/.test(form.username)) errors.username = 'Sin espacios.'
    else if (form.username !== form.username.toLowerCase()) errors.username = 'Solo minúsculas.'
  }
  if (field === 'role' && !form.role)
    errors.role = 'Selecciona un rol.'
  if (field === 'password' && !isEdit.value) {
    if (!form.password) errors.password = 'La contraseña es requerida.'
    else if (form.password.length < 8) errors.password = 'Mínimo 8 caracteres.'
  }
}

const validateAll = () => {
  ['fullName', 'email', 'username', 'role'].forEach(validateField)
  if (!isEdit.value) validateField('password')
}

const isFormValid = computed(() => {
  const baseOk = form.fullName && form.email && EMAIL_RE.test(form.email)
    && form.username && form.role && Object.keys(errors).length === 0
  if (isEdit.value) return baseOk
  return baseOk && form.password.length >= 8
})

// ── Fortaleza de contraseña ───────────────────────────
const passwordStrength = computed(() => {
  const pw = form.password
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8)               score++
  if (/[A-Z]/.test(pw))             score++
  if (/[0-9]/.test(pw))             score++
  if (/[^A-Za-z0-9]/.test(pw))      score++
  return score
})

const strengthLabel = computed(() => {
  const s = passwordStrength.value
  return s <= 1 ? 'Débil' : s === 2 ? 'Media' : s === 3 ? 'Fuerte' : 'Muy fuerte'
})

const strengthLabelClass = computed(() => {
  const s = passwordStrength.value
  return s <= 1 ? 'lbl-weak' : s === 2 ? 'lbl-mid' : 'lbl-strong'
})

const getStrengthBarClass = (index) => {
  const s = passwordStrength.value
  if (index > s) return 'bar-empty'
  if (s <= 1) return 'bar-weak'
  if (s === 2) return 'bar-mid'
  if (s === 3) return 'bar-strong'
  return 'bar-max'
}

// ── Guardar ───────────────────────────────────────────
const guardar = () => {
  validateAll()
  if (!isFormValid.value) return
  // conectar API aquí → createUser(form) / updateUser(props.usuario.id, form)
  const payload = {
    ...form,
    ...(isEdit.value && { id: props.usuario.id }),
  }
  emit('save', payload)
}
</script>

<style scoped>
/* ── Overlay ─────────────────────────────────────────── */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 26, 46, 0.45);
  backdrop-filter: blur(4px);
}

/* ── Modal card ──────────────────────────────────────── */
.modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(15, 26, 46, 0.18);
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 90vh;
  overflow-y: auto;
}

/* ── Header ──────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}

.mode-badge {
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}

.badge-create { background: #DBEAFE; color: #1D4ED8; }
.badge-edit   { background: #FEF3C7; color: #B45309; }

.btn-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: transparent;
  color: #94A3B8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-close:hover { background: #F8FAFC; color: #0F172A; }

/* ── Body ────────────────────────────────────────────── */
.form-body { display: flex; flex-direction: column; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

/* ── Fields ──────────────────────────────────────────── */
.field-wrap { display: flex; flex-direction: column; gap: 5px; }

.field-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  font-family: 'Inter', sans-serif;
}

.req { color: #B91C1C; }
.optional { color: #94A3B8; font-weight: 400; }

.field-input {
  padding: 8px 12px;
  background: #F8FAFC;
  border: 1.5px solid #E2EBF6;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
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

.field-input.field-ok {
  border-color: #16A34A;
}

.field-textarea {
  padding: 8px 12px;
  background: #F8FAFC;
  border: 1.5px solid #E2EBF6;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  outline: none;
  resize: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.field-textarea:focus { border-color: #054EAF; }

.err-msg {
  font-size: 11px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* ── Username prefix ─────────────────────────────────── */
.input-prefix-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #94A3B8;
  font-family: 'JetBrains Mono', monospace;
  pointer-events: none;
  z-index: 1;
}

.field-input.has-prefix { padding-left: 24px; }

/* ── Select + badge preview ──────────────────────────── */
.select-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-wrap .field-input { flex: 1; }

.role-preview-badge {
  padding: 2px 9px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Password ────────────────────────────────────────── */
.pw-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.pw-wrap .field-input { padding-right: 38px; }

.pw-toggle {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.15s;
}

.pw-toggle:hover { color: #475569; }

/* ── Strength indicator ──────────────────────────────── */
.pw-strength-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.pw-bars {
  display: flex;
  gap: 4px;
  flex: 1;
}

.pw-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  transition: background 0.2s ease;
}

.bar-empty  { background: #E2EBF6; }
.bar-weak   { background: #EF4444; }
.bar-mid    { background: #F59E0B; }
.bar-strong { background: #22C55E; }
.bar-max    { background: #15803D; }

.pw-strength-label {
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

.lbl-weak   { color: #EF4444; }
.lbl-mid    { color: #F59E0B; }
.lbl-strong { color: #16A34A; }

/* ── Footer ──────────────────────────────────────────── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #EBF3FC;
}

.btn-ghost {
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

.btn-ghost:hover { background: #F8FAFC; color: #0F172A; }

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

.btn-save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* ── Utilidades ──────────────────────────────────────── */
.mt-4 { margin-top: 16px; }

/* ── Transiciones modal ──────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to       { opacity: 0; }

.modal-scale-enter-active { transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), opacity 0.18s ease; }
.modal-scale-leave-active  { transition: transform 0.15s ease, opacity 0.15s ease; }
.modal-scale-enter-from   { transform: scale(0.92); opacity: 0; }
.modal-scale-leave-to     { transform: scale(0.95); opacity: 0; }

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 600px) {
  .modal-card { padding: 20px 16px; }
  .form-grid { grid-template-columns: 1fr; }
  .select-wrap { flex-wrap: wrap; }
}
</style>
