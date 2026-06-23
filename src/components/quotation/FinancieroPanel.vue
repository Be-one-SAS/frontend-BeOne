<template>
  <div class="fp-wrap">

    <!-- Loading -->
    <div v-if="loading" class="fp-loading">
      <div class="fp-spinner" /> Cargando datos financieros…
    </div>

    <template v-else-if="data">

      <!-- ── 1. VALORES COTIZACIÓN ─────────────────────── -->
      <div class="fp-card fp-card-summary">
        <div class="fp-card-title">Valores cotización</div>
        <div class="fp-trio">
          <div class="fp-trio-item">
            <span class="fp-trio-label">Subtotal</span>
            <span class="fp-trio-val">{{ fmt(data.cotizacion.subtotal) }}</span>
          </div>
          <div v-if="data.cotizacion.descuento > 0" class="fp-trio-item">
            <span class="fp-trio-label">Descuento</span>
            <span class="fp-trio-val fp-trio-desc">− {{ fmt(data.cotizacion.descuento) }}</span>
          </div>
          <div class="fp-trio-item">
            <span class="fp-trio-label">Base c/desc.</span>
            <span class="fp-trio-val">{{ fmt(data.cotizacion.valorBase) }}</span>
          </div>
          <div class="fp-trio-item">
            <span class="fp-trio-label">IVA (19%)</span>
            <span class="fp-trio-val">{{ fmt(data.cotizacion.valorIva) }}</span>
          </div>
          <div class="fp-trio-item fp-trio-total">
            <span class="fp-trio-label">Total general</span>
            <span class="fp-trio-val">{{ fmt(data.cotizacion.valorTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- ── 2. OC CLIENTES ────────────────────────────── -->
      <div class="fp-card">
        <div class="fp-card-head">
          <div class="fp-card-title">OC Recibidas de clientes</div>
          <button class="fp-add-btn" @click="ocForm = newOcForm(); ocAdding = true" v-if="!ocAdding">
            + Agregar OC
          </button>
        </div>

        <!-- Form nueva OC -->
        <div v-if="ocAdding" class="fp-form">
          <div class="fp-form-grid">
            <div class="fp-field">
              <label>N° OC</label>
              <input v-model="ocForm.numeroOC" placeholder="OC-001" />
            </div>
            <div class="fp-field">
              <label>Fecha recepción</label>
              <input v-model="ocForm.fechaRecepcion" type="date" />
            </div>
            <div class="fp-field">
              <label>Valor base $</label>
              <input v-model="ocForm.valorBase" type="number" min="0" @input="calcOcTotal" />
            </div>
            <div class="fp-field">
              <label>Valor IVA $</label>
              <input v-model="ocForm.valorIva" type="number" min="0" @input="calcOcTotal" />
            </div>
            <div class="fp-field">
              <label>Valor total $</label>
              <input v-model="ocForm.valorTotal" type="number" min="0" readonly class="fp-readonly" />
            </div>
            <div class="fp-field fp-field-full">
              <label>Observaciones</label>
              <textarea v-model="ocForm.observaciones" rows="2" />
            </div>
            <div class="fp-field fp-field-full">
              <label>Documento OC</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" @change="e => ocForm.file = e.target.files[0]" />
            </div>
          </div>
          <div class="fp-form-actions">
            <button class="fp-btn-cancel" @click="ocAdding = false">Cancelar</button>
            <button class="fp-btn-save" @click="submitOc" :disabled="ocSaving">
              {{ ocSaving ? 'Guardando…' : 'Guardar OC' }}
            </button>
          </div>
        </div>

        <!-- Lista OC -->
        <div v-if="data.ocClientes.items.length" class="fp-items">
          <div v-for="oc in data.ocClientes.items" :key="oc.id" class="fp-item">
            <div class="fp-item-head">
              <span class="fp-item-num">{{ oc.numeroOC || 'Sin N°' }}</span>
              <span v-if="oc.fechaRecepcion" class="fp-item-date">{{ fmtDate(oc.fechaRecepcion) }}</span>
              <div class="fp-item-actions">
                <a v-if="oc.documentoUrl" :href="oc.documentoUrl" target="_blank" class="fp-doc-link" title="Ver documento">📄</a>
                <button class="fp-del-btn" @click="removeOc(oc.id)" title="Eliminar">✕</button>
              </div>
            </div>
            <div class="fp-item-valores">
              <span>Base: <b>{{ fmt(oc.valorBase) }}</b></span>
              <span>IVA: <b>{{ fmt(oc.valorIva) }}</b></span>
              <span>Total: <b>{{ fmt(oc.valorTotal) }}</b></span>
            </div>
            <div v-if="oc.observaciones" class="fp-item-obs">{{ oc.observaciones }}</div>
          </div>
        </div>
        <div v-else-if="!ocAdding" class="fp-empty">Sin OC registradas</div>

        <!-- Totalizado OC -->
        <div v-if="data.ocClientes.items.length" class="fp-total-row">
          <span>Total OC:</span>
          <span>Base <b>{{ fmt(data.ocClientes.totalBase) }}</b></span>
          <span>IVA <b>{{ fmt(data.ocClientes.totalIva) }}</b></span>
          <span class="fp-total-big">{{ fmt(data.ocClientes.totalTotal) }}</span>
        </div>
      </div>

      <!-- ── 3. FACTURAS BEONE ──────────────────────────── -->
      <div class="fp-card">
        <div class="fp-card-head">
          <div class="fp-card-title">Facturas emitidas por BeOne</div>
          <button class="fp-add-btn" @click="factForm = newFactForm(); factAdding = true" v-if="!factAdding">
            + Agregar factura
          </button>
        </div>

        <!-- Form nueva factura -->
        <div v-if="factAdding" class="fp-form">
          <div class="fp-form-grid">
            <div class="fp-field">
              <label>N° Factura</label>
              <input v-model="factForm.numeroFactura" placeholder="FV-001" />
            </div>
            <div class="fp-field">
              <label>Fecha emisión</label>
              <input v-model="factForm.fechaEmision" type="date" />
            </div>
            <div class="fp-field">
              <label>Fecha vencimiento</label>
              <input v-model="factForm.fechaVencimiento" type="date" />
            </div>
            <div class="fp-field">
              <label>Valor facturado $</label>
              <input v-model="factForm.valorFacturado" type="number" min="0" @input="calcFactTotal" />
            </div>
            <div class="fp-field">
              <label>Valor IVA $</label>
              <input v-model="factForm.valorIva" type="number" min="0" @input="calcFactTotal" />
            </div>
            <div class="fp-field">
              <label>Valor total $</label>
              <input v-model="factForm.valorTotal" type="number" min="0" readonly class="fp-readonly" />
            </div>
            <div class="fp-field">
              <label>N° RAS</label>
              <input v-model="factForm.numeroRas" placeholder="RAS-001" />
            </div>
            <div class="fp-field fp-field-full">
              <label>Observaciones</label>
              <textarea v-model="factForm.observaciones" rows="2" />
            </div>
            <div class="fp-field fp-field-full">
              <label>Documento factura</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" @change="e => factForm.file = e.target.files[0]" />
            </div>
          </div>
          <div class="fp-form-actions">
            <button class="fp-btn-cancel" @click="factAdding = false">Cancelar</button>
            <button class="fp-btn-save" @click="submitFactura" :disabled="factSaving">
              {{ factSaving ? 'Guardando…' : 'Guardar factura' }}
            </button>
          </div>
        </div>

        <!-- Lista facturas -->
        <div v-if="data.facturasBeOne.items.length" class="fp-items">
          <div v-for="f in data.facturasBeOne.items" :key="f.id" class="fp-item">
            <div class="fp-item-head">
              <span class="fp-item-num">{{ f.numeroFactura || 'Sin N°' }}</span>
              <span v-if="f.fechaEmision" class="fp-item-date">{{ fmtDate(f.fechaEmision) }}</span>
              <span v-if="f.fechaVencimiento" class="fp-item-date fp-vence">Vence: {{ fmtDate(f.fechaVencimiento) }}</span>
              <div class="fp-item-actions">
                <a v-if="f.documentoUrl" :href="f.documentoUrl" target="_blank" class="fp-doc-link" title="Ver documento">📄</a>
                <button class="fp-del-btn" @click="removeFactura(f.id)" title="Eliminar">✕</button>
              </div>
            </div>
            <div class="fp-item-valores">
              <span>Facturado: <b>{{ fmt(f.valorFacturado) }}</b></span>
              <span>IVA: <b>{{ fmt(f.valorIva) }}</b></span>
              <span>Total: <b>{{ fmt(f.valorTotal) }}</b></span>
              <span v-if="f.numeroRas" class="fp-ras">RAS: {{ f.numeroRas }}</span>
            </div>
            <div v-if="f.observaciones" class="fp-item-obs">{{ f.observaciones }}</div>
          </div>
        </div>
        <div v-else-if="!factAdding" class="fp-empty">Sin facturas registradas</div>

        <!-- Totalizado facturas -->
        <div v-if="data.facturasBeOne.items.length" class="fp-total-row">
          <span>Total facturas:</span>
          <span>Facturado <b>{{ fmt(data.facturasBeOne.totalFacturado) }}</b></span>
          <span>IVA <b>{{ fmt(data.facturasBeOne.totalIva) }}</b></span>
          <span class="fp-total-big">{{ fmt(data.facturasBeOne.totalTotal) }}</span>
        </div>
      </div>

      <!-- ── 4. PAGOS ───────────────────────────────────── -->
      <div class="fp-card">
        <div class="fp-card-head">
          <div class="fp-card-title">Pagos</div>
          <button class="fp-add-btn" @click="pagoForm = newPagoForm(); pagoAdding = true" v-if="!pagoAdding">
            + Agregar pago
          </button>
        </div>

        <!-- Form nuevo pago -->
        <div v-if="pagoAdding" class="fp-form">
          <div class="fp-form-grid">
            <div class="fp-field">
              <label>Tipo</label>
              <select v-model="pagoForm.tipo">
                <option value="ANTICIPO">Anticipo</option>
                <option value="PARCIAL">Parcial</option>
                <option value="TOTAL">Total</option>
              </select>
            </div>
            <div class="fp-field">
              <label>Valor $</label>
              <input v-model="pagoForm.valor" type="number" min="0" @input="calcPagoTotal" />
            </div>
            <div class="fp-field">
              <label>Valor IVA $</label>
              <input v-model="pagoForm.valorIva" type="number" min="0" @input="calcPagoTotal" />
            </div>
            <div class="fp-field">
              <label>Valor total $</label>
              <input v-model="pagoForm.valorTotal" type="number" min="0" readonly class="fp-readonly" />
            </div>
            <div class="fp-field">
              <label>Valor retención $</label>
              <input v-model="pagoForm.valorRetencion" type="number" min="0" />
            </div>
            <div class="fp-field">
              <label>Fecha retención</label>
              <input v-model="pagoForm.fechaRetencion" type="date" />
            </div>
            <div class="fp-field fp-field-full fp-check-field">
              <label class="fp-check-label">
                <input type="checkbox" v-model="pagoForm.esCobroInterno" />
                Cobro interno (SINZA)
              </label>
            </div>
            <div class="fp-field fp-field-full">
              <label>Observaciones</label>
              <textarea v-model="pagoForm.observaciones" rows="2" />
            </div>
            <div class="fp-field">
              <label>Documento pago</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" @change="e => pagoForm.filePago = e.target.files[0]" />
            </div>
            <div class="fp-field">
              <label>Documento retenciones</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" @change="e => pagoForm.fileRet = e.target.files[0]" />
            </div>
          </div>
          <div class="fp-form-actions">
            <button class="fp-btn-cancel" @click="pagoAdding = false">Cancelar</button>
            <button class="fp-btn-save" @click="submitPago" :disabled="pagoSaving">
              {{ pagoSaving ? 'Guardando…' : 'Guardar pago' }}
            </button>
          </div>
        </div>

        <!-- Lista pagos -->
        <div v-if="data.pagosEvento.items.length" class="fp-items">
          <div v-for="p in data.pagosEvento.items" :key="p.id" class="fp-item">
            <div class="fp-item-head">
              <span class="fp-tipo-badge" :class="`fp-tipo-${p.tipo.toLowerCase()}`">{{ p.tipo }}</span>
              <span v-if="p.esCobroInterno" class="fp-interno-badge">SINZA</span>
              <div class="fp-item-actions">
                <a v-if="p.documentoPagoUrl"      :href="p.documentoPagoUrl"      target="_blank" class="fp-doc-link" title="Doc. pago">💳</a>
                <a v-if="p.documentoRetencionUrl" :href="p.documentoRetencionUrl" target="_blank" class="fp-doc-link" title="Doc. retención">📋</a>
                <button class="fp-del-btn" @click="removePago(p.id)" title="Eliminar">✕</button>
              </div>
            </div>
            <div class="fp-item-valores">
              <span>Valor: <b>{{ fmt(p.valor) }}</b></span>
              <span>IVA: <b>{{ fmt(p.valorIva) }}</b></span>
              <span>Total: <b>{{ fmt(p.valorTotal) }}</b></span>
              <span v-if="p.valorRetencion">Retención: <b>{{ fmt(p.valorRetencion) }}</b></span>
            </div>
            <div v-if="p.fechaRetencion" class="fp-item-date" style="margin-top:4px">
              Fecha retención: {{ fmtDate(p.fechaRetencion) }}
            </div>
            <div v-if="p.observaciones" class="fp-item-obs">{{ p.observaciones }}</div>
          </div>
        </div>
        <div v-else-if="!pagoAdding" class="fp-empty">Sin pagos registrados</div>

        <!-- Totalizado pagos -->
        <div v-if="data.pagosEvento.items.length" class="fp-total-row">
          <span>Total pagos:</span>
          <span>Valor <b>{{ fmt(data.pagosEvento.totalValor) }}</b></span>
          <span>IVA <b>{{ fmt(data.pagosEvento.totalIva) }}</b></span>
          <span>Retención <b>{{ fmt(data.pagosEvento.totalRetencion) }}</b></span>
          <span class="fp-total-big">{{ fmt(data.pagosEvento.totalTotal) }}</span>
        </div>
      </div>

      <!-- ── RESUMEN DE SALDO ──────────────────────────── -->
      <div class="fp-saldo-card" :class="saldoClass">
        <div class="fp-saldo-top">
          <div class="fp-saldo-left">
            <span class="fp-saldo-eyebrow">{{ saldoEyebrow }}</span>
            <span class="fp-saldo-monto">{{ fmt(Math.abs(saldo)) }}</span>
            <span v-if="saldo < 0" class="fp-saldo-overpaid">El pago excede el total de la cotización</span>
          </div>
          <div class="fp-saldo-icon">{{ saldoIcon }}</div>
        </div>
        <div class="fp-saldo-breakdown">
          <div class="fp-saldo-row">
            <span>Total cotización</span>
            <span>{{ fmt(data.cotizacion.valorTotal) }}</span>
          </div>
          <div class="fp-saldo-row">
            <span>Total pagado</span>
            <span>{{ fmt(data.pagosEvento.totalTotal) }}</span>
          </div>
          <div v-if="data.pagosEvento.totalRetencion > 0" class="fp-saldo-row fp-saldo-ret">
            <span>Retenciones aplicadas</span>
            <span>− {{ fmt(data.pagosEvento.totalRetencion) }}</span>
          </div>
          <div class="fp-saldo-divider" />
          <div class="fp-saldo-row fp-saldo-row-final">
            <span>{{ saldo <= 0 ? 'Saldo' : 'Por pagar' }}</span>
            <span class="fp-saldo-final-val">{{ fmt(Math.abs(saldo)) }}</span>
          </div>
        </div>
        <!-- Barra de progreso de pago -->
        <div class="fp-saldo-bar-wrap">
          <div class="fp-saldo-bar-fill" :style="{ width: pagoProgress + '%' }" />
        </div>
        <div class="fp-saldo-bar-label">
          <span>{{ pagoProgress }}% pagado</span>
          <span v-if="data.pagosEvento.items.length">{{ data.pagosEvento.items.length }} pago{{ data.pagosEvento.items.length > 1 ? 's' : '' }} registrado{{ data.pagosEvento.items.length > 1 ? 's' : '' }}</span>
          <span v-else>Sin pagos registrados</span>
        </div>
      </div>

    </template>

    <!-- Error global -->
    <div v-if="errorMsg" class="fp-error">{{ errorMsg }}</div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  getResumenFinanciero,
  createOc, deleteOc,
  createFactura, deleteFactura,
  createPago, deletePago,
} from '@/services/financiero.service.js'

const props = defineProps({ quotationId: { type: Number, required: true } })

const loading   = ref(true)
const data      = ref(null)
const errorMsg  = ref('')

// OC state
const ocAdding  = ref(false)
const ocSaving  = ref(false)
const ocForm    = ref({})

// Factura state
const factAdding = ref(false)
const factSaving = ref(false)
const factForm   = ref({})

// Pago state
const pagoAdding = ref(false)
const pagoSaving = ref(false)
const pagoForm   = ref({})

// ── Format helpers ────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(v ?? 0)

const fmtDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Saldo computeds ──────────────────────────────────────
const saldo = computed(() => {
  if (!data.value) return 0
  const total  = data.value.cotizacion.valorTotal
  const pagado = data.value.pagosEvento.totalTotal
  return total - pagado
})

const pagoProgress = computed(() => {
  if (!data.value) return 0
  const total  = data.value.cotizacion.valorTotal
  if (!total)  return 0
  const pagado = data.value.pagosEvento.totalTotal
  return Math.min(100, Math.round((pagado / total) * 100))
})

const saldoClass = computed(() => {
  if (saldo.value <= 0)    return 'fp-saldo-paid'
  if (pagoProgress.value >= 50) return 'fp-saldo-partial'
  return 'fp-saldo-pending'
})

const saldoIcon = computed(() => {
  if (saldo.value <= 0)    return '✓'
  if (pagoProgress.value >= 50) return '◑'
  return '!'
})

const saldoEyebrow = computed(() => {
  if (saldo.value <= 0)    return 'Pago completo'
  if (pagoProgress.value > 0) return 'Saldo pendiente'
  return 'Sin pagos registrados'
})

// ── Load ──────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    data.value = await getResumenFinanciero(props.quotationId)
  } catch {
    errorMsg.value = 'Error cargando datos financieros'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ── Form factories ────────────────────────────────────────
const newOcForm   = () => ({ numeroOC: '', fechaRecepcion: '', valorBase: 0, valorIva: 0, valorTotal: 0, observaciones: '', file: null })
const newFactForm = () => ({ numeroFactura: '', fechaEmision: '', fechaVencimiento: '', valorFacturado: 0, valorIva: 0, valorTotal: 0, numeroRas: '', observaciones: '', file: null })
const newPagoForm = () => ({ tipo: 'ANTICIPO', valor: 0, valorIva: 0, valorTotal: 0, valorRetencion: 0, fechaRetencion: '', esCobroInterno: false, observaciones: '', filePago: null, fileRet: null })

// ── Auto-calc totals ──────────────────────────────────────
const calcOcTotal   = () => { ocForm.value.valorTotal   = (parseFloat(ocForm.value.valorBase   || 0) + parseFloat(ocForm.value.valorIva    || 0)).toFixed(2) }
const calcFactTotal = () => { factForm.value.valorTotal = (parseFloat(factForm.value.valorFacturado || 0) + parseFloat(factForm.value.valorIva || 0)).toFixed(2) }
const calcPagoTotal = () => { pagoForm.value.valorTotal = (parseFloat(pagoForm.value.valor     || 0) + parseFloat(pagoForm.value.valorIva   || 0)).toFixed(2) }

// ── Build FormData ────────────────────────────────────────
function buildFd(obj, fileKey, fileVal) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined && k !== 'file' && k !== 'filePago' && k !== 'fileRet') {
      fd.append(k, String(v))
    }
  }
  if (fileVal) fd.append(fileKey, fileVal)
  return fd
}

// ── Submit OC ─────────────────────────────────────────────
async function submitOc() {
  ocSaving.value = true
  errorMsg.value = ''
  try {
    const fd = buildFd(ocForm.value, 'documento', ocForm.value.file)
    await createOc(props.quotationId, fd)
    ocAdding.value = false
    await load()
  } catch { errorMsg.value = 'Error al guardar OC' }
  finally  { ocSaving.value = false }
}

async function removeOc(id) {
  if (!confirm('¿Eliminar esta OC?')) return
  try { await deleteOc(id); await load() }
  catch { errorMsg.value = 'Error al eliminar OC' }
}

// ── Submit Factura ────────────────────────────────────────
async function submitFactura() {
  factSaving.value = true
  errorMsg.value = ''
  try {
    const fd = buildFd(factForm.value, 'documento', factForm.value.file)
    await createFactura(props.quotationId, fd)
    factAdding.value = false
    await load()
  } catch { errorMsg.value = 'Error al guardar factura' }
  finally  { factSaving.value = false }
}

async function removeFactura(id) {
  if (!confirm('¿Eliminar esta factura?')) return
  try { await deleteFactura(id); await load() }
  catch { errorMsg.value = 'Error al eliminar factura' }
}

// ── Submit Pago ───────────────────────────────────────────
async function submitPago() {
  pagoSaving.value = true
  errorMsg.value = ''
  try {
    const fd = new FormData()
    const { filePago, fileRet, ...rest } = pagoForm.value
    for (const [k, v] of Object.entries(rest)) fd.append(k, String(v))
    if (filePago) fd.append('documentoPago',      filePago)
    if (fileRet)  fd.append('documentoRetencion', fileRet)
    await createPago(props.quotationId, fd)
    pagoAdding.value = false
    await load()
  } catch { errorMsg.value = 'Error al guardar pago' }
  finally  { pagoSaving.value = false }
}

async function removePago(id) {
  if (!confirm('¿Eliminar este pago?')) return
  try { await deletePago(id); await load() }
  catch { errorMsg.value = 'Error al eliminar pago' }
}
</script>

<style scoped>
.fp-wrap { display: flex; flex-direction: column; gap: 12px; }

.fp-loading {
  display: flex; align-items: center; gap: 10px; color: #64748B; font-size: 13px; padding: 16px 0;
}
.fp-spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid #E2E8F0; border-top-color: #054EAF;
  animation: spin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Cards */
.fp-card {
  background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
  padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;
}
.fp-card-summary { background: #F0F7FF; border-color: #BFDBFE; }
.fp-card-head { display: flex; align-items: center; justify-content: space-between; }
.fp-card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; }

/* Summary trio */
.fp-trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 6px; }
.fp-trio-item { display: flex; flex-direction: column; gap: 2px; }
.fp-trio-label { font-size: 10px; color: #94A3B8; font-weight: 600; text-transform: uppercase; }
.fp-trio-val { font-size: 14px; font-weight: 700; color: #0F172A; }
.fp-trio-total .fp-trio-val { color: #054EAF; font-size: 15px; }
.fp-trio-desc { color: #DC2626; }

/* Add button */
.fp-add-btn {
  font-size: 11px; font-weight: 600; color: #054EAF; background: #EFF6FF;
  border: 1px solid #BFDBFE; border-radius: 6px; padding: 4px 10px; cursor: pointer;
  transition: background 0.15s;
}
.fp-add-btn:hover { background: #DBEAFE; }

/* Form */
.fp-form { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; }
.fp-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 12px; }
.fp-field { display: flex; flex-direction: column; gap: 3px; }
.fp-field-full { grid-column: 1 / -1; }
.fp-field label { font-size: 11px; font-weight: 600; color: #64748B; }
.fp-field input, .fp-field select, .fp-field textarea {
  border: 1px solid #CBD5E1; border-radius: 6px; padding: 6px 8px;
  font-size: 12px; color: #0F172A; background: #fff;
  outline: none; transition: border 0.15s;
}
.fp-field input:focus, .fp-field select:focus, .fp-field textarea:focus { border-color: #054EAF; }
.fp-readonly { background: #F1F5F9 !important; color: #64748B !important; }
.fp-check-field { justify-content: center; }
.fp-check-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #0F172A; cursor: pointer; }
.fp-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.fp-btn-cancel {
  padding: 6px 14px; border-radius: 6px; border: 1px solid #CBD5E1;
  font-size: 12px; font-weight: 600; color: #64748B; background: #fff; cursor: pointer;
}
.fp-btn-save {
  padding: 6px 16px; border-radius: 6px; border: none;
  font-size: 12px; font-weight: 600; color: #fff; background: #054EAF; cursor: pointer;
  transition: background 0.15s;
}
.fp-btn-save:hover:not(:disabled) { background: #0342A0; }
.fp-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* Items list */
.fp-items { display: flex; flex-direction: column; gap: 6px; }
.fp-item {
  border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px;
  background: #FAFBFC;
}
.fp-item-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.fp-item-num { font-size: 13px; font-weight: 700; color: #0F172A; }
.fp-item-date { font-size: 11px; color: #64748B; }
.fp-vence { color: #C2410C; }
.fp-item-actions { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.fp-doc-link { font-size: 16px; text-decoration: none; cursor: pointer; }
.fp-del-btn {
  width: 22px; height: 22px; border-radius: 5px; border: none;
  background: #FEE2E2; color: #991B1B; font-size: 11px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.fp-del-btn:hover { background: #FECACA; }
.fp-item-valores { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #475569; }
.fp-item-valores b { color: #0F172A; }
.fp-item-obs { font-size: 11px; color: #64748B; margin-top: 4px; font-style: italic; }
.fp-ras { font-size: 11px; color: #7C3AED; font-weight: 600; background: #F5F3FF; padding: 1px 6px; border-radius: 5px; }

/* Tipo badges */
.fp-tipo-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.fp-tipo-anticipo { background: #FFF7ED; color: #C2410C; }
.fp-tipo-parcial  { background: #EFF6FF; color: #1D4ED8; }
.fp-tipo-total    { background: #F0FDF4; color: #166534; }
.fp-interno-badge { font-size: 10px; font-weight: 700; background: #FDF4FF; color: #7E22CE; padding: 2px 7px; border-radius: 99px; }

/* Totalizado */
.fp-total-row {
  display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
  font-size: 12px; color: #475569; border-top: 1px solid #E2E8F0;
  padding-top: 8px; margin-top: 2px;
}
.fp-total-row span > b { color: #0F172A; }
.fp-total-big { margin-left: auto; font-size: 14px; font-weight: 800; color: #054EAF; }

.fp-empty { font-size: 12px; color: #94A3B8; padding: 4px 0; }
.fp-error { font-size: 12px; color: #991B1B; background: #FEF2F2; padding: 8px 12px; border-radius: 6px; margin-top: 4px; }

/* ─── Saldo card ──────────────────────────────────────── */
.fp-saldo-card {
  border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 12px;
  border: 2px solid transparent;
}
.fp-saldo-pending {
  background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
  border-color: #FED7AA;
}
.fp-saldo-partial {
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border-color: #BFDBFE;
}
.fp-saldo-paid {
  background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
  border-color: #BBF7D0;
}

.fp-saldo-top {
  display: flex; align-items: flex-start; justify-content: space-between;
}
.fp-saldo-left { display: flex; flex-direction: column; gap: 2px; }
.fp-saldo-eyebrow {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px;
}
.fp-saldo-pending  .fp-saldo-eyebrow { color: #C2410C; }
.fp-saldo-partial  .fp-saldo-eyebrow { color: #1D4ED8; }
.fp-saldo-paid     .fp-saldo-eyebrow { color: #166534; }

.fp-saldo-monto {
  font-size: 26px; font-weight: 900; line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.fp-saldo-pending .fp-saldo-monto { color: #C2410C; }
.fp-saldo-partial .fp-saldo-monto { color: #1D4ED8; }
.fp-saldo-paid    .fp-saldo-monto { color: #166534; }

.fp-saldo-overpaid { font-size: 11px; color: #7C3AED; font-style: italic; margin-top: 2px; }

.fp-saldo-icon {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 900; flex-shrink: 0;
}
.fp-saldo-pending .fp-saldo-icon { background: #FED7AA; color: #C2410C; }
.fp-saldo-partial .fp-saldo-icon { background: #BFDBFE; color: #1D4ED8; }
.fp-saldo-paid    .fp-saldo-icon { background: #BBF7D0; color: #166534; }

.fp-saldo-breakdown {
  display: flex; flex-direction: column; gap: 4px;
  background: rgba(255,255,255,0.55); border-radius: 8px; padding: 10px 12px;
}
.fp-saldo-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: #475569;
}
.fp-saldo-ret { color: #7C3AED; }
.fp-saldo-divider { height: 1px; background: rgba(0,0,0,0.08); margin: 4px 0; }
.fp-saldo-row-final {
  font-size: 13px; font-weight: 700; color: #0F172A;
}
.fp-saldo-final-val { font-size: 14px; font-weight: 800; }
.fp-saldo-pending .fp-saldo-final-val { color: #C2410C; }
.fp-saldo-partial .fp-saldo-final-val { color: #1D4ED8; }
.fp-saldo-paid    .fp-saldo-final-val { color: #166534; }

/* Barra de progreso */
.fp-saldo-bar-wrap {
  height: 6px; background: rgba(0,0,0,0.1); border-radius: 99px; overflow: hidden;
}
.fp-saldo-bar-fill {
  height: 100%; border-radius: 99px; transition: width 0.5s ease;
}
.fp-saldo-pending .fp-saldo-bar-fill { background: #F97316; }
.fp-saldo-partial .fp-saldo-bar-fill { background: #3B82F6; }
.fp-saldo-paid    .fp-saldo-bar-fill { background: #22C55E; }

.fp-saldo-bar-label {
  display: flex; justify-content: space-between;
  font-size: 11px; color: #64748B;
}
</style>
