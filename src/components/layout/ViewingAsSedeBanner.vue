<template>
  <div v-if="user?.isViewingAsSede" class="sede-banner">
    <Eye :size="15" />
    <span>Viendo como líder de <strong>{{ user.viewAsSedeName ?? user.sedeName }}</strong> — modo de solo lectura</span>
    <button class="sede-banner-exit" :disabled="exiting" @click="onExit">
      <LogOut :size="14" />
      Salir
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Eye, LogOut } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const { user, exitSede } = useAuth()
const exiting = ref(false)

async function onExit() {
  exiting.value = true
  try {
    await exitSede()
    // Recarga completa por la misma razón que en SedeSwitcher: hay que
    // refrescar toda página/composable abierto con la identidad real.
    window.location.href = '/dashboard'
  } finally {
    exiting.value = false
  }
}
</script>

<style scoped>
.sede-banner {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  background: #FFF7ED;
  border: 1px solid #FED7AA;
  color: #9A3412;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}

.sede-banner-exit {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 99px;
  border: 1px solid #FDBA74;
  background: #FFFFFF;
  color: #9A3412;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.sede-banner-exit:hover { background: #FFEDD5; }
.sede-banner-exit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
