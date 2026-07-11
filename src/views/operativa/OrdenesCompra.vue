<template>
  <div class="oc-page">

    <!-- ── Header ─────────────────────────────────────── -->
    <div class="oc-header">
      <div>
        <h1 class="oc-title">Órdenes de Compra</h1>
        <p class="oc-sub">{{ totalOCs }} OC{{ totalOCs !== 1 ? 's' : '' }} en total</p>
      </div>
      <div style="display:flex; align-items:center; gap:8px">
        <button
          v-if="canDo('OrdenCompraCrear', OC_ROLES)"
          class="oc-cash-btn"
          @click="openCashModal"
        >
          <Banknote :size="15" /> Nueva OC en efectivo
        </button>
        <button class="oc-refresh" @click="load" :disabled="loading">
          <RefreshCw :size="15" :class="{ spin: loading }" />
        </button>
      </div>
    </div>

    <!-- ── Filtros ─────────────────────────────────────── -->
    <div class="oc-filters">
      <div class="oc-search-wrap">
        <Search :size="14" class="oc-search-icon" />
        <input v-model="filters.search" class="oc-input" placeholder="Número OC o proveedor…" @input="onFilter" />
      </div>

      <!-- Estado multi-select -->
      <div class="oc-estado-wrap" ref="estadoRef">
        <button class="oc-input oc-estado-btn" @click="estadoOpen = !estadoOpen">
          <span v-if="!filters.estados.length" class="oc-placeholder">Estado</span>
          <span v-else class="oc-pills">
            <span v-for="e in filters.estados" :key="e" class="oc-pill" :class="`oc-badge-${e.toLowerCase()}`">{{ e }}</span>
          </span>
          <ChevronDown :size="13" />
        </button>
        <div v-if="estadoOpen" class="oc-estado-drop">
          <div v-for="e in ESTADOS" :key="e" class="oc-estado-opt" :class="{ sel: filters.estados.includes(e) }" @click="toggleEstado(e)">
            <span class="oc-opt-check"><Check v-if="filters.estados.includes(e)" :size="11" /></span>
            <span class="oc-badge" :class="`oc-badge-${e.toLowerCase()}`">{{ e }}</span>
          </div>
          <button v-if="filters.estados.length" class="oc-clear" @click="filters.estados = []; onFilter()">Limpiar</button>
        </div>
      </div>

      <input v-model="filters.fechaInicio" type="date" class="oc-input" @change="onFilter" />
      <input v-model="filters.fechaFin"    type="date" class="oc-input" @change="onFilter" />
    </div>

    <!-- ── Loading ─────────────────────────────────────── -->
    <div v-if="loading" class="oc-loading">
      <div class="oc-spinner" />
      <span>Cargando órdenes…</span>
    </div>

    <!-- ── Error ──────────────────────────────────────── -->
    <div v-else-if="error" class="oc-error">
      <AlertCircle :size="18" /> {{ error }}
      <button @click="load">Reintentar</button>
    </div>

    <!-- ── Empty ──────────────────────────────────────── -->
    <div v-else-if="!groupedOCs.length" class="oc-empty">
      <ShoppingCart :size="38" class="opacity-30" />
      <p>No hay órdenes de compra{{ filters.estados.length || filters.search ? ' con estos filtros' : '' }}</p>
    </div>

    <!-- ── Groups ─────────────────────────────────────── -->
    <div v-else class="oc-groups">
      <div v-for="group in groupedOCs" :key="group.quotationId" class="oc-group">

        <!-- Group header -->
        <div class="oc-group-head">
          <div class="oc-group-meta">
            <span class="oc-group-num">#{{ group.quotacion.numero }}</span>
            <span class="oc-group-name">{{ group.quotacion.empresa || group.quotacion.contacto || group.quotacion.cliente?.name || '—' }}</span>
            <span v-if="group.quotacion.description" class="oc-group-desc">· {{ group.quotacion.description }}</span>
          </div>
          <div class="oc-group-right">
            <span v-if="group.quotacion.operationWindow" class="oc-group-date">
              <Calendar :size="12" />
              {{ fmtDate(group.quotacion.operationWindow.eventStartAt) }}
            </span>
            <span class="oc-group-count">{{ group.ocs.length }} OC</span>
          </div>
        </div>

        <!-- OC list -->
        <div class="oc-list">
          <div v-for="oc in group.ocs" :key="oc.id" class="oc-card" @click="openDetail(oc)">
            <div class="oc-card-top">
              <div class="oc-card-left">
                <span class="oc-card-numero">{{ oc.numero }}</span>
                <span class="oc-badge" :class="`oc-badge-${oc.estado.toLowerCase()}`">{{ oc.estado }}</span>
              </div>
              <div class="oc-card-right">
                <!-- Estado dropdown -->
                <div class="oc-estado-ctrl oc-estado-ctrl-select" @click.stop>
                  <SelectLabel
                    :model-value="oc.estado"
                    :options="ESTADOS"
                    :disabled="oc._saving"
                    @update:model-value="v => changeEstado(oc, v)"
                  />
                  <div v-if="oc._saving" class="oc-saving-dot" />
                </div>
              </div>
            </div>

            <div class="oc-card-body">
              <div class="oc-card-proveedor">
                <Building2 :size="13" />
                <span>{{ oc.proveedorNombre }}</span>
              </div>
              <div v-if="oc.tipo === 'EFECTIVO'" class="oc-card-producto">
                <Banknote :size="13" />
                <span>Efectivo · {{ oc.descripcion }}</span>
              </div>
              <div v-else-if="oc.thirdPartyItem" class="oc-card-producto">
                <Package :size="13" />
                <span>{{ oc.thirdPartyItem.catalogProduct?.nombre || oc.thirdPartyItem.catalogProduct?.dispositivo || oc.descripcion }}</span>
              </div>
              <div class="oc-card-detail">
                <span v-if="oc.tipo !== 'EFECTIVO'">{{ oc.cantidad }} {{ oc.thirdPartyItem ? 'uds' : '' }}</span>
                <span v-if="oc.tipo !== 'EFECTIVO'" class="oc-card-sep">·</span>
                <span class="oc-card-total">{{ fmtMoney(oc.precioTotal) }}</span>
                <span v-if="oc.condicionesPago" class="oc-card-sep">·</span>
                <span v-if="oc.condicionesPago" class="oc-card-pago">{{ oc.condicionesPago }}</span>
              </div>
            </div>

            <div class="oc-card-footer">
              <div v-if="oc.fechaEntrega" class="oc-card-fecha">
                <Clock :size="12" />
                Entrega: {{ fmtDate(oc.fechaEntrega) }}
              </div>
              <div v-if="oc.responsableRecepcion" class="oc-card-responsable">
                <User :size="12" />
                {{ oc.responsableRecepcion }}
              </div>
            </div>

            <!-- Botón confirmar recepción (solo OCs aprobadas) -->
            <div v-if="oc.estado === 'APROBADA' && canDo('OrdenCompraCambiarEstado', OC_ROLES)" class="oc-confirm-wrap" @click.stop>
              <button class="oc-confirm-btn" @click.stop="confirmarRecepcion(oc)" :disabled="oc._saving">
                <CheckCircle2 :size="13" />
                Confirmar recepción
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Detail modal ───────────────────────────────── -->
    <Transition name="fade">
      <div v-if="detailOC" class="oc-detail-backdrop">
        <div class="oc-detail-modal">
          <div class="oc-detail-head">
            <div>
              <h3 class="oc-detail-num">{{ detailOC.numero }}</h3>
              <span class="oc-badge" :class="`oc-badge-${detailOC.estado.toLowerCase()}`">{{ detailOC.estado }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button
                v-if="detailOC.estado === 'APROBADA' && canDo('OrdenCompraCambiarEstado', OC_ROLES)"
                class="oc-detail-confirm-btn"
                @click="confirmarRecepcionModal"
                :disabled="detailOC._saving"
              >
                <CheckCircle2 :size="13" />
                Confirmar recepción
              </button>
              <button class="oc-detail-close" @click="detailOC = null"><X :size="20" /></button>
            </div>
          </div>
          <div class="oc-detail-body">
            <!-- Evento -->
            <div class="oc-detail-section">
              <h4 class="oc-detail-section-title">Evento</h4>
              <div class="oc-detail-row">
                <span class="oc-detail-label">Cotización</span>
                <span>#{{ detailOC.quotation?.numero }} — {{ detailOC.quotation?.empresa || detailOC.quotation?.contacto }}</span>
              </div>
              <div v-if="detailOC.quotation?.operationWindow" class="oc-detail-row">
                <span class="oc-detail-label">Fecha evento</span>
                <span>{{ fmtDate(detailOC.quotation.operationWindow.eventStartAt) }}</span>
              </div>
            </div>
            <!-- Proveedor -->
            <div class="oc-detail-section">
              <h4 class="oc-detail-section-title">Proveedor</h4>
              <div class="oc-detail-row"><span class="oc-detail-label">Nombre</span><span>{{ detailOC.proveedorNombre }}</span></div>
              <div v-if="detailOC.proveedorContacto" class="oc-detail-row"><span class="oc-detail-label">Contacto</span><span>{{ detailOC.proveedorContacto }}</span></div>
              <div v-if="detailOC.proveedorTelefono" class="oc-detail-row"><span class="oc-detail-label">Teléfono</span><span>{{ detailOC.proveedorTelefono }}</span></div>
              <div v-if="detailOC.proveedorEmail"    class="oc-detail-row"><span class="oc-detail-label">Email</span><span>{{ detailOC.proveedorEmail }}</span></div>
            </div>
            <!-- Detalle -->
            <div class="oc-detail-section">
              <h4 class="oc-detail-section-title">{{ detailOC.tipo === 'EFECTIVO' ? 'Detalle del gasto' : 'Detalle del pedido' }}</h4>
              <div class="oc-detail-row"><span class="oc-detail-label">{{ detailOC.tipo === 'EFECTIVO' ? 'Concepto' : 'Descripción' }}</span><span>{{ detailOC.descripcion }}</span></div>
              <div v-if="detailOC.tipo !== 'EFECTIVO'" class="oc-detail-row"><span class="oc-detail-label">Cantidad</span><span>{{ detailOC.cantidad }}</span></div>
              <div v-if="detailOC.tipo !== 'EFECTIVO'" class="oc-detail-row"><span class="oc-detail-label">Precio unitario</span><span>{{ fmtMoney(detailOC.precioUnitario) }}</span></div>
              <div class="oc-detail-row"><span class="oc-detail-label">{{ detailOC.tipo === 'EFECTIVO' ? 'Monto' : 'Precio total' }}</span><span class="oc-detail-total">{{ fmtMoney(detailOC.precioTotal) }}</span></div>
              <div v-if="detailOC.condicionesPago" class="oc-detail-row"><span class="oc-detail-label">Pago</span><span>{{ detailOC.condicionesPago }}</span></div>
            </div>
            <!-- Entrega -->
            <div class="oc-detail-section">
              <h4 class="oc-detail-section-title">Entrega</h4>
              <div v-if="detailOC.fechaEntrega" class="oc-detail-row"><span class="oc-detail-label">Fecha</span><span>{{ fmtDate(detailOC.fechaEntrega) }}</span></div>
              <div v-if="detailOC.direccionEntrega" class="oc-detail-row"><span class="oc-detail-label">Dirección</span><span>{{ detailOC.direccionEntrega }}</span></div>
              <div v-if="detailOC.responsableRecepcion" class="oc-detail-row"><span class="oc-detail-label">Responsable</span><span>{{ detailOC.responsableRecepcion }}</span></div>
              <div v-if="detailOC.notas" class="oc-detail-row"><span class="oc-detail-label">Notas</span><span>{{ detailOC.notas }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Nueva OC en efectivo ──────────────────────────── -->
    <Transition name="fade">
      <div v-if="cashModalOpen" class="oc-detail-backdrop" @click.self="closeCashModal">
        <div class="oc-detail-modal">
          <div class="oc-detail-head">
            <h3 class="oc-detail-num" style="margin:0">Nueva OC en efectivo</h3>
            <button class="oc-detail-close" @click="closeCashModal"><X :size="20" /></button>
          </div>
          <div class="oc-detail-body">
            <div v-if="cashError" class="oc-error" style="margin:0">
              <AlertCircle :size="16" /> {{ cashError }}
            </div>

            <div class="oc-detail-section">
              <h4 class="oc-detail-section-title">Evento</h4>
              <SelectLabel
                v-model="cashForm.quotationId"
                :options="quotEventoOptions"
                placeholder="Selecciona una cotización aprobada…"
              />
              <p v-if="!quotDisponibles.length" style="font-size:12px;color:#94A3B8;margin:2px 0 0">
                No hay cotizaciones aprobadas disponibles.
              </p>
            </div>

            <div class="oc-detail-section">
              <h4 class="oc-detail-section-title">Proveedor / Beneficiario</h4>
              <input v-model="cashForm.proveedorNombre" class="oc-input" style="width:100%" placeholder="Nombre (requerido)" />
              <input v-model="cashForm.proveedorContacto" class="oc-input" style="width:100%" placeholder="Contacto (opcional)" />
              <input v-model="cashForm.proveedorTelefono" class="oc-input" style="width:100%" placeholder="Teléfono (opcional)" />
              <input v-model="cashForm.proveedorEmail" class="oc-input" style="width:100%" placeholder="Email (opcional)" />
            </div>

            <div class="oc-detail-section">
              <h4 class="oc-detail-section-title">Gasto</h4>
              <textarea v-model="cashForm.descripcion" class="oc-input" style="width:100%; height:64px; padding:8px 10px; resize:vertical" placeholder="Concepto del gasto (ej: viáticos, combustible, imprevistos)"></textarea>
              <input v-model.number="cashForm.precioUnitario" type="number" min="0" step="0.01" class="oc-input" style="width:100%" placeholder="Monto en efectivo (COP)" />
              <input v-model="cashForm.condicionesPago" class="oc-input" style="width:100%" placeholder="Condiciones de pago (opcional)" />
              <textarea v-model="cashForm.notas" class="oc-input" style="width:100%; height:52px; padding:8px 10px; resize:vertical" placeholder="Notas (opcional)"></textarea>
            </div>

            <button class="oc-detail-confirm-btn" style="width:100%; justify-content:center; padding:10px" :disabled="cashSaving" @click="submitCashOC">
              {{ cashSaving ? 'Creando…' : 'Crear orden de compra' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { formatCOP } from '@/utils/currency.js'
import {
  RefreshCw, Search, ChevronDown, Check, AlertCircle,
  ShoppingCart, Calendar, Clock, User, Building2, Package, X, CheckCircle2,
  Plus, Banknote,
} from 'lucide-vue-next'
import { getOrdenesCompra, updateOrdenCompraEstado, createOrdenCompra, getQuotationsDisponiblesOC } from '@/services/ordenes-compra.service.js'
import { useActionAccess } from '@/composables/useActionAccess'
import SelectLabel from '@/components/input/SelectLabel.vue'

const { canDo } = useActionAccess()
const OC_ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'LIDER', 'DIRECCION', 'OPERATIVO']

const ESTADOS = ['EMITIDA', 'APROBADA', 'RECIBIDA', 'EJECUTADA', 'CANCELADA']

// ── Helpers ───────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtMoney(n) { return n == null ? '—' : formatCOP(n) }

// ── State ─────────────────────────────────────────────────
const loading    = ref(false)
const error      = ref(null)
const allOCs     = ref([])
const estadoOpen = ref(false)
const estadoRef  = ref(null)
const detailOC   = ref(null)

const filters = ref({ search: '', estados: [], fechaInicio: '', fechaFin: '' })

const totalOCs = computed(() => allOCs.value.length)

// ── Group by quotation ────────────────────────────────────
const groupedOCs = computed(() => {
  const map = new Map()
  for (const oc of allOCs.value) {
    const qid = oc.quotationId
    if (!map.has(qid)) {
      map.set(qid, { quotationId: qid, quotacion: oc.quotation, ocs: [] })
    }
    map.get(qid).ocs.push(oc)
  }
  return Array.from(map.values()).sort((a, b) => {
    const dateA = a.quotacion?.operationWindow?.eventStartAt ?? a.quotacion?.fechaCotizacion ?? ''
    const dateB = b.quotacion?.operationWindow?.eventStartAt ?? b.quotacion?.fechaCotizacion ?? ''
    return dateA < dateB ? -1 : 1
  })
})

// ── Load ──────────────────────────────────────────────────
let debounce = null
function onFilter() {
  clearTimeout(debounce)
  debounce = setTimeout(load, 350)
}

async function load() {
  loading.value = true
  error.value   = null
  try {
    const res = await getOrdenesCompra({
      search:      filters.value.search      || undefined,
      estado:      filters.value.estados.join(',') || undefined,
      fechaInicio: filters.value.fechaInicio || undefined,
      fechaFin:    filters.value.fechaFin    || undefined,
    })
    allOCs.value = (res.data ?? []).map(oc => ({ ...oc, _saving: false }))
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando órdenes'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => document.removeEventListener('click', onClickOutside))

function onClickOutside(e) {
  if (estadoRef.value && !estadoRef.value.contains(e.target)) estadoOpen.value = false
}

// ── Filters ───────────────────────────────────────────────
function toggleEstado(e) {
  const i = filters.value.estados.indexOf(e)
  i >= 0 ? filters.value.estados.splice(i, 1) : filters.value.estados.push(e)
  onFilter()
}

// ── Change estado ─────────────────────────────────────────
async function changeEstado(oc, newEstado) {
  if (newEstado === oc.estado || oc._saving) return
  oc._saving = true
  const prev = oc.estado
  oc.estado = newEstado
  try {
    await updateOrdenCompraEstado(oc.id, newEstado)
  } catch {
    oc.estado = prev
  } finally {
    oc._saving = false
  }
}

// ── Confirmar recepción ───────────────────────────────────
async function confirmarRecepcion(oc) {
  if (!confirm(`¿Confirmar que se recibió la OC ${oc.numero} del proveedor ${oc.proveedorNombre}?`)) return
  await changeEstado(oc, 'RECIBIDA')
}

async function confirmarRecepcionModal() {
  const oc = detailOC.value
  if (!oc) return
  if (!confirm(`¿Confirmar que se recibió la OC ${oc.numero} del proveedor ${oc.proveedorNombre}?`)) return
  oc._saving = true
  const prev = oc.estado
  oc.estado = 'RECIBIDA'
  try {
    await updateOrdenCompraEstado(oc.id, 'RECIBIDA')
    const inList = allOCs.value.find(o => o.id === oc.id)
    if (inList) inList.estado = 'RECIBIDA'
  } catch {
    oc.estado = prev
  } finally {
    oc._saving = false
  }
}

// ── Detail ────────────────────────────────────────────────
function openDetail(oc) { detailOC.value = oc }

// ── Nueva OC en efectivo (sin producto — monto ligado a un evento) ────────
const cashModalOpen  = ref(false)
const cashSaving     = ref(false)
const cashError      = ref('')
const quotDisponibles = ref([])
const quotEventoOptions = computed(() => quotDisponibles.value.map(q => ({
  value: q.id,
  label: `#${q.numero} — ${q.empresa || q.cliente?.name || q.description || 'Sin nombre'}`,
})))
const emptyCashForm = () => ({
  quotationId: '',
  proveedorNombre: '',
  proveedorContacto: '',
  proveedorTelefono: '',
  proveedorEmail: '',
  descripcion: '',
  precioUnitario: null,
  condicionesPago: '',
  notas: '',
})
const cashForm = ref(emptyCashForm())

async function openCashModal() {
  cashError.value = ''
  cashForm.value = emptyCashForm()
  cashModalOpen.value = true
  try {
    const res = await getQuotationsDisponiblesOC()
    quotDisponibles.value = res.data ?? []
  } catch {
    quotDisponibles.value = []
  }
}

function closeCashModal() {
  if (cashSaving.value) return
  cashModalOpen.value = false
}

async function submitCashOC() {
  const f = cashForm.value
  if (!f.quotationId || !f.proveedorNombre.trim() || !f.descripcion.trim() || !f.precioUnitario || f.precioUnitario <= 0) {
    cashError.value = 'Completa evento, proveedor/beneficiario, concepto y monto.'
    return
  }
  cashSaving.value = true
  cashError.value = ''
  try {
    await createOrdenCompra({
      quotationId: Number(f.quotationId),
      tipo: 'EFECTIVO',
      cantidad: 1,
      proveedorNombre: f.proveedorNombre.trim(),
      proveedorContacto: f.proveedorContacto.trim() || undefined,
      proveedorTelefono: f.proveedorTelefono.trim() || undefined,
      proveedorEmail: f.proveedorEmail.trim() || undefined,
      descripcion: f.descripcion.trim(),
      precioUnitario: Number(f.precioUnitario),
      condicionesPago: f.condicionesPago.trim() || undefined,
      notas: f.notas.trim() || undefined,
    })
    cashModalOpen.value = false
    await load()
  } catch (e) {
    cashError.value = e?.response?.data?.message || 'No se pudo crear la orden de compra en efectivo'
  } finally {
    cashSaving.value = false
  }
}
</script>

<style scoped>
.oc-page {
  padding: 16px 20px;
  width: 100%;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}

/* Header */
.oc-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 16px;
}
.oc-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px; font-weight: 700; color: #0F172A; margin: 0;
}
.oc-sub { font-size: 13px; color: #64748B; margin: 2px 0 0; }
.oc-refresh {
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  border: 1.5px solid #E2E8F0; border-radius: 8px; background: #fff; color: #64748B; cursor: pointer;
}
.oc-refresh:hover { background: #F8FAFC; }
.oc-cash-btn {
  display: flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px;
  border: 1.5px solid #16A34A; border-radius: 8px;
  background: #F0FDF4; color: #166534;
  font-size: 13px; font-weight: 700; font-family: 'Inter', sans-serif;
  cursor: pointer; transition: background .15s;
}
.oc-cash-btn:hover { background: #DCFCE7; }

/* Filters */
.oc-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.oc-search-wrap { position: relative; flex: 1; min-width: 200px; }
.oc-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
.oc-search-wrap .oc-input { padding-left: 30px; width: 100%; }
.oc-input {
  height: 36px; padding: 0 10px;
  border: 1.5px solid #E2E8F0; border-radius: 8px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #0F172A;
  background: #fff; outline: none; box-sizing: border-box; transition: border-color 0.15s;
}
.oc-input:focus { border-color: #27C8D8; }

/* Estado multi-select */
.oc-estado-wrap { position: relative; }
.oc-estado-btn {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  min-width: 160px; cursor: pointer; user-select: none;
}
.oc-placeholder { color: #94A3B8; font-size: 13px; }
.oc-pills { display: flex; gap: 4px; flex: 1; }
.oc-pill { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 5px; }

.oc-estado-drop {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 100;
  background: #fff; border: 1.5px solid #E2E8F0; border-radius: 10px;
  box-shadow: 0 6px 20px rgba(39,200,216,.1); padding: 5px; min-width: 160px;
}
.oc-estado-opt {
  display: flex; align-items: center; gap: 8px; padding: 7px 8px;
  border-radius: 7px; cursor: pointer; transition: background 0.1s;
}
.oc-estado-opt:hover { background: #F8FAFC; }
.oc-estado-opt.sel { background: #F0FAFB; }
.oc-opt-check {
  width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid #CBD5E1;
  display: flex; align-items: center; justify-content: center; color: #27C8D8;
}
.oc-clear { width: 100%; margin-top: 3px; padding: 5px; border: none; background: none; color: #EF4444; font-size: 12px; cursor: pointer; border-radius: 6px; }
.oc-clear:hover { background: #FEF2F2; }

/* Estado badges */
.oc-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
.oc-badge-emitida  { background: #E0F9FA; color: #27C8D8; }
.oc-badge-aprobada { background: #F0FDF4; color: #166534; }
.oc-badge-recibida { background: #1E293B; color: #F1F5F9; }
.oc-badge-ejecutada{ background: #EDE9FE; color: #6D28D9; }
.oc-badge-cancelada{ background: #FEF2F2; color: #991B1B; }

/* Loading / Error / Empty */
.oc-loading { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px; color: #64748B; font-size: 14px; }
.oc-spinner { width: 26px; height: 26px; border: 3px solid #E2E8F0; border-top-color: #27C8D8; border-radius: 50%; animation: spin 0.8s linear infinite; }
.oc-error { display: flex; align-items: center; gap: 8px; padding: 14px; background: #FEF2F2; border-radius: 10px; color: #DC2626; font-size: 13px; }
.oc-error button { margin-left: auto; padding: 4px 10px; border: 1px solid #DC2626; border-radius: 6px; background: none; color: #DC2626; cursor: pointer; font-size: 12px; }
.oc-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px; color: #94A3B8; font-size: 14px; }
.opacity-30 { opacity: 0.3; }

/* Groups */
.oc-groups { display: flex; flex-direction: column; gap: 16px; }
/* Sin overflow:hidden — clipaba el menú desplegable de SelectLabel (estado
   por OC), que se abre con position:absolute y escapa del borde del grupo. */
.oc-group { background: #fff; border-radius: 16px; box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 2px 8px rgba(39,200,216,.06); }

.oc-group-head {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  padding: 14px 18px; background: #F8FAFC; border-bottom: 1.5px solid #E2E8F0;
  border-radius: 16px 16px 0 0;
}
.oc-group-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.oc-group-num { font-size: 11px; font-weight: 700; color: #27C8D8; }
.oc-group-name { font-size: 14px; font-weight: 700; color: #0F172A; }
.oc-group-desc { font-size: 12px; color: #64748B; }
.oc-group-right { display: flex; align-items: center; gap: 10px; }
.oc-group-date { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #64748B; }
.oc-group-count { font-size: 11px; font-weight: 700; color: #64748B; background: #E2E8F0; padding: 2px 8px; border-radius: 20px; }

/* OC list */
.oc-list { display: flex; flex-direction: column; }
.oc-card {
  padding: 14px 18px;
  border-bottom: 1px solid #F1F5F9;
  cursor: pointer;
  transition: background 0.1s;
  display: flex; flex-direction: column; gap: 8px;
}
.oc-card:last-child { border-bottom: none; }
.oc-card:hover { background: #FAFBFD; }

.oc-card-top { display: flex; align-items: center; justify-content: space-between; }
.oc-card-left { display: flex; align-items: center; gap: 8px; }
.oc-card-numero { font-size: 13px; font-weight: 700; color: #27C8D8; }
.oc-card-right { display: flex; align-items: center; gap: 8px; }

.oc-estado-ctrl { display: flex; align-items: center; gap: 6px; }
.oc-estado-ctrl-select { width: 168px; }
.oc-saving-dot { width: 7px; height: 7px; border-radius: 50%; background: #27C8D8; animation: blink 0.8s alternate infinite; }
@keyframes blink { from { opacity: 1 } to { opacity: 0.2 } }

.oc-card-body { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.oc-card-proveedor, .oc-card-producto {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #374151;
}
.oc-card-detail { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748B; }
.oc-card-sep { color: #CBD5E1; }
.oc-card-total { font-weight: 600; color: #0F172A; }
.oc-card-pago { font-style: italic; }

.oc-card-footer { display: flex; flex-wrap: wrap; gap: 10px; }
.oc-card-fecha, .oc-card-responsable {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: #94A3B8;
}

/* Animations */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

/* Detail modal */
.oc-detail-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.oc-detail-modal {
  background: #fff; border-radius: 20px; width: 100%; max-width: 540px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(15,23,42,.2);
}
.oc-detail-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1.5px solid #E2E8F0; flex-shrink: 0;
}
.oc-detail-num { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 6px; }
.oc-detail-close { background: none; border: none; color: #94A3B8; cursor: pointer; padding: 6px; border-radius: 50%; }
.oc-detail-close:hover { background: #F1F5F9; color: #0F172A; }
.oc-detail-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
.oc-detail-section { display: flex; flex-direction: column; gap: 8px; }
.oc-detail-section-title {
  font-size: 10px; font-weight: 700; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.5px; margin: 0;
}
.oc-detail-row { display: flex; gap: 12px; font-size: 13px; }
.oc-detail-label { font-weight: 600; color: #64748B; min-width: 100px; flex-shrink: 0; }
.oc-detail-total { font-weight: 700; color: #0F172A; }

/* Confirmar recepción */
.oc-confirm-wrap { padding-top: 6px; border-top: 1px solid #F1F5F9; }
.oc-confirm-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 7px 12px;
  background: #E0F9FA; border: 1.5px solid #27C8D8;
  border-radius: 8px; font-size: 12px; font-weight: 700; color: #0F7A89;
  cursor: pointer; transition: background .15s, filter .15s;
  font-family: 'Inter', sans-serif;
}
.oc-confirm-btn:hover:not(:disabled) { background: #A7EEF5; }
.oc-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.oc-detail-confirm-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px;
  background: #27C8D8; border: none;
  border-radius: 8px; font-size: 12px; font-weight: 700; color: #fff;
  cursor: pointer; transition: background .15s;
  font-family: 'Inter', sans-serif;
}
.oc-detail-confirm-btn:hover:not(:disabled) { background: #1BAEBB; }
.oc-detail-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
