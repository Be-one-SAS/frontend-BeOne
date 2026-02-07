<template>
  <div class="w-full bg-gray-100 p-4 rounded shadow flex justify-between items-center text-sm text-gray-800">
    <div class="flex-1 text-center">
      <span class="font-semibold">Q de Motores:</span> {{ motores }}
    </div>
    <div class="flex-1 text-center border-l border-r border-gray-300">
      <span class="font-semibold">Q de Amperios:</span> {{ amperios }}
    </div>
    <div class="flex-1 text-center">
      <span class="font-semibold">Precio unitario:</span> ${{ precio.toFixed(2) }}
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