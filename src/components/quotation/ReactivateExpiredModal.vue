<template>
  <div v-if="show" class="rem-overlay" @click.self="onClose">
    <div class="rem-content">
      <button class="rem-close" @click="onClose">×</button>

      <!-- Paso 1: Intro -->
      <div v-if="step === 'intro'" class="rem-step">
        <div class="rem-icon rem-icon-info"><Hourglass :size="22" /></div>
        <h2 class="rem-title">Reactivar cotización #{{ quotation?.numero }}</h2>
        <p class="rem-text">
          Esta cotización volverá a estado <strong>Pendiente</strong> y tendrá
          <strong>7 días más</strong> para gestionarse — hasta el
          <strong>{{ nuevaFechaLimite }}</strong> — antes de volver a expirar.
        </p>
        <p class="rem-text rem-text-muted">
          Antes de reactivarla, vamos a validar que sus productos sigan disponibles
          en esas fechas (pudieron quedar reservados por otra cotización mientras esta estaba expirada).
        </p>
        <div class="rem-actions">
          <button class="rem-btn rem-btn-secondary" @click="onClose">Cancelar</button>
          <button class="rem-btn rem-btn-primary" @click="iniciarValidacion">
            Verificar disponibilidad
          </button>
        </div>
      </div>

      <!-- Paso 2: Validando -->
      <div v-else-if="step === 'checking'" class="rem-step rem-step-center">
        <Loader2 :size="30" class="rem-spinner" />
        <p class="rem-text rem-checking-text">Voy a validar si los productos aún están disponibles…</p>
        <p class="rem-text rem-text-muted">Revisando que ningún juego haya sido tomado por otra cotización.</p>
      </div>

      <!-- Paso 3: Resolver conflictos -->
      <div v-else-if="step === 'resolve'" class="rem-step">
        <h2 class="rem-title">Revisa los productos</h2>
        <p class="rem-text rem-text-muted">
          <span v-if="hayConflictos">
            Algunos productos ya fueron reservados por otra cotización — quítalos o reemplázalos para poder reactivar.
          </span>
          <span v-else>
            Todos los productos siguen disponibles. Puedes reactivar la cotización.
          </span>
        </p>

        <div class="rem-items">
          <div
            v-for="(it, idx) in workingItems"
            :key="it.productId + '-' + idx"
            class="rem-item"
            :class="{ 'rem-item-conflict': it.conflicted }"
          >
            <div class="rem-item-info">
              <span class="rem-item-name">{{ it.nombre || it.product?.nombre }}</span>
              <span v-if="it.conflicted" class="rem-item-badge">
                <AlertTriangle :size="11" /> Ya reservado por otra cotización
              </span>
            </div>
            <div class="rem-item-actions">
              <button class="rem-item-btn" @click="abrirReemplazo(idx)">Reemplazar</button>
              <button class="rem-item-btn rem-item-btn-danger" @click="quitarItem(idx)">Quitar</button>
            </div>
          </div>

          <p v-if="!workingItems.length" class="rem-text rem-text-muted rem-empty">
            No quedan productos en la cotización — agrega al menos uno para continuar.
          </p>
        </div>

        <div class="rem-actions">
          <button class="rem-btn rem-btn-secondary" @click="onClose">Cancelar</button>
          <button
            class="rem-btn rem-btn-primary"
            :disabled="hayConflictos || !workingItems.length"
            @click="confirmarReactivacion"
          >
            Reactivar cotización
          </button>
        </div>
      </div>

      <!-- Paso 4: Guardando -->
      <div v-else-if="step === 'saving'" class="rem-step rem-step-center">
        <Loader2 :size="30" class="rem-spinner" />
        <p class="rem-text rem-checking-text">Reactivando cotización…</p>
      </div>

      <!-- Error -->
      <div v-else-if="step === 'error'" class="rem-step">
        <div class="rem-icon rem-icon-error"><AlertTriangle :size="22" /></div>
        <h2 class="rem-title">No se pudo continuar</h2>
        <p class="rem-text">{{ errorMsg }}</p>
        <div class="rem-actions">
          <button class="rem-btn rem-btn-secondary" @click="onClose">Cerrar</button>
          <button class="rem-btn rem-btn-primary" @click="iniciarValidacion">Reintentar</button>
        </div>
      </div>
    </div>

    <ProductPickerModal
      :show="showPicker"
      :productos="catalogWithAvailability"
      @close="showPicker = false"
      @select="onProductoSeleccionado"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Hourglass, AlertTriangle, Loader2 } from 'lucide-vue-next'
import ProductPickerModal from '../products/ProductPickerModal.vue'
import { getProductsEndReservation } from '../../services/reservation.service'
import { addQuotationItems } from '../../services/quotation.service'
import { reactivateQuotation } from '../../services/quotation.service'

const props = defineProps({
  show: { type: Boolean, default: false },
  quotation: { type: Object, default: null },
})
const emit = defineEmits(['close', 'reactivated'])

const step = ref('intro') // intro | checking | resolve | saving | error
const errorMsg = ref('')
const workingItems = ref([])
const catalogWithAvailability = ref([])
const showPicker = ref(false)
const replacingIndex = ref(null)

const nuevaFechaLimite = computed(() => {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
})

const hayConflictos = computed(() => workingItems.value.some((it) => it.conflicted))

const resetState = () => {
  step.value = 'intro'
  errorMsg.value = ''
  workingItems.value = []
  catalogWithAvailability.value = []
  showPicker.value = false
  replacingIndex.value = null
}

watch(() => props.show, (val) => { if (val) resetState() })

const onClose = () => emit('close')

// Precio simplificado por lista de precio del propio `quotation.listaPrecio`
// (mismo criterio que resolverPrecioParaCliente en useQuotationProducts.ts,
// pero contra el string guardado en la cotización en vez de un objeto cliente).
const resolverPrecio = (producto, listaPrecio) => {
  if (listaPrecio === 'cliente_directo') {
    const vcc = producto?.valorCuadroCotizador
    if (vcc && vcc > 0) return vcc
  }
  const boxes = producto?.productBoxes ?? []
  const nombreBox = (listaPrecio || '').toString().trim().toLowerCase()
  if (nombreBox && boxes.length) {
    const match = boxes.find((b) => b.boxName?.toString().trim().toLowerCase() === nombreBox)
    if (match) return match.price
  }
  const fallback = boxes.find((b) => b.price > 0)
  return fallback?.price ?? producto?.cop ?? 0
}

const iniciarValidacion = async () => {
  if (!props.quotation) return
  step.value = 'checking'
  errorMsg.value = ''
  try {
    const ow = props.quotation.operationWindow
    if (!ow?.setupStartAt || !ow?.teardownEndAt) {
      throw new Error('Esta cotización no tiene fechas de montaje/desmontaje registradas.')
    }
    const { data } = await getProductsEndReservation({
      tramos: [{ setupStartAt: ow.setupStartAt, teardownEndAt: ow.teardownEndAt }],
      isSameCity: true,
    })
    catalogWithAvailability.value = data || []
    const disponibilidadPorId = new Map(data.map((p) => [p.id, p.isAvailable]))

    workingItems.value = (props.quotation.items || []).map((it) => ({
      ...it,
      nombre: it.nombre || it.product?.nombre,
      conflicted: disponibilidadPorId.get(it.productId) === false,
    }))
    step.value = 'resolve'
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || 'Ocurrió un error validando disponibilidad.'
    step.value = 'error'
  }
}

const quitarItem = (idx) => {
  workingItems.value.splice(idx, 1)
}

const abrirReemplazo = (idx) => {
  replacingIndex.value = idx
  showPicker.value = true
}

const onProductoSeleccionado = (producto) => {
  const idx = replacingIndex.value
  if (idx === null || idx === undefined) return
  const anterior = workingItems.value[idx]
  workingItems.value.splice(idx, 1, {
    ...anterior,
    productId: producto.id,
    nombre: producto.nombre,
    product: producto,
    unitPrice: resolverPrecio(producto, props.quotation?.listaPrecio),
    conflicted: producto.isAvailable === false,
  })
  showPicker.value = false
  replacingIndex.value = null
}

const confirmarReactivacion = async () => {
  if (hayConflictos.value || !workingItems.value.length) return
  step.value = 'saving'
  try {
    const payload = workingItems.value.map((it) => ({
      productId: it.productId,
      unitPrice: it.unitPrice ?? 0,
      cantidadJornada: it.cantidadJornada ?? 1,
      cantidadProducto: it.cantidadProducto ?? it.quantity ?? 1,
      descuentoPct: it.descuentoPct ?? 0,
      aumentoPct: it.aumentoPct ?? 0,
      horasAdicionales: it.horasAdicionales ?? 0,
    }))
    await addQuotationItems(props.quotation.id, payload)
    await reactivateQuotation(props.quotation.id)
    emit('reactivated', props.quotation.id)
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || 'No se pudo reactivar la cotización.'
    step.value = 'error'
  }
}
</script>

<style scoped>
.rem-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 26, 46, 0.45);
  backdrop-filter: blur(4px);
  padding: 16px;
}

.rem-content {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(15, 26, 46, 0.2);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px;
  position: relative;
  font-family: 'Inter', sans-serif;
}

.rem-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #F1F5F9;
  color: #64748B;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
}
.rem-close:hover { background: #E2E8F0; color: #0F1A2E; }

.rem-step { display: flex; flex-direction: column; gap: 10px; }
.rem-step-center { align-items: center; text-align: center; padding: 24px 0 12px; }

.rem-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.rem-icon-info  { background: #EDE9FE; color: #5B21B6; }
.rem-icon-error { background: #FEE2E2; color: #B91C1C; }

.rem-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}

.rem-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
  margin: 0;
}
.rem-text-muted { color: #94A3B8; font-size: 12.5px; }
.rem-checking-text { font-weight: 600; color: #0F1A2E; margin-top: 4px; }

.rem-spinner { color: #27C8D8; animation: rem-spin 1s linear infinite; }
@keyframes rem-spin { to { transform: rotate(360deg); } }

.rem-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.rem-btn {
  font-size: 13px;
  font-weight: 600;
  padding: 9px 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.rem-btn-secondary { background: #F1F5F9; color: #64748B; }
.rem-btn-secondary:hover { background: #E2E8F0; }
.rem-btn-primary { background: #27C8D8; color: #FFFFFF; }
.rem-btn-primary:hover:not(:disabled) { background: #14B8C4; }
.rem-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

.rem-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  margin: 4px 0;
}

.rem-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 10px;
  padding: 10px 12px;
}
.rem-item-conflict {
  background: #FEF2F2;
  border-color: #FCA5A5;
  opacity: 0.85;
}

.rem-item-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.rem-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #0F1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rem-item-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 600;
  color: #B91C1C;
}

.rem-item-actions { display: flex; gap: 6px; flex-shrink: 0; }
.rem-item-btn {
  font-size: 11.5px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 7px;
  border: 1px solid #E5EAF0;
  background: #FFFFFF;
  color: #334155;
  cursor: pointer;
}
.rem-item-btn:hover { background: #F1F5F9; }
.rem-item-btn-danger { color: #B91C1C; border-color: #FCA5A5; }
.rem-item-btn-danger:hover { background: #FEE2E2; }

.rem-empty { text-align: center; padding: 16px 0; }
</style>
