<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <button @click="$emit('close')" class="modal-close">×</button>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean
});
defineEmits(['close']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 26, 46, 0.4);
  backdrop-filter: blur(4px);
  padding: 16px;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(15, 26, 46, 0.18);
  width: 100%;
  max-width: 896px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F1F5F9;
  color: #64748B;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: background 0.15s, color 0.15s;
}
.modal-close:hover {
  background: #E2E8F0;
  color: #0F1A2E;
}

@media (max-width: 768px) {
  .modal-overlay { padding: 12px; }
  .modal-content { padding: 20px; border-radius: 20px; }
}

@media (max-width: 640px) {
  .modal-overlay { padding: 8px; align-items: flex-end; }
  .modal-content { padding: 16px; border-radius: 20px 20px 0 0; max-height: 85vh; }
}

@media (max-width: 480px) {
  .modal-overlay { padding: 0; }
  .modal-content { border-radius: 16px 16px 0 0; padding: 14px; }
  .modal-close { top: 12px; right: 12px; width: 32px; height: 32px; font-size: 18px; }
}
</style>