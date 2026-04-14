<script setup>
import { computed, ref } from 'vue'
import {
  Package, X, Save,
  Cpu, Zap, Truck, Clock, DollarSign,
  FileText, Calculator,
} from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, required: true },
  producto: { type: Object, required: true },
})

const emit = defineEmits(['close', 'save'])

/* ────────────────────────────────────────────────────
   VALIDATION
──────────────────────────────────────────────────── */
const submitted = ref(false)

const hasError = (field) => submitted.value && !props.producto[field]

const handleSave = () => {
  submitted.value = true
  if (!props.producto.dispositivo || !props.producto.descripcion) return
  emit('save')
  submitted.value = false
}

/* ────────────────────────────────────────────────────
   FINANCIAL SUMMARY (lógica original intacta)
──────────────────────────────────────────────────── */
const cotizacion = computed(() => {
  const cantidad    = Number(props.producto.cantidad || 0)
  const precioVenta = Number(props.producto.precios  || 0)
  const costo       = Number(props.producto.costo    || 0)

  if (!cantidad || !precioVenta) return null

  const IVA           = 0.19
  const CUATRO_X_MIL  = 0.004
  const costoTotal    = cantidad * costo
  const iva           = precioVenta * IVA
  const cuatroXmil    = precioVenta * CUATRO_X_MIL
  const comision      = precioVenta * (Number(props.producto.porcentajeComision            || 0) / 100)
  const renta         = precioVenta * (Number(props.producto.porcentajeRenta               || 0) / 100)
  const gastosFinancieros     = precioVenta * (Number(props.producto.porcentajeGastosFinancieros    || 0) / 100)
  const gastosAdministrativos = precioVenta * (Number(props.producto.porcentajeGastosAdministrativos|| 0) / 100)
  const utilidadFinal = precioVenta - costoTotal - (iva + cuatroXmil + comision + renta + gastosFinancieros + gastosAdministrativos)

  return { precioVenta, costoTotal, iva, cuatroXmil, comision, renta, gastosFinancieros, gastosAdministrativos, utilidadFinal }
})

const formatMoney = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0)
</script>

<template>
  <Teleport to="body">
    <Transition name="tp-fade">
      <div v-if="show" class="tp-overlay" @click.self="emit('close')">
        <div class="tp-panel">

          <!-- ══════════ HEADER ══════════ -->
          <div class="tp-header">
            <div class="tp-header-left">
              <div class="tp-icon-wrap">
                <Package :size="18" />
              </div>
              <div>
                <h2 class="tp-title">Agregar Producto de Tercero</h2>
                <p class="tp-subtitle">Completa la información del producto externo</p>
              </div>
            </div>
            <button class="tp-close" @click="emit('close')" aria-label="Cerrar">
              <X :size="16" />
            </button>
          </div>

          <!-- ══════════ BODY (scroll) ══════════ -->
          <div class="tp-body">

            <!-- ── 1. Información del Producto ─────────────────── -->
            <div class="tp-card">
              <div class="tp-section-hdr">
                <Cpu :size="15" class="tp-ico" />
                <span>Información del Producto</span>
              </div>
              <div class="g2">

                <div class="fg" :class="{ 'fg--err': hasError('dispositivo') }">
                  <label class="flbl">Dispositivo <span class="req">*</span></label>
                  <input
                    type="text"
                    v-model="producto.dispositivo"
                    class="finp"
                    placeholder="Nombre del dispositivo"
                  />
                  <span v-if="hasError('dispositivo')" class="err-msg">Campo requerido</span>
                </div>

                <div class="fg" :class="{ 'fg--err': hasError('descripcion') }">
                  <label class="flbl">Descripción <span class="req">*</span></label>
                  <input
                    type="text"
                    v-model="producto.descripcion"
                    class="finp"
                    placeholder="Descripción del producto"
                  />
                  <span v-if="hasError('descripcion')" class="err-msg">Campo requerido</span>
                </div>

                <div class="fg">
                  <label class="flbl">Categoría</label>
                  <input type="text" v-model="producto.categoria" class="finp" placeholder="Ej: Sonido, Iluminación…" />
                </div>

                <div class="fg">
                  <label class="flbl">Bodega</label>
                  <input type="text" v-model="producto.bodega" class="finp" placeholder="Ubicación de bodega" />
                </div>

              </div>
            </div>

            <!-- ── 2. Especificaciones Técnicas ────────────────── -->
            <div class="tp-card">
              <div class="tp-section-hdr">
                <Zap :size="15" class="tp-ico" />
                <span>Especificaciones Técnicas</span>
              </div>
              <div class="g3">
                <div class="fg">
                  <label class="flbl">Amperios</label>
                  <input type="number" v-model="producto.amperios" class="finp" placeholder="0" min="0" />
                </div>
                <div class="fg">
                  <label class="flbl">Medidas</label>
                  <input type="text" v-model="producto.medidas" class="finp" placeholder="Ej: 2m × 3m" />
                </div>
                <div class="fg">
                  <label class="flbl">Motores</label>
                  <input type="number" v-model="producto.motores" class="finp" placeholder="0" min="0" />
                </div>
                <div class="fg">
                  <label class="flbl">Operarios</label>
                  <input type="number" v-model="producto.operarios" class="finp" placeholder="0" min="0" />
                </div>
                <div class="fg">
                  <label class="flbl">Metros Extensiones</label>
                  <input type="number" v-model="producto.metrosExt" class="finp" placeholder="0" min="0" />
                </div>
                <div class="fg">
                  <label class="flbl">m² Dispositivo</label>
                  <input type="number" v-model="producto.m2Disp" class="finp" placeholder="0" min="0" />
                </div>
                <div class="fg">
                  <label class="flbl">Pesos Estacas</label>
                  <input type="number" v-model="producto.pesosEstacas" class="finp" placeholder="0" min="0" />
                </div>
                <div class="fg">
                  <label class="flbl">Extintores</label>
                  <input type="number" v-model="producto.extintores" class="finp" placeholder="0" min="0" />
                </div>
                <div class="fg">
                  <label class="flbl">Peso (kg)</label>
                  <input type="number" v-model="producto.peso" class="finp" placeholder="0" min="0" />
                </div>
              </div>
            </div>

            <!-- ── 3. Logística y Transporte ───────────────────── -->
            <div class="tp-card">
              <div class="tp-section-hdr">
                <Truck :size="15" class="tp-ico" />
                <span>Logística y Transporte</span>
              </div>
              <div class="g2">

                <div class="fg">
                  <label class="flbl">m³ Transporte</label>
                  <input type="number" v-model="producto.m3Transporte" class="finp" placeholder="0" min="0" />
                </div>

                <div></div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="flbl" style="margin-bottom:0">Incluye Transporte Bog-Mde</span>
                    <span class="toggle-state">{{ producto.incluyeTransporte ? 'Sí' : 'No' }}</span>
                  </div>
                  <button
                    type="button"
                    class="tgl"
                    :class="{ 'tgl--on': producto.incluyeTransporte }"
                    @click="producto.incluyeTransporte = !producto.incluyeTransporte"
                    :aria-checked="!!producto.incluyeTransporte"
                    role="switch"
                  >
                    <span class="tgl-thumb"></span>
                  </button>
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="flbl" style="margin-bottom:0">Montacarga requerido</span>
                    <span class="toggle-state">{{ producto.montacarga ? 'Sí' : 'No' }}</span>
                  </div>
                  <button
                    type="button"
                    class="tgl"
                    :class="{ 'tgl--on': producto.montacarga }"
                    @click="producto.montacarga = !producto.montacarga"
                    :aria-checked="!!producto.montacarga"
                    role="switch"
                  >
                    <span class="tgl-thumb"></span>
                  </button>
                </div>

              </div>
            </div>

            <!-- ── 4. Tiempos de Operación ─────────────────────── -->
            <div class="tp-card">
              <div class="tp-section-hdr">
                <Clock :size="15" class="tp-ico" />
                <span>Tiempos de Operación</span>
              </div>
              <div class="g3">
                <div class="fg">
                  <label class="flbl">Horas Operación</label>
                  <input type="number" v-model="producto.horasOperacion" class="finp" placeholder="0" min="0" />
                </div>
                <div class="fg">
                  <label class="flbl">Horas Montaje</label>
                  <input type="number" v-model="producto.horasMontaje" class="finp" placeholder="0" min="0" />
                </div>
                <div class="fg">
                  <label class="flbl">Personal Montaje</label>
                  <input type="number" v-model="producto.personalMontaje" class="finp" placeholder="0" min="0" />
                </div>
              </div>
            </div>

            <!-- ── 5. Financiero ───────────────────────────────── -->
            <div class="tp-card">
              <div class="tp-section-hdr">
                <DollarSign :size="15" class="tp-ico" />
                <span>Financiero</span>
              </div>
              <div class="g2">

                <div class="fg" :class="{ 'fg--err': hasError('precios') }">
                  <label class="flbl">Precio Unitario <span class="req">*</span></label>
                  <input type="number" v-model="producto.precios" class="finp" placeholder="0" min="0" />
                  <span v-if="hasError('precios')" class="err-msg">Campo requerido</span>
                </div>

                <div class="fg">
                  <label class="flbl">Costo Unitario</label>
                  <input type="number" v-model="producto.costo" class="finp" placeholder="0" min="0" />
                </div>

                <div class="fg">
                  <label class="flbl">Cantidad</label>
                  <input type="number" v-model="producto.cantidad" class="finp" placeholder="0" min="0" />
                </div>

                <div class="fg">
                  <label class="flbl">Año del dispositivo</label>
                  <input type="number" v-model="producto.anio" class="finp" placeholder="Ej: 2023" />
                </div>

                <div class="fg">
                  <label class="flbl">Amortización %</label>
                  <input type="number" v-model="producto.amortizacion" class="finp" placeholder="0" min="0" />
                </div>

                <div class="fg">
                  <label class="flbl">Margen %</label>
                  <input type="number" v-model="producto.porcentajeAumento" class="finp" placeholder="0" min="0" />
                </div>

                <div class="fg">
                  <label class="flbl">Comisión %</label>
                  <input type="number" v-model="producto.porcentajeComision" class="finp" placeholder="0" min="0" />
                </div>

                <div class="fg">
                  <label class="flbl">Renta %</label>
                  <input type="number" v-model="producto.porcentajeRenta" class="finp" placeholder="0" min="0" />
                </div>

                <div class="fg">
                  <label class="flbl">Gastos Financieros %</label>
                  <input type="number" v-model="producto.porcentajeGastosFinancieros" class="finp" placeholder="0" min="0" />
                </div>

                <div class="fg">
                  <label class="flbl">Gastos Administrativos %</label>
                  <input type="number" v-model="producto.porcentajeGastosAdministrativos" class="finp" placeholder="0" min="0" />
                </div>

              </div>
            </div>

            <!-- ── Resumen financiero (solo si hay datos) ─────── -->
            <div v-if="cotizacion" class="tp-card tp-card--fin">
              <div class="tp-section-hdr">
                <Calculator :size="15" class="tp-ico" />
                <span>Resumen Financiero</span>
              </div>
              <div class="g3">
                <div class="fin-pill fin-pill--green">
                  <span class="fin-lbl">Precio Unitario</span>
                  <span class="fin-val">{{ formatMoney(cotizacion.precioVenta) }}</span>
                </div>
                <div class="fin-pill fin-pill--blue">
                  <span class="fin-lbl">Costo Total</span>
                  <span class="fin-val">{{ formatMoney(cotizacion.costoTotal) }}</span>
                </div>
                <div class="fin-pill" :class="cotizacion.utilidadFinal >= 0 ? 'fin-pill--green' : 'fin-pill--red'">
                  <span class="fin-lbl">Utilidad Final</span>
                  <span class="fin-val">{{ formatMoney(cotizacion.utilidadFinal) }}</span>
                </div>
                <div class="fin-pill fin-pill--yellow">
                  <span class="fin-lbl">IVA (19%)</span>
                  <span class="fin-val">{{ formatMoney(cotizacion.iva) }}</span>
                </div>
                <div class="fin-pill fin-pill--slate">
                  <span class="fin-lbl">Comisión</span>
                  <span class="fin-val">{{ formatMoney(cotizacion.comision) }}</span>
                </div>
                <div class="fin-pill fin-pill--slate">
                  <span class="fin-lbl">G. Administrativos</span>
                  <span class="fin-val">{{ formatMoney(cotizacion.gastosAdministrativos) }}</span>
                </div>
              </div>
            </div>

            <!-- ── 6. Notas ────────────────────────────────────── -->
            <div class="tp-card">
              <div class="tp-section-hdr">
                <FileText :size="15" class="tp-ico" />
                <span>Notas</span>
              </div>
              <div class="fg">
                <label class="flbl">Observaciones adicionales</label>
                <textarea
                  v-model="producto.notas"
                  class="f-textarea"
                  rows="3"
                  placeholder="Observaciones, condiciones especiales…"
                ></textarea>
              </div>
            </div>

          </div>
          <!-- END BODY -->

          <!-- ══════════ FOOTER ══════════ -->
          <div class="tp-footer">
            <button type="button" class="tp-btn-ghost" @click="emit('close')">
              Cancelar
            </button>
            <button type="button" class="tp-btn-primary" @click="handleSave">
              <Save :size="14" />
              Guardar producto
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── Overlay & panel ──────────────────────────────────────── */
.tp-overlay {
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

.tp-panel {
  background: #FFFFFF;
  border-radius: var(--r-2xl, 24px);
  box-shadow: var(--shadow-modal, 0 8px 40px rgba(5,78,175,.14));
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ─── Header ───────────────────────────────────────────────── */
.tp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 18px;
  border-bottom: 1px solid #EBF3FC;
  flex-shrink: 0;
}

.tp-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tp-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #EEF4FF;
  color: #054EAF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tp-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 2px;
  line-height: 1.2;
}

.tp-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #94A3B8;
  margin: 0;
}

.tp-close {
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
.tp-close:hover {
  background: #E5EAF0;
  color: #0F1A2E;
}

/* ─── Scrollable body ──────────────────────────────────────── */
.tp-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* Subtle scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #CBD5E1 transparent;
}

/* ─── Cards (section containers) ──────────────────────────── */
.tp-card {
  background: #FFFFFF;
  border: 1px solid #EBF3FC;
  border-radius: var(--r-lg, 12px);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tp-card--fin {
  background: #F8FBFF;
  border-color: #DBEAFE;
}

/* ─── Section header ───────────────────────────────────────── */
.tp-section-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #0F1A2E;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBF3FC;
}

.tp-ico {
  color: #054EAF;
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

/* ─── Field group ──────────────────────────────────────────── */
.fg {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fg--err .finp,
.fg--err .f-textarea {
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
  border-color: #054EAF;
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.1);
}
.finp::placeholder { color: #94A3B8; }

/* ─── Textarea ─────────────────────────────────────────────── */
.f-textarea {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
  min-height: 72px;
}
.f-textarea:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.1);
}
.f-textarea::placeholder { color: #94A3B8; }

/* ─── Toggle switch ────────────────────────────────────────── */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 12px;
  padding: 10px 14px;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-state {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

.tgl {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: #CBD5E1;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  padding: 0;
}
.tgl--on {
  background: #054EAF;
}
.tgl-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
  transition: transform 0.2s;
  display: block;
}
.tgl--on .tgl-thumb {
  transform: translateX(18px);
}

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
}

.fin-pill--green { border-color: #BBF7D0; }
.fin-pill--green .fin-val { color: #16A34A; }

.fin-pill--blue  { border-color: #BFDBFE; }
.fin-pill--blue  .fin-val { color: #1D4ED8; }

.fin-pill--yellow { border-color: #FDE68A; }
.fin-pill--yellow .fin-val { color: #B45309; }

.fin-pill--red   { border-color: #FECACA; }
.fin-pill--red   .fin-val { color: #B91C1C; }

.fin-pill--slate { border-color: #E5EAF0; }
.fin-pill--slate .fin-val { color: #475569; }

/* ─── Footer ───────────────────────────────────────────────── */
.tp-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #EBF3FC;
  flex-shrink: 0;
  background: #FFFFFF;
}

.tp-btn-ghost {
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
.tp-btn-ghost:hover {
  background: #E5EAF0;
  color: #0F1A2E;
}

.tp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #054EAF;
  color: #FFFFFF;
  cursor: pointer;
  box-shadow: var(--shadow-btn, 0 2px 8px rgba(5,78,175,.18));
  transition: background 0.15s, box-shadow 0.15s;
}
.tp-btn-primary:hover {
  background: #03368A;
}

/* ─── Transition ───────────────────────────────────────────── */
.tp-fade-enter-active,
.tp-fade-leave-active {
  transition: opacity 0.18s ease;
}
.tp-fade-enter-active .tp-panel,
.tp-fade-leave-active .tp-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.tp-fade-enter-from,
.tp-fade-leave-to {
  opacity: 0;
}
.tp-fade-enter-from .tp-panel {
  transform: translateY(12px);
  opacity: 0;
}
.tp-fade-leave-to .tp-panel {
  transform: translateY(8px);
  opacity: 0;
}
</style>
