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
import { AlertCircle, CheckCircle2, Info, MapPin, X, XCircle } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismissToast } = useToast()

const ICONS = {
  error: XCircle,
  warning: AlertCircle,
  success: CheckCircle2,
  info: Info,
  prompt: MapPin,
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
  padding: 12px 14px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  border: 1px solid #E5EAF0;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  background: #F1F5F9;
}
.toast-icon svg { width: 15px; height: 15px; }
.toast-message {
  flex: 1;
  align-self: center;
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

/* Tarjeta con relleno suave del color semántico + ícono en badge de color
   sólido — reemplaza el viejo patrón "tarjeta blanca + barra lateral". */
.toast--error   { background: #FEF2F2; border-color: #FECACA; }
.toast--error   .toast-icon { background: #EF4444; color: #fff; }
.toast--warning { background: #FFFBEB; border-color: #FDE68A; }
.toast--warning .toast-icon { background: #F59E0B; color: #fff; }
.toast--success { background: #F0FDF4; border-color: #BBF7D0; }
.toast--success .toast-icon { background: #16A34A; color: #fff; }
.toast--info    { background: #EFF6FF; border-color: #BFDBFE; }
.toast--info    .toast-icon { background: #2563EB; color: #fff; }

/* ── "prompt": invita a hacer algo — deliberadamente distinto de los
   toasts de estado (sin barra lateral, relleno en degradado, forma de
   píldora) para que no se confunda con un error/warning. ── */
.toast--prompt {
  border-left: none;
  border-radius: 99px;
  padding: 10px 18px 10px 10px;
  background: linear-gradient(135deg, #FB923C 0%, #EA580C 100%);
  box-shadow: 0 12px 32px rgba(234, 88, 12, 0.32);
}
.toast--prompt .toast-icon {
  color: #fff;
  background: rgba(255, 255, 255, 0.22);
}
.toast--prompt .toast-message { color: #fff; font-weight: 600; }
.toast--prompt .toast-close   { color: rgba(255, 255, 255, 0.75); }
.toast--prompt .toast-close:hover { background: rgba(255, 255, 255, 0.18); color: #fff; }

/* Entra deslizando desde la derecha, sale desvaneciendo */
.toast-enter-active { transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease; position: absolute; }
.toast-enter-from { opacity: 0; transform: translateX(60px); }
.toast-leave-to   { opacity: 0; transform: translateX(40px); }
.toast-move       { transition: transform 0.22s ease; }
</style>
