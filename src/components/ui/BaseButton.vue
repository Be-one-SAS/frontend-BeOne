<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
  >
    <!-- Spinner -->
    <svg
      v-if="loading"
      class="animate-spin h-4 w-4 mr-2"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>

    <span>
      <slot />
    </span>
  </button>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  variant: {
    type: String,
    default: "primary", // primary | secondary
  },
  type: {
    type: String,
    default: "button",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  fullWidth: {
    type: Boolean,
    default: true,
  },
})

const buttonClasses = computed(() => {
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"

  const variants = {
    primary:
      "bg-cyan-500 text-white hover:bg-cyan-600 active:scale-[0.98]",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-[0.98]",
  }

  return [
    base,
    variants[props.variant],
    props.fullWidth ? "w-full" : "",
  ].join(" ")
})
</script>