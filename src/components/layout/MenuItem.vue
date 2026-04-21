<template>
  <div class="menu-item-wrap">

    <!-- ══ ITEM SIMPLE (ruta directa) ══ -->
    <RouterLink
      v-if="route && !items?.length"
      :to="route"
      class="menu-link"
      :class="{ 'menu-link--active': isActive }"
      :title="!isExpanded ? label : undefined"
    >
      <component :is="icon" class="menu-icon" />
      <Transition name="label-fade">
        <span v-if="isExpanded" class="menu-label">{{ label }}</span>
      </Transition>
    </RouterLink>

    <!-- ══ ITEM CON SUBMENÚ (dropdown) ══ -->
    <div v-else>
      <button
        class="menu-link menu-link--parent"
        :class="{ 'menu-link--active': isParentActive }"
        :title="!isExpanded ? label : undefined"
        @click="isExpanded ? $emit('toggle') : null"
      >
        <component :is="icon" class="menu-icon" />

        <Transition name="label-fade">
          <span v-if="isExpanded" class="menu-label">{{ label }}</span>
        </Transition>

        <Transition name="label-fade">
          <ChevronRight
            v-if="isExpanded"
            class="menu-chevron"
            :class="{ 'menu-chevron--open': isOpen }"
          />
        </Transition>
      </button>

      <!-- Submenú animado -->
      <Transition name="submenu">
        <div v-if="isOpen && isExpanded" class="submenu">
          <RouterLink
            v-for="child in items"
            :key="child.route"
            :to="child.route"
            class="submenu-link"
            :class="{ 'submenu-link--active': routeIsActive(child.route) }"
          >
            <component
              v-if="child.icon"
              :is="child.icon"
              class="submenu-icon"
            />
            <span>{{ child.label }}</span>
          </RouterLink>
        </div>
      </Transition>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  /** Componente de ícono Lucide (no string) */
  icon:       { type: [Object, Function], required: true },
  label:      { type: String, required: true },
  /** Ruta directa (sin hijos) */
  route:      { type: String, default: null },
  /** Subitems: [{ label, route, icon }] */
  items:      { type: Array, default: () => [] },
  /** Si el dropdown está abierto */
  isOpen:     { type: Boolean, default: false },
  /** Si el sidebar está expandido */
  isExpanded: { type: Boolean, default: true },
})

defineEmits(['toggle'])

const currentRoute = useRoute()

/** Activo para ítems con ruta directa */
const isActive = computed(() =>
  props.route ? currentRoute.path === props.route : false
)

/** Activo para ítem padre cuando algún hijo está activo */
const isParentActive = computed(() => {
  if (!props.items?.length) return false
  return props.items.some(c => routeIsActive(c.route))
})

/** Compara path exacto */
const routeIsActive = (path) => currentRoute.path === path
</script>

<style scoped>
/* ── Wrapper ─────────────────────────────────────────── */
.menu-item-wrap { width: 100%; }

/* ── Link base (shared por RouterLink y button) ──────── */
.menu-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  color: #64748B;
  text-decoration: none;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
}

.menu-link:hover {
  background: #EBF3FC;
  color: #054EAF;
}

.menu-link--active {
  background: #EBF3FC;
  color: #054EAF;
  font-weight: 600;
}

/* ── Ícono ───────────────────────────────────────────── */
.menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ── Label ───────────────────────────────────────────── */
.menu-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Chevron ─────────────────────────────────────────── */
.menu-chevron {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-left: auto;
  transition: transform 0.2s ease;
}

.menu-chevron--open {
  transform: rotate(90deg);
}

/* ── Submenú ─────────────────────────────────────────── */
.submenu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  padding-left: 28px;
}

.submenu-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  color: #64748B;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
}

.submenu-link:hover {
  background: #EBF3FC;
  color: #054EAF;
}

.submenu-link--active {
  background: #EBF3FC;
  color: #054EAF;
  font-weight: 600;
}

.submenu-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  opacity: 0.75;
}

/* ── Transición label ────────────────────────────────── */
.label-fade-enter-active {
  transition: opacity 0.15s ease 0.08s;
}
.label-fade-leave-active {
  transition: opacity 0.08s ease;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
}

/* ── Transición submenú (max-height) ─────────────────── */
.submenu-enter-active,
.submenu-leave-active {
  transition: max-height 0.22s ease, opacity 0.18s ease;
  overflow: hidden;
}
.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}
.submenu-enter-to,
.submenu-leave-from {
  max-height: 320px;
  opacity: 1;
}
</style>
