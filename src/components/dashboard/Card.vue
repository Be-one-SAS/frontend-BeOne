<template>
    <div class="bg-white rounded-xl shadow p-4 flex items-center space-x-4">
      <div class="text-blue-600 text-3xl">
        <slot name="icon" />
      </div>
      <div>
        <p class="text-gray-600 text-sm">{{ title }}</p>
        <p class="text-xl font-semibold text-gray-900">{{ value }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    title: String,
    value: [String, Number]
  })
  </script>