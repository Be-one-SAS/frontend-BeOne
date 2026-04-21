<template>
    <div class="bg-card rounded-[var(--r-xl)] px-5 py-[18px] shadow-[var(--shadow-card)] flex items-center gap-4">
      <div class="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary text-lg">
        <slot name="icon" />
      </div>
      <div>
        <p class="text-[13px] text-text-2">{{ title }}</p>
        <p class="text-[32px] font-bold text-text-1 font-['Plus_Jakarta_Sans',sans-serif] leading-none">{{ value }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    title: String,
    value: [String, Number]
  })
  </script>