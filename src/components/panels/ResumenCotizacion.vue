<template>
  <div class="rc-card">

    <div class="rc-header">
      <ReceiptText :size="17" class="rc-header-icon" />
      <span>Resumen financiero</span>
    </div>

    <div class="rc-body">

      <!-- Subtotales -->
      <div class="rc-row">
        <span class="rc-label">Subtotal equipos propios</span>
        <span class="rc-val">{{ fmt(subtotalPropios) }}</span>
      </div>

      <div class="rc-row">
        <span class="rc-label">Subtotal productos terceros</span>
        <span class="rc-val">{{ fmt(subtotalTerceros) }}</span>
      </div>

      <!-- Divisor -->
      <div class="rc-divider" />

      <!-- Subtotal general -->
      <div class="rc-row rc-row--subtotal">
        <span class="rc-label rc-label--strong">SUBTOTAL</span>
        <span class="rc-val rc-val--strong">{{ fmt(subtotalGeneral) }}</span>
      </div>

      <!-- Descuento global -->
      <div class="rc-row rc-row--discount">
        <span class="rc-label">Descuento global</span>
        <div class="rc-discount-right">
          <div class="rc-pct-wrap">
            <input
              :value="descuentoPct"
              @input="onDescuentoInput"
              @focus="onFocusSelect"
              type="number"
              min="0"
              max="100"
              step="1"
              class="rc-pct-input"
            />
            <span class="rc-pct-sign">%</span>
          </div>
          <span class="rc-val rc-val--discount">− {{ fmt(descuentoValor) }}</span>
        </div>
      </div>

      <!-- Divisor -->
      <div class="rc-divider" />

      <!-- IVA -->
      <div class="rc-row">
        <span class="rc-label">IVA (19%)</span>
        <span class="rc-val" style="color: #27C8D8; font-weight: 600;">+ {{ fmt(ivaGeneral) }}</span>
      </div>

      <!-- TOTAL -->
      <div class="rc-row rc-row--total">
        <span class="rc-label rc-label--total">TOTAL GENERAL</span>
        <span class="rc-val rc-val--total">{{ fmt(totalGeneral) }}</span>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ReceiptText } from 'lucide-vue-next'
import { formatCOP } from '@/utils/currency.js'

defineProps({
  subtotalPropios:  { type: Number, default: 0 },
  subtotalTerceros: { type: Number, default: 0 },
  subtotalGeneral:  { type: Number, default: 0 },
  descuentoPct:     { type: Number, default: 0 },
  descuentoValor:   { type: Number, default: 0 },
  ivaGeneral:       { type: Number, default: 0 },
  totalGeneral:     { type: Number, default: 0 },
})

const emit = defineEmits(['update:descuentoPct'])

const onDescuentoInput = (e) => {
  let v = parseFloat(e.target.value)
  if (isNaN(v) || v < 0) v = 0
  if (v > 100) v = 100
  emit('update:descuentoPct', v)
}

const onFocusSelect = (e) => {
  e.target.select()
  e.target.value = ''
}

const fmt = formatCOP
</script>

<style scoped>
.rc-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(39,200,216, .06), 0 4px 16px rgba(39,200,216, .08);
  border: 1px solid #EEF1F7;
  overflow: hidden;
}

.rc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: #F8FAFC;
  border-bottom: 1px solid #EEF1F7;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #0F1A2E;
}
.rc-header-icon { color: #27C8D8; }

.rc-body {
  padding: 6px 20px 16px;
  display: flex;
  flex-direction: column;
}

.rc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #F8FAFC;
  font-family: 'Inter', sans-serif;
}
.rc-row:last-child { border-bottom: none; }

.rc-row--discount {
  flex-wrap: wrap;
  row-gap: 6px;
}
.rc-row--total { padding: 14px 0 4px; }

.rc-label {
  font-size: 13px;
  color: #5B6B8A;
  font-weight: 400;
  flex: 1;
}
.rc-label--strong {
  font-size: 13px;
  font-weight: 700;
  color: #0F1A2E;
}
.rc-label--total {
  font-size: 16px;
  font-weight: 800;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.rc-val {
  font-size: 13px;
  font-weight: 500;
  color: #0F1A2E;
  text-align: right;
  white-space: nowrap;
}
.rc-val--strong {
  font-weight: 700;
}
.rc-val--discount {
  color: #B91C1C;
  font-weight: 600;
  white-space: nowrap;
}
.rc-val--total {
  font-size: 22px;
  font-weight: 800;
  color: #27C8D8;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.rc-divider {
  height: 1px;
  background: #D1DAE6;
  margin: 2px 0;
}

/* Discount row right side */
.rc-discount-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.rc-pct-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.rc-pct-input {
  width: 64px;
  padding: 5px 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  border: 1px solid #D1DAE6;
  border-radius: 8px;
  background: #F8FAFC;
  text-align: right;
  transition: border 0.15s, box-shadow 0.15s;
}
.rc-pct-input:focus {
  outline: none;
  border-color: #27C8D8;
  box-shadow: 0 0 0 3px rgba(39,200,216, 0.10);
  background: #fff;
}
.rc-pct-sign {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
}

@media (max-width: 1024px) {
  .rc-body { padding: 4px 16px 12px; }
  .rc-header { padding: 12px 16px; font-size: 13px; }
  .rc-row { padding: 8px 0; gap: 8px; }
}

@media (max-width: 768px) {
  .rc-row--discount { flex-direction: column; align-items: flex-start; gap: 4px; }
  .rc-discount-right { width: 100%; justify-content: flex-end; }
  .rc-label { font-size: 12px; }
  .rc-val { font-size: 12px; }
  .rc-val--total { font-size: 18px; }
}

@media (max-width: 640px) {
  .rc-header { font-size: 12px; padding: 10px 14px; }
  .rc-body { padding: 2px 14px 10px; gap: 2px; }
  .rc-row { padding: 6px 0; }
  .rc-label { font-size: 11px; }
  .rc-label--total { font-size: 14px; }
  .rc-val { font-size: 11px; }
  .rc-val--total { font-size: 16px; }
  .rc-pct-input { width: 52px; padding: 4px 6px; font-size: 12px; }
  .rc-pct-sign { font-size: 12px; }
}

@media (max-width: 480px) {
  .rc-body { padding: 2px 12px 8px; }
  .rc-row { padding: 5px 0; }
  .rc-val--total { font-size: 14px; }
}

@media (max-width: 360px) {
  .rc-body { padding: 0 10px 6px; }
  .rc-row { padding: 4px 0; }
  .rc-val--total { font-size: 13px; }
}
</style>
