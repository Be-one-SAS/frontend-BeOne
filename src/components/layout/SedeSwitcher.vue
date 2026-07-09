<template>
  <div v-if="visible" class="ss-wrap" ref="rootEl">
    <button type="button" class="ss-trigger" :class="{ 'ss-trigger--open': open }" @click="toggle">
      <Building2 :size="14" />
      <span>Sede</span>
      <ChevronDown :size="13" class="ss-chevron" :class="{ 'ss-chevron--open': open }" />
    </button>

    <Transition name="ss-fade">
      <div v-if="open" class="ss-menu">
        <p v-if="loading" class="ss-empty">Cargando…</p>
        <ul v-else-if="otherSedes.length" class="ss-list">
          <li
            v-for="s in otherSedes"
            :key="s.id"
            class="ss-option"
            @click="select(s.id)"
          >
            <span class="ss-option-icon"><Building2 :size="14" /></span>
            <span class="ss-option-label">{{ s.nombre }}</span>
          </li>
        </ul>
        <p v-else class="ss-empty">No hay otras sedes para ver</p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Building2, ChevronDown } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import api from '@/services/api'

const { user, enterSede } = useAuth()

const open    = ref(false)
const rootEl  = ref(null)
const sedes   = ref([])
const loading = ref(false)

// Solo el rol BEONE lo ve, y solo mientras no está ya viendo una sede
// (hay que salir antes de entrar a otra — mantiene el backend simple).
const visible = computed(() =>
  !!user.value?.roles?.includes('BEONE') && !user.value?.isViewingAsSede
)

// No mostrar la sede propia del usuario (si tiene una) — "ver como líder de
// mi propia sede" no tiene sentido, ya la ve tal cual con su sesión normal.
const otherSedes = computed(() =>
  sedes.value.filter((s) => s.id !== user.value?.sedeId)
)

async function loadSedes() {
  loading.value = true
  try {
    const { data } = await api.get('/unidades-ejecucion/lista-simple')
    sedes.value = data
  } finally {
    loading.value = false
  }
}

function toggle() {
  open.value = !open.value
  // Refresca la lista cada vez que se abre — una sede recién creada en
  // /configuracion → Unidades de Ejecución debe aparecer sin recargar la página.
  if (open.value) loadSedes()
}

async function select(sedeId) {
  open.value = false
  await enterSede(sedeId)
  // Recarga completa: fuerza a que todas las páginas/composables abiertos
  // vuelvan a montarse y a pedir datos con el token nuevo (router.push a la
  // misma ruta sería un no-op y dejaría el dashboard con los datos viejos).
  window.location.href = '/dashboard'
}

function onClickOutside(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.ss-wrap { position: relative; }

.ss-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 99px;
  border: 1px solid #E5EAF0;
  background: #F8FAFC;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  white-space: nowrap;
}
.ss-trigger:hover { background: #F0FAFB; color: #27C8D8; border-color: #A7EEF5; }
.ss-trigger--open { border-color: #27C8D8; background: #F0FAFB; color: #27C8D8; box-shadow: 0 0 0 2px rgba(39,200,216,.12); }

.ss-chevron { color: inherit; flex-shrink: 0; transition: transform 0.15s; }
.ss-chevron--open { transform: rotate(180deg); }

.ss-menu {
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  background: #fff;
  border: 1px solid #E5EAF0;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(15,26,46,.14);
  padding: 6px;
}

.ss-list { max-height: 280px; overflow-y: auto; list-style: none; margin: 0; padding: 0; }

.ss-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  transition: background 0.12s;
}
.ss-option:hover { background: #F0FAFB; }

.ss-option-icon {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E0F9FA;
  color: #27C8D8;
}

.ss-option-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

.ss-empty {
  padding: 12px 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #94A3B8;
  text-align: center;
  margin: 0;
}

.ss-fade-enter-active, .ss-fade-leave-active { transition: opacity 0.12s, transform 0.12s; }
.ss-fade-enter-from, .ss-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
