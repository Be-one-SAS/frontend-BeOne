<template>
  <!-- Solo activo fuera de la página de login -->
  <template v-if="!isLoginPage">

    <!-- ── Barra de progreso superior ──────────────────── -->
    <Transition name="loader-bar">
      <div v-if="isLoading" class="progress-track">
        <div class="progress-fill" />
        <!-- Glow en el extremo derecho -->
        <div class="progress-glow" />
      </div>
    </Transition>

    <!-- ── Overlay para peticiones largas (>800ms) ─────── -->
    <Transition name="overlay-fade">
      <div
        v-if="isLoading && isLongRequest"
        class="loader-overlay"
      >
        <div class="loader-card">
          <div class="spinner" />
          <span class="loader-msg">{{ loadingMessage }}</span>
        </div>
      </div>
    </Transition>

  </template>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalLoader } from '@/composables/useGlobalLoader'

const { isLoading, loadingMessage } = useGlobalLoader()
const route = useRoute()

/** Excluir loader en páginas de autenticación */
const isLoginPage = computed(() =>
  route.path === '/login' || route.path === '/'
)

/**
 * El overlay solo aparece si la petición tarda más de 800ms.
 * Esto evita el parpadeo en peticiones rápidas.
 */
const isLongRequest = ref(false)
let longTimer = null

watch(isLoading, (active) => {
  if (active) {
    longTimer = setTimeout(() => {
      isLongRequest.value = true
    }, 800)
  } else {
    clearTimeout(longTimer)
    longTimer = null
    isLongRequest.value = false
  }
})

onUnmounted(() => {
  clearTimeout(longTimer)
})
</script>

<style scoped>
/* ── Barra de progreso ───────────────────────────────── */
.progress-track {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  height: 3px;
  overflow: visible;
  pointer-events: none;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    #054EAF 0%,
    #6EE7A0 50%,
    #054EAF 100%
  );
  background-size: 200% 100%;
  border-radius: 0 2px 2px 0;
  animation: loader-slide 1.6s ease-in-out infinite;
}

.progress-glow {
  position: absolute;
  right: 0;
  top: 0;
  width: 80px;
  height: 3px;
  background: #6EE7A0;
  filter: blur(4px);
  opacity: 0.9;
  animation: glow-pulse 1.6s ease-in-out infinite;
}

@keyframes loader-slide {
  0%   { width: 0%;   margin-left: 0;    background-position: 0% 0;   }
  40%  { width: 60%;  margin-left: 0;    background-position: 50% 0;  }
  70%  { width: 85%;  margin-left: 0;    background-position: 100% 0; }
  100% { width: 100%; margin-left: 0;    background-position: 200% 0; }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1;   }
}

/* ── Overlay ─────────────────────────────────────────── */
.loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(235, 243, 252, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.loader-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 14px 22px;
  box-shadow: 0 4px 24px rgba(5, 78, 175, 0.12);
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #EBF3FC;
  border-top-color: #054EAF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loader-msg {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

/* ── Transición barra ────────────────────────────────── */
.loader-bar-enter-active { transition: opacity 0.15s ease; }
.loader-bar-leave-active { transition: opacity 0.35s ease 0.1s; }
.loader-bar-enter-from,
.loader-bar-leave-to     { opacity: 0; }

/* ── Transición overlay ──────────────────────────────── */
.overlay-fade-enter-active { transition: opacity 0.25s ease; }
.overlay-fade-leave-active { transition: opacity 0.2s ease; }
.overlay-fade-enter-from,
.overlay-fade-leave-to     { opacity: 0; }
</style>
