<template>
  <div class="status-wrap">
    <div class="status-card">
      <div class="status-code">404</div>
      <div class="status-icon">
        <FileSearch :size="44" color="#94A3B8" />
      </div>
      <h1 class="status-title">Página no encontrada</h1>
      <p class="status-sub">La ruta <code class="status-path">{{ currentPath }}</code> no existe.</p>
      <div class="status-actions">
        <button class="status-btn status-btn--primary" @click="router.push('/dashboard')">Ir al inicio</button>
        <button class="status-btn status-btn--ghost" @click="router.back()">Volver atrás</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { FileSearch } from 'lucide-vue-next'

const router = useRouter()
const route  = useRoute()
const currentPath = computed(() => route.path)
</script>

<style scoped>
.status-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
}
.status-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 56px;
  text-align: center;
  box-shadow: 0 4px 32px rgba(39,200,216,.09);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 420px;
  width: 90%;
}
.status-code {
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  font-size: 72px;
  font-weight: 800;
  color: #E2E8F0;
  line-height: 1;
  letter-spacing: -2px;
}
.status-icon { margin: -4px 0 4px; }
.status-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}
.status-sub {
  font-size: 13px;
  color: #64748B;
  margin: 0;
  line-height: 1.5;
}
.status-path {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #F1F5F9;
  padding: 1px 6px;
  border-radius: 4px;
  color: #475569;
}
.status-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.status-btn {
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  border: none;
  transition: background .15s, color .15s;
}
.status-btn--primary {
  background: #27C8D8;
  color: #fff;
}
.status-btn--primary:hover { background: #1BAEBB; }
.status-btn--ghost {
  background: #F1F5F9;
  color: #475569;
}
.status-btn--ghost:hover { background: #E2E8F0; }
</style>
