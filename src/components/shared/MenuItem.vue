<!-- components/layout/MenuItem.vue -->
<template>
    <div>
        <div class="flex items-center gap-2 cursor-pointer select-none mt-5" @click="isOpen = !isOpen">
            <component :is="`Icon${icon}`" />
            <span>{{ label }}</span>
            <svg class="w-4 h-4 ml-auto transition-transform duration-200" :class="{ 'rotate-90': isOpen }" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
        </div>

        <div v-if="isOpen" class="ml-7 mt-3 space-y-2 text-sm text-gray-600">
            <router-link v-for="item in items" :key="item.route" :to="item.route" class="block hover:text-blue-700">
                {{ item.name }}
            </router-link>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
defineProps({
    label: String,
    icon: String,
    items: Array,
});
const isOpen = ref(false);
</script>