<!-- layouts/MainLayout.vue -->
<template>
    <div class="flex flex-row">
        <Sidebar /> <!-- Menú persistente -->
        <div class="flex flex-col w-full p-6 gap-5 h-full">
            <router-view /> <!-- Área que se actualiza -->
        </div>
    </div>
</template>

<script setup>
import Sidebar from '../shared/Sidebar.vue';

</script>