<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="`toast--${t.type}`"
          @click="dismissToast(t.id)"
        >
          <component :is="ICONS[t.type]" :size="18" class="toast-icon" />
          <span class="toast-message">{{ t.message }}</span>
          <button class="toast-close" @click.stop="dismissToast(t.id)"><X :size="14" /></button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismissToast } = useToast()

const ICONS = {
  error: XCircle,
  warning: AlertCircle,
  success: CheckCircle2,
  info: Info,
}
</script>

<style scoped>
.toast-stack {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 12000;
  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
  max-width: 380px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
  border-left: 4px solid #94A3B8;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}

.toast-icon { flex-shrink: 0; margin-top: 1px; }
.toast-message {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: #0F172A;
}
.toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 2px;
  border-radius: 6px;
  display: flex;
  transition: background 0.12s ease, color 0.12s ease;
}
.toast-close:hover { background: #F1F5F9; color: #475569; }

.toast--error   { border-left-color: #EF4444; }
.toast--error   .toast-icon { color: #EF4444; }
.toast--warning { border-left-color: #F59E0B; }
.toast--warning .toast-icon { color: #F59E0B; }
.toast--success { border-left-color: #16A34A; }
.toast--success .toast-icon { color: #16A34A; }
.toast--info    { border-left-color: #2563EB; }
.toast--info    .toast-icon { color: #2563EB; }

/* Entra deslizando desde la derecha, sale desvaneciendo */
.toast-enter-active { transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease; position: absolute; }
.toast-enter-from { opacity: 0; transform: translateX(60px); }
.toast-leave-to   { opacity: 0; transform: translateX(40px); }
.toast-move       { transition: transform 0.22s ease; }
</style>
