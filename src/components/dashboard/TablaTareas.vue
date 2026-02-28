<template>
    <div class="bg-card rounded-[var(--r-xl)] shadow-[var(--shadow-card)] p-5">
      <h3 class="text-[16px] font-semibold text-text-1 mb-4 font-['Plus_Jakarta_Sans',sans-serif]">Pendientes Urgentes</h3>
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left border-b border-border-light">
            <th class="pb-2 text-[11px] font-medium text-text-3 uppercase">Tarea</th>
            <th class="pb-2 text-[11px] font-medium text-text-3 uppercase">Responsable</th>
            <th class="pb-2 text-[11px] font-medium text-text-3 uppercase">Vence</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tarea, i) in tareas" :key="i" class="border-b border-border-light">
            <td class="py-2 text-[13px] text-text-2">{{ tarea.nombre }}</td>
            <td class="py-2 text-[13px] text-text-2">{{ tarea.responsable }}</td>
            <td class="py-2 text-[13px] text-[#B91C1C]">{{ tarea.fecha }}</td>
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