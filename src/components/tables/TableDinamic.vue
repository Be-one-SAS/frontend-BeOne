<template>
  <div class="overflow-auto rounded-xl shadow border border-gray-200">
    <table class="w-full divide-y divide-gray-200">
      <thead class="bg-gray-100">
        <tr>
          <th
            v-for="(column, index) in columns"
            :key="index"
            class="px-4 py-3 text-left text-sm font-semibold text-gray-700"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>

      <tbody class="bg-white divide-y divide-gray-100">
        <tr
          v-for="(row, rowIndex) in data"
          :key="rowIndex"
          class="hover:bg-gray-50 cursor-pointer transition"
          @click="emit('row-click', row)"
        >
          <td
            v-for="(column, colIndex) in columns"
            :key="colIndex"
            class="px-4 py-2 text-sm text-gray-700 whitespace-nowrap w-auto max-w-[150px] overflow-auto"
          >
            <slot
              v-if="column.slot"
              :name="column.slot"
              :value="row[column.field]"
              :row="row"
            />
            <span v-else>
              {{ column.formatFn ? column.formatFn(row[column.field]) : row[column.field] }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['row-click'])
</script>