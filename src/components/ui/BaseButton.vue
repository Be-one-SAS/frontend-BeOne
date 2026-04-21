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
    "inline-flex items-center justify-center px-[18px] py-[9px] rounded-[8px] text-[13px] font-semibold transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"

  const variants = {
    primary:
      "bg-primary text-white shadow-[var(--shadow-btn)] hover:bg-primary-dark active:scale-[0.98]",
    secondary:
      "bg-primary-light text-primary border border-[#BFDBFE] hover:bg-[#DBEAFE] active:scale-[0.98]",
  }

  return [
    base,
    variants[props.variant],
    props.fullWidth ? "w-full" : "",
  ].join(" ")
})
</script>