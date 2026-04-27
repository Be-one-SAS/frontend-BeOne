<template>
  <div class="ph-wrapper" ref="wrapperRef">
    <!-- Trigger -->
    <button class="ph-trigger" @click="open = !open" :aria-expanded="open">
      <!-- Avatar -->
      <div class="ph-avatar" :style="{ background: avatarColor }">
        <img v-if="userPhoto" :src="userPhoto" alt="Avatar" class="ph-avatar-img" />
        <span v-else>{{ userInitials }}</span>
      </div>

      <!-- Name + role (desktop only) -->
      <div class="ph-info hidden md:flex">
        <span class="ph-name">{{ displayName }}</span>
      </div>

      <ChevronDown class="ph-chevron hidden md:block" :class="{ 'ph-chevron--open': open }" :size="14" />
    </button>

    <!-- Dropdown -->
    <Transition name="dd-fade">
      <div v-if="open" class="ph-dropdown">
        <!-- User summary -->
        <div class="ph-dd-header">
          <div class="ph-dd-avatar" :style="{ background: avatarColor }">
            <img v-if="userPhoto" :src="userPhoto" alt="Avatar" class="ph-avatar-img" />
            <span v-else>{{ userInitials }}</span>
          </div>
          <div class="ph-dd-info">
            <p class="ph-dd-name">{{ displayName }}</p>
            <p class="ph-dd-email">{{ user?.email }}</p>
          </div>
        </div>

        <div class="ph-dd-sep" />

        <!-- Ver perfil -->
        <RouterLink to="/admin/perfil" class="ph-dd-item" @click="open = false">
          <User :size="15" />
          Ver perfil
        </RouterLink>

        <div class="ph-dd-sep" />

        <!-- Cerrar sesión -->
        <button class="ph-dd-item ph-dd-item--danger" @click="handleLogout">
          <LogOut :size="15" />
          Cerrar sesión
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, User, LogOut } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useSidebarPermissions } from '@/composables/useSidebarPermissions'

const { user, setLogout } = useAuth()
const { userRole, roleBadgeStyle, userInitials, avatarColor, displayName } = useSidebarPermissions()
const router = useRouter()

const open = ref(false)
const wrapperRef = ref(null)
const userPhoto = ref('')

const handleLogout = () => {
  open.value = false
  setLogout()
  router.push('/login')
}

const onClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.ph-wrapper {
  position: relative;
}

.ph-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px 5px 5px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.ph-trigger:hover {
  background: #EBF3FC;
}

.ph-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
  overflow: hidden;
}

.ph-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ph-info {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.ph-name {
  font-size: 13px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  line-height: 1;
}

.ph-role {
  font-size: 10px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 1px 7px;
  border-radius: 99px;
  white-space: nowrap;
  line-height: 1.4;
}

.ph-chevron {
  color: #94A3B8;
  transition: transform 0.18s ease;
  flex-shrink: 0;
}

.ph-chevron--open {
  transform: rotate(180deg);
}

/* ── Dropdown ──────────────────────────────────────────── */
.ph-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(15, 26, 46, 0.14), 0 2px 8px rgba(15, 26, 46, 0.06);
  border: 1px solid #E5EAF0;
  padding: 8px;
  z-index: 100;
  overflow: hidden;
}

.ph-dd-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
}

.ph-dd-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
  overflow: hidden;
}

.ph-dd-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ph-dd-name {
  font-size: 13px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ph-dd-email {
  font-size: 11px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ph-dd-sep {
  height: 1px;
  background: #F1F5FA;
  margin: 4px 0;
}

.ph-dd-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.13s;
}

.ph-dd-item:hover {
  background: #EBF3FC;
  color: #054EAF;
}

.ph-dd-item--danger {
  color: #B91C1C;
}

.ph-dd-item--danger:hover {
  background: #FEE2E2;
  color: #B91C1C;
}

/* ── Transition ────────────────────────────────────────── */
.dd-fade-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dd-fade-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.dd-fade-enter-from,
.dd-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
