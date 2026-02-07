<template>
  <div class="flex bg-gray-100 h-screen">
    <!-- Sidebar fijo -->

    <Sidebar />
    <div class="flex-1 flex flex-col">
      <Topbar />


      <!-- Contenido principal con margen izquierdo -->
      <main class="flex-1 overflow-auto p-6 bg-white rounded-3xl mb-6 mr-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '../shared/Sidebar.vue';
import Topbar from './Topbar.vue';

</script>