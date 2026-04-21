<template>
  <div class="collab-manager">
    <div class="collab-header">
      <div class="header-left">
        <Users :size="16" class="icon-brand" />
        <span class="collab-title">Colaboradores</span>
      </div>
      <button 
        type="button" 
        class="add-collab-btn" 
        @click="showSelector = !showSelector"
        :disabled="isReadOnly"
      >
        <Plus :size="14" /> Agregar
      </button>
    </div>

    <!-- Lista de miembros asignados -->
    <div v-if="members.length > 0" class="members-list">
      <div v-for="member in members" :key="member.user.id" class="member-chip">
        <div class="member-avatar" :style="{ background: getAvatarColor(member.user.fullName) }">
          {{ getInitials(member.user.fullName) }}
        </div>
        <div class="member-info">
          <span class="member-name">{{ member.user.fullName }}</span>
          <span class="member-role">{{ member.user.role || 'Invitado' }}</span>
        </div>
        <button 
          v-if="!isReadOnly"
          type="button" 
          class="remove-member" 
          @click="quitarMiembro(member.user.id)"
          title="Quitar acceso"
        >
          <X :size="13" />
        </button>
      </div>
    </div>
    
    <div v-else class="empty-collab">
      Solo tú tienes acceso a esta cotización.
    </div>

    <!-- Selector desplegable de usuarios (tipo popover) -->
    <Transition name="fade-down">
      <div v-if="showSelector" class="user-selector-card">
        <div class="selector-search">
          <Search :size="13" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar por nombre o correo..."
            class="search-input"
            autofocus
          />
        </div>
        
        <div class="selector-users">
          <div v-if="loadingUsers" class="selector-loading">Cargando usuarios...</div>
          <div v-else-if="filteredAvailableUsers.length === 0" class="selector-empty">
            No se encontraron más usuarios.
          </div>
          <button
            v-else
            v-for="u in filteredAvailableUsers"
            :key="u.id"
            type="button"
            class="user-option"
            @click="agregarMiembro(u)"
          >
            <div class="member-avatar" :style="{ background: getAvatarColor(u.fullName) }">
              {{ getInitials(u.fullName) }}
            </div>
            <div class="option-info">
              <span class="option-name">{{ u.fullName }}</span>
              <span class="option-email">{{ u.email }} | {{ u.role }}</span>
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Users, Plus, X, Search } from 'lucide-vue-next'
import { getUsers } from '@/services/users.service'
import { addQuotationMember, removeQuotationMember } from '@/services/quotation.service'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  quotationId: {
    type: [Number, String],
    default: null
  },
  initialMembers: {
    type: Array,
    default: () => []
  },
  isReadOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-members'])

const { user } = useAuth()
const currentUserId = computed(() => user.value?.id)

const members = ref([])
const showSelector = ref(false)
const searchQuery = ref('')
const allUsers = ref([])
const loadingUsers = ref(false)

// ─ Inicialización ──────────────────────────────
watch(() => props.initialMembers, (newMembers) => {
  if (newMembers) {
    members.value = [...newMembers]
  }
}, { immediate: true })

const loadAllUsers = async () => {
  if (allUsers.value.length > 0) return;
  loadingUsers.value = true;
  try {
    const rawUsers = await getUsers()
    // Filtramos solo usuarios activos
    allUsers.value = rawUsers?.filter(u => u.status !== 'Inactivo' && u.status !== 'Suspendido') || []
  } catch (error) {
    console.error("No se pudieron cargar usuarios para asignar", error)
  } finally {
    loadingUsers.value = false;
  }
}

watch(showSelector, (val) => {
  if (val) loadAllUsers()
  else searchQuery.value = ''
})

// ─ Lógica de visualización ─────────────────────
// Usuarios que NO están ya en la lista y no son el dueño actual si estuviera.
const availableUsers = computed(() => {
  const memberIds = members.value.map(m => m.user.id)
  return allUsers.value.filter(u => 
    !memberIds.includes(u.id) && u.id !== currentUserId.value
  )
})

const filteredAvailableUsers = computed(() => {
  if (!searchQuery.value) return availableUsers.value
  const q = searchQuery.value.toLowerCase()
  return availableUsers.value.filter(u => 
    u.fullName?.toLowerCase().includes(q) || 
    u.email?.toLowerCase().includes(q)
  )
})

// ─ Acciones de API (`id` requerido de Cotización)
const agregarMiembro = async (userData) => {
  // Optimizacion visual local
  const newMemberObj = {
    userId: userData.id,
    user: {
      id: userData.id,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role
    }
  }
  
  // Guardamos en servidor (si ya está creada la cotización)
  if (props.quotationId) {
    try {
      await addQuotationMember(props.quotationId, userData.id)
    } catch (e) {
      console.error("Error al añadir en bd", e)
      return
    }
  }
  
  // Reflejamos localmente
  members.value.push(newMemberObj)
  emit('update-members', members.value)
  showSelector.value = false
}

const quitarMiembro = async (userId) => {
  if (props.quotationId) {
    try {
      await removeQuotationMember(props.quotationId, userId)
    } catch (e) {
      console.error("Error al quitar de bd", e)
      return
    }
  }
  
  members.value = members.value.filter(m => m.user.id !== userId)
  emit('update-members', members.value)
}

// ─ Helpers Visuales ────────────────────────────
const AVATAR_COLORS = ['#054EAF', '#7C3AED', '#B45309', '#B91C1C', '#16A34A', '#0891B2']
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
const getInitials = (name) => (name ?? '').trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

</script>

<style scoped>
.collab-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  background: white;
  border: 1px solid #E2EBF6;
  border-radius: 12px;
  padding: 14px;
}

.collab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-brand {
  color: #054EAF;
}

.collab-title {
  font-size: 13px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}

.add-collab-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #054EAF;
  background: #EBF3FC;
  border: none;
  padding: 4px 10px;
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.add-collab-btn:hover:not(:disabled) {
  background: #DCECFB;
}
.add-collab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─ Lista de miembros ─ */
.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  padding: 4px 8px 4px 4px;
  border-radius: 99px;
}

.member-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 9px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.member-info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.member-name {
  font-size: 12px;
  font-weight: 600;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}

.member-role {
  font-size: 10px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
}

.remove-member {
  background: transparent;
  border: none;
  color: #94A3B8;
  padding: 2px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
  transition: all 0.15s;
}
.remove-member:hover {
  background: #FEE2E2;
  color: #B91C1C;
}

.empty-collab {
  font-size: 12px;
  color: #94A3B8;
  font-style: italic;
  font-family: 'Inter', sans-serif;
  padding: 4px 0;
}

/* ─ Popover de selección ─ */
.user-selector-card {
  position: absolute;
  top: 45px;
  right: 0;
  width: 260px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(5,78,175,0.15);
  border: 1px solid #E2EBF6;
  z-index: 50;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.selector-search {
  padding: 8px 12px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 18px;
  color: #94A3B8;
}

.search-input {
  width: 100%;
  border: 1px solid #E2EBF6;
  background: #F8FAFC;
  border-radius: 6px;
  padding: 6px 8px 6px 28px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  outline: none;
}
.search-input:focus {
  border-color: #054EAF;
}

.selector-users {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.selector-loading, .selector-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #94A3B8;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.user-option:hover {
  background: #F0F7FF;
}

.option-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.option-name {
  font-size: 12px;
  font-weight: 600;
  color: #0F1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-email {
  font-size: 10px;
  color: #64748B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Animations */
.fade-down-enter-active, .fade-down-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-down-enter-from, .fade-down-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
