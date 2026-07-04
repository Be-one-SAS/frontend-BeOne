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
      <div v-if="open" class="sl-menu">
        <input
          v-if="creatable"
          ref="searchInputEl"
          v-model="searchTerm"
          type="text"
          class="sl-search"
          :placeholder="searchPlaceholder"
          @keydown.enter.prevent="onEnter"
        />
        <ul class="sl-list">
          <li
            v-for="opt in filteredOptions"
            :key="opt.value"
            class="sl-option"
            :class="{ 'sl-option--active': opt.value === modelValue }"
            @click="select(opt.value)"
          >
            {{ opt.label }}
          </li>
          <li v-if="canCreate" class="sl-option sl-option--create" @click="createNew">
            <Plus :size="13" /> Crear "{{ searchTerm.trim() }}"
          </li>
          <li v-if="creatable && !filteredOptions.length && !canCreate" class="sl-empty">
            Sin resultados
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Plus } from 'lucide-vue-next'

const props = defineProps({
  label:             { type: String, default: '' },
  modelValue:        { type: [String, Number, null], default: '' },
  options:           { type: Array, required: true }, // string[] o [{ value, label }]
  placeholder:       { type: String, default: 'Seleccionar…' },
  disabled:          { type: Boolean, default: false },
  creatable:         { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: 'Buscar o escribir nueva…' },
})
const emit = defineEmits(['update:modelValue'])

const open          = ref(false)
const rootEl        = ref(null)
const searchInputEl = ref(null)
const searchTerm    = ref('')

const normalizedOptions = computed(() =>
  props.options.map(o => (o && typeof o === 'object') ? o : { value: o, label: o })
)

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.placeholder
  const match = normalizedOptions.value.find(o => o.value === props.modelValue)
  if (match) return match.label
  // creatable: el valor puede no existir aún en `options` (recién creado)
  return props.creatable ? props.modelValue : props.placeholder
})

const filteredOptions = computed(() => {
  if (!props.creatable || !searchTerm.value.trim()) return normalizedOptions.value
  const term = searchTerm.value.toLowerCase().trim()
  return normalizedOptions.value.filter(o => o.label.toLowerCase().includes(term))
})

const canCreate = computed(() => {
  if (!props.creatable) return false
  const term = searchTerm.value.trim()
  if (!term) return false
  return !normalizedOptions.value.some(o => o.label.toLowerCase() === term.toLowerCase())
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function select(value) {
  emit('update:modelValue', value)
  open.value = false
}

function createNew() {
  const val = searchTerm.value.trim()
  if (!val) return
  emit('update:modelValue', val)
  open.value = false
}

function onEnter() {
  if (canCreate.value) { createNew(); return }
  if (filteredOptions.value.length === 1) select(filteredOptions.value[0].value)
}

function onClickOutside(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) open.value = false
}

watch(open, (v) => {
  if (!v) return
  searchTerm.value = ''
  if (props.creatable) nextTick(() => searchInputEl.value?.focus())
})

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
}

.sl-search {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  outline: none;
  margin-bottom: 6px;
  box-sizing: border-box;
}
.sl-search:focus { border-color: #27C8D8; box-shadow: 0 0 0 2px rgba(39,200,216,.12); }

.sl-list {
  max-height: 220px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;
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

.sl-option--create {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #27C8D8;
  font-weight: 600;
  border-top: 1px solid #F1F5F9;
  margin-top: 4px;
  padding-top: 10px;
}
.sl-option--create:hover { background: rgba(39,200,216,.08); }

.sl-empty {
  padding: 10px 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #94A3B8;
  text-align: center;
}

.sl-fade-enter-active, .sl-fade-leave-active { transition: opacity 0.12s, transform 0.12s; }
.sl-fade-enter-from, .sl-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
