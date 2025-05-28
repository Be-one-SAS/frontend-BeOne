<!-- components/layout/MenuItem.vue -->
<template>
    <div>
        <!-- Si hay una ruta directa, se muestra como un solo enlace -->
        <router-link
            v-if="route"
            :to="route"
            class="flex items-center gap-2 cursor-pointer select-none mt-1 hover:text-blue-700"
        >
            <component :is="`Icon${icon}`" />
            <span>{{ label }}</span>
        </router-link>

        <!-- Si no hay ruta directa, se muestran los subItems expandibles -->
        <div v-else>
            <div class="flex items-center gap-2 cursor-pointer select-none mt-1" @click="isOpen = !isOpen">
                <component :is="`Icon${icon}`" />
                <span>{{ label }}</span>
                <svg class="w-4 h-4 ml-auto transition-transform duration-200" :class="{ 'rotate-90': isOpen }" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </div>

            <div v-if="isOpen" class="ml-7 mt-3 space-y-2 text-sm text-gray-600">
                <router-link
                    v-for="item in items"
                    :key="item.route"
                    :to="item.route"
                    class="block hover:text-blue-700"
                >
                    {{ item.name }}
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    label: String,
    icon: String,
    items: Array,
    route: String,
});

const isOpen = ref(false);
</script>