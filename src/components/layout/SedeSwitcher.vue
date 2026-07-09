<template>
  <div v-if="visible" class="sede-switcher">
    <SelectLabel
      :model-value="null"
      :options="sedeOptions"
      placeholder="Sede"
      :disabled="loading"
      @update:model-value="onSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SelectLabel from '@/components/input/SelectLabel.vue'
import { useAuth } from '@/composables/useAuth'
import api from '@/services/api'

const { user, enterSede } = useAuth()

const sedes = ref([])
const loading = ref(false)

// Solo el rol BEONE lo ve, y solo mientras no está ya viendo una sede
// (hay que salir antes de entrar a otra — mantiene el backend simple).
const visible = computed(() =>
  !!user.value?.roles?.includes('BEONE') && !user.value?.isViewingAsSede
)

const sedeOptions = computed(() => sedes.value.map((s) => ({ value: s.id, label: s.nombre })))

async function loadSedes() {
  if (sedes.value.length || loading.value) return
  loading.value = true
  try {
    const { data } = await api.get('/unidades-ejecucion/lista-simple')
    sedes.value = data
  } finally {
    loading.value = false
  }
}

async function onSelect(sedeId) {
  if (!sedeId) return
  await enterSede(sedeId)
  // Recarga completa: fuerza a que todas las páginas/composables abiertos
  // vuelvan a montarse y a pedir datos con el token nuevo (router.push a la
  // misma ruta sería un no-op y dejaría el dashboard con los datos viejos).
  window.location.href = '/dashboard'
}

onMounted(() => {
  if (visible.value) loadSedes()
})
</script>

<style scoped>
.sede-switcher {
  width: 150px;
}
</style>
