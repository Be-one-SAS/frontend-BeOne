<template>
  <div class="layout-wrap">

    <!-- ── Loader global HTTP ─────────────────────────── -->
    <GlobalLoader />

    <!-- ── Sidebar ─────────────────────────────────────── -->
    <Sidebar />

    <!-- ── Área principal ─────────────────────────────── -->
    <div class="main-area">

      <!-- Topbar + botón hamburger mobile -->
      <header class="topbar">
        <!-- Hamburger (solo visible en mobile) -->
        <button
          class="hamburger-btn"
          :title="showMobile ? 'Cerrar menú' : 'Abrir menú'"
          @click="toggleMobile"
        >
          <X    v-if="showMobile" :size="20" />
          <Menu v-else            :size="20" />
        </button>

        <Topbar />
      </header>

      <!-- Contenido de la página -->
      <main class="page-content">
        <router-view />
      </main>

    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { Menu, X } from 'lucide-vue-next'
import Sidebar      from './Sidebar.vue'
import Topbar       from './Topbar.vue'
import GlobalLoader from '@/components/ui/GlobalLoader.vue'
import { useMobileSidebar } from '@/composables/useSidebarPermissions'
import { useNotifications } from '@/composables/useNotifications'
import { useAuth } from '@/composables/useAuth'

const { showMobile, toggle: toggleMobile } = useMobileSidebar()
const { connect, disconnect } = useNotifications()
const { token } = useAuth()

onMounted(() => {
  if (token.value) connect(token.value)
})

onBeforeUnmount(() => {
  disconnect()
})
</script>

<style scoped>
/* ── Layout raíz ─────────────────────────────────────── */
.layout-wrap {
  display: flex;
  background: #F0FAFB;
  height: 100vh;
  overflow: hidden;
}

/* ── Área de contenido ───────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 20px 24px 24px 24px;
  gap: 20px;
  overflow: hidden;
}

/* ── Topbar con hamburger ────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Hamburger oculto en desktop */
.hamburger-btn {
  display: none;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #E2EBF6;
  background: #FFFFFF;
  color: #475569;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
  box-shadow: 0 1px 4px rgba(39,200,216, .06);
}

.hamburger-btn:hover {
  background: #F0FAFB;
  color: #27C8D8;
}

/* ── Contenido scrollable ────────────────────────────── */
.page-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 0 4px 0;
}

/* ── Mobile ──────────────────────────────────────────── */
@media (max-width: 767px) {
  .main-area {
    padding: 16px;
    gap: 16px;
  }

  .hamburger-btn {
    display: flex;
  }

  /* El Topbar ocupa el espacio restante */
  .topbar :deep(.topbar-header) {
    flex: 1;
  }

  .page-content { gap: 16px; }
}

@media (max-width: 480px) {
  .main-area { padding: 10px; gap: 12px; }
  .page-content { gap: 12px; }
}

@media (max-width: 360px) {
  .main-area { padding: 8px; gap: 10px; }
  .page-content { gap: 10px; }
}
</style>
