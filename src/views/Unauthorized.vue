<template>
  <div class="unauth-wrap">
    <div class="unauth-card">
      <div class="unauth-icon">
        <ShieldOff :size="48" color="#EF4444" />
      </div>
      <h1 class="unauth-title">Acceso no autorizado</h1>
      <p class="unauth-sub">No tienes permisos para ver esta página.</p>
      <button class="unauth-btn" @click="goHome">Ir al inicio</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ShieldOff } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user } = useAuth()

const ROLE_HOME = {
  OPERATIVO:    '/admin/control',
  LOGISTICO:    '/admin/control',
  COORDINADOR:  '/admin/control',
  EJECUTIVO:    '/admin/control',
  EJECUTIVO_CUENTA: '/admin/control',
  SUPERVISOR:   '/dashboard',
  LIDER:        '/dashboard',
  DIRECCION:    '/dashboard',
  ADMINISTRADOR:'/dashboard',
  ADMIN:        '/dashboard',
}

function goHome() {
  const role = user.value?.roles?.[0]
  router.replace(ROLE_HOME[role] ?? '/login')
}
</script>

<style scoped>
.unauth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
}
.unauth-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 56px;
  text-align: center;
  box-shadow: 0 4px 32px rgba(39,200,216,.09);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.unauth-icon { margin-bottom: 4px; }
.unauth-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}
.unauth-sub {
  font-size: 14px;
  color: #64748B;
  margin: 0;
}
.unauth-btn {
  margin-top: 8px;
  padding: 10px 28px;
  background: #27C8D8;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background .15s;
}
.unauth-btn:hover { background: #1BAEBB; }
</style>
