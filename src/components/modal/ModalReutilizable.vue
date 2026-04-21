<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,26,46,0.4)] backdrop-blur-sm">
      <div class="bg-card rounded-[var(--r-2xl)] shadow-[var(--shadow-modal)] w-full max-w-4xl p-6 relative">
        <button @click="$emit('close')" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F1F5F9] text-text-2 flex items-center justify-center hover:bg-border transition text-xl">×</button>
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