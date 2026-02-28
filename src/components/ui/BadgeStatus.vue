<template>
  <span class="badge" :class="`badge-${variant}`">
    <span class="badge-dot"></span>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
  type:   { type: String, default: 'quotation' }, // quotation | client | inventory | event
})

// ── Mapas de estado ──────────────────────────────────────
const maps = {
  quotation: {
    DRAFT:      { label: 'Borrador',    variant: 'gray'   },
    SENT:       { label: 'Enviada',     variant: 'blue'   },
    CONFIRMED:  { label: 'Confirmada',  variant: 'green'  },
    IN_PROCESS: { label: 'En proceso',  variant: 'amber'  },
    EXPIRED:    { label: 'Vencida',     variant: 'red'    },
    CANCELLED:  { label: 'Cancelada',   variant: 'red'    },
  },
  client: {
    ACTIVE:    { label: 'Activo',     variant: 'green'  },
    INACTIVE:  { label: 'Inactivo',   variant: 'gray'   },
    PROSPECT:  { label: 'Prospecto',  variant: 'purple' },
    VIP:       { label: 'VIP',        variant: 'amber'  },
  },
  inventory: {
    AVAILABLE:    { label: 'Disponible',   variant: 'green'  },
    IN_USE:       { label: 'En uso',       variant: 'blue'   },
    MAINTENANCE:  { label: 'Mantenimiento',variant: 'amber'  },
    DAMAGED:      { label: 'Dañado',       variant: 'red'    },
    RETIRED:      { label: 'Retirado',     variant: 'gray'   },
  },
  event: {
    PLANNING:   { label: 'Planificación', variant: 'purple' },
    CONFIRMED:  { label: 'Confirmado',    variant: 'green'  },
    IN_PROCESS: { label: 'En proceso',    variant: 'blue'   },
    COMPLETED:  { label: 'Completado',    variant: 'gray'   },
    CANCELLED:  { label: 'Cancelado',     variant: 'red'    },
  },
}

const resolved = computed(() => {
  const map = maps[props.type] ?? maps.quotation
  return map[props.status] ?? { label: props.status, variant: 'gray' }
})

const label   = computed(() => resolved.value.label)
const variant = computed(() => resolved.value.variant)
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Green ─────────── */
.badge-green { background: #DCFCE7; color: #15803D; }
.badge-green .badge-dot { background: #22C55E; }

/* ── Blue ──────────── */
.badge-blue { background: #DBEAFE; color: #1D4ED8; }
.badge-blue .badge-dot { background: #3B82F6; }

/* ── Amber ─────────── */
.badge-amber { background: #FEF3C7; color: #B45309; }
.badge-amber .badge-dot { background: #F59E0B; }

/* ── Red ───────────── */
.badge-red { background: #FEE2E2; color: #B91C1C; }
.badge-red .badge-dot { background: #EF4444; }

/* ── Gray ──────────── */
.badge-gray { background: #F1F5F9; color: #64748B; }
.badge-gray .badge-dot { background: #94A3B8; }

/* ── Purple ────────── */
.badge-purple { background: #EDE9FE; color: #6D28D9; }
.badge-purple .badge-dot { background: #8B5CF6; }
</style>
