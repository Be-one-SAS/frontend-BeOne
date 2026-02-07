<template>
  <div class="flex items-center gap-3 cursor-pointer">
    <!-- Avatar -->
    <div
      class="h-9 w-9 rounded-full bg-gray-200 overflow-hidden
             flex items-center justify-center"
    >
      <img
        v-if="src"
        :src="src"
        alt="User avatar"
        class="h-full w-full object-cover"
      />
      <span
        v-else
        class="text-xs font-medium text-gray-500"
      >
        {{ initials }}
      </span>
    </div>

    <!-- Name -->
    <span
      v-if="showName"
      class="text-sm font-medium text-gray-700 hidden md:block"
    >
      {{ name }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: 'Daymer Perdomo'
  },
  src: {
    type: String,
    default: ''
  },
  showName: {
    type: Boolean,
    default: true
  }
})

const initials = computed(() =>
  props.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
)
</script>