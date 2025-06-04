<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center backdrop-opacity-[.75] backdrop-blur-2xl">
      <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button @click="$emit('close')" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl">×</button>
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