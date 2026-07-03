<template>
  <div class="sl-wrap" ref="rootEl">
    <label v-if="label" class="text-[13px] font-medium text-text-1 mb-1 block">{{ label }}</label>
    <button
      type="button"
      class="sl-trigger"
      :class="{ 'sl-trigger--open': open }"
      :disabled="disabled"
      @click="toggle"
    >
      <span :class="{ 'sl-trigger-placeholder': !modelValue }">{{ selectedLabel }}</span>
      <ChevronDown :size="14" class="sl-chevron" :class="{ 'sl-chevron--open': open }" />
    </button>

    <Transition name="sl-fade">
      <ul v-if="open" class="sl-menu">
        <li
          v-for="opt in normalizedOptions"
          :key="opt.value"
          class="sl-option"
          :class="{ 'sl-option--active': opt.value === modelValue }"
          @click="select(opt.value)"
        >
          {{ opt.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  label:       { type: String, default: '' },
  modelValue:  { type: [String, Number, null], default: '' },
  options:     { type: Array, required: true }, // string[] o [{ value, label }]
  placeholder: { type: String, default: 'Seleccionar…' },
  disabled:    { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const open   = ref(false)
const rootEl = ref(null)

const normalizedOptions = computed(() =>
  props.options.map(o => (o && typeof o === 'object') ? o : { value: o, label: o })
)

const selectedLabel = computed(() => {
  const match = normalizedOptions.value.find(o => o.value === props.modelValue)
  return match ? match.label : props.placeholder
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function select(value) {
  emit('update:modelValue', value)
  open.value = false
}

function onClickOutside(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.sl-wrap { position: relative; width: 100%; }

.sl-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 99px;
  padding: 8px 16px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.sl-trigger:disabled { opacity: 0.6; cursor: not-allowed; }
.sl-trigger--open,
.sl-trigger:focus-visible {
  border-color: #27C8D8;
  box-shadow: 0 0 0 2px rgba(39,200,216,.12);
  outline: none;
}
.sl-trigger-placeholder { color: #94A3B8; }

.sl-chevron { color: #64748B; flex-shrink: 0; transition: transform 0.15s; }
.sl-chevron--open { transform: rotate(180deg); }

.sl-menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #E5EAF0;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(15,26,46,.12);
  padding: 6px;
  max-height: 220px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
}

.sl-option {
  padding: 8px 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
}
.sl-option:hover { background: #F8FAFC; }
.sl-option--active { background: #27C8D8; color: #fff; font-weight: 600; }

.sl-fade-enter-active, .sl-fade-leave-active { transition: opacity 0.12s, transform 0.12s; }
.sl-fade-enter-from, .sl-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
