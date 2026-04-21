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
              <th class="th-product">Producto</th>
              <th class="th-center">Q. Jornada</th>
              <th class="th-center">Q. Producto</th>
              <th class="th-center">Precio unit.</th>
              <th class="th-center">Desc. (%)</th>
              <th class="th-center">Total</th>
              <th class="th-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in items"
              :key="index"
              class="prd-row"
              @click="emitEdit(item, index)"
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

              <!-- Producto -->
              <td class="td-name">
                <p class="prd-nombre">{{ item.dispositivo || item.descripcion || '—' }}</p>
                <p v-if="item.category" class="prd-cat">{{ item.category }}</p>
              </td>

              <!-- Q. Jornada -->
              <td class="td-center">
                <span class="prd-qty">{{ item.cantidadJornada ?? 1 }}</span>
              </td>

              <!-- Q. Producto -->
              <td class="td-center">
                <span class="prd-qty">{{ item.cantidadProducto ?? 1 }}</span>
              </td>

              <!-- Precio unitario -->
              <td class="td-center prd-price">
                {{ format(item.unitPrice) }}
              </td>

              <!-- Descuento (%) -->
              <td class="td-center" @click.stop>
                <input
                  v-model.number="item.descuentoPct"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0%"
                  class="prd-discount-input"
                  @click.stop
                />
              </td>

              <!-- Total -->
              <td class="td-center prd-total">
                {{ format(totalesFilas[index]) }}
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

const totalesFilas = computed(() =>
  props.items.map(item => {
    const sub = (item.unitPrice || 0) * (item.cantidadJornada || 0) * (item.cantidadProducto || 0)
    const dsc = Number(item.descuentoPct) || 0
    return sub - (sub * dsc / 100)
  })
)

const subtotalItems = computed(() =>
  totalesFilas.value.reduce((sum, t) => sum + t, 0)
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
.prd-table th.th-num     { width: 40px; text-align: center; }
.prd-table th.th-img     { width: 72px; }
.prd-table th.th-right   { text-align: right; }
.prd-table th.th-center  { text-align: center; }
.prd-table th.th-product { width: 240px; min-width: 240px; }

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

/* Input de descuento */
.prd-discount-input {
  width: 60px;
  padding: 4px 8px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 99px;
  text-align: center;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.prd-discount-input:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 2px rgba(5, 78, 175, 0.12);
}
.prd-discount-input::-webkit-outer-spin-button,
.prd-discount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

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
