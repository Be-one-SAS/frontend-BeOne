<template>
  <div class="w-full bg-primary-light rounded-[var(--r-md)] p-4 flex justify-between items-center border border-[#BFDBFE]">
    <div class="flex-1 text-center text-[13px] text-text-1">
      <span class="font-semibold text-primary">Q de Motores:</span> {{ motores }}
    </div>
    <div class="flex-1 text-center text-[13px] text-text-1 border-l border-r border-[#BFDBFE]">
      <span class="font-semibold text-primary">Q de Amperios:</span> {{ amperios }}
    </div>
    <div class="flex-1 text-center text-[13px] text-text-1">
      <span class="font-semibold text-primary">Precio unitario:</span> ${{ precio.toFixed(2) }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  motores: {
    type: Number,
    default: 0
  },
  amperios: {
    type: Number,
    default: 0
  },
  precio: {
    type: Number,
    default: 0
  }
})
</script>