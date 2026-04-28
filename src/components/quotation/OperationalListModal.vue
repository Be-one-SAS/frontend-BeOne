<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="op-modal-overlay" @click.self="$emit('close')">
        <div class="op-modal-container">

          <!-- ══════════ HEADER ══════════ -->
          <header class="op-header">
            <div class="flex items-center gap-3">
              <div class="op-header-icon">
                <ClipboardCheck :size="20" />
              </div>
              <div>
                <h2 class="op-title">Lista Operativa — Evento #{{ event?.numero }}</h2>
                <p class="op-subtitle">{{ event?.description || event?.empresa }}</p>
              </div>
            </div>

            <div class="op-progress-wrap hidden md:flex">
              <div class="op-progress-info">
                <span class="op-progress-text">
                  ✅ <strong>{{ validatedCount }}</strong> de {{ totalCount }} materiales validados
                </span>
                <span class="op-progress-pct">{{ progressPct }}%</span>
              </div>
              <div class="op-progress-bar-bg">
                <div class="op-progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
              </div>
            </div>

            <button class="op-close-btn" @click="$emit('close')">
              <X :size="20" />
            </button>
          </header>

          <!-- ══════════ LOADING ══════════ -->
          <div v-if="loading" class="op-loading">
            <Loader2 :size="32" class="spin" />
            <p>Cargando materiales…</p>
          </div>

          <!-- ══════════ CONTENT ══════════ -->
          <div v-else class="op-content">

            <!-- Mobile progress -->
            <div class="op-progress-wrap md:hidden mb-6">
              <div class="op-progress-info">
                <span class="op-progress-text">✅ {{ validatedCount }}/{{ totalCount }} validados</span>
                <span class="op-progress-pct">{{ progressPct }}%</span>
              </div>
              <div class="op-progress-bar-bg">
                <div class="op-progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
              </div>
            </div>

            <!-- ── 1. Equipos solicitados (informativo) ──────────── -->
            <section class="op-section">
              <h3 class="section-title">Equipos / Juegos Solicitados</h3>
              <div class="product-grid-layout">
                <div v-for="item in allItems" :key="item.id" class="p-card">
                  <div class="p-card-icon"><Package :size="20" /></div>
                  <div class="p-card-body">
                    <p class="p-card-name">{{ getProductName(item) }}</p>
                    <div class="p-card-footer">
                      <span class="p-card-qty">x{{ getProductQty(item) }}</span>
                      <span class="p-card-type" :class="item.isThird ? 'badge-ext' : 'badge-own'">
                        {{ item.isThird ? 'Tercero' : 'Propio' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- ── 1b. Info operativa por producto ──────────────── -->
            <div v-if="productInfoItems.length > 0" class="prod-info-strip">
              <div
                v-for="(p, i) in productInfoItems"
                :key="i"
                class="prod-info-card"
              >
                <p class="prod-info-name">🎪 {{ p.nombre }}</p>
                <div class="prod-info-tags">
                  <span v-if="p.amperios" class="prod-tag">⚡ {{ p.amperios }} amp</span>
                  <span v-if="p.qMotores" class="prod-tag">⚙️ {{ p.qMotores }} motor{{ p.qMotores !== 1 ? 'es' : '' }}</span>
                  <span v-if="p.qMetrosExtensiones" class="prod-tag">📏 {{ p.qMetrosExtensiones }}m extensiones</span>
                  <span v-if="p.qOperarios" class="prod-tag">👷 {{ p.qOperarios }} operario{{ p.qOperarios !== 1 ? 's' : '' }}</span>
                  <span v-if="p.qExtintores" class="prod-tag">🧯 {{ p.qExtintores }} extintor{{ p.qExtintores !== 1 ? 'es' : '' }}</span>
                </div>
              </div>
            </div>

            <!-- ── 2. Lista de Materiales (backend-driven) ───────── -->
            <section class="op-section">
              <div class="flex items-center justify-between mb-0">
                <h3 class="section-title">Lista de Materiales</h3>
                <button
                  v-if="activeMateriales.length > 0"
                  class="btn-validate-all"
                  :disabled="savingAll"
                  @click="handleValidarTodos"
                >
                  <Loader2 v-if="savingAll" :size="13" class="spin" />
                  <CheckCircle2 v-else :size="13" />
                  Validar todos
                </button>
              </div>

              <!-- Empty state -->
              <div v-if="activeMateriales.length === 0" class="op-empty">
                <Package :size="40" class="op-empty-ico" />
                <p>No hay materiales asignados</p>
                <button
                  v-if="productInfoItems.length > 0"
                  class="op-btn-sync"
                  :disabled="syncing"
                  @click="handleSync"
                >
                  <Loader2 v-if="syncing" :size="14" class="spin" />
                  <span v-else>⚙️</span>
                  Sincronizar materiales del producto
                </button>
                <button class="op-btn-add-first" @click="openAddModal">
                  <Plus :size="14" /> Agregar material manualmente
                </button>
              </div>

              <!-- Grid de materiales -->
              <div v-else class="material-grid-layout">
                <div
                  v-for="mat in activeMateriales"
                  :key="mat.id"
                  class="m-card"
                  :class="{ 'm-card--validated': mat.validado, 'm-card--saving': savingMat[mat.id] }"
                  @click="toggleValidar(mat)"
                >
                  <div v-if="mat.validado" class="m-card-check">
                    <Check :size="12" stroke-width="3" />
                  </div>
                  <button class="m-card-delete" @click.stop="pendingDelete = mat">
                    <Trash2 :size="12" />
                  </button>
                  <div v-if="mat.esExtra" class="m-card-badge">Extra</div>
                  <span class="m-card-cat-icon">{{ mat.categoria?.icono || '📦' }}</span>
                  <p class="m-card-name">{{ mat.nombre }}</p>
                  <p class="m-card-qty">{{ mat.cantidad }} {{ mat.unidad }}</p>
                  <p v-if="mat.productoOrigen" class="m-card-desc">De: {{ mat.productoOrigen }}</p>
                  <p v-else-if="mat.descripcion" class="m-card-desc">{{ mat.descripcion }}</p>
                </div>

                <!-- Add card -->
                <button class="m-card-add" @click="openAddModal">
                  <Plus :size="20" />
                  <span>Agregar material</span>
                </button>
              </div>
            </section>

            <!-- ── 3. Resumen por categoría ───────────────────────── -->
            <section v-if="activeMateriales.length > 0" class="op-section">
              <h3 class="section-title">Resumen Consolidado</h3>
              <div class="material-grid-layout">
                <div
                  v-for="c in consolidadoPorCategoria"
                  :key="c.categoriaId"
                  class="m-card m-card--summary"
                  :class="{ 'm-card--validated': c.allValidated }"
                >
                  <div v-if="c.allValidated" class="m-card-check">
                    <Check :size="12" stroke-width="3" />
                  </div>
                  <span class="m-card-cat-icon">{{ c.icono }}</span>
                  <p class="m-card-name">{{ c.nombre }}</p>
                  <p class="m-card-qty">{{ c.count }} item{{ c.count !== 1 ? 's' : '' }}</p>
                  <p class="m-card-desc">{{ c.validados }}/{{ c.count }} validados</p>
                </div>
              </div>
            </section>

            <!-- ── 4. Notas operativas ────────────────────────────── -->
            <section class="op-section">
              <h3 class="section-title">
                <MessageSquare :size="14" />
                Notas Operativas
              </h3>
              <textarea
                v-model="notes"
                class="op-textarea"
                placeholder="Agrega observaciones sobre el estado de los materiales o requerimientos especiales…"
              ></textarea>
            </section>

          </div>

          <!-- ══════════ FOOTER ══════════ -->
          <footer class="op-footer">
            <div class="flex-1 flex items-center gap-3">
              <div v-if="!allValidated" class="op-footer-status op-footer-status--warn">
                <AlertCircle :size="14" />
                Valida todos los materiales ({{ validatedCount }}/{{ totalCount }})
              </div>
              <div v-else class="op-footer-status op-footer-status--ok">
                <CheckCircle2 :size="14" />
                ¡Todo listo para operar!
              </div>
            </div>
            <button class="op-btn-secondary" @click="$emit('close')">Cancelar</button>
            <button
              class="op-btn-primary"
              :disabled="!allValidated"
              @click="showConfirm = true"
            >
              <CheckCircle2 :size="16" />
              Revisado y Completo
            </button>
          </footer>

          <!-- ══════════ SUB-MODAL: AGREGAR MATERIAL ══════════ -->
          <Transition name="fade">
            <div v-if="showAddModal" class="sub-modal-overlay" @click.self="closeAddModal">
              <div class="sub-modal-card">

                <!-- STEP 1 — Origen -->
                <div v-if="addStep === 1">
                  <h4 class="sub-modal-title">Agregar Material</h4>
                  <div class="origin-grid">
                    <button class="origin-btn" @click="addStep = 2; addOrigin = 'catalogo'">
                      <BookOpen :size="28" />
                      <span class="origin-btn-label">Desde catálogo</span>
                      <small class="origin-btn-hint">Busca en la biblioteca</small>
                    </button>
                    <button class="origin-btn" @click="addStep = 2; addOrigin = 'nuevo'">
                      <PlusCircle :size="28" />
                      <span class="origin-btn-label">Material nuevo</span>
                      <small class="origin-btn-hint">Personalizado</small>
                    </button>
                  </div>
                  <div class="sub-modal-actions" style="margin-top: 8px">
                    <button class="sm-btn-sec" @click="closeAddModal">Cancelar</button>
                  </div>
                </div>

                <!-- STEP 2a — Catálogo -->
                <div v-if="addStep === 2 && addOrigin === 'catalogo'">
                  <h4 class="sub-modal-title">Buscar en Catálogo</h4>
                  <div class="sub-modal-form">
                    <div class="sm-field">
                      <label>Categoría</label>
                      <select v-model.number="catalogFilter.categoriaId" class="sm-select">
                        <option :value="undefined">Todas las categorías</option>
                        <option v-for="c in categorias" :key="c.id" :value="c.id">
                          {{ c.icono }} {{ c.nombre }}
                        </option>
                      </select>
                    </div>
                    <div class="sm-field">
                      <label>Buscar</label>
                      <input v-model="catalogFilter.search" type="text" placeholder="Nombre del material…" />
                    </div>
                  </div>

                  <div class="catalog-list">
                    <div v-if="catalogLoading" class="catalog-empty">
                      <Loader2 :size="20" class="spin" /> Cargando…
                    </div>
                    <div v-else-if="filteredCatalog.length === 0" class="catalog-empty">
                      Sin resultados
                    </div>
                    <div
                      v-for="m in filteredCatalog"
                      :key="m.id"
                      class="catalog-item"
                      :class="{ 'catalog-item--sel': selectedCatalogMat?.id === m.id }"
                      @click="selectedCatalogMat = m"
                    >
                      <span class="catalog-ico">{{ m.categoria?.icono || '📦' }}</span>
                      <div class="catalog-info">
                        <span class="catalog-name">{{ m.nombre }}</span>
                        <span class="catalog-unit">{{ m.unidad }}</span>
                      </div>
                      <CheckCircle2 v-if="selectedCatalogMat?.id === m.id" :size="16" class="catalog-check" />
                    </div>
                  </div>

                  <div v-if="selectedCatalogMat" class="sm-field mt-3">
                    <label>Cantidad</label>
                    <input v-model.number="catalogQty" type="number" min="1" placeholder="1" />
                  </div>

                  <div class="sub-modal-actions">
                    <button class="sm-btn-sec" @click="addStep = 1">← Volver</button>
                    <button
                      class="sm-btn-pri"
                      :disabled="!selectedCatalogMat || !catalogQty || savingAdd"
                      @click="addFromCatalog"
                    >
                      <Loader2 v-if="savingAdd" :size="13" class="spin" />
                      Agregar
                    </button>
                  </div>
                </div>

                <!-- STEP 2b — Material nuevo -->
                <div v-if="addStep === 2 && addOrigin === 'nuevo'">
                  <h4 class="sub-modal-title">Nuevo Material</h4>
                  <div class="sub-modal-form">
                    <div class="sm-field">
                      <label>Nombre <span class="req">*</span></label>
                      <input v-model="newMat.nombre" type="text" placeholder="Ej: Tornillos M8" />
                    </div>
                    <div class="sm-grid">
                      <div class="sm-field">
                        <label>Cantidad <span class="req">*</span></label>
                        <input v-model.number="newMat.cantidad" type="number" min="1" placeholder="1" />
                      </div>
                      <div class="sm-field">
                        <label>Unidad <span class="req">*</span></label>
                        <input v-model="newMat.unidad" type="text" placeholder="uds, metros, kg…" />
                      </div>
                    </div>
                    <div class="sm-field">
                      <label>Categoría <span class="req">*</span></label>
                      <select v-model.number="newMat.categoriaId" class="sm-select" @change="newMat.atributos = {}">
                        <option :value="undefined">Selecciona categoría</option>
                        <option v-for="c in categorias" :key="c.id" :value="c.id">
                          {{ c.icono }} {{ c.nombre }}
                        </option>
                      </select>
                    </div>

                    <!-- Campos dinámicos de la categoría -->
                    <template v-if="selectedNewCategoria">
                      <div
                        v-for="campo in selectedNewCategoria.campos"
                        :key="campo.key"
                        class="sm-field"
                      >
                        <label>
                          {{ campo.label }}
                          <span v-if="campo.unit" class="campo-unit">({{ campo.unit }})</span>
                        </label>
                        <input
                          v-if="campo.type === 'number'"
                          type="number"
                          v-model.number="newMat.atributos[campo.key]"
                          :placeholder="campo.label"
                        />
                        <input
                          v-else-if="campo.type === 'text'"
                          type="text"
                          v-model="newMat.atributos[campo.key]"
                          :placeholder="campo.label"
                        />
                        <label v-else-if="campo.type === 'boolean'" class="check-row">
                          <input type="checkbox" v-model="newMat.atributos[campo.key]" />
                          {{ campo.label }}
                        </label>
                      </div>
                    </template>

                    <div class="sm-field">
                      <label>Descripción</label>
                      <input v-model="newMat.descripcion" type="text" placeholder="Notas adicionales (opcional)" />
                    </div>
                  </div>
                  <div class="sub-modal-actions">
                    <button class="sm-btn-sec" @click="addStep = 1">← Volver</button>
                    <button
                      class="sm-btn-pri"
                      :disabled="!newMat.nombre || !newMat.categoriaId || !newMat.cantidad || !newMat.unidad || savingAdd"
                      @click="addNewMaterial"
                    >
                      <Loader2 v-if="savingAdd" :size="13" class="spin" />
                      Agregar
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </Transition>

          <!-- ══════════ DELETE CONFIRM ══════════ -->
          <Transition name="fade">
            <div v-if="pendingDelete" class="confirm-overlay" @click.self="pendingDelete = null">
              <div class="confirm-card">
                <div class="confirm-icon">
                  <Trash2 :size="28" />
                </div>
                <h4 class="confirm-title">¿Eliminar material?</h4>
                <p class="confirm-text">
                  <template v-if="pendingDelete.esExtra">
                    Este material extra será eliminado definitivamente.
                  </template>
                  <template v-else>
                    Solo afectará esta cotización. El catálogo no cambia.
                  </template>
                </p>
                <div class="confirm-actions">
                  <button class="op-btn-secondary" @click="pendingDelete = null">Cancelar</button>
                  <button class="op-btn-danger" @click="executeDelete">Sí, eliminar</button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- ══════════ COMPLETE CONFIRM ══════════ -->
          <Transition name="fade">
            <div v-if="showConfirm" class="confirm-overlay" @click.self="showConfirm = false">
              <div class="confirm-card">
                <div class="confirm-icon"><CheckCircle2 :size="32" /></div>
                <h4 class="confirm-title">¿Confirmar Revisión?</h4>
                <p class="confirm-text">¿Todos los materiales han sido validados y están listos?</p>
                <div class="confirm-actions">
                  <button class="op-btn-secondary" @click="showConfirm = false">Cancelar</button>
                  <button class="op-btn-primary" @click="handleComplete">Sí, confirmar</button>
                </div>
              </div>
            </div>
          </Transition>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  X, Package, ClipboardCheck, CheckCircle2, MessageSquare,
  Plus, Trash2, Check, AlertCircle, Loader2,
  BookOpen, PlusCircle,
} from 'lucide-vue-next'
import {
  getCotizacionMateriales,
  getMaterialCategorias,
  getMaterialesBase,
  createCotizacionMaterial,
  updateCotizacionMaterial,
  deleteCotizacionMaterial,
  validarTodosMateriales,
  syncProductosMateriales,
} from '@/services/materiales.service'

const props = defineProps({ show: Boolean, event: Object })
const emit = defineEmits(['close', 'complete'])

// ── State general ─────────────────────────────────────────────
const loading    = ref(false)
const materiales = ref([])
const categorias = ref([])
const notes      = ref('')
const showConfirm = ref(false)
const savingMat  = ref({})   // { materialId: true }
const savingAll  = ref(false)
const syncing    = ref(false)

// ── Add modal state ───────────────────────────────────────────
const showAddModal = ref(false)
const addStep      = ref(1)
const addOrigin    = ref('')
const savingAdd    = ref(false)

// Catálogo picker
const catalogFilter       = ref({ categoriaId: undefined, search: '' })
const catalogLoading      = ref(false)
const catalogItems        = ref([])
const selectedCatalogMat  = ref(null)
const catalogQty          = ref(1)

// Nuevo material
const newMat = ref({ nombre: '', cantidad: 1, unidad: 'unidad', categoriaId: undefined, descripcion: '', atributos: {} })

// Delete confirm
const pendingDelete = ref(null)

// ── Load data ─────────────────────────────────────────────────
watch(() => props.show, async (val) => {
  if (val && props.event?.id) {
    loading.value = true
    materiales.value = []
    try {
      const [mats, cats] = await Promise.all([
        getCotizacionMateriales(props.event.id),
        getMaterialCategorias(),
      ])
      materiales.value = mats
      categorias.value = cats
    } catch (e) {
      console.error('[OperationalListModal] Error cargando datos:', e)
    } finally {
      loading.value = false
    }
  }
}, { immediate: true })

// ── Computed ──────────────────────────────────────────────────
const allItems = computed(() => {
  const own   = (props.event?.items || []).map(i => ({ ...i, isThird: false }))
  const third = (props.event?.thirdPartyItems || []).map(i => ({ ...i, isThird: true }))
  return [...own, ...third]
})

const activeMateriales = computed(() =>
  materiales.value.filter(m => !m.eliminado)
)

const totalCount     = computed(() => activeMateriales.value.length)
const validatedCount = computed(() => activeMateriales.value.filter(m => m.validado).length)
const progressPct    = computed(() =>
  totalCount.value === 0 ? 100 : Math.round((validatedCount.value / totalCount.value) * 100)
)
const allValidated = computed(() => totalCount.value > 0 && validatedCount.value >= totalCount.value)

const consolidadoPorCategoria = computed(() => {
  const map = new Map()
  for (const m of activeMateriales.value) {
    const key = m.categoriaId
    if (!map.has(key)) {
      map.set(key, {
        categoriaId: key,
        nombre: m.categoria?.nombre || 'Sin categoría',
        icono: m.categoria?.icono || '📦',
        count: 0,
        validados: 0,
        allValidated: true,
      })
    }
    const entry = map.get(key)
    entry.count++
    if (m.validado) entry.validados++
    else entry.allValidated = false
  }
  return Array.from(map.values())
})

// ── Product info for header ───────────────────────────────────
const productInfoItems = computed(() =>
  (props.event?.items || [])
    .filter(i => i.product)
    .map(i => ({
      nombre: i.product.dispositivo || i.product.nombre || 'Producto',
      amperios: i.product.amperios,
      qMotores: i.product.qMotores,
      qMetrosExtensiones: i.product.qMetrosExtensiones,
      qOperarios: i.product.qOperarios,
      qExtintores: i.product.qExtintores,
    }))
    .filter(p => p.amperios || p.qMotores || p.qMetrosExtensiones || p.qOperarios)
)

// ── Catalog picker ────────────────────────────────────────────
const filteredCatalog = computed(() => {
  const q = catalogFilter.value.search.toLowerCase()
  return catalogItems.value.filter(m => {
    const matchCat = !catalogFilter.value.categoriaId || m.categoriaId === catalogFilter.value.categoriaId
    const matchQ   = !q || m.nombre.toLowerCase().includes(q)
    return matchCat && matchQ
  })
})

watch(
  () => showAddModal.value,
  async (val) => {
    if (val && catalogItems.value.length === 0) {
      catalogLoading.value = true
      try {
        catalogItems.value = await getMaterialesBase({ activo: true })
      } finally {
        catalogLoading.value = false
      }
    }
  },
)

const selectedNewCategoria = computed(() =>
  categorias.value.find(c => c.id === newMat.value.categoriaId) || null
)

// ── Helpers ───────────────────────────────────────────────────
const getProductName = (item) =>
  item.isThird
    ? (item.catalogProduct?.dispositivo || item.dispositivo || item.nombre || '—')
    : (item.product?.dispositivo || item.product?.nombre || item.dispositivo || 'Equipo sin nombre')

const getProductQty = (item) =>
  item.isThird ? (item.cantidad || 1) : (item.cantidadProducto || item.quantity || 1)

// ── Actions ───────────────────────────────────────────────────
async function toggleValidar(mat) {
  if (savingMat.value[mat.id]) return
  savingMat.value = { ...savingMat.value, [mat.id]: true }
  try {
    const updated = await updateCotizacionMaterial(props.event.id, mat.id, { validado: !mat.validado })
    const idx = materiales.value.findIndex(m => m.id === mat.id)
    if (idx !== -1) materiales.value[idx] = { ...materiales.value[idx], ...updated }
  } catch (e) {
    console.error('[OperationalListModal] Error toggling material:', e)
  } finally {
    const s = { ...savingMat.value }
    delete s[mat.id]
    savingMat.value = s
  }
}

async function handleValidarTodos() {
  savingAll.value = true
  try {
    await validarTodosMateriales(props.event.id)
    materiales.value = materiales.value.map(m =>
      m.eliminado ? m : { ...m, validado: true }
    )
  } catch (e) {
    console.error('[OperationalListModal] Error validando todos:', e)
  } finally {
    savingAll.value = false
  }
}

async function executeDelete() {
  const mat = pendingDelete.value
  if (!mat) return
  try {
    await deleteCotizacionMaterial(props.event.id, mat.id)
    if (mat.esExtra) {
      materiales.value = materiales.value.filter(m => m.id !== mat.id)
    } else {
      const idx = materiales.value.findIndex(m => m.id === mat.id)
      if (idx !== -1) materiales.value[idx] = { ...materiales.value[idx], eliminado: true }
    }
  } catch (e) {
    console.error('[OperationalListModal] Error eliminando material:', e)
  } finally {
    pendingDelete.value = null
  }
}

// ── Add modal ─────────────────────────────────────────────────
function openAddModal() {
  addStep.value = 1
  addOrigin.value = ''
  selectedCatalogMat.value = null
  catalogQty.value = 1
  catalogFilter.value = { categoriaId: undefined, search: '' }
  newMat.value = { nombre: '', cantidad: 1, unidad: 'unidad', categoriaId: undefined, descripcion: '', atributos: {} }
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

async function addFromCatalog() {
  if (!selectedCatalogMat.value || !catalogQty.value) return
  savingAdd.value = true
  try {
    const mat = selectedCatalogMat.value
    const created = await createCotizacionMaterial(props.event.id, {
      materialBaseId: mat.id,
      nombre: mat.nombre,
      cantidad: catalogQty.value,
      unidad: mat.unidad,
      categoriaId: mat.categoriaId,
      esExtra: true,
    })
    materiales.value.push(created)
    closeAddModal()
  } catch (e) {
    console.error('[OperationalListModal] Error agregando desde catálogo:', e)
  } finally {
    savingAdd.value = false
  }
}

async function addNewMaterial() {
  const m = newMat.value
  if (!m.nombre || !m.categoriaId || !m.cantidad || !m.unidad) return
  savingAdd.value = true
  try {
    const created = await createCotizacionMaterial(props.event.id, {
      nombre: m.nombre,
      descripcion: m.descripcion || undefined,
      cantidad: m.cantidad,
      unidad: m.unidad,
      categoriaId: m.categoriaId,
      atributos: Object.keys(m.atributos).length > 0 ? m.atributos : undefined,
      esExtra: true,
    })
    materiales.value.push(created)
    closeAddModal()
  } catch (e) {
    console.error('[OperationalListModal] Error agregando material nuevo:', e)
  } finally {
    savingAdd.value = false
  }
}

async function handleSync() {
  syncing.value = true
  try {
    await syncProductosMateriales()
    const mats = await getCotizacionMateriales(props.event.id)
    materiales.value = mats
  } catch (e) {
    console.error('[OperationalListModal] Error sincronizando materiales:', e)
  } finally {
    syncing.value = false
  }
}

function handleComplete() {
  emit('complete', { eventId: props.event.id, notes: notes.value })
  emit('close')
  showConfirm.value = false
}
</script>

<style scoped>
.op-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 26, 46, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.op-modal-container {
  width: 100%;
  max-width: 1100px;
  background: #FFFFFF;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  box-shadow: 0 25px 60px rgba(15, 26, 46, 0.2);
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────── */
.op-header {
  padding: 18px 24px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-shrink: 0;
}

.op-header-icon {
  width: 40px; height: 40px;
  background: #EBF3FC; color: #054EAF;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}

.op-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px; font-weight: 700; color: #0F1A2E; margin: 0;
}
.op-subtitle { font-size: 12px; color: #64748B; margin: 2px 0 0; }

/* ── Progress ───────────────────────────────────────── */
.op-progress-wrap {
  flex: 1; max-width: 320px;
  display: flex; flex-direction: column; gap: 6px;
}
.op-progress-info { display: flex; justify-content: space-between; align-items: center; }
.op-progress-text { font-size: 11px; color: #64748B; }
.op-progress-pct { font-size: 11px; font-weight: 700; color: #054EAF; }
.op-progress-bar-bg { height: 6px; background: #F1F5F9; border-radius: 10px; overflow: hidden; }
.op-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6, #054EAF);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.op-close-btn {
  background: none; border: none; color: #94A3B8; cursor: pointer;
  padding: 8px; border-radius: 50%; transition: all 0.2s;
}
.op-close-btn:hover { background: #F1F5F9; color: #0F1A2E; }

/* ── Loading ────────────────────────────────────────── */
.op-loading {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 24px;
  color: #94A3B8; font-size: 13px; font-family: 'Inter', sans-serif;
}

/* ── Content ────────────────────────────────────────── */
.op-content {
  flex: 1; overflow-y: auto; padding: 24px;
  display: flex; flex-direction: column; gap: 32px;
  background: #FCFDFF;
  scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent;
}

.op-section { display: flex; flex-direction: column; gap: 16px; }

.section-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: #94A3B8; margin: 0;
  display: flex; align-items: center; gap: 8px;
}

/* ── Grids ──────────────────────────────────────────── */
.product-grid-layout {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;
}
.material-grid-layout {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px;
}
@media (max-width: 640px) {
  .product-grid-layout, .material-grid-layout { grid-template-columns: repeat(2, 1fr); }
}

/* ── Product card ───────────────────────────────────── */
.p-card {
  background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px;
  padding: 12px; display: flex; align-items: center; gap: 12px;
}
.p-card-icon {
  width: 36px; height: 36px; background: #F1F5F9; color: #64748B;
  border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.p-card-body { flex: 1; min-width: 0; }
.p-card-name { font-size: 13px; font-weight: 600; color: #0F1A2E; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; gap: 4px; }
.p-card-qty { font-size: 11px; font-weight: 700; color: #64748B; }
.p-card-type { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.badge-own { background: #EEF4FF; color: #054EAF; }
.badge-ext { background: #FFF7ED; color: #B45309; }

/* ── Material card ──────────────────────────────────── */
.m-card {
  position: relative; background: #FFFFFF; border: 1.5px solid #E2E8F0;
  border-radius: 16px; padding: 16px;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px;
  cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}
.m-card:hover { transform: scale(1.03); border-color: #054EAF; box-shadow: 0 8px 20px rgba(15, 26, 46, 0.08); }
.m-card--validated { background: #F0FDF4; border-color: #22C55E; }
.m-card--saving { opacity: 0.6; pointer-events: none; }

.m-card-check {
  position: absolute; top: 8px; right: 8px;
  width: 18px; height: 18px; background: #22C55E; color: white;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
}
.m-card-delete {
  position: absolute; bottom: 8px; right: 8px;
  color: #94A3B8; padding: 4px; border-radius: 4px;
  background: none; border: none; cursor: pointer; transition: all 0.2s;
}
.m-card-delete:hover { color: #DC2626; background: #FEE2E2; }

.m-card-badge {
  position: absolute; top: 8px; left: 8px;
  font-size: 9px; font-weight: 800; text-transform: uppercase;
  background: #EBF3FC; color: #054EAF; padding: 2px 6px; border-radius: 4px;
}
.m-card-cat-icon { font-size: 24px; line-height: 1; }
.m-card-name { font-size: 12px; font-weight: 600; color: #334155; margin: 0; }
.m-card-qty { font-size: 11px; color: #64748B; margin: 0; }
.m-card-desc { font-size: 10px; color: #94A3B8; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.m-card--validated .m-card-cat-icon { filter: none; }
.m-card--summary { cursor: default; }
.m-card--summary:hover { transform: none; }

/* ── Add card ───────────────────────────────────────── */
.m-card-add {
  background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 16px;
  padding: 16px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; color: #64748B; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.m-card-add:hover { border-color: #054EAF; color: #054EAF; background: #EBF3FC; }

/* ── Product info strip ─────────────────────────────── */
.prod-info-strip { display: flex; flex-direction: column; gap: 8px; }

.prod-info-card {
  background: linear-gradient(135deg, #EBF3FC 0%, #F0F7FF 100%);
  border: 1px solid #BFDBFE; border-radius: 14px; padding: 12px 16px;
  display: flex; flex-direction: column; gap: 8px;
}

.prod-info-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 700; color: #0F1A2E; margin: 0;
  text-transform: uppercase; letter-spacing: 0.02em;
}

.prod-info-tags { display: flex; flex-wrap: wrap; gap: 6px; }

.prod-tag {
  font-size: 11px; font-weight: 600; color: #054EAF;
  background: #DBEAFE; border-radius: 6px; padding: 3px 8px;
  white-space: nowrap;
}

/* ── Empty state ────────────────────────────────────── */
.op-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 40px 24px; color: #94A3B8;
  font-family: 'Inter', sans-serif; font-size: 13px;
}
.op-empty-ico { color: #CBD5E1; }
.op-btn-add-first {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; background: #054EAF; color: white;
  border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
}
.op-btn-add-first:hover { background: #0441a0; }

.op-btn-sync {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 18px; background: #EFF6FF; color: #1D4ED8;
  border: 1.5px solid #BFDBFE; border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.op-btn-sync:hover { background: #DBEAFE; border-color: #93C5FD; }
.op-btn-sync:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Validate all button ────────────────────────────── */
.btn-validate-all {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; background: #F0FDF4; color: #16A34A;
  border: 1px solid #BBF7D0; border-radius: 8px;
  font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-validate-all:hover { background: #DCFCE7; }
.btn-validate-all:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Textarea ───────────────────────────────────────── */
.op-textarea {
  width: 100%; height: 80px; background: #F8FAFC;
  border: 1.5px solid #E2E8F0; border-radius: 16px; padding: 16px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #0F1A2E;
  resize: none; transition: all 0.2s;
}
.op-textarea:focus { border-color: #054EAF; outline: none; background: #FFFFFF; }

/* ── Footer ─────────────────────────────────────────── */
.op-footer {
  padding: 18px 24px; border-top: 1px solid #F1F5F9;
  display: flex; align-items: center; gap: 16px; flex-shrink: 0;
}
.op-footer-status {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 500;
}
.op-footer-status--warn { color: #D97706; }
.op-footer-status--ok   { color: #16A34A; }

.op-btn-secondary {
  padding: 10px 20px; background: #F1F5F9; color: #64748B;
  border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; border: none;
  transition: background 0.2s;
}
.op-btn-secondary:hover { background: #E2E8F0; }

.op-btn-primary {
  padding: 10px 24px; background: #054EAF; color: #FFFFFF;
  border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; border: none;
  display: flex; align-items: center; gap: 8px; transition: all 0.2s;
}
.op-btn-primary:hover { background: #0441a0; }
.op-btn-primary:disabled { background: #E2E8F0; color: #94A3B8; cursor: not-allowed; }

.op-btn-danger {
  padding: 10px 20px; background: #DC2626; color: white;
  border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; border: none;
  transition: background 0.2s;
}
.op-btn-danger:hover { background: #B91C1C; }

/* ── Sub-modal ──────────────────────────────────────── */
.sub-modal-overlay {
  position: absolute; inset: 0; background: rgba(15, 26, 46, 0.4);
  backdrop-filter: blur(2px); display: flex; align-items: center;
  justify-content: center; z-index: 10;
}
.sub-modal-card {
  background: #FFFFFF; width: 100%; max-width: 480px;
  border-radius: 20px; padding: 24px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.2);
  max-height: 80vh; overflow-y: auto;
}
.sub-modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px; font-weight: 700; color: #0F1A2E; margin: 0 0 20px;
}
.sub-modal-form { display: flex; flex-direction: column; gap: 14px; }
.sub-modal-actions { display: flex; gap: 10px; margin-top: 20px; }

.sm-field { display: flex; flex-direction: column; gap: 5px; }
.sm-field label {
  font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sm-field input, .sm-select {
  padding: 9px 13px; border: 1px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; color: #0F1A2E; outline: none; background: #F8FAFC;
  transition: border-color 0.15s;
}
.sm-field input:focus, .sm-select:focus { border-color: #054EAF; background: #FFFFFF; }
.sm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.sm-btn-sec {
  flex: 1; padding: 10px; background: #F1F5F9; border-radius: 10px;
  font-size: 13px; font-weight: 600; color: #64748B; border: none; cursor: pointer;
}
.sm-btn-pri {
  flex: 2; padding: 10px; background: #054EAF; border-radius: 10px;
  font-size: 13px; font-weight: 600; color: white; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: background 0.2s;
}
.sm-btn-pri:hover { background: #0441a0; }
.sm-btn-pri:disabled { background: #CBD5E1; cursor: not-allowed; }

/* ── Origin grid (step 1) ───────────────────────────── */
.origin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.origin-btn {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 16px; background: #F8FAFC; border: 1.5px solid #E2E8F0;
  border-radius: 14px; cursor: pointer; transition: all 0.2s; color: #475569;
}
.origin-btn:hover { border-color: #054EAF; background: #EBF3FC; color: #054EAF; }
.origin-btn-label { font-size: 13px; font-weight: 700; color: inherit; }
.origin-btn-hint  { font-size: 11px; color: #94A3B8; }

/* ── Catalog list ───────────────────────────────────── */
.catalog-list {
  max-height: 240px; overflow-y: auto; border: 1px solid #E2E8F0;
  border-radius: 12px; margin-top: 4px;
  scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent;
}
.catalog-empty {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 24px; color: #94A3B8; font-size: 13px;
}
.catalog-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #F8FAFC;
}
.catalog-item:last-child { border-bottom: none; }
.catalog-item:hover { background: #F0F7FF; }
.catalog-item--sel { background: #EBF3FC; }
.catalog-ico { font-size: 18px; flex-shrink: 0; }
.catalog-info { flex: 1; min-width: 0; }
.catalog-name { display: block; font-size: 13px; font-weight: 600; color: #0F1A2E; }
.catalog-unit { display: block; font-size: 11px; color: #94A3B8; }
.catalog-check { color: #054EAF; flex-shrink: 0; }

/* ── Dynamic field helpers ──────────────────────────── */
.req { color: #EF4444; font-weight: 700; }
.campo-unit { font-size: 10px; color: #94A3B8; font-weight: 400; text-transform: none; }
.check-row { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.mt-3 { margin-top: 12px; }

/* ── Confirm dialog ─────────────────────────────────── */
.confirm-overlay {
  position: absolute; inset: 0; background: rgba(15, 26, 46, 0.4);
  backdrop-filter: blur(2px); display: flex; align-items: center;
  justify-content: center; z-index: 20;
}
.confirm-card {
  background: #FFFFFF; max-width: 380px; width: 100%;
  border-radius: 20px; padding: 28px; text-align: center;
  box-shadow: 0 15px 40px rgba(0,0,0,0.2);
}
.confirm-icon { color: #054EAF; margin-bottom: 12px; }
.confirm-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #0F1A2E; margin: 0 0 8px; }
.confirm-text { font-size: 13px; color: #64748B; margin: 0 0 20px; line-height: 1.5; }
.confirm-actions { display: flex; gap: 10px; justify-content: center; }

/* ── Spin animation ─────────────────────────────────── */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

/* ── Utility ────────────────────────────────────────── */
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-3 { gap: 12px; }
.mb-0 { margin-bottom: 0; }
.mb-6 { margin-bottom: 24px; }
.flex-1 { flex: 1; }

@media (min-width: 768px) {
  .md\:flex { display: flex; }
  .md\:hidden { display: none; }
}
.hidden { display: none; }

/* ── Transitions ────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.95); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
