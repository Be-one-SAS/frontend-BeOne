<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="pcm-overlay">
        <Transition name="modal-scale">
          <div v-if="show" class="pcm-card">
            <div class="pcm-icon-wrap">
              <Trash2 :size="26" />
            </div>

            <div class="pcm-body">
              <h3 class="pcm-title">{{ title }}</h3>
              <p class="pcm-message">{{ message }}</p>
            </div>

            <div class="pcm-field">
              <label class="pcm-label">Escribe <strong>ELIMINAR TODO</strong> para continuar</label>
              <input
                v-model="phrase"
                class="pcm-input"
                type="text"
                autocomplete="off"
                placeholder="ELIMINAR TODO"
                :disabled="loading"
              />
            </div>

            <div class="pcm-field">
              <label class="pcm-label">Clave de seguridad</label>
              <input
                v-model="secretKey"
                class="pcm-input"
                type="password"
                autocomplete="off"
                placeholder="Clave de administración"
                :disabled="loading"
              />
            </div>

            <p v-if="error" class="pcm-error">{{ error }}</p>

            <div class="pcm-footer">
              <button class="pcm-btn-ghost" :disabled="loading" @click="onCancel">Cancelar</button>
              <button
                class="pcm-btn-confirm"
                :disabled="!canConfirm || loading"
                @click="onConfirm"
              >{{ loading ? 'Eliminando…' : confirmLabel }}</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Trash2 } from 'lucide-vue-next'

const props = defineProps({
  show:         { type: Boolean, required: true },
  title:        { type: String,  required: true },
  message:      { type: String,  required: true },
  confirmLabel: { type: String,  default: 'Eliminar todo' },
  loading:      { type: Boolean, default: false },
  error:        { type: String,  default: '' },
})
const emit = defineEmits(['confirm', 'cancel'])

const phrase    = ref('')
const secretKey = ref('')

const canConfirm = computed(() =>
  phrase.value.trim() === 'ELIMINAR TODO' && secretKey.value.trim().length > 0
)

// Limpiar campos sensibles cada vez que el modal se cierra/abre.
watch(() => props.show, () => { phrase.value = ''; secretKey.value = '' })

function onCancel() { emit('cancel') }
function onConfirm() {
  if (!canConfirm.value) return
  emit('confirm', { confirmPhrase: phrase.value.trim(), secretKey: secretKey.value })
}
</script>

<style scoped>
.pcm-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 26, 46, 0.45);
  backdrop-filter: blur(4px);
}

.pcm-card {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 60px rgba(15, 26, 46, 0.18);
}

.pcm-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  flex-shrink: 0;
  background: #FEE2E2;
  color: #B91C1C;
}

.pcm-body { text-align: center; }
.pcm-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 8px;
}
.pcm-message {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin: 0;
  line-height: 1.6;
}

.pcm-field { display: flex; flex-direction: column; gap: 5px; }
.pcm-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: 'Inter', sans-serif;
}
.pcm-label strong { color: #B91C1C; }

.pcm-input {
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pcm-input:focus { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
.pcm-input:disabled { opacity: 0.6; }
.pcm-input::placeholder { color: #94A3B8; }

.pcm-error {
  font-size: 12px;
  color: #B91C1C;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 8px 10px;
  margin: 0;
  font-family: 'Inter', sans-serif;
}

.pcm-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 4px;
  border-top: 1px solid #F0FAFB;
}
.pcm-btn-ghost {
  padding: 9px 18px;
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
.pcm-btn-ghost:hover { background: #F8FAFC; color: #0F172A; }
.pcm-btn-ghost:disabled { opacity: 0.6; cursor: not-allowed; }

.pcm-btn-confirm {
  padding: 9px 18px;
  border-radius: 10px;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s ease;
  background: #EF4444;
}
.pcm-btn-confirm:hover:not(:disabled) { background: #DC2626; }
.pcm-btn-confirm:disabled { background: #FCA5A5; cursor: not-allowed; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to       { opacity: 0; }

.modal-scale-enter-active { transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), opacity 0.18s ease; }
.modal-scale-leave-active { transition: transform 0.15s ease, opacity 0.15s ease; }
.modal-scale-enter-from   { transform: scale(0.92); opacity: 0; }
.modal-scale-leave-to     { transform: scale(0.95); opacity: 0; }
</style>
