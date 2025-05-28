<template>
    <div class="flex">
      <!-- Sidebar fijo -->
      <div class="fixed top-0 left-0 h-screen w-64 z-50 shadow-md bg-white">
        <Sidebar />
      </div>
  
      <!-- Contenido principal con margen izquierdo -->
      <div class="ml-64 w-full min-h-screen p-6">
        <router-view />
      </div>
    </div>
  </template>
  
  <script setup>
  import Sidebar from '../shared/Sidebar.vue';
  </script>