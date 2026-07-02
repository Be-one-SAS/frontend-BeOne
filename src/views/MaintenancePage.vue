<template>
  <div class="maint-wrap">
    <div class="maint-card">
      <img src="@/assets/logo.svg" alt="BeOne" class="maint-logo" />
      <div class="maint-badge">
        <span class="maint-dot" />
        En mantenimiento
      </div>
      <div class="maint-icon">
        <Wrench :size="44" color="#27C8D8" />
      </div>
      <h1 class="maint-title">Estamos mejorando la plataforma</h1>
      <p class="maint-sub">
        BeOne está temporalmente fuera de servicio por tareas de mantenimiento.<br />
        Volveremos pronto.
      </p>
    </div>
  </div>
</template>

<script setup>
import { Wrench } from 'lucide-vue-next'
</script>

<style scoped>
.maint-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E0F9FA 0%, #F8FAFC 60%, #F0F9FF 100%);
}
.maint-card {
  background: #fff;
  border-radius: 24px;
  padding: 52px 60px;
  text-align: center;
  box-shadow: 0 8px 40px rgba(39,200,216,.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-width: 460px;
  width: 90%;
}
.maint-logo {
  height: 36px;
  width: auto;
  margin-bottom: 4px;
}
.maint-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #27C8D8;
  background: #E0F9FA;
  border: 1px solid #A7EEF5;
  padding: 4px 12px;
  border-radius: 99px;
}
.maint-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #27C8D8;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(.75); }
}
.maint-icon { margin: 4px 0; }
.maint-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
  line-height: 1.3;
}
.maint-sub {
  font-size: 14px;
  color: #64748B;
  margin: 0;
  line-height: 1.6;
}
</style>
