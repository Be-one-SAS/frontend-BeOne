<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="cm-overlay"
      >
        <Transition name="modal-scale">
          <div v-if="show" class="cm-card">
            <div class="cm-icon-wrap" :class="`cm-icon-wrap--${variant}`">
              <AlertTriangle v-if="variant !== 'danger'" :size="26" />
              <Trash2 v-else :size="26" />
            </div>

            <div class="cm-body">
              <h3 class="cm-title">{{ title }}</h3>
              <p class="cm-message">{{ message }}</p>
            </div>

            <div class="cm-footer">
              <button class="cm-btn-ghost" @click="$emit('cancel')">{{ cancelLabel }}</button>
              <button
                class="cm-btn-confirm"
                :class="`cm-btn-confirm--${variant}`"
                @click="$emit('confirm')"
              >{{ confirmLabel }}</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { AlertTriangle, Trash2 } from 'lucide-vue-next'

defineProps({
  show:         { type: Boolean, required: true },
  title:        { type: String,  required: true },
  message:      { type: String,  required: true },
  confirmLabel: { type: String,  default: 'Confirmar' },
  cancelLabel:  { type: String,  default: 'Cancelar' },
  variant:      { type: String,  default: 'warning' }, // warning | danger
})

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.cm-overlay {
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

.cm-card {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 20px 60px rgba(15, 26, 46, 0.18);
}

.cm-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  flex-shrink: 0;
}
.cm-icon-wrap--warning { background: #FFFBEB; color: #B45309; }
.cm-icon-wrap--danger  { background: #FEE2E2; color: #B91C1C; }

.cm-body { text-align: center; }
.cm-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 8px;
}
.cm-message {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin: 0;
  line-height: 1.6;
}

.cm-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 4px;
  border-top: 1px solid #F0FAFB;
}
.cm-btn-ghost {
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
.cm-btn-ghost:hover { background: #F8FAFC; color: #0F172A; }

.cm-btn-confirm {
  padding: 9px 18px;
  border-radius: 10px;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s ease;
}
.cm-btn-confirm--warning { background: #27C8D8; }
.cm-btn-confirm--warning:hover { background: #1BAEBB; }
.cm-btn-confirm--danger { background: #EF4444; }
.cm-btn-confirm--danger:hover { background: #DC2626; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to       { opacity: 0; }

.modal-scale-enter-active { transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), opacity 0.18s ease; }
.modal-scale-leave-active { transition: transform 0.15s ease, opacity 0.15s ease; }
.modal-scale-enter-from   { transform: scale(0.92); opacity: 0; }
.modal-scale-leave-to     { transform: scale(0.95); opacity: 0; }
</style>
