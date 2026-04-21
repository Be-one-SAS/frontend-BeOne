<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="overlay"
        @click.self="$emit('close')"
      >
        <Transition name="modal-scale">
          <div v-if="show" class="modal-card">

            <!-- ── Header ──────────────────────────────── -->
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Cambiar rol</h2>
                <p class="modal-sub" v-if="usuario">
                  Asignar nuevo rol a
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
                <span class="role-lbl">Rol actual</span>
                <span class="role-badge" :class="ROLE_BADGE[usuario.role]">
                  {{ usuario.role }}
                </span>
              </div>
            </div>

            <!-- ── Grid de roles ───────────────────────── -->
            <div class="roles-section">
              <p class="section-title">Selecciona el nuevo rol</p>
              <div class="roles-grid">
                <button
                  v-for="rol in ROLE_CONFIG"
                  :key="rol.key"
                  class="role-card"
                  :class="{ 'role-card-selected': selectedRole === rol.key }"
                  @click="selectedRole = rol.key"
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
                  <div v-if="selectedRole === rol.key" class="role-check">
                    <CheckCircle2 :size="16" color="#054EAF" />
                  </div>
                </button>
              </div>
            </div>

            <!-- ── Advertencia ADMIN ────────────────────── -->
            <Transition name="warn-fade">
              <div v-if="selectedRole === 'ADMIN'" class="admin-warning">
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
                :disabled="!selectedRole || selectedRole === usuario?.role"
                @click="asignar"
              >
                <Shield :size="14" />
                Asignar rol
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  X, Shield, AlertTriangle, CheckCircle2,
  TrendingUp, Eye, Truck, Users, DollarSign, HelpCircle,
} from 'lucide-vue-next'

// ── Props & Emits ─────────────────────────────────────
const props = defineProps({
  show:    { type: Boolean, required: true },
  usuario: { type: Object, default: null },
})
const emit = defineEmits(['close', 'save'])

// ── Selected role state ───────────────────────────────
const selectedRole = ref('')

// Inicializar con el rol actual del usuario al abrir
watch(() => props.show, (val) => {
  if (val && props.usuario) selectedRole.value = props.usuario.role ?? ''
  else selectedRole.value = ''
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
    key:         'COMERCIAL',
    icon:        TrendingUp,
    iconBg:      '#DBEAFE',
    iconColor:   '#1D4ED8',
    description: 'Cotizaciones y clientes',
  },
  {
    key:         'SUPERVISOR',
    icon:        Eye,
    iconBg:      '#EDE9FE',
    iconColor:   '#7C3AED',
    description: 'Supervisión y reportes',
  },
  {
    key:         'LOGISTICA',
    icon:        Truck,
    iconBg:      '#DCFCE7',
    iconColor:   '#16A34A',
    description: 'Operaciones e inventario',
  },
  {
    key:         'COORDINADOR',
    icon:        Users,
    iconBg:      '#FEF3C7',
    iconColor:   '#B45309',
    description: 'Coordinación en campo',
  },
  {
    key:         'FINANCIERO',
    icon:        DollarSign,
    iconBg:      '#FFEDD5',
    iconColor:   '#C2410C',
    description: 'Finanzas y aprobaciones',
  },
  {
    key:         'SOPORTE',
    icon:        HelpCircle,
    iconBg:      '#F1F5F9',
    iconColor:   '#64748B',
    description: 'Solo lectura general',
  },
]

const ROLE_BADGE = {
  ADMIN:       'bg-[#FEE2E2] text-[#B91C1C]',
  COMERCIAL:   'bg-[#DBEAFE] text-[#1D4ED8]',
  SUPERVISOR:  'bg-[#EDE9FE] text-[#7C3AED]',
  LOGISTICA:   'bg-[#DCFCE7] text-[#16A34A]',
  COORDINADOR: 'bg-[#FEF3C7] text-[#B45309]',
  FINANCIERO:  'bg-[#FFEDD5] text-[#C2410C]',
  SOPORTE:     'bg-[#F1F5F9] text-[#64748B]',
}

// ── Avatar helpers ────────────────────────────────────
const AVATAR_COLORS = ['#054EAF', '#7C3AED', '#B45309', '#B91C1C', '#16A34A', '#0891B2', '#C2410C']
const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
const getInitials = (name) =>
  (name ?? '').trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

// ── Asignar ───────────────────────────────────────────
const asignar = () => {
  if (!selectedRole.value || selectedRole.value === props.usuario?.role) return
  // conectar API aquí → updateUserRole(props.usuario.id, selectedRole.value)
  emit('save', { usuario: props.usuario, nuevoRol: selectedRole.value })
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
  border-color: #054EAF !important;
  background: #EBF3FC !important;
  box-shadow: 0 0 0 1px #054EAF;
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
  border-top: 1px solid #EBF3FC;
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
  background: #054EAF;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(5, 78, 175, 0.22);
  transition: background 0.15s;
}

.btn-assign:hover:not(:disabled) { background: #03368A; }

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
