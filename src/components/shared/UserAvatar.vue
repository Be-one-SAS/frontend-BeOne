<template>
  <div class="flex items-center gap-3 cursor-pointer">
    <!-- Avatar -->
    <div
      class="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center overflow-hidden"
    >
      <img
        v-if="src"
        :src="src"
        alt="User avatar"
        class="h-full w-full object-cover"
      />
      <span
        v-else
        class="text-[11px] font-medium text-primary"
      >
        {{ initials }}
      </span>
    </div>

    <!-- Name -->
    <span
      v-if="showName"
      class="text-[13px] font-medium text-text-1 hidden md:block"
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