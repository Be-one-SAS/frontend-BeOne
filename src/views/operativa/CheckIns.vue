<template>
  <div class="page-placeholder">
    <div class="placeholder-icon"><MapPin :size="32" color="#054EAF" /></div>
    <h1 class="placeholder-title">Check-ins</h1>
    <p class="placeholder-sub">Módulo en construcción</p>
  </div>
</template>

<script setup>
import { MapPin } from 'lucide-vue-next'
</script>

<style scoped>
.page-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 300px;
  color: #94A3B8;
}
.placeholder-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #EBF3FC;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}
.placeholder-sub {
  font-size: 13px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}
</style>
