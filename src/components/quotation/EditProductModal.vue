<script setup>
import { computed, ref, watch } from 'vue'
import { formatCOP } from '@/utils/currency.js'
import { Package, X, Save, Cpu, DollarSign, Calculator } from 'lucide-vue-next'

const props = defineProps({
  show: Boolean,
  producto: Object
})

const emit = defineEmits(['close', 'save'])

/* ────────────────────────────────────────────────────
   VALIDATION
──────────────────────────────────────────────────── */
const submitted = ref(false)

const hasError = (field) => {
  if (!submitted.value) return false
  if (field === 'unitPrice') return !props.producto?.unitPrice || props.producto.unitPrice <= 0
  return !props.producto?.[field]
}

const handleSave = () => {
  submitted.value = true
  if (!props.producto?.dispositivo || !props.producto?.descripcion) return
  if (!props.producto?.unitPrice || props.producto.unitPrice <= 0) return
  emit('save')
  submitted.value = false
}

watch(() => props.show, (val) => {
  if (val) submitted.value = false
})

/* ────────────────────────────────────────────────────
   RESUMEN (subtotal / descuento / aumento / total)
──────────────────────────────────────────────────── */
const resumen = computed(() => {
  const p = props.producto || {}
  const unitPrice = Number(p.unitPrice || 0)
  const cantidadJornada = Number(p.cantidadJornada || 0)
  const cantidadProducto = Number(p.cantidadProducto || 0)
  const descuentoPct = Number(p.descuentoPct || 0)
  const aumentoPct = Number(p.aumentoPct || 0)

  const subtotal = unitPrice * cantidadJornada * cantidadProducto
  const descuento = subtotal * descuentoPct / 100
  const aumento = subtotal * aumentoPct / 100
  const total = subtotal - descuento + aumento

  return { subtotal, descuento, aumento, total }
})

const formatMoney = (val) => formatCOP(val || 0)
</script>

<template>
  <Teleport to="body">
    <Transition name="epm-fade">
      <div v-if="show" class="epm-overlay" @click.self="emit('close')">
        <div class="epm-panel">

          <!-- ══════════ HEADER ══════════ -->
          <div class="epm-header">
            <div class="epm-header-left">
              <div class="epm-icon-wrap">
                <Package :size="18" />
              </div>
              <div>
                <h2 class="epm-title">Editar producto</h2>
                <p class="epm-subtitle">Actualiza los datos de este equipo propio</p>
              </div>
            </div>
            <button class="epm-close" @click="emit('close')" aria-label="Cerrar">
              <X :size="16" />
            </button>
          </div>

          <!-- ══════════ BODY ══════════ -->
          <div class="epm-body">

            <!-- 1. Información del producto -->
            <div class="epm-card">
              <div class="epm-section-hdr">
                <Cpu :size="15" class="epm-ico" />
                <span>Información del Producto</span>
              </div>

              <div class="epm-photo-row">
                <img
                  :src="producto.linkFoto || producto.linkFotoDispositivo || '/assets/be-one-logo.webp'"
                  @error="$event.target.src = '/assets/be-one-logo.webp'"
                  class="epm-photo"
                  alt=""
                />
              </div>

              <div class="g2">

                <div class="fg fg--full" :class="{ 'fg--err': hasError('dispositivo') }">
                  <label class="flbl">Dispositivo <span class="req">*</span></label>
                  <input type="text" v-model="producto.dispositivo" class="finp" placeholder="Nombre del dispositivo" />
                  <span v-if="hasError('dispositivo')" class="err-msg">Campo requerido</span>
                </div>

                <div class="fg fg--full" :class="{ 'fg--err': hasError('descripcion') }">
                  <label class="flbl">Descripción <span class="req">*</span></label>
                  <input type="text" v-model="producto.descripcion" class="finp" placeholder="Descripción del producto" />
                  <span v-if="hasError('descripcion')" class="err-msg">Campo requerido</span>
                </div>

              </div>
            </div>

            <!-- 2. Cantidades y precio -->
            <div class="epm-card">
              <div class="epm-section-hdr">
                <DollarSign :size="15" class="epm-ico" />
                <span>Cantidades y Precio</span>
              </div>
              <div class="g2">

                <div class="fg" :class="{ 'fg--err': hasError('unitPrice') }">
                  <label class="flbl">Precio unitario <span class="req">*</span></label>
                  <input type="number" v-model.number="producto.unitPrice" class="finp" placeholder="0" min="0" />
                  <span v-if="hasError('unitPrice')" class="err-msg">Debe ser mayor a 0</span>
                </div>

                <div class="fg">
                  <label class="flbl">Q. Jornada</label>
                  <input type="number" v-model.number="producto.cantidadJornada" class="finp" placeholder="0" min="1" />
                </div>

                <div class="fg">
                  <label class="flbl">Q. Producto</label>
                  <input type="number" v-model.number="producto.cantidadProducto" class="finp" placeholder="0" min="1" />
                </div>

                <div class="fg">
                  <label class="flbl">Descuento %</label>
                  <input type="number" v-model.number="producto.descuentoPct" class="finp" placeholder="0" min="0" max="100" />
                </div>

                <div class="fg">
                  <label class="flbl">Aumento %</label>
                  <input type="number" v-model.number="producto.aumentoPct" class="finp" placeholder="0" min="0" />
                </div>

              </div>
            </div>

            <!-- Resumen -->
            <div class="epm-card epm-card--fin">
              <div class="epm-section-hdr">
                <Calculator :size="15" class="epm-ico" />
                <span>Resumen</span>
              </div>
              <div class="g3">
                <div class="fin-pill fin-pill--blue">
                  <span class="fin-lbl">Subtotal</span>
                  <span class="fin-val">{{ formatMoney(resumen.subtotal) }}</span>
                </div>
                <div class="fin-pill fin-pill--slate">
                  <span class="fin-lbl">Descuento</span>
                  <span class="fin-val">-{{ formatMoney(resumen.descuento) }}</span>
                </div>
                <div class="fin-pill fin-pill--slate">
                  <span class="fin-lbl">Aumento</span>
                  <span class="fin-val">+{{ formatMoney(resumen.aumento) }}</span>
                </div>
              </div>
              <div class="fin-total">
                <span>Total</span>
                <span>{{ formatMoney(resumen.total) }}</span>
              </div>
            </div>

          </div>

          <!-- ══════════ FOOTER ══════════ -->
          <div class="epm-footer">
            <button type="button" class="epm-btn-ghost" @click="emit('close')">
              Cancelar
            </button>
            <button type="button" class="epm-btn-primary" @click="handleSave">
              <Save :size="14" />
              Guardar cambios
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── Overlay & panel ──────────────────────────────────────── */
.epm-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 26, 46, 0.42);
  backdrop-filter: blur(4px);
  padding: 16px;
}

.epm-panel {
  background: #FFFFFF;
  border-radius: var(--r-2xl, 24px);
  box-shadow: var(--shadow-modal, 0 8px 40px rgba(39,200,216,.14));
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ─── Header ───────────────────────────────────────────────── */
.epm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 18px;
  border-bottom: 1px solid #F0FAFB;
  flex-shrink: 0;
}

.epm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.epm-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #E0F9FA;
  color: #27C8D8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.epm-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 2px;
  line-height: 1.2;
}

.epm-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #94A3B8;
  margin: 0;
}

.epm-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #F1F5F9;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.epm-close:hover {
  background: #E5EAF0;
  color: #0F1A2E;
}

/* ─── Scrollable body ──────────────────────────────────────── */
.epm-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: thin;
  scrollbar-color: #CBD5E1 transparent;
}

/* ─── Cards (section containers) ──────────────────────────── */
.epm-card {
  background: #FFFFFF;
  border: 1px solid #F0FAFB;
  border-radius: var(--r-lg, 12px);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.epm-card--fin {
  background: #F8FBFF;
  border-color: #CCEFF2;
}

/* ─── Section header ───────────────────────────────────────── */
.epm-section-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #0F1A2E;
  padding-bottom: 10px;
  border-bottom: 1px solid #F0FAFB;
}

.epm-ico {
  color: #27C8D8;
  flex-shrink: 0;
}

/* ─── Grids ────────────────────────────────────────────────── */
.g2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.g3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px 16px;
}

@media (max-width: 540px) {
  .g2, .g3 { grid-template-columns: 1fr; }
}

/* ─── Foto del producto ──────────────────────────────────────── */
.epm-photo-row {
  display: flex;
  justify-content: center;
}

.epm-photo {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #E5EAF0;
  background: #F1F5F9;
  display: block;
}

/* ─── Field group ──────────────────────────────────────────── */
.fg {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fg--full {
  grid-column: 1 / -1;
}

.fg--err .finp {
  border-color: #EF4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.flbl {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  margin-bottom: 2px;
}

.req {
  color: #EF4444;
  font-weight: 700;
  margin-left: 2px;
}

.err-msg {
  font-size: 11px;
  color: #EF4444;
  font-family: 'Inter', sans-serif;
}

/* ─── Inputs ───────────────────────────────────────────────── */
.finp {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.finp:focus {
  border-color: #27C8D8;
  box-shadow: 0 0 0 3px rgba(39,200,216, 0.1);
}
.finp::placeholder { color: #94A3B8; }

/* ─── Financial pills ──────────────────────────────────────── */
.fin-pill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #FFFFFF;
  border: 1px solid #E5EAF0;
  border-radius: var(--r-lg, 12px);
  padding: 12px 14px;
}

.fin-lbl {
  font-size: 11px;
  font-weight: 500;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fin-val {
  font-size: 14px;
  font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #475569;
}

.fin-pill--blue  { border-color: #A7EEF5; }
.fin-pill--blue  .fin-val { color: #27C8D8; }

.fin-pill--slate { border-color: #E5EAF0; }

.fin-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: var(--r-lg, 12px);
  background: #E0F9FA;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #0F1A2E;
}
.fin-total span:last-child {
  color: #16A34A;
  font-size: 16px;
}

/* ─── Footer ───────────────────────────────────────────────── */
.epm-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #F0FAFB;
  flex-shrink: 0;
  background: #FFFFFF;
}

.epm-btn-ghost {
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #E5EAF0;
  background: #F1F5F9;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.epm-btn-ghost:hover {
  background: #E5EAF0;
  color: #0F1A2E;
}

.epm-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #27C8D8;
  color: #FFFFFF;
  cursor: pointer;
  box-shadow: var(--shadow-btn, 0 2px 8px rgba(39,200,216,.18));
  transition: background 0.15s, box-shadow 0.15s;
}
.epm-btn-primary:hover {
  background: #1BAEBB;
}

/* ─── Transition ───────────────────────────────────────────── */
.epm-fade-enter-active,
.epm-fade-leave-active {
  transition: opacity 0.18s ease;
}
.epm-fade-enter-active .epm-panel,
.epm-fade-leave-active .epm-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.epm-fade-enter-from,
.epm-fade-leave-to {
  opacity: 0;
}
.epm-fade-enter-from .epm-panel {
  transform: translateY(12px);
  opacity: 0;
}
.epm-fade-leave-to .epm-panel {
  transform: translateY(8px);
  opacity: 0;
}
</style>
