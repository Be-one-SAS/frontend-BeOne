<template>
    <div class="bg-white rounded-xl shadow p-4">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Pendientes Urgentes</h3>
      <table class="min-w-full text-sm text-gray-700">
        <thead>
          <tr class="text-left border-b">
            <th class="py-2">Tarea</th>
            <th class="py-2">Responsable</th>
            <th class="py-2">Vence</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tarea, i) in tareas" :key="i" class="border-b hover:bg-gray-50">
            <td class="py-2">{{ tarea.nombre }}</td>
            <td class="py-2">{{ tarea.responsable }}</td>
            <td class="py-2 text-red-600">{{ tarea.fecha }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  defineProps({
    tareas: Array
  })
  </script>