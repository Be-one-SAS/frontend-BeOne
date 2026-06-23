<template>
  <Transition name="loader-fade">
    <div v-if="visible" class="loader-overlay">
      <div class="loader-container">
        <div class="loader-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-logo">B1</div>
        </div>
        <p v-if="message" class="loader-message">{{ message }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  message: { type: String, default: '' }
})
</script>

<style scoped>
.loader-overlay {
  position: absolute;
  inset: 0;
  background: rgba(235, 243, 252, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: inherit;
}

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loader-spinner {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid #E5EAF0;
  border-top-color: #054EAF;
  animation: spin 0.8s linear infinite;
}

.spinner-logo {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: #054EAF;
  letter-spacing: -0.5px;
}

.loader-message {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loader-fade-enter-active { transition: opacity 0.25s ease; }
.loader-fade-leave-active { transition: opacity 0.2s ease; }
.loader-fade-enter-from,
.loader-fade-leave-to { opacity: 0; }
</style>
