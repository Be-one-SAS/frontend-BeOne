<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  getMaterialCategorias, getMaterialesBase,
  createMaterialBase, updateMaterialBase, deactivateMaterialBase,
  getMaterialesByProducto, addMaterialToProducto,
  updateMaterialOfProducto, removeMaterialFromProducto,
  parseTextoMateriales, bulkAssignMateriales, migrateFromAccesorios,
} from '@/services/materiales.service'
import { getProducts } from '@/services/products.service'
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import {
  RefreshCw, Plus, Pencil, Trash2, X, Search,
  ChevronDown, Package, Layers, AlertCircle, CheckCircle2,
} from 'lucide-vue-next'

// ── tabs ─────────────────────────────────────────────────────────────
const tab = ref('catalogo') // 'catalogo' | 'producto'

// ── catálogo state ────────────────────────────────────────────────────
const categorias   = ref([])
const materiales   = ref([])
const catFilter    = ref('')
const searchCat    = ref('')
const showInactive = ref(false)
const catLoading   = ref(false)

const materialesFiltrados = computed(() => {
  const q = searchCat.value.toLowerCase()
  return materiales.value.filter(m => {
    const matchQ    = !q || m.nombre.toLowerCase().includes(q)
    const matchCat  = !catFilter.value || m.categoriaId === Number(catFilter.value)
    const matchActivo = showInactive.value ? true : m.activo
    return matchQ && matchCat && matchActivo
  })
})

const materialesPorCategoria = computed(() => {
  const map = new Map()
  for (const m of materialesFiltrados.value) {
    const cat = m.categoria?.nombre || 'Sin categoría'
    if (!map.has(cat)) map.set(cat, { cat: m.categoria, items: [] })
    map.get(cat).items.push(m)
  }
  return [...map.values()].sort((a, b) => a.cat?.nombre?.localeCompare(b.cat?.nombre))
})

// ── modal catálogo ────────────────────────────────────────────────────
const catModal   = ref(false)
const catSaving  = ref(false)
const catError   = ref('')
const catEdit    = ref(null)
const catForm    = ref({ nombre: '', categoriaId: '', unidad: 'unidad', descripcion: '' })

function openCatCreate() {
  catEdit.value = null
  catError.value = ''
  catForm.value = { nombre: '', categoriaId: '', unidad: 'unidad', descripcion: '' }
  catModal.value = true
}

function openCatEdit(m) {
  catEdit.value = m
  catError.value = ''
  catForm.value = { nombre: m.nombre, categoriaId: String(m.categoriaId), unidad: m.unidad, descripcion: m.descripcion || '' }
  catModal.value = true
}

async function saveCatModal() {
  if (!catForm.value.nombre.trim() || !catForm.value.categoriaId) {
    catError.value = 'Nombre y categoría son obligatorios.'
    return
  }
  catSaving.value = true; catError.value = ''
  try {
    const dto = {
      nombre:      catForm.value.nombre.trim().toUpperCase(),
      categoriaId: Number(catForm.value.categoriaId),
      unidad:      catForm.value.unidad || 'unidad',
      descripcion: catForm.value.descripcion || undefined,
    }
    if (catEdit.value) {
      const updated = await updateMaterialBase(catEdit.value.id, dto)
      const idx = materiales.value.findIndex(m => m.id === catEdit.value.id)
      if (idx !== -1) materiales.value[idx] = updated
    } else {
      const created = await createMaterialBase(dto)
      materiales.value.push(created)
    }
    catModal.value = false
  } catch (e) {
    catError.value = e?.response?.data?.message || 'Error al guardar.'
  } finally {
    catSaving.value = false
  }
}

async function toggleActivo(m) {
  try {
    if (m.activo) {
      await deactivateMaterialBase(m.id)
      m.activo = false
    } else {
      const updated = await updateMaterialBase(m.id, { activo: true })
      m.activo = updated.activo
    }
  } catch (e) { console.error(e) }
}

// ── materiales por producto state ─────────────────────────────────────
const productos          = ref([])
const selectedProductoId = ref(null)
const prodMateriales     = ref([])
const prodLoading        = ref(false)

const selectedProducto = computed(() =>
  productos.value.find(p => p.id === selectedProductoId.value)
)

async function fetchProdMateriales() {
  if (!selectedProductoId.value) return
  prodLoading.value = true
  try {
    prodMateriales.value = await getMaterialesByProducto(selectedProductoId.value)
  } catch (e) { console.error(e) }
  finally { prodLoading.value = false }
}

watch(selectedProductoId, fetchProdMateriales)

// ── agregar material individual ───────────────────────────────────────
const addModal     = ref(false)
const addSaving    = ref(false)
const addError     = ref('')
const addSearch    = ref('')
const addResults   = ref([])
const addSearching = ref(false)
const addCantidad  = ref(1)
const addSelected  = ref(null)
const addEsOpcional = ref(false)

watch(addSearch, async (val) => {
  if (val.length < 2) { addResults.value = []; return }
  addSearching.value = true
  try {
    addResults.value = await getMaterialesBase({ search: val, activo: true })
  } catch (e) { console.error(e) }
  finally { addSearching.value = false }
})

function selectAddMaterial(m) {
  addSelected.value = m
  addSearch.value   = m.nombre
  addResults.value  = []
}

async function saveAddMaterial() {
  if (!addSelected.value) { addError.value = 'Selecciona un material del catálogo.'; return }
  if (!addCantidad.value || addCantidad.value <= 0) { addError.value = 'La cantidad debe ser mayor a 0.'; return }
  addSaving.value = true; addError.value = ''
  try {
    const pm = await addMaterialToProducto(selectedProductoId.value, {
      materialBaseId: addSelected.value.id,
      cantidad: addCantidad.value,
      esOpcional: addEsOpcional.value,
    })
    prodMateriales.value.push(pm)
    addModal.value = false
  } catch (e) {
    addError.value = e?.response?.data?.message || 'Error al agregar.'
  } finally {
    addSaving.value = false
  }
}

function openAddModal() {
  addSearch.value = ''; addResults.value = []; addSelected.value = null
  addCantidad.value = 1; addEsOpcional.value = false; addError.value = ''
  addModal.value = true
}

// ── editar cantidad ───────────────────────────────────────────────────
const editPmId      = ref(null)
const editPmCant    = ref(1)
const editPmOpc     = ref(false)
const editPmSaving  = ref(false)

function startEditPm(pm) {
  editPmId.value   = pm.id
  editPmCant.value = pm.cantidad
  editPmOpc.value  = pm.esOpcional
}

function cancelEditPm() { editPmId.value = null }

async function saveEditPm(pm) {
  editPmSaving.value = true
  try {
    const updated = await updateMaterialOfProducto(pm.id, { cantidad: editPmCant.value, esOpcional: editPmOpc.value })
    const idx = prodMateriales.value.findIndex(m => m.id === pm.id)
    if (idx !== -1) prodMateriales.value[idx] = updated
    editPmId.value = null
  } catch (e) { console.error(e) }
  finally { editPmSaving.value = false }
}

async function deletePm(pm) {
  if (!confirm(`¿Eliminar "${pm.materialBase?.nombre}" de este producto?`)) return
  try {
    await removeMaterialFromProducto(pm.id)
    prodMateriales.value = prodMateriales.value.filter(m => m.id !== pm.id)
  } catch (e) { console.error(e) }
}

// ── parser de texto ───────────────────────────────────────────────────
const parserModal   = ref(false)
const parserText    = ref('')
const parserItems   = ref([])  // [{ cantidad, nombre, categoriaId }]
const parserParsing = ref(false)
const parserSaving  = ref(false)
const parserResult  = ref(null)
const parserError   = ref('')

async function parseTexto() {
  if (!parserText.value.trim()) return
  parserParsing.value = true
  parserItems.value   = []
  parserResult.value  = null
  try {
    const parsed = await parseTextoMateriales(parserText.value)
    parserItems.value = parsed.map(p => ({ ...p, categoriaId: 11 }))
  } catch (e) {
    parserError.value = 'Error al parsear el texto.'
  } finally {
    parserParsing.value = false
  }
}

async function assignParsed() {
  if (!parserItems.value.length) return
  parserSaving.value = true; parserError.value = ''
  try {
    const result = await bulkAssignMateriales(selectedProductoId.value, parserItems.value)
    parserResult.value = result
    await fetchProdMateriales()
  } catch (e) {
    parserError.value = e?.response?.data?.message || 'Error al asignar.'
  } finally {
    parserSaving.value = false
  }
}

function openParser() {
  parserText.value = ''; parserItems.value = []; parserResult.value = null; parserError.value = ''
  parserModal.value = true
}

function removeParserItem(i) { parserItems.value.splice(i, 1) }

// ── migración ─────────────────────────────────────────────────────────
const migrLoading = ref(false)
const migrResult  = ref(null)

async function runMigration() {
  if (!confirm('¿Migrar todos los accesorios existentes al sistema de materiales? Esto creará materiales en el catálogo y los asignará a cada producto. Se puede re-ejecutar sin duplicados.')) return
  migrLoading.value = true; migrResult.value = null
  try {
    migrResult.value = await migrateFromAccesorios()
    await fetchData()
  } catch (e) { console.error(e) }
  finally { migrLoading.value = false }
}

// ── init ──────────────────────────────────────────────────────────────
async function fetchData() {
  catLoading.value = true
  try {
    const [cats, mats, prods] = await Promise.all([
      getMaterialCategorias(),
      getMaterialesBase(),
      getProducts().then(r => r.data),
    ])
    categorias.value = cats
    materiales.value = mats
    productos.value  = prods
  } catch (e) { console.error(e) }
  finally { catLoading.value = false }
}

onMounted(fetchData)
</script>

<template>
  <div class="mat-page">

    <!-- HEADER -->
    <div class="mat-header">
      <div>
        <h2 class="mat-title">Materiales y Accesorios</h2>
        <p class="mat-sub">Catálogo de materiales · Asignación por producto · Parser de texto</p>
      </div>
      <div class="mat-header-actions">
        <button class="btn-migrate" :disabled="migrLoading" @click="runMigration">
          <RefreshCw :size="13" :class="migrLoading ? 'spin' : ''" />
          {{ migrLoading ? 'Migrando…' : 'Migrar accesorios' }}
        </button>
        <button class="btn-reload" @click="fetchData">
          <RefreshCw :size="13" /> Recargar
        </button>
      </div>
    </div>

    <!-- Resultado migración -->
    <div v-if="migrResult" class="migr-result">
      <CheckCircle2 :size="16" />
      Migración completada: <strong>{{ migrResult.migrated }}</strong> asignados,
      <strong>{{ migrResult.materialesCreados }}</strong> materiales nuevos creados,
      <strong>{{ migrResult.skipped }}</strong> omitidos.
      <button class="migr-close" @click="migrResult = null"><X :size="14" /></button>
    </div>

    <!-- TABS -->
    <div class="mat-tabs">
      <button :class="['tab-btn', { 'tab-active': tab === 'catalogo' }]" @click="tab = 'catalogo'">
        <Layers :size="14" /> Catálogo de materiales
        <span class="tab-badge">{{ materiales.length }}</span>
      </button>
      <button :class="['tab-btn', { 'tab-active': tab === 'producto' }]" @click="tab = 'producto'">
        <Package :size="14" /> Materiales por producto
      </button>
    </div>

    <!-- ══ TAB: CATÁLOGO ══ -->
    <div v-if="tab === 'catalogo'">
      <!-- Filtros + acción -->
      <div class="cat-toolbar">
        <div class="cat-search-wrap">
          <Search :size="14" class="cat-search-ico" />
          <input v-model="searchCat" class="cat-input" placeholder="Buscar material…" />
        </div>
        <select v-model="catFilter" class="cat-input cat-select">
          <option value="">Todas las categorías</option>
          <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.icono }} {{ c.nombre }}</option>
        </select>
        <label class="cat-toggle">
          <input type="checkbox" v-model="showInactive" />
          Ver inactivos
        </label>
        <button class="btn-primary" @click="openCatCreate">
          <Plus :size="13" /> Nuevo material
        </button>
      </div>

      <!-- Grupos por categoría -->
      <div v-if="catLoading" class="cat-loading">Cargando catálogo…</div>
      <div v-else-if="!materialesPorCategoria.length" class="cat-empty">Sin resultados</div>
      <div v-else class="cat-groups">
        <div v-for="group in materialesPorCategoria" :key="group.cat?.id" class="cat-group">
          <div class="cat-group-header" :style="{ background: group.cat?.color || '#F1F5F9' }">
            <span class="cat-group-ico">{{ group.cat?.icono || '📦' }}</span>
            <span class="cat-group-name">{{ group.cat?.nombre || 'Sin categoría' }}</span>
            <span class="cat-group-count">{{ group.items.length }}</span>
          </div>
          <div class="cat-group-body">
            <div
              v-for="m in group.items"
              :key="m.id"
              class="cat-row"
              :class="{ 'cat-row--inactive': !m.activo }"
            >
              <div class="cat-row-name">
                <span>{{ m.nombre }}</span>
                <span v-if="!m.activo" class="badge-inactive">inactivo</span>
              </div>
              <span class="cat-row-unit">{{ m.unidad }}</span>
              <div class="cat-row-actions">
                <button class="act-btn act-edit" @click.stop="openCatEdit(m)"><Pencil :size="11" /></button>
                <button
                  class="act-btn"
                  :class="m.activo ? 'act-del' : 'act-restore'"
                  :title="m.activo ? 'Desactivar' : 'Activar'"
                  @click.stop="toggleActivo(m)"
                >
                  <X v-if="m.activo" :size="11" />
                  <CheckCircle2 v-else :size="11" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ TAB: MATERIALES POR PRODUCTO ══ -->
    <div v-if="tab === 'producto'">
      <!-- Selector de producto -->
      <div class="prod-selector-wrap">
        <label class="prod-sel-lbl">Selecciona un producto</label>
        <select v-model="selectedProductoId" class="prod-select">
          <option :value="null">— Elige un producto —</option>
          <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
      </div>

      <div v-if="selectedProductoId">
        <!-- Acciones -->
        <div class="prod-actions-bar">
          <div class="prod-info">
            <Package :size="14" />
            <span><strong>{{ selectedProducto?.nombre }}</strong></span>
            <span class="prod-mat-count">{{ prodMateriales.length }} materiales</span>
          </div>
          <div class="prod-action-btns">
            <button class="btn-secondary" @click="openParser">
              <Layers :size="13" /> Importar desde texto
            </button>
            <button class="btn-primary" @click="openAddModal">
              <Plus :size="13" /> Agregar material
            </button>
          </div>
        </div>

        <!-- Lista de materiales -->
        <div v-if="prodLoading" class="prod-loading">Cargando…</div>
        <div v-else-if="!prodMateriales.length" class="prod-empty">
          <Package :size="36" class="prod-empty-ico" />
          <p>Este producto no tiene materiales asignados.</p>
          <button class="btn-primary" @click="openParser">Importar desde texto</button>
        </div>
        <div v-else class="prod-mat-table-wrap">
          <table class="prod-mat-table">
            <thead>
              <tr>
                <th class="th-cat"></th>
                <th>Material</th>
                <th class="th-unit">Unidad</th>
                <th class="th-qty">Cantidad</th>
                <th class="th-opc">Opcional</th>
                <th class="th-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pm in prodMateriales" :key="pm.id" class="pm-row">
                <!-- Categoría color -->
                <td class="td-cat">
                  <div class="pm-cat-dot" :style="{ background: pm.materialBase?.categoria?.color || '#E2E8F0' }" :title="pm.materialBase?.categoria?.nombre">
                    {{ pm.materialBase?.categoria?.icono || '📦' }}
                  </div>
                </td>
                <!-- Nombre -->
                <td class="td-name">
                  <span class="pm-name">{{ pm.materialBase?.nombre }}</span>
                </td>
                <!-- Unidad -->
                <td class="td-unit">{{ pm.materialBase?.unidad || '—' }}</td>
                <!-- Cantidad (inline edit) -->
                <td class="td-qty">
                  <template v-if="editPmId === pm.id">
                    <input
                      v-model.number="editPmCant"
                      type="number" min="0.01" step="0.01"
                      class="pm-qty-input"
                      @keydown.enter="saveEditPm(pm)"
                      @keydown.esc="cancelEditPm"
                    />
                  </template>
                  <span v-else class="pm-qty">{{ pm.cantidad }}</span>
                </td>
                <!-- Opcional -->
                <td class="td-opc">
                  <template v-if="editPmId === pm.id">
                    <input type="checkbox" v-model="editPmOpc" />
                  </template>
                  <span v-else :class="pm.esOpcional ? 'badge-opc' : 'badge-req'">
                    {{ pm.esOpcional ? 'Opcional' : 'Requerido' }}
                  </span>
                </td>
                <!-- Acciones -->
                <td class="td-actions">
                  <template v-if="editPmId === pm.id">
                    <button class="act-btn act-save" :disabled="editPmSaving" @click="saveEditPm(pm)">
                      <CheckCircle2 :size="12" />
                    </button>
                    <button class="act-btn act-cancel" @click="cancelEditPm">
                      <X :size="12" />
                    </button>
                  </template>
                  <template v-else>
                    <button class="act-btn act-edit" @click="startEditPm(pm)"><Pencil :size="11" /></button>
                    <button class="act-btn act-del" @click="deletePm(pm)"><Trash2 :size="11" /></button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="prod-no-sel">
        <Package :size="48" class="prod-no-sel-ico" />
        <p>Selecciona un producto para ver y gestionar sus materiales</p>
      </div>
    </div>

  </div>

  <!-- ══ MODAL: Crear/Editar material base ══ -->
  <ModalReutilizable :show="catModal" @close="catModal = false">
    <div class="modal-wrap">
      <h3 class="modal-title">{{ catEdit ? 'Editar material' : 'Nuevo material' }}</h3>
      <div v-if="catError" class="modal-error"><AlertCircle :size="14" /> {{ catError }}</div>

      <div class="modal-fields">
        <div class="modal-field modal-field--wide">
          <label class="modal-lbl">Nombre *</label>
          <input v-model="catForm.nombre" class="modal-input" placeholder="Ej: CAJA PARA MOTOR" @input="catForm.nombre = catForm.nombre.toUpperCase()" />
        </div>
        <div class="modal-field">
          <label class="modal-lbl">Categoría *</label>
          <select v-model="catForm.categoriaId" class="modal-input">
            <option value="">— Seleccionar —</option>
            <option v-for="c in categorias" :key="c.id" :value="String(c.id)">{{ c.icono }} {{ c.nombre }}</option>
          </select>
        </div>
        <div class="modal-field">
          <label class="modal-lbl">Unidad</label>
          <input v-model="catForm.unidad" class="modal-input" placeholder="unidad" />
        </div>
        <div class="modal-field modal-field--wide">
          <label class="modal-lbl">Descripción</label>
          <input v-model="catForm.descripcion" class="modal-input" placeholder="Descripción opcional…" />
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="catModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="catSaving" @click="saveCatModal">
          {{ catSaving ? 'Guardando…' : catEdit ? 'Guardar' : 'Crear' }}
        </button>
      </div>
    </div>
  </ModalReutilizable>

  <!-- ══ MODAL: Agregar material a producto ══ -->
  <ModalReutilizable :show="addModal" @close="addModal = false">
    <div class="modal-wrap">
      <h3 class="modal-title">Agregar material a producto</h3>
      <div v-if="addError" class="modal-error"><AlertCircle :size="14" /> {{ addError }}</div>

      <div class="modal-fields">
        <div class="modal-field modal-field--wide" style="position:relative">
          <label class="modal-lbl">Buscar en catálogo *</label>
          <input v-model="addSearch" class="modal-input" placeholder="Escribe para buscar…" autocomplete="off" />
          <div v-if="addResults.length" class="add-dropdown">
            <div
              v-for="m in addResults" :key="m.id"
              class="add-dropdown-item"
              @mousedown.prevent="selectAddMaterial(m)"
            >
              <span class="add-dd-ico">{{ m.categoria?.icono }}</span>
              <span>{{ m.nombre }}</span>
              <span class="add-dd-unit">{{ m.unidad }}</span>
            </div>
          </div>
          <div v-if="addSearching" class="add-searching">Buscando…</div>
        </div>
        <div class="modal-field">
          <label class="modal-lbl">Cantidad *</label>
          <input v-model.number="addCantidad" type="number" min="0.01" step="0.01" class="modal-input" />
        </div>
        <div class="modal-field">
          <label class="modal-lbl">¿Es opcional?</label>
          <label class="toggle-lbl">
            <input type="checkbox" v-model="addEsOpcional" />
            {{ addEsOpcional ? 'Sí, opcional' : 'No, requerido' }}
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="addModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="addSaving || !addSelected" @click="saveAddMaterial">
          {{ addSaving ? 'Agregando…' : 'Agregar' }}
        </button>
      </div>
    </div>
  </ModalReutilizable>

  <!-- ══ MODAL: Parser de texto ══ -->
  <ModalReutilizable :show="parserModal" @close="parserModal = false">
    <div class="modal-wrap modal-wrap--wide">
      <h3 class="modal-title">Importar materiales desde texto</h3>
      <p class="modal-sub">Pega la lista en formato "CANTIDAD NOMBRE": ej. <em>20 puff 4 parasoles 10 ESTIBAS</em></p>
      <div v-if="parserError" class="modal-error"><AlertCircle :size="14" /> {{ parserError }}</div>

      <!-- Paso 1: entrada de texto -->
      <div v-if="!parserItems.length && !parserResult">
        <textarea
          v-model="parserText"
          class="parser-textarea"
          placeholder="20 puff 4 parasoles 4 TORNILLOS DE PARASOLES 10 ESTIBAS 5 MANTELES DE COLORES…"
          rows="5"
        />
        <div class="modal-footer">
          <button class="btn-cancel" @click="parserModal = false">Cancelar</button>
          <button class="btn-primary" :disabled="parserParsing || !parserText.trim()" @click="parseTexto">
            {{ parserParsing ? 'Parseando…' : 'Parsear' }}
          </button>
        </div>
      </div>

      <!-- Paso 2: revisar items parseados -->
      <div v-else-if="parserItems.length && !parserResult">
        <p class="parser-hint">Revisa y ajusta los items antes de asignar. Categoría por defecto: Insumos y Consumibles.</p>
        <div class="parser-items">
          <div v-for="(item, i) in parserItems" :key="i" class="parser-item">
            <input v-model.number="item.cantidad" type="number" min="0.01" step="0.01" class="parser-qty" />
            <input v-model="item.nombre" class="parser-name" />
            <select v-model.number="item.categoriaId" class="parser-cat">
              <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.icono }} {{ c.nombre }}</option>
            </select>
            <button class="act-btn act-del" @click="removeParserItem(i)"><X :size="11" /></button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="parserItems = []">← Volver</button>
          <button class="btn-primary" :disabled="parserSaving" @click="assignParsed">
            {{ parserSaving ? 'Asignando…' : `Asignar ${parserItems.length} materiales` }}
          </button>
        </div>
      </div>

      <!-- Paso 3: resultado -->
      <div v-else-if="parserResult" class="parser-done">
        <CheckCircle2 :size="40" class="parser-done-ico" />
        <p class="parser-done-msg">¡Materiales asignados correctamente!</p>
        <div class="parser-stats">
          <div class="stat"><span class="stat-n">{{ parserResult.created }}</span><span class="stat-l">Nuevos</span></div>
          <div class="stat"><span class="stat-n">{{ parserResult.updated }}</span><span class="stat-l">Actualizados</span></div>
          <div class="stat"><span class="stat-n">{{ parserResult.materials?.length }}</span><span class="stat-l">Total asignados</span></div>
        </div>
        <button class="btn-primary" @click="parserModal = false; parserResult = null">Cerrar</button>
      </div>

    </div>
  </ModalReutilizable>
</template>

<style scoped>
.mat-page { padding: 20px 24px; max-width: 1300px; font-family: 'Inter', sans-serif; }

.mat-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.mat-title  { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0F1A2E; margin: 0 0 4px; }
.mat-sub    { font-size: 13px; color: #94A3B8; margin: 0; }
.mat-header-actions { display: flex; gap: 8px; }

.btn-reload   { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 12px; font-weight: 600; border-radius: 8px; border: 1px solid #E2EBF6; background: #F8FAFC; color: #64748B; cursor: pointer; }
.btn-migrate  { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 12px; font-weight: 600; border-radius: 8px; border: 1px solid #C4B5FD; background: #F5F3FF; color: #7C3AED; cursor: pointer; }
.btn-migrate:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary  { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; font-size: 12px; font-weight: 600; border-radius: 8px; border: none; background: #054EAF; color: #fff; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #03368A; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 8px; border: 1.5px solid #054EAF; background: #EBF3FC; color: #054EAF; cursor: pointer; }
.btn-cancel   { padding: 9px 18px; font-size: 12px; font-weight: 600; border-radius: 8px; border: 1px solid #E2EBF6; background: #F1F5F9; color: #64748B; cursor: pointer; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.migr-result { display: flex; align-items: center; gap: 8px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #166534; margin-bottom: 16px; }
.migr-close  { margin-left: auto; border: none; background: none; cursor: pointer; color: #166534; }

/* TABS */
.mat-tabs  { display: flex; gap: 4px; border-bottom: 2px solid #E2EBF6; margin-bottom: 20px; }
.tab-btn   { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: 13px; font-weight: 600; border: none; background: none; color: #64748B; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; border-radius: 8px 8px 0 0; transition: all 0.15s; }
.tab-btn:hover { background: #F8FAFC; color: #0F1A2E; }
.tab-active { color: #054EAF; border-bottom-color: #054EAF; background: #EBF3FC; }
.tab-badge { background: #E2EBF6; color: #64748B; border-radius: 999px; font-size: 11px; padding: 1px 7px; }
.tab-active .tab-badge { background: #BFDBFE; color: #054EAF; }

/* CATÁLOGO */
.cat-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.cat-search-wrap { position: relative; display: flex; align-items: center; }
.cat-search-ico  { position: absolute; left: 10px; color: #94A3B8; }
.cat-input       { background: #F8FAFC; border: 1px solid #E2EBF6; border-radius: 8px; padding: 8px 12px 8px 32px; font-size: 13px; color: #0F1A2E; outline: none; width: 240px; font-family: 'Inter', sans-serif; }
.cat-input:focus { border-color: #054EAF; }
.cat-select { padding-left: 12px; width: 200px; appearance: auto; }
.cat-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748B; cursor: pointer; }
.cat-loading { text-align: center; padding: 40px; color: #94A3B8; }
.cat-empty   { text-align: center; padding: 40px; color: #94A3B8; }
.cat-groups  { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.cat-group   { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(5,78,175,.06); }
.cat-group-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; }
.cat-group-ico   { font-size: 16px; }
.cat-group-name  { font-size: 13px; font-weight: 700; color: #1E293B; flex: 1; }
.cat-group-count { font-size: 11px; font-weight: 700; background: rgba(0,0,0,.08); border-radius: 999px; padding: 2px 8px; }
.cat-group-body  { padding: 4px 0; max-height: 300px; overflow-y: auto; }
.cat-row         { display: flex; align-items: center; gap: 8px; padding: 7px 14px; transition: background 0.1s; }
.cat-row:hover   { background: #F8FAFC; }
.cat-row--inactive { opacity: 0.45; }
.cat-row-name    { flex: 1; display: flex; align-items: center; gap: 6px; font-size: 12px; color: #1E293B; font-weight: 500; }
.cat-row-unit    { font-size: 11px; color: #94A3B8; min-width: 50px; text-align: right; }
.cat-row-actions { display: flex; gap: 4px; }
.badge-inactive  { background: #F1F5F9; color: #94A3B8; border-radius: 4px; font-size: 10px; padding: 1px 5px; }

/* PRODUCTO MATERIALES */
.prod-selector-wrap { margin-bottom: 16px; }
.prod-sel-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; letter-spacing: .04em; display: block; margin-bottom: 6px; }
.prod-select  { background: #F8FAFC; border: 1px solid #E2EBF6; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #0F1A2E; outline: none; width: 100%; max-width: 500px; appearance: auto; font-family: 'Inter', sans-serif; }
.prod-select:focus { border-color: #054EAF; }

.prod-actions-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; padding: 12px 16px; background: #F8FAFC; border: 1px solid #E2EBF6; border-radius: 10px; }
.prod-info  { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #0F1A2E; }
.prod-mat-count { background: #EBF3FC; color: #054EAF; border-radius: 999px; font-size: 11px; font-weight: 700; padding: 2px 8px; }
.prod-action-btns { display: flex; gap: 8px; }
.prod-loading { padding: 32px; text-align: center; color: #94A3B8; }
.prod-empty   { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px; background: #fff; border-radius: 12px; text-align: center; color: #94A3B8; }
.prod-empty-ico { color: #CBD5E1; }
.prod-no-sel  { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px; text-align: center; color: #CBD5E1; }
.prod-no-sel-ico { color: #E2E8F0; }

.prod-mat-table-wrap { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(5,78,175,.06); }
.prod-mat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.prod-mat-table thead tr { background: #F8FAFC; }
.prod-mat-table th { padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #64748B; text-align: left; border-bottom: 1px solid #E2EBF6; }
.th-cat, .th-unit, .th-qty, .th-opc, .th-actions { width: 80px; }
.pm-row { border-bottom: 1px solid #F1F5F9; transition: background 0.1s; }
.pm-row:last-child { border-bottom: none; }
.pm-row:hover { background: #FAFCFF; }
.td-cat, .td-unit, .td-qty, .td-opc, .td-actions { padding: 10px 14px; text-align: center; }
.td-name { padding: 10px 14px; }
.pm-cat-dot { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; margin: 0 auto; }
.pm-name { font-size: 13px; font-weight: 500; color: #1E293B; }
.pm-qty  { font-size: 13px; font-weight: 600; color: #054EAF; }
.pm-qty-input { width: 64px; border: 1.5px solid #054EAF; border-radius: 6px; padding: 4px 8px; font-size: 13px; text-align: center; outline: none; }
.badge-req  { background: #DCFCE7; color: #166534; border-radius: 999px; font-size: 11px; padding: 2px 8px; }
.badge-opc  { background: #FEF3C7; color: #92400E; border-radius: 999px; font-size: 11px; padding: 2px 8px; }
.td-actions { display: flex; justify-content: center; gap: 4px; border-bottom: none; }

/* ACCIONES */
.act-btn     { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer; transition: background 0.15s; }
.act-edit    { background: #EBF3FC; color: #054EAF; }
.act-edit:hover { background: #BFDBFE; }
.act-del     { background: #FEE2E2; color: #B91C1C; }
.act-del:hover { background: #FECACA; }
.act-restore { background: #F0FDF4; color: #166534; }
.act-restore:hover { background: #BBF7D0; }
.act-save    { background: #F0FDF4; color: #166534; }
.act-save:hover { background: #BBF7D0; }
.act-cancel  { background: #F1F5F9; color: #64748B; }
.act-cancel:hover { background: #E2EBF6; }

/* MODALES */
.modal-wrap  { display: flex; flex-direction: column; gap: 16px; min-width: 360px; }
.modal-wrap--wide { min-width: 520px; }
.modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; color: #0F1A2E; margin: 0; }
.modal-sub   { font-size: 13px; color: #64748B; margin: -10px 0 0; }
.modal-error { display: flex; align-items: center; gap: 8px; background: #FEE2E2; color: #B91C1C; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
.modal-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.modal-field { display: flex; flex-direction: column; gap: 5px; }
.modal-field--wide { grid-column: span 2; }
.modal-lbl   { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #64748B; }
.modal-input { background: #F8FAFC; border: 1px solid #E2EBF6; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #0F1A2E; outline: none; font-family: 'Inter', sans-serif; appearance: auto; }
.modal-input:focus { border-color: #054EAF; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; border-top: 1px solid #EBF3FC; }
.toggle-lbl  { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #1E293B; cursor: pointer; padding: 8px 0; }

/* DROPDOWN BÚSQUEDA */
.add-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #E2EBF6; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.08); z-index: 50; max-height: 220px; overflow-y: auto; margin-top: 2px; }
.add-dropdown-item { display: flex; align-items: center; gap: 8px; padding: 9px 12px; font-size: 13px; cursor: pointer; }
.add-dropdown-item:hover { background: #EBF3FC; }
.add-dd-ico  { font-size: 15px; }
.add-dd-unit { margin-left: auto; font-size: 11px; color: #94A3B8; }
.add-searching { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #E2EBF6; border-radius: 8px; padding: 10px; font-size: 12px; color: #94A3B8; text-align: center; margin-top: 2px; z-index: 50; }

/* PARSER */
.parser-textarea { width: 100%; border: 1.5px solid #E2EBF6; border-radius: 10px; padding: 12px; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; resize: vertical; }
.parser-textarea:focus { border-color: #054EAF; }
.parser-hint  { font-size: 12px; color: #64748B; margin: -8px 0 10px; }
.parser-items { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; padding-right: 4px; margin-bottom: 12px; }
.parser-item  { display: flex; align-items: center; gap: 8px; }
.parser-qty   { width: 60px; border: 1px solid #E2EBF6; border-radius: 6px; padding: 6px 8px; font-size: 13px; text-align: center; outline: none; background: #F8FAFC; }
.parser-name  { flex: 1; border: 1px solid #E2EBF6; border-radius: 6px; padding: 6px 10px; font-size: 12px; outline: none; background: #F8FAFC; font-family: 'Inter', sans-serif; }
.parser-cat   { width: 170px; border: 1px solid #E2EBF6; border-radius: 6px; padding: 6px 8px; font-size: 12px; outline: none; background: #F8FAFC; appearance: auto; }
.parser-done  { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px; text-align: center; }
.parser-done-ico { color: #22C55E; }
.parser-done-msg { font-size: 15px; font-weight: 700; color: #0F1A2E; margin: 0; }
.parser-stats { display: flex; gap: 24px; }
.stat         { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-n       { font-size: 28px; font-weight: 800; color: #054EAF; }
.stat-l       { font-size: 12px; color: #64748B; }
</style>
