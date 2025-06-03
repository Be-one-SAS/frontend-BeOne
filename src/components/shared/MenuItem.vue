<!-- components/layout/MenuItem.vue -->
<template>
    <div>
      <router-link
        v-if="route"
        :to="route"
        class="flex items-center gap-2 cursor-pointer select-none mt-1 hover:text-blue-700"
      >
        <component :is="`Icon${icon}`" />
        <span>{{ label }}</span>
      </router-link>
  
      <div v-else>
        <div class="flex items-center gap-2 cursor-pointer select-none mt-1" @click="$emit('toggle')">
          <component :is="`Icon${icon}`" />
          <span>{{ label }}</span>
          <svg
            class="w-4 h-4 ml-auto transition-transform duration-300"
            :class="{ 'rotate-90': isOpen }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
  
        <transition name="fade">
          <div v-show="isOpen" class="ml-7 mt-3 space-y-2 text-sm text-gray-600">
            <router-link
              v-for="item in items"
              :key="item.route"
              :to="item.route"
              class="block hover:text-blue-700"
            >
              {{ item.name }}
            </router-link>
          </div>
        </transition>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    label: String,
    icon: String,
    items: Array,
    route: String,
    isOpen: Boolean,
  });
  </script>
  
  <style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: all 0.3s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  .fade-enter-to, .fade-leave-from {
    opacity: 1;
    max-height: 500px;
    transform: translateY(0);
  }
  </style>