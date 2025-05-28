<!-- components/InputLabel.vue -->
<template>
    <div>
      <label class="block text-gray-800 font-medium mb-1">{{ label }}</label>
      <input
        :type="type"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </template>
  
  <script setup>
  defineProps({
    label: String,
    modelValue: [String, Number],
    type: {
      type: String,
      default: 'text'
    }
  })
  
  defineEmits(['update:modelValue'])
  </script>