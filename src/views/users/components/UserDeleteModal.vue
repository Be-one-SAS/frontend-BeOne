<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(15,26,46,0.45); backdrop-filter: blur(4px)"
        @click.self="$emit('close')"
      >
        <Transition name="modal-scale">
          <div v-if="show" class="del-card">

            <!-- ── Ícono de advertencia ── -->
            <div class="del-icon-wrap">
              <AlertTriangle :size="28" color="#B91C1C" />
            </div>

            <!-- ── Título y descripción ── -->
            <div class="del-body">
              <h3 class="del-title">¿Eliminar usuario?</h3>
              <p class="del-desc">
                Esta acción no se puede deshacer. El usuario
                <strong>{{ usuario?.fullName }}</strong>
                perderá acceso inmediatamente.
              </p>
            </div>

            <!-- ── Card de usuario a eliminar ── -->
            <div v-if="usuario" class="del-user-card">
              <div class="del-avatar" :style="{ background: getAvatarColor(usuario.fullName) }">
                {{ getInitials(usuario.fullName) }}
              </div>
              <div class="del-user-info">
                <span class="del-user-name">{{ usuario.fullName }}</span>
                <span class="del-user-email">{{ usuario.email }}</span>
              </div>
              <span class="role-badge" :class="roleBadgeClass[usuario.role]">
                {{ usuario.role }}
              </span>
            </div>

            <!-- ── Input de confirmación ── -->
            <div class="del-confirm-wrap">
              <label class="del-confirm-label">
                Escribe <code class="del-code">DELETE</code> para confirmar
              </label>
              <input
                v-model="confirmText"
                type="text"
                placeholder="DELETE"
                class="del-confirm-input"
                :class="{ 'del-input-ready': confirmText === 'DELETE' }"
                autocomplete="off"
                spellcheck="false"
              />
            </div>

            <!-- ── Footer ── -->
            <div class="del-footer">
              <button class="btn-ghost" @click="$emit('close')">Cancelar</button>
              <button
                class="btn-danger"
                :disabled="confirmText !== 'DELETE'"
                @click="onConfirm"
              >
                <Trash2 :size="13" /> Eliminar usuario
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { AlertTriangle, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  show:    { type: Boolean, required: true },
  usuario: { type: Object,  default: null  },
})

const emit = defineEmits(['close', 'confirm'])

const confirmText = ref('')

// Reset al abrir el modal
watch(() => props.show, (val) => { if (val) confirmText.value = '' })

const onConfirm = () => {
  if (confirmText.value !== 'DELETE') return
  emit('confirm', props.usuario)
}

// ── Helpers visuales ──────────────────────────────────────
const roleBadgeClass = {
  ADMIN:       'bg-[#FEE2E2] text-[#B91C1C]',
  COMERCIAL:   'bg-[#DBEAFE] text-[#1D4ED8]',
  SUPERVISOR:  'bg-[#EDE9FE] text-[#7C3AED]',
  LOGISTICA:   'bg-[#DCFCE7] text-[#16A34A]',
  COORDINADOR: 'bg-[#FEF3C7] text-[#B45309]',
  FINANCIERO:  'bg-[#FFEDD5] text-[#C2410C]',
  SOPORTE:     'bg-[#F1F5F9] text-[#64748B]',
}

const AVATAR_COLORS = ['#054EAF','#7C3AED','#B45309','#B91C1C','#16A34A','#0891B2','#C2410C']
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
const getInitials = (name) =>
  (name ?? '').trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
</script>

<style scoped>
/* ── Card ───────────────────────────────────────────── */
.del-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 20px 60px rgba(15, 26, 46, 0.18);
}

/* ── Ícono ──────────────────────────────────────────── */
.del-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #FEE2E2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  flex-shrink: 0;
}

/* ── Texto ──────────────────────────────────────────── */
.del-body { text-align: center; }

.del-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 8px;
}

.del-desc {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin: 0;
  line-height: 1.6;
}

/* ── Card usuario ───────────────────────────────────── */
.del-user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: 12px;
  padding: 12px 14px;
}

.del-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.del-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.del-user-name {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.del-user-email {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Input confirmación ─────────────────────────────── */
.del-confirm-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.del-confirm-label {
  font-size: 12px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.del-code {
  font-family: 'JetBrains Mono', monospace;
  background: #F1F5F9;
  color: #B91C1C;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}

.del-confirm-input {
  width: 100%;
  padding: 9px 14px;
  border: 1.5px solid #E2EBF6;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: #0F172A;
  background: #F8FAFC;
  outline: none;
  letter-spacing: 0.08em;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
}

.del-confirm-input:focus { border-color: #054EAF; }

.del-input-ready {
  border-color: #16A34A !important;
  background: #F0FDF4;
  color: #15803D;
}

/* ── Footer ─────────────────────────────────────────── */
.del-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
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
  transition: all 0.15s ease;
}

.btn-ghost:hover { background: #F8FAFC; color: #0F172A; }

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 10px;
  border: none;
  background: #EF4444;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-danger:hover:not(:disabled) { background: #DC2626; }

.btn-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Transiciones ───────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to       { opacity: 0; }

.modal-scale-enter-active { transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), opacity 0.18s ease; }
.modal-scale-leave-active  { transition: transform 0.15s ease, opacity 0.15s ease; }
.modal-scale-enter-from   { transform: scale(0.92); opacity: 0; }
.modal-scale-leave-to     { transform: scale(0.95); opacity: 0; }
</style>
