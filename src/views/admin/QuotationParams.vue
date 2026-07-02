<template>
  <div class="qp-page">

    <!-- Header -->
    <div class="qp-header">
      <div class="qp-header-left">
        <SlidersHorizontal :size="22" class="qp-header-icon" />
        <div>
          <h1 class="qp-title">Parámetros de Cotización</h1>
          <p class="qp-subtitle">Motor de Pricing V2 — ajusta los parámetros del cálculo sin tocar código</p>
        </div>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="qp-card">
      <div v-for="n in 5" :key="n" class="qp-skeleton-row">
        <div class="qp-skel qp-skel--label"></div>
        <div class="qp-skel qp-skel--key"></div>
        <div class="qp-skel qp-skel--input"></div>
        <div class="qp-skel qp-skel--btn"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="qp-card qp-error">
      <AlertCircle :size="20" />
      <span>{{ loadError }}</span>
      <button class="qp-btn-retry" @click="fetchAll">Reintentar</button>
    </div>

    <template v-else>
      <!-- Parámetros del motor V2 -->
      <section class="qp-section">
        <button type="button" class="qp-section-hdr" @click="toggle('motor')">
          <ChevronDown v-if="open.motor" :size="16" class="qp-chevron" />
          <ChevronRight v-else :size="16" class="qp-chevron" />
          <h2 class="qp-section-title">Motor de Pricing V2</h2>
        </button>
        <div v-show="open.motor" class="qp-card">
          <div class="qp-table-wrap">
            <table class="qp-table">
              <thead>
                <tr>
                  <th>Parámetro</th>
                  <th>Clave</th>
                  <th>Valor</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="param in v2Params" :key="param.key" :class="{ 'qp-row--saving': saving[param.key] }">
                  <td class="qp-td-label">{{ getLabel(param.key) }}</td>
                  <td class="qp-td-key"><code class="qp-code">{{ param.key }}</code></td>
                  <td class="qp-td-input">
                    <input
                      v-model="edited[param.key]"
                      type="number"
                      step="0.001"
                      class="qp-input"
                      :disabled="saving[param.key]"
                      @keydown.enter="save(param)"
                    />
                  </td>
                  <td class="qp-td-action">
                    <div class="qp-action-row">
                      <button
                        class="qp-btn-save"
                        :disabled="saving[param.key] || String(edited[param.key]) === String(param.value)"
                        @click="save(param)"
                      >
                        <Loader2 v-if="saving[param.key]" :size="13" class="qp-spin" />
                        <Save v-else :size="13" />
                        Guardar
                      </button>
                      <span v-if="saved[param.key]" class="qp-saved-badge"><CheckCircle2 :size="13" /> Guardado</span>
                      <span v-if="errors[param.key]" class="qp-err-badge">{{ errors[param.key] }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Simulador -->
      <section class="qp-section">
        <button type="button" class="qp-section-hdr" @click="toggle('sim')">
          <ChevronDown v-if="open.sim" :size="16" class="qp-chevron" />
          <ChevronRight v-else :size="16" class="qp-chevron" />
          <h2 class="qp-section-title">Simulador</h2>
        </button>
        <p v-show="open.sim" class="qp-section-hint">
          Usa los valores que tengas escritos arriba aunque no los hayas guardado — sirve para ver el impacto de un cambio antes de confirmarlo.
        </p>
        <div v-show="open.sim" class="qp-card qp-sim">
          <div class="qp-sim-inputs">
            <div class="qp-field">
              <label class="qp-field-label">Costo unitario (COP)</label>
              <input v-model.number="sim.costo" type="number" min="0" class="qp-input" />
            </div>
            <div class="qp-field">
              <label class="qp-field-label">Cantidad</label>
              <input v-model.number="sim.cantidad" type="number" min="1" class="qp-input" />
            </div>
            <div class="qp-field">
              <label class="qp-field-label">Margen comercial (%)</label>
              <input v-model.number="sim.margenComercial" type="number" min="0" step="0.1" class="qp-input" />
            </div>
          </div>

          <div v-if="simResult.error" class="qp-sim-error">{{ simResult.error }}</div>

          <template v-else>
            <div class="qp-sim-group">
              <h3 class="qp-sim-group-title">Lo que ve el vendedor</h3>
              <div class="qp-sim-grid">
                <div class="qp-sim-item">
                  <span class="qp-sim-label">Costo</span>
                  <span class="qp-sim-val">{{ formatCOP(simResult.costoTotal) }}</span>
                </div>
                <div class="qp-sim-item">
                  <span class="qp-sim-label">Precio de venta</span>
                  <span class="qp-sim-val">{{ formatCOP(simResult.subtotalVenta) }}</span>
                </div>
                <div class="qp-sim-item">
                  <span class="qp-sim-label">Comisión visible</span>
                  <span class="qp-sim-val">{{ simResult.comisionVisiblePct }}% · {{ formatCOP(simResult.comisionVisibleMonto) }}</span>
                </div>
                <div class="qp-sim-item qp-sim-item--highlight">
                  <span class="qp-sim-label">Total con IVA</span>
                  <span class="qp-sim-val">{{ formatCOP(simResult.total) }}</span>
                </div>
              </div>
            </div>

            <div class="qp-sim-group">
              <h3 class="qp-sim-group-title">Solo administración</h3>
              <div class="qp-sim-grid">
                <div class="qp-sim-item">
                  <span class="qp-sim-label">Utilidad antes de renta</span>
                  <span class="qp-sim-val">{{ formatCOP(simResult.utilidadAntesRenta) }}</span>
                </div>
                <div class="qp-sim-item">
                  <span class="qp-sim-label">Utilidad limpia</span>
                  <span class="qp-sim-val">{{ formatCOP(simResult.utilidadLimpia) }} ({{ simResult.utilidadPct }}%)</span>
                </div>
                <div class="qp-sim-item">
                  <span class="qp-sim-label">Comisión estructural</span>
                  <span class="qp-sim-val">{{ simResult.comisionEstructuralPct }}% · {{ formatCOP(simResult.comisionEstructuralMonto) }}</span>
                </div>
                <div class="qp-sim-item">
                  <span class="qp-sim-label">Reserva</span>
                  <span class="qp-sim-val">{{ formatCOP(simResult.reserva) }}</span>
                </div>
              </div>
              <div v-if="simResult.utilidadInsuficiente" class="qp-sim-alert">
                <AlertCircle :size="14" />
                Utilidad ({{ simResult.utilidadPct }}%) por debajo del mínimo objetivo ({{ simResult.utilidadMinima }}%)
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- Comisión visible (vendedor) -->
      <section class="qp-section">
        <button type="button" class="qp-section-hdr" @click="toggle('visible')">
          <ChevronDown v-if="open.visible" :size="16" class="qp-chevron" />
          <ChevronRight v-else :size="16" class="qp-chevron" />
          <h2 class="qp-section-title">Tabla de comisión visible (vendedor)</h2>
        </button>
        <p v-show="open.visible" class="qp-section-hint">Se consulta con el margen equivalente ponderado de la cotización. Porcentaje aplicado sobre el precio de venta.</p>
        <div v-show="open.visible" class="qp-card">
          <div class="qp-table-wrap">
            <table class="qp-table">
              <thead>
                <tr>
                  <th>Margen desde (%)</th>
                  <th>Margen hasta (%)</th>
                  <th>Comisión (%)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tier in visibleTiers" :key="tier.id" :class="{ 'qp-row--saving': savingTier[tier.id] }">
                  <td class="qp-td-input"><input v-model="editedTiers[tier.id].minPct" type="number" step="0.01" class="qp-input" :disabled="savingTier[tier.id]" /></td>
                  <td class="qp-td-input"><input v-model="editedTiers[tier.id].maxPct" type="number" step="0.01" class="qp-input" :disabled="savingTier[tier.id]" /></td>
                  <td class="qp-td-input"><input v-model="editedTiers[tier.id].comisionPct" type="number" step="0.01" class="qp-input" :disabled="savingTier[tier.id]" /></td>
                  <td class="qp-td-action">
                    <div class="qp-action-row">
                      <button class="qp-btn-save" :disabled="savingTier[tier.id] || !tierChanged(tier)" @click="saveTier(tier)">
                        <Loader2 v-if="savingTier[tier.id]" :size="13" class="qp-spin" />
                        <Save v-else :size="13" />
                        Guardar
                      </button>
                      <span v-if="savedTier[tier.id]" class="qp-saved-badge"><CheckCircle2 :size="13" /> Guardado</span>
                      <span v-if="tierErrors[tier.id]" class="qp-err-badge">{{ tierErrors[tier.id] }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Comisión estructural (solo administración) -->
      <section class="qp-section">
        <button type="button" class="qp-section-hdr" @click="toggle('estructural')">
          <ChevronDown v-if="open.estructural" :size="16" class="qp-chevron" />
          <ChevronRight v-else :size="16" class="qp-chevron" />
          <h2 class="qp-section-title">Tabla de comisión estructural (solo administración)</h2>
        </button>
        <p v-show="open.estructural" class="qp-section-hint">No se muestra al vendedor. Se usa para calcular la Reserva (comisión estructural − comisión visible).</p>
        <div v-show="open.estructural" class="qp-card">
          <div class="qp-table-wrap">
            <table class="qp-table">
              <thead>
                <tr>
                  <th>Margen desde (%)</th>
                  <th>Margen hasta (%)</th>
                  <th>Comisión (%)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tier in estructuralTiers" :key="tier.id" :class="{ 'qp-row--saving': savingTier[tier.id] }">
                  <td class="qp-td-input"><input v-model="editedTiers[tier.id].minPct" type="number" step="0.01" class="qp-input" :disabled="savingTier[tier.id]" /></td>
                  <td class="qp-td-input"><input v-model="editedTiers[tier.id].maxPct" type="number" step="0.01" class="qp-input" :disabled="savingTier[tier.id]" /></td>
                  <td class="qp-td-input"><input v-model="editedTiers[tier.id].comisionPct" type="number" step="0.01" class="qp-input" :disabled="savingTier[tier.id]" /></td>
                  <td class="qp-td-action">
                    <div class="qp-action-row">
                      <button class="qp-btn-save" :disabled="savingTier[tier.id] || !tierChanged(tier)" @click="saveTier(tier)">
                        <Loader2 v-if="savingTier[tier.id]" :size="13" class="qp-spin" />
                        <Save v-else :size="13" />
                        Guardar
                      </button>
                      <span v-if="savedTier[tier.id]" class="qp-saved-badge"><CheckCircle2 :size="13" /> Guardado</span>
                      <span v-if="tierErrors[tier.id]" class="qp-err-badge">{{ tierErrors[tier.id] }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Empty -->
      <div v-if="!v2Params.length" class="qp-card">
        <div class="qp-empty">
          <SlidersHorizontal :size="36" class="qp-empty-ico" />
          <p>No se encontraron parámetros configurables</p>
        </div>
      </div>

      <!-- Explicación -->
      <section class="qp-explain">
        <div class="qp-explain-hdr">
          <Info :size="16" class="qp-ico-blue" />
          <h2 class="qp-section-title">¿Cómo funciona el cálculo?</h2>
        </div>

        <div class="qp-explain-block">
          <h3>1. Precio de venta (productos de terceros)</h3>
          <p>
            <code class="qp-formula">PrecioVenta = Costo / (1 − (d + margenBaseReal + margenComercial) / 100)</code>
          </p>
          <p>
            <strong>d</strong> y <strong>margenBaseReal</strong> son fijos del negocio (el segundo ya incluye la utilidad
            objetivo y la renta proyectada, por eso no se descuentan aparte). <strong>margenComercial</strong> lo pone el
            vendedor por producto. Los productos propios no usan esta fórmula: su precio viene directo de la lista de precios.
          </p>
        </div>

        <div class="qp-explain-block">
          <h3>2. Margen equivalente de la cotización</h3>
          <p>
            Antes de buscar la comisión, se calcula un único margen para toda la cotización: el promedio de los márgenes de
            cada producto, ponderado por su costo. Los productos de terceros aportan su margen comercial real; los productos
            propios aportan un margen fijo (<strong>margenEquivalenteOwn</strong>, 16% por defecto) que no es su utilidad
            real — solo sirve para ubicar la cotización dentro de las tablas de comisión.
          </p>
        </div>

        <div class="qp-explain-block">
          <h3>3. Comisión visible y comisión estructural</h3>
          <p>
            Con ese margen equivalente se consultan las dos tablas de tramos: la <strong>visible</strong> le muestra al
            vendedor cuánto gana, y la <strong>estructural</strong> es un número interno más alto que nunca ve el vendedor.
            La diferencia entre ambas (estructural − visible) es la <strong>Reserva</strong>, que solo ve administración.
          </p>
        </div>

        <div class="qp-explain-block">
          <h3>4. Utilidad e IVA</h3>
          <p>
            La utilidad limpia es el precio de venta menos el costo menos la comisión visible. Si el porcentaje de utilidad
            resultante cae por debajo de <strong>utilidadMinima</strong>, el sistema marca la cotización como alerta. El IVA
            se aplica sobre el precio de venta para llegar al total; retención y 4×1000 solo se calculan como referencia de
            flujo de caja para administración, no afectan la utilidad.
          </p>
        </div>
      </section>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { SlidersHorizontal, Save, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Info } from 'lucide-vue-next'
import { getParams, updateParam, getCommissionTiers, updateCommissionTier } from '@/services/quotation-params.service'
import { formatCOP } from '@/utils/currency.js'

const params = ref([])
const tiers = ref([])
const edited = ref({})
const editedTiers = ref({})
const loading = ref(false)
const loadError = ref('')
const saving = ref({})
const saved = ref({})
const errors = ref({})
const savingTier = ref({})
const savedTier = ref({})
const tierErrors = ref({})

// Motor de Pricing V2 abierto por defecto; el resto colapsado.
const open = ref({ motor: true, sim: false, visible: false, estructural: false })
const toggle = (key) => { open.value[key] = !open.value[key] }

// ── Simulador — replica la fórmula del backend usando los valores que estén
// en los campos de edición (aunque no se hayan guardado), para previsualizar
// el efecto de un cambio de parámetro antes de confirmarlo. ──
const sim = ref({ costo: 1000000, cantidad: 1, margenComercial: 10 })

const numOr = (val, fallback) => {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

const simResult = computed(() => {
  const d              = numOr(edited.value.d, 3)
  const margenBaseReal  = numOr(edited.value.margenBaseReal, 23.5)
  const iva             = numOr(edited.value.iva, 19)
  const utilidadMinima  = numOr(edited.value.utilidadMinima, 13)
  const margenComercial = numOr(sim.value.margenComercial, 0)
  const costo    = numOr(sim.value.costo, 0)
  const cantidad = numOr(sim.value.cantidad, 1)

  const descuentoTotal = (d + margenBaseReal + margenComercial) / 100
  if (descuentoTotal >= 1) {
    return { error: `d (${d}) + margenBaseReal (${margenBaseReal}) + margenComercial (${margenComercial}) = ${(descuentoTotal * 100).toFixed(2)}% — debe ser menor a 100%` }
  }

  const precioUnitario = costo / (1 - descuentoTotal)
  const subtotalVenta  = precioUnitario * cantidad
  const costoTotal     = costo * cantidad
  const ivaVal = subtotalVenta * (iva / 100)
  const total  = subtotalVenta + ivaVal
  const utilidadAntesRenta = subtotalVenta - costoTotal

  // Simulación de un solo producto: el margen equivalente de la cotización
  // es el margen comercial de este ítem.
  const tierRows = tiers.value.map(t => ({ tipo: t.tipo, ...(editedTiers.value[t.id] || t) }))
  const findPct = (tipo) => {
    const match = tierRows
      .filter(t => t.tipo === tipo)
      .find(t => margenComercial >= numOr(t.minPct, 0) && margenComercial <= numOr(t.maxPct, 0))
    return match ? numOr(match.comisionPct, 0) : 0
  }

  const comisionVisiblePct     = findPct('VISIBLE')
  const comisionEstructuralPct = findPct('ESTRUCTURAL')
  const comisionVisibleMonto     = subtotalVenta * (comisionVisiblePct / 100)
  const comisionEstructuralMonto = subtotalVenta * (comisionEstructuralPct / 100)
  const reserva = comisionEstructuralMonto - comisionVisibleMonto

  const utilidadLimpia = utilidadAntesRenta - comisionVisibleMonto
  const utilidadPct = subtotalVenta > 0 ? (utilidadLimpia / subtotalVenta) * 100 : 0

  const r = (n) => Math.round(n * 100) / 100

  return {
    costoTotal: r(costoTotal),
    subtotalVenta: r(subtotalVenta),
    total: r(total),
    comisionVisiblePct,
    comisionVisibleMonto: r(comisionVisibleMonto),
    comisionEstructuralPct,
    comisionEstructuralMonto: r(comisionEstructuralMonto),
    reserva: r(reserva),
    utilidadAntesRenta: r(utilidadAntesRenta),
    utilidadLimpia: r(utilidadLimpia),
    utilidadPct: r(utilidadPct),
    utilidadMinima,
    utilidadInsuficiente: utilidadPct < utilidadMinima,
  }
})

// Claves que pertenecen al Motor de Pricing V2 (spec sección 2)
const V2_KEYS = new Set([
  'iva', 'd', 'margenBaseReal', 'utilidadMinima', 'margenEquivalenteOwn',
  'margenComercialSugerido', 'retefuente', 'cuatro_x_mil',
])

const PARAM_LABELS = {
  iva:                     'IVA (%)',
  d:                       'Descuento estructural d (%)',
  margenBaseReal:          'Margen base real (%)',
  utilidadMinima:          'Utilidad mínima objetivo (%)',
  margenEquivalenteOwn:    'Margen equivalente producto propio (%)',
  margenComercialSugerido: 'Margen comercial sugerido (%)',
  retefuente:              'Retención en la fuente (%) — flujo de caja',
  cuatro_x_mil:            '4×1000 (%) — flujo de caja',
}

const getLabel = (key) => PARAM_LABELS[key] || key

// Solo se listan las claves que efectivamente usa el cálculo (Motor V2).
// El resto de claves legadas en QuotationParam (comision, ica, margen_fijo, etc.)
// las usa únicamente el endpoint /third-party-quotation-item y no se muestran aquí.
const v2Params = computed(() => params.value.filter(p => V2_KEYS.has(p.key)))
const visibleTiers     = computed(() => tiers.value.filter(t => t.tipo === 'VISIBLE'))
const estructuralTiers = computed(() => tiers.value.filter(t => t.tipo === 'ESTRUCTURAL'))

const fetchAll = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const [{ data: paramsData }, { data: tiersData }] = await Promise.all([getParams(), getCommissionTiers()])
    const list = Array.isArray(paramsData) ? paramsData : Object.entries(paramsData).map(([key, value]) => ({ key, value }))
    params.value = list
    list.forEach(p => { edited.value[p.key] = p.value })

    tiers.value = tiersData
    tiersData.forEach(t => {
      editedTiers.value[t.id] = { minPct: t.minPct, maxPct: t.maxPct, comisionPct: t.comisionPct }
    })

    sim.value.margenComercial = numOr(edited.value.margenComercialSugerido, 10)
  } catch (e) {
    loadError.value = e?.response?.data?.message || 'Error al cargar los parámetros'
  } finally {
    loading.value = false
  }
}

const save = async (param) => {
  saving.value[param.key] = true
  errors.value[param.key] = ''
  saved.value[param.key] = false
  try {
    await updateParam(param.key, edited.value[param.key])
    param.value = edited.value[param.key]
    saved.value[param.key] = true
    setTimeout(() => { saved.value[param.key] = false }, 2500)
  } catch (e) {
    errors.value[param.key] = e?.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value[param.key] = false
  }
}

const tierChanged = (tier) => {
  const e = editedTiers.value[tier.id]
  return !e || String(e.minPct) !== String(tier.minPct) || String(e.maxPct) !== String(tier.maxPct) || String(e.comisionPct) !== String(tier.comisionPct)
}

const saveTier = async (tier) => {
  savingTier.value[tier.id] = true
  tierErrors.value[tier.id] = ''
  savedTier.value[tier.id] = false
  try {
    const payload = editedTiers.value[tier.id]
    await updateCommissionTier(tier.id, {
      minPct: Number(payload.minPct),
      maxPct: Number(payload.maxPct),
      comisionPct: Number(payload.comisionPct),
    })
    Object.assign(tier, payload)
    savedTier.value[tier.id] = true
    setTimeout(() => { savedTier.value[tier.id] = false }, 2500)
  } catch (e) {
    tierErrors.value[tier.id] = e?.response?.data?.message || 'Error al guardar'
  } finally {
    savingTier.value[tier.id] = false
  }
}

onMounted(async () => { await fetchAll() })
</script>

<style scoped>
.qp-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding-bottom: 40px;
}

/* Header */
.qp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.qp-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.qp-header-icon { color: #27C8D8; flex-shrink: 0; }
.qp-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 2px;
}
.qp-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #64748B;
  margin: 0;
}

/* Sections */
.qp-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qp-section-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}
.qp-section-title--muted { color: #94A3B8; }
.qp-section-hint {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #64748B;
  margin: -6px 0 0;
}
.qp-section-hdr {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  text-align: left;
  width: fit-content;
}
.qp-chevron { color: #94A3B8; flex-shrink: 0; }
.qp-section-hdr:hover .qp-section-title { color: #27C8D8; }
.qp-section-hdr:hover .qp-chevron { color: #27C8D8; }

/* Explicación */
.qp-explain {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #F8FDFE;
  border: 1px solid #E0F5F7;
  border-radius: 16px;
  padding: 20px 24px;
  margin-top: 8px;
}
.qp-explain-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qp-ico-blue { color: #27C8D8; flex-shrink: 0; }
.qp-explain-block h3 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 6px;
}
.qp-explain-block p {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.6;
  color: #475569;
  margin: 0 0 4px;
}
.qp-explain-block strong { color: #0F1A2E; }
.qp-formula {
  display: inline-block;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  background: #EEF1F7;
  color: #0F1A2E;
  padding: 6px 10px;
  border-radius: 6px;
  margin: 4px 0;
}

/* Simulador */
.qp-card.qp-sim {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.qp-sim-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.qp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
  flex: 1;
}
.qp-field-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.qp-sim-group {
  border-top: 1px solid #F1F5FA;
  padding-top: 16px;
}
.qp-sim-group-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 12px;
}
.qp-sim-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}
.qp-sim-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.qp-sim-item--highlight .qp-sim-val { color: #27C8D8; }
.qp-sim-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #94A3B8;
}
.qp-sim-val {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #0F1A2E;
}
.qp-sim-error {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #B91C1C;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 10px 14px;
}
.qp-sim-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #B45309;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 8px;
  padding: 8px 12px;
}

/* Card */
.qp-card {
  background: #fff;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 1px 4px rgba(39,200,216, .06), 0 4px 16px rgba(39,200,216, .08);
  border: 1px solid #EEF1F7;
  overflow: hidden;
}

/* Skeleton */
.qp-skeleton-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  border-bottom: 1px solid #F1F5FA;
}
.qp-skel {
  background: #EEF1F7;
  border-radius: 6px;
  animation: shimmer 1.2s infinite ease-in-out;
  height: 16px;
}
.qp-skel--label { width: 160px; }
.qp-skel--key   { width: 100px; }
.qp-skel--input { flex: 1; }
.qp-skel--btn   { width: 80px; }
@keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

/* Error */
.qp-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  color: #B91C1C;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}
.qp-btn-retry {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid #FECACA;
  border-radius: 7px;
  cursor: pointer;
  margin-left: 8px;
}

/* Table */
.qp-table-wrap { overflow-x: auto; }
.qp-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}
.qp-table thead tr {
  background: #F8FAFC;
  border-bottom: 2px solid #F0FAFB;
}
.qp-table th {
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 10px 20px;
  white-space: nowrap;
}
.qp-table td {
  padding: 12px 20px;
  border-bottom: 1px solid #F1F5FA;
  color: #0F1A2E;
  vertical-align: middle;
}
.qp-table tr:last-child td { border-bottom: none; }
.qp-row--saving { opacity: 0.7; }

.qp-td-label { font-weight: 500; min-width: 160px; }
.qp-td-key   { min-width: 120px; }
.qp-td-input { min-width: 160px; }
.qp-td-action { min-width: 180px; }

.qp-code {
  font-size: 11px;
  background: #EEF1F7;
  color: #374151;
  padding: 2px 7px;
  border-radius: 5px;
  font-family: 'Fira Code', monospace;
}

.qp-input {
  width: 100%;
  padding: 7px 11px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  border: 1px solid #D1DAE6;
  border-radius: 8px;
  background: #F8FAFC;
  transition: border 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.qp-input:focus {
  outline: none;
  border-color: #27C8D8;
  box-shadow: 0 0 0 3px rgba(39,200,216, 0.10);
  background: #fff;
}
.qp-input:disabled { opacity: 0.6; cursor: not-allowed; }

.qp-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qp-btn-save {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 600;
  background: #27C8D8;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s, opacity 0.15s;
  box-shadow: 0 1px 4px rgba(39,200,216, 0.18);
}
.qp-btn-save:hover:not(:disabled) { background: #1BAEBB; }
.qp-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
.qp-spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.qp-saved-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #16A34A;
  font-family: 'Inter', sans-serif;
}
.qp-err-badge {
  font-size: 11px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
}

/* Empty */
.qp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: #94A3B8;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}
.qp-empty-ico { color: #CBD5E1; }
</style>
