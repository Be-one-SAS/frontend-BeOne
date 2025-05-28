<template>
    <div class="bg-white rounded-xl shadow p-4 space-y-2">
      <h3 class="text-lg font-semibold text-gray-800">Mensajes Recientes</h3>
      <ul class="space-y-3">
        <li v-for="(msg, index) in mensajes" :key="index" class="border-b pb-2">
          <p class="font-medium">{{ msg.usuario }}</p>
          <p class="text-sm text-gray-600">{{ msg.mensaje }}</p>
          <p class="text-xs text-gray-400">{{ msg.fecha }}</p>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  defineProps({
    mensajes: Array
  })
  </script>