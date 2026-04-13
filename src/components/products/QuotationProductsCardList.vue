<template>
  <div class="prd-wrap">

    <!-- Estado vacío -->
    <div v-if="!items || items.length === 0" class="prd-empty">
      <Package :size="36" class="prd-empty-ico" />
      <p>No hay productos agregados</p>
    </div>

    <!-- Tabla -->
    <div v-else class="prd-table-card">
      <div class="prd-table-scroll">
        <table class="prd-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th class="th-img"></th>
              <th class="th-center">Q. Motores</th>
              <th class="th-center">Q. Operarios</th>
              <th>Producto</th>
              <th class="th-right">Cantidad</th>
              <th class="th-right">Precio unit.</th>
              <th class="th-right">Total</th>
              <th class="th-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in items"
              :key="index"
              class="prd-row"
              @click="emitEdit(item)"
            >
              <!-- # -->
              <td class="td-num">{{ index + 1 }}</td>

              <!-- Imagen -->
              <td class="td-img">
                <img
                  :src="item.linkFoto || item.linkFotoDispositivo || '/assets/be-one-logo.webp'"
                  @error="$event.target.src = '/assets/be-one-logo.webp'"
                  class="prd-thumb"
                  alt=""
                />
              </td>

              <!-- Q. Motores -->
              <td class="td-center">
                <span class="prd-qty-badge">{{ item.qMotores ?? '—' }}</span>
              </td>

              <!-- Q. Operarios -->
              <td class="td-center">
                <span class="prd-qty-badge">{{ item.qOperarios ?? '—' }}</span>
              </td>

              <!-- Producto -->
              <td class="td-name">
                <p class="prd-nombre">{{ item.dispositivo || item.descripcion || '—' }}</p>
                <p v-if="item.category" class="prd-cat">{{ item.category }}</p>
              </td>

              <!-- Cantidad -->
              <td class="td-right">
                <span class="prd-qty">
                  {{ item.cantidadJornada ?? 0 }}j × {{ item.cantidadProducto ?? 0 }}u
                </span>
              </td>

              <!-- Precio unitario -->
              <td class="td-right prd-price">
                {{ format(item.unitPrice) }}
              </td>

              <!-- Total -->
              <td class="td-right prd-total">
                {{ format((item.unitPrice || 0) * (item.cantidadJornada || 0) * (item.cantidadProducto || 0)) }}
              </td>

              <!-- Acciones -->
              <td class="td-center" @click.stop>
                <button
                  class="prd-action-btn"
                  title="Eliminar producto"
                  style="--hbg:#FEE2E2; --hc:#B91C1C"
                  @click="emitDelete(item)"
                >
                  <Trash2 :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="prd-subtotal-row">
              <td colspan="7" class="td-subtotal-label">Subtotal equipos propios</td>
              <td class="td-subtotal-val">{{ format(subtotalItems) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Package, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  linkFoto: {
    type: String,
    required: false,
    default: ''
  }
})

const emit = defineEmits(['edit', 'delete'])

const emitEdit = (item) => {
  emit('edit', item)
}

const emitDelete = (item) => {
  emit('delete', item)
}

const subtotalItems = computed(() =>
  props.items.reduce(
    (sum, item) => sum + (item.unitPrice || 0) * (item.cantidadJornada || 0) * (item.cantidadProducto || 0),
    0
  )
)

const format = (value) => {
  if (!value) return "$ 0"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value)
}
</script>

<style scoped>
.prd-wrap {
  width: 100%;
}

/* ── Estado vacío ──────────────────────────────────────── */
.prd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}
.prd-empty-ico { color: #CBD5E1; }

/* ── Table card ────────────────────────────────────────── */
.prd-table-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06), 0 4px 16px rgba(5, 78, 175, .08);
  overflow: hidden;
}

.prd-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ── Tabla ─────────────────────────────────────────────── */
.prd-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  min-width: 760px;
}

.prd-table thead tr {
  background: #F8FAFC;
  border-bottom: 1px solid #E2EBF6;
}

.prd-table th {
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  text-align: left;
  white-space: nowrap;
}
.th-num    { width: 40px; text-align: center; }
.th-img    { width: 72px; }
.th-right  { text-align: right; }
.th-center { text-align: center; width: 72px; }

/* ── Celdas ────────────────────────────────────────────── */
.prd-table td {
  padding: 13px 16px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #475569;
  border-bottom: 1px solid #F1F5FA;
  vertical-align: middle;
}

.prd-table tbody tr:last-child td { border-bottom: none; }

/* ── Filas ─────────────────────────────────────────────── */
.prd-row {
  cursor: pointer;
  transition: background 0.15s ease;
}
.prd-row:hover { background: #F0F7FF; }

/* ── Celdas específicas ────────────────────────────────── */
.td-num {
  text-align: center;
  color: #94A3B8;
  font-size: 11px;
  font-weight: 600;
  width: 40px;
}

.td-img {
  width: 72px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.prd-thumb {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #E5EAF0;
  display: block;
  background: #F1F5F9;
}

.td-name { min-width: 160px; }

.prd-nombre {
  font-weight: 500;
  color: #0F1A2E;
  margin: 0;
  line-height: 1.4;
}
.prd-cat {
  font-size: 11px;
  color: #94A3B8;
  margin: 2px 0 0;
}

.prd-qty-badge {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.prd-qty {
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  background: #F1F5F9;
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}

.td-right  { text-align: right; white-space: nowrap; }
.td-center { text-align: center; white-space: nowrap; }

.prd-price { color: #374151; font-weight: 500; }
.prd-total { font-weight: 700; color: #054EAF; }

/* ── Botón acción ──────────────────────────────────────── */
.prd-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94A3B8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.prd-action-btn:hover {
  background: var(--hbg);
  color: var(--hc);
}

/* ── Fila subtotal ─────────────────────────────────────── */
.prd-subtotal-row {
  background: #F0F6FF;
  border-top: 2px solid #D1DAE6;
}
.prd-subtotal-row td {
  border-bottom: none;
  padding: 10px 16px;
}
.td-subtotal-label {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: 'Inter', sans-serif;
  text-align: right;
}
.td-subtotal-val {
  font-size: 14px;
  font-weight: 800;
  color: #054EAF;
  text-align: right;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
</style>
