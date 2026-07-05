<template>
  <div class="bi-bar">
    <div class="bi-item">
      <span class="bi-lbl">Q de Motores:</span>
      <span class="bi-val">{{ motores }}</span>
    </div>
    <div class="bi-item bi-item--mid">
      <span class="bi-lbl">Q de Amperios:</span>
      <span class="bi-val">{{ amperios }}</span>
    </div>
    <div class="bi-item">
      <span class="bi-lbl">Precio unitario:</span>
      <span class="bi-val">${{ precio.toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  motores: { type: Number, default: 0 },
  amperios: { type: Number, default: 0 },
  precio: { type: Number, default: 0 }
})
</script>

<style scoped>
.bi-bar {
  width: 100%;
  background: #E0F9FA;
  border: 1px solid #A7EEF5;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  gap: 0;
  align-items: center;
}

.bi-item {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: #475569;
  font-family: 'Inter', sans-serif;
  padding: 0 12px;
}

.bi-item--mid {
  border-left: 1px solid #A7EEF5;
  border-right: 1px solid #A7EEF5;
}

.bi-lbl {
  font-weight: 700;
  color: #27C8D8;
}

.bi-val {
  font-weight: 600;
  color: #0F1A2E;
}

@media (max-width: 640px) {
  .bi-bar {
    flex-direction: column;
    gap: 8px;
    padding: 10px 14px;
  }
  .bi-item {
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: space-between;
    padding: 0;
    font-size: 12px;
  }
  .bi-item--mid {
    border: none;
  }
}

@media (max-width: 480px) {
  .bi-bar { padding: 8px 12px; gap: 6px; }
  .bi-item { font-size: 11px; }
}
</style>
