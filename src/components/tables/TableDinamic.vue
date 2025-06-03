<template>
    <div class="overflow-auto rounded-xl shadow border border-gray-200">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gray-100">
          <tr>
            <th
              v-for="(header, index) in headers"
              :key="index"
              class="px-4 py-3 text-left text-sm font-semibold text-gray-700"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
            <td
              v-for="(header, colIndex) in headers"
              :key="colIndex"
              class="px-4 py-2 text-sm text-gray-700 whitespace-nowrap w-auto max-w-[150px] overflow-auto"
            >
              {{ row[header] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  defineProps({
    headers: {
      type: Array,
      required: true
    },
    rows: {
      type: Array,
      required: true
    }
  });
  </script>