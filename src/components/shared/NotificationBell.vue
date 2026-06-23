<template>
  <div class="nb-wrapper" ref="wrapperRef">
    <!-- Trigger -->
    <button class="nb-trigger" @click="toggle" :aria-label="`${unread} notificaciones sin leer`">
      <Bell :size="18" />
      <span v-if="unread > 0" class="nb-badge">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <!-- Dropdown -->
    <Transition name="nb-fade">
      <div v-if="open" class="nb-dropdown">
        <div class="nb-header">
          <span class="nb-title">Notificaciones</span>
          <button v-if="unread > 0" class="nb-mark-all" @click="markAllRead">
            Marcar todas como leídas
          </button>
        </div>

        <div class="nb-list" v-if="notifications.length">
          <div
            v-for="n in notifications.slice(0, 20)"
            :key="n.id"
            class="nb-item"
            :class="{ 'nb-item--unread': !n.read }"
            @click="handleClick(n)"
          >
            <div class="nb-icon" :class="`nb-icon--${n.type}`">
              <component :is="iconFor(n.type)" :size="14" />
            </div>
            <div class="nb-content">
              <p class="nb-item-title">{{ n.title }}</p>
              <p class="nb-item-msg">{{ n.message }}</p>
              <p class="nb-item-time">{{ relativeTime(n.createdAt) }}</p>
            </div>
            <div v-if="!n.read" class="nb-dot" />
          </div>
        </div>

        <div v-else class="nb-empty">
          <BellOff :size="28" class="nb-empty-icon" />
          <p>Sin notificaciones</p>
        </div>

        <div v-if="notifications.length" class="nb-footer">
          <button class="nb-clear" @click="clear">Limpiar todo</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, BellOff, FileText, CheckCircle, ClipboardList, Info } from 'lucide-vue-next'
import { useNotifications } from '@/composables/useNotifications'

const { notifications, unread, markRead, markAllRead, clear } = useNotifications()
const router = useRouter()

const open       = ref(false)
const wrapperRef = ref(null)

const toggle = () => { open.value = !open.value }

const onClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

function iconFor(type) {
  const map = {
    cotizacion_nueva:  FileText,
    cotizacion_estado: CheckCircle,
    tarea_asignada:    ClipboardList,
    tarea_estado:      CheckCircle,
    info:              Info,
  }
  return map[type] ?? Info
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora mismo'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

function handleClick(n) {
  markRead(n.id)
  if (n.link) {
    router.push(n.link)
    open.value = false
  }
}
</script>

<style scoped>
.nb-wrapper {
  position: relative;
}

.nb-trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  color: #64748B;
  transition: background 0.15s, color 0.15s;
}
.nb-trigger:hover {
  background: #EBF3FC;
  color: #054EAF;
}

.nb-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #E94560;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  font-family: 'Inter', sans-serif;
  border: 1.5px solid #fff;
}

/* ── Dropdown ──────────────────────────────────────────── */
.nb-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(15, 26, 46, 0.14), 0 2px 8px rgba(15, 26, 46, 0.06);
  border: 1px solid #E5EAF0;
  z-index: 200;
  overflow: hidden;
}

.nb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  border-bottom: 1px solid #F1F5FA;
}
.nb-title {
  font-size: 13px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}
.nb-mark-all {
  font-size: 11px;
  color: #054EAF;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  padding: 0;
}
.nb-mark-all:hover { text-decoration: underline; }

/* ── List ─────────────────────────────────────────────── */
.nb-list {
  max-height: 320px;
  overflow-y: auto;
}

.nb-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.13s;
  border-bottom: 1px solid #F8FAFC;
  position: relative;
}
.nb-item:hover { background: #F8FAFF; }
.nb-item--unread { background: #F0F6FF; }
.nb-item--unread:hover { background: #E8F2FF; }

.nb-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.nb-icon--cotizacion_nueva  { background: #DBEAFE; color: #1D4ED8; }
.nb-icon--cotizacion_estado { background: #D1FAE5; color: #065F46; }
.nb-icon--tarea_asignada    { background: #FEF3C7; color: #92400E; }
.nb-icon--tarea_estado      { background: #D1FAE5; color: #065F46; }
.nb-icon--info              { background: #E0E7FF; color: #3730A3; }

.nb-content { flex: 1; min-width: 0; }
.nb-item-title {
  font-size: 12px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nb-item-msg {
  font-size: 11px;
  color: #475569;
  font-family: 'Inter', sans-serif;
  margin: 0 0 3px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.nb-item-time {
  font-size: 10px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.nb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3B82F6;
  flex-shrink: 0;
  margin-top: 6px;
}

/* ── Empty ────────────────────────────────────────────── */
.nb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 20px;
  color: #94A3B8;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
}
.nb-empty-icon { opacity: 0.4; }

/* ── Footer ───────────────────────────────────────────── */
.nb-footer {
  padding: 8px 14px;
  border-top: 1px solid #F1F5FA;
  text-align: center;
}
.nb-clear {
  font-size: 11px;
  color: #94A3B8;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}
.nb-clear:hover { color: #E94560; }

/* ── Transition ───────────────────────────────────────── */
.nb-fade-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.nb-fade-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.nb-fade-enter-from,
.nb-fade-leave-to     { opacity: 0; transform: translateY(-6px) scale(0.97); }
</style>
