<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="overlay"
      >
        <Transition name="modal-scale">
          <div v-if="show" class="modal-card">

            <!-- ── Header ──────────────────────────────── -->
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Cambiar roles</h2>
                <p class="modal-sub" v-if="usuario">
                  Asignar roles a
                  <strong class="text-text-1">{{ usuario.fullName }}</strong>
                </p>
              </div>
              <button class="btn-close" @click="$emit('close')">
                <X :size="18" />
              </button>
            </div>

            <!-- ── Usuario actual ──────────────────────── -->
            <div v-if="usuario" class="user-preview">
              <div class="avatar" :style="{ background: getAvatarColor(usuario.fullName) }">
                {{ getInitials(usuario.fullName) }}
              </div>
              <div class="user-info">
                <p class="u-name">{{ usuario.fullName }}</p>
                <p class="u-email">{{ usuario.email }}</p>
              </div>
              <div class="role-current-wrap">
                <span class="role-lbl">Roles actuales</span>
                <span class="role-current-badges">
                  <span
                    v-for="r in (usuario.roles ?? [])"
                    :key="r"
                    class="role-badge"
                    :class="ROLE_BADGE[r]"
                  >{{ r }}</span>
                </span>
              </div>
            </div>

            <!-- ── Grid de roles ───────────────────────── -->
            <div class="roles-section">
              <p class="section-title">Selecciona los roles (puedes marcar más de uno)</p>
              <div class="roles-grid">
                <button
                  v-for="rol in ROLE_CONFIG"
                  :key="rol.key"
                  class="role-card"
                  :class="{ 'role-card-selected': selectedRoles.includes(rol.key) }"
                  @click="toggleRole(rol.key)"
                >
                  <!-- Ícono -->
                  <div class="role-card-icon" :style="{ background: rol.iconBg }">
                    <component :is="rol.icon" :size="17" :color="rol.iconColor" />
                  </div>

                  <!-- Info -->
                  <div class="role-card-body">
                    <p class="role-card-name">{{ rol.key }}</p>
                    <p class="role-card-desc">{{ rol.description }}</p>
                  </div>

                  <!-- Badge -->
                  <span class="role-badge role-card-badge" :class="ROLE_BADGE[rol.key]">
                    {{ rol.key }}
                  </span>

                  <!-- Check -->
                  <div v-if="selectedRoles.includes(rol.key)" class="role-check">
                    <CheckCircle2 :size="16" color="#27C8D8" />
                  </div>
                </button>
              </div>
            </div>

            <!-- ── Advertencia ADMIN ────────────────────── -->
            <Transition name="warn-fade">
              <div v-if="selectedRoles.includes('ADMIN')" class="admin-warning">
                <AlertTriangle :size="15" class="warn-icon" />
                <p class="warn-text">
                  Este rol tiene acceso completo al sistema incluyendo
                  eliminación de datos y configuración global.
                  Asígnalo solo a personal autorizado.
                </p>
              </div>
            </Transition>

            <!-- ── Footer ──────────────────────────────── -->
            <div class="modal-footer">
              <button class="btn-ghost" @click="$emit('close')">Cancelar</button>
              <button
                class="btn-assign"
                :disabled="!selectedRoles.length || sameRoles"
                @click="asignar"
              >
                <Shield :size="14" />
                Asignar roles
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  X, Shield, AlertTriangle, CheckCircle2,
  TrendingUp, Eye, Truck, Users, UserCog, BarChart2, ScanEye,
  Briefcase, Gauge, MapPin,
} from 'lucide-vue-next'

// ── Props & Emits ─────────────────────────────────────
const props = defineProps({
  show:    { type: Boolean, required: true },
  usuario: { type: Object, default: null },
})
const emit = defineEmits(['close', 'save'])

// ── Selected roles state ──────────────────────────────
const selectedRoles = ref([])

const toggleRole = (role) => {
  selectedRoles.value = selectedRoles.value.includes(role)
    ? selectedRoles.value.filter(r => r !== role)
    : [...selectedRoles.value, role]
}

// true si el conjunto seleccionado es exactamente igual al actual (sin cambios)
const sameRoles = computed(() => {
  const current = props.usuario?.roles ?? []
  if (current.length !== selectedRoles.value.length) return false
  return current.every(r => selectedRoles.value.includes(r))
})

// Inicializar con los roles actuales del usuario al abrir
watch(() => props.show, (val) => {
  if (val && props.usuario) selectedRoles.value = [...(props.usuario.roles ?? [])]
  else selectedRoles.value = []
})

// ── Role config ───────────────────────────────────────
const ROLE_CONFIG = [
  {
    key:         'ADMIN',
    icon:        Shield,
    iconBg:      '#FEE2E2',
    iconColor:   '#B91C1C',
    description: 'Acceso total al sistema',
  },
  {
    key:         'ADMINISTRADOR',
    icon:        UserCog,
    iconBg:      '#CCEFF2',
    iconColor:   '#27C8D8',
    description: 'Gestión comercial y operativa',
  },
  {
    key:         'DIRECCION',
    icon:        BarChart2,
    iconBg:      '#EDE9FE',
    iconColor:   '#7C3AED',
    description: 'Supervisión y reportes',
  },
  {
    key:         'LIDER',
    icon:        TrendingUp,
    iconBg:      '#DCFCE7',
    iconColor:   '#16A34A',
    description: 'Cotizaciones y clientes',
  },
  {
    key:         'SUPERVISOR',
    icon:        Eye,
    iconBg:      '#FEF3C7',
    iconColor:   '#B45309',
    description: 'Reservas, inventario y control',
  },
  {
    key:         'COORDINADOR',
    icon:        Users,
    iconBg:      '#FFEDD5',
    iconColor:   '#C2410C',
    description: 'Coordinación en campo',
  },
  {
    key:         'EJECUTIVO',
    icon:        Briefcase,
    iconBg:      '#DBEAFE',
    iconColor:   '#2563EB',
    description: 'Cotizaciones y clientes propios',
  },
  {
    key:         'EJECUTIVO_CUENTA',
    icon:        Gauge,
    iconBg:      '#FCE7F3',
    iconColor:   '#BE185D',
    description: 'Ejecutivo de cuenta monitoreado por su líder',
  },
  {
    key:         'LOGISTICO',
    icon:        Truck,
    iconBg:      '#F1F5F9',
    iconColor:   '#64748B',
    description: 'Control operativo y materiales',
  },
  {
    key:         'OPERATIVO',
    icon:        Truck,
    iconBg:      '#D1FAE5',
    iconColor:   '#065F46',
    description: 'Responsable operativo de eventos',
  },
  {
    key:         'VISOR',
    icon:        ScanEye,
    iconBg:      '#E0E7FF',
    iconColor:   '#4338CA',
    description: 'Solo lectura — ve todo, no puede editar',
  },
  {
    key:         'BEONE',
    icon:        MapPin,
    iconBg:      '#FFF7ED',
    iconColor:   '#C2410C',
    description: 'Ver como líder de cualquier sede — solo lectura',
  },
]

const ROLE_BADGE = {
  ADMIN:         'bg-[#FEE2E2] text-[#B91C1C]',
  ADMINISTRADOR: 'bg-[#CCEFF2] text-[#27C8D8]',
  DIRECCION:     'bg-[#EDE9FE] text-[#7C3AED]',
  LIDER:         'bg-[#DCFCE7] text-[#16A34A]',
  SUPERVISOR:    'bg-[#FEF3C7] text-[#B45309]',
  COORDINADOR:   'bg-[#FFEDD5] text-[#C2410C]',
  EJECUTIVO:     'bg-[#DBEAFE] text-[#2563EB]',
  EJECUTIVO_CUENTA: 'bg-[#FCE7F3] text-[#BE185D]',
  LOGISTICO:     'bg-[#F1F5F9] text-[#64748B]',
  OPERATIVO:     'bg-[#D1FAE5] text-[#065F46]',
  VISOR:         'bg-[#E0E7FF] text-[#4338CA]',
  BEONE:         'bg-[#FFF7ED] text-[#C2410C]',
}

// ── Avatar helpers ────────────────────────────────────
const AVATAR_COLORS = ['#27C8D8', '#7C3AED', '#B45309', '#B91C1C', '#16A34A', '#27C8D8', '#C2410C']
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
const getInitials = (name) =>
  (name ?? '').trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

// ── Asignar ───────────────────────────────────────────
const asignar = () => {
  if (!selectedRoles.value.length || sameRoles.value) return
  emit('save', { usuario: props.usuario, nuevosRoles: [...selectedRoles.value] })
}
</script>

<style scoped>
/* ── Overlay ─────────────────────────────────────────── */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 26, 46, 0.45);
  backdrop-filter: blur(4px);
}

/* ── Modal card ──────────────────────────────────────── */
.modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 620px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(15, 26, 46, 0.18);
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 90vh;
  overflow-y: auto;
}

/* ── Header ──────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 2px;
}

.modal-sub {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.text-text-1 { color: #0F172A; }

.btn-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: transparent;
  color: #94A3B8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-close:hover { background: #F8FAFC; color: #0F172A; }

/* ── User preview ────────────────────────────────────── */
.user-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 14px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.u-name {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  font-family: 'Inter', sans-serif;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.u-email {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.role-current-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}

.role-lbl {
  font-size: 10px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.role-current-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

/* ── Roles section ───────────────────────────────────── */
.roles-section { display: flex; flex-direction: column; gap: 10px; }

.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* ── Roles grid ──────────────────────────────────────── */
.roles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* ── Role card ───────────────────────────────────────── */
.role-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 12px 12px;
  background: #FFFFFF;
  border: 2px solid #E2EBF6;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;
}

.role-card:hover {
  border-color: #C7D9F5;
  background: #F8FAFC;
}

.role-card-selected {
  border-color: #27C8D8 !important;
  background: #F0FAFB !important;
  box-shadow: 0 0 0 1px #27C8D8;
}

.role-card-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.role-card-body { flex: 1; min-width: 0; }

.role-card-name {
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.role-card-desc {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-card-badge {
  flex-shrink: 0;
  font-size: 10px !important;
  padding: 2px 7px !important;
}

.role-check {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* ── Badge global ────────────────────────────────────── */
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

/* ── Admin warning ───────────────────────────────────── */
.admin-warning {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  background: #FEF3C7;
  border-radius: 10px;
  border: 1px solid #FDE68A;
}

.warn-icon { color: #B45309; flex-shrink: 0; margin-top: 1px; }

.warn-text {
  font-size: 12px;
  color: #B45309;
  font-family: 'Inter', sans-serif;
  margin: 0;
  line-height: 1.5;
}

/* ── Footer ──────────────────────────────────────────── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
  border-top: 1px solid #F0FAFB;
}

.btn-ghost {
  padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid #E2EBF6;
  background: transparent;
  color: #64748B;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-ghost:hover { background: #F8FAFC; color: #0F172A; }

.btn-assign {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: #27C8D8;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(39,200,216, 0.22);
  transition: background 0.15s;
}

.btn-assign:hover:not(:disabled) { background: #1BAEBB; }

.btn-assign:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

/* ── Transiciones ────────────────────────────────────── */
.warn-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.warn-fade-leave-active { transition: opacity 0.15s ease; }
.warn-fade-enter-from   { opacity: 0; transform: translateY(-4px); }
.warn-fade-leave-to     { opacity: 0; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to       { opacity: 0; }

.modal-scale-enter-active { transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), opacity 0.18s ease; }
.modal-scale-leave-active  { transition: transform 0.15s ease, opacity 0.15s ease; }
.modal-scale-enter-from   { transform: scale(0.92); opacity: 0; }
.modal-scale-leave-to     { transform: scale(0.95); opacity: 0; }

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 600px) {
  .modal-card { padding: 20px 16px; }
  .roles-grid { grid-template-columns: 1fr; }
  .role-card-badge { display: none; }
}
</style>
