<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductFoto } from '@/services/products.service'
import { getMaterialesByProducto, removeMaterialFromProducto } from '@/services/materiales.service'
import { formatCOP } from '@/utils/currency.js'
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import ConfirmModal from '@/components/modal/ConfirmModal.vue'
import SelectLabel from '@/components/input/SelectLabel.vue'
import ThumbHoverPreview from '@/components/shared/ThumbHoverPreview.vue'
import { useThumbHoverPreview } from '@/composables/useThumbHoverPreview'
import {
  RefreshCw, ChevronUp, ChevronDown, Inbox,
  Pencil, Trash2, Plus, X, Camera,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Calculator,
} from 'lucide-vue-next'

const router = useRouter()

/** Lleva el costo (cop) y precio cliente directo (valorCuadroCotizador) de
 * este producto propio al Simulador de /admin/quotation-params. */
const simularProducto = (row) => {
  router.push({
    name: 'QuotationParams',
    query: {
      simTipo:    'propio',
      simCosto:   row.cop ?? 0,
      simPrecio:  row.valorCuadroCotizador ?? 0,
      simNombre:  row.nombre ?? '',
    },
  })
}

/* ─── state ─────────────────────────────────────────────── */
const products    = ref([])
const loading     = ref(false)

const search      = ref('')
const categFilter = ref('')
const tipoFilter  = ref('')
const condFilter  = ref('')
const pageSize    = ref(25)

const sortKey = ref('nombre')
const sortDir = ref('asc')

const expandedRow = ref(null)
const toggleRow   = (id) => { expandedRow.value = expandedRow.value === id ? null : id }

// ── Preview ampliado al hacer hover sobre la miniatura ──
const { preview: thumbPreview, showPreview: showThumbPreview, hidePreview: hideThumbPreview } = useThumbHoverPreview()

// modal delete
const deleteModal     = ref(false)
const deleteLoading   = ref(false)
const productToDelete = ref(null)

// modal editar / crear
const editModal   = ref(false)
const editLoading = ref(false)
const editError   = ref('')
const isCreating  = ref(false)
const editForm    = ref({
  nombre:             '',
  dispositivo:        '',
  descripcion:        '',
  categoria:          '',
  bodega:             '',
  conditionStatus:    '',
  availabilityStatus: '',
  valorCuadroCotizador: null,
  amperios:           null,
  medidas:            '',
  qMotores:           null,
  qOperarios:         null,
  m2Dispositivo:      null,
  pesoAproxDisp:      null,
  m3Transporte:       null,
  qHorasOperacion:    null,
  qHorasMontaje:      null,
  qPersonalMontaje:   null,
  anioDispositivo:    null,
  montacarga:         '',
  qPesosEstacas:      null,
  qExtintores:        null,
  notas:              '',
  precioCafam:        null,
  precioComfama:      null,
  precioCompensar:    null,
  precioColsubsidio:  null,
  precioOperadores:   null,
})
const editAccesorios = ref([])   // [{ nombre: string }]
const newAccesorio   = ref('')
const productToEdit  = ref(null)

// foto
const fotoLoading    = ref(false)
const fotoError      = ref('')
const fotoInput      = ref(null)   // ref al <input type="file">
const newFotoFile     = ref(null)  // File pendiente de subir (modo creación)
const newFotoLocalUrl = ref('')    // preview local (object URL) mientras no existe el producto

const fotoPreviewUrl = computed(() =>
  isCreating.value ? newFotoLocalUrl.value : (productToEdit.value?.linkFotoDispositivo || '')
)

// materiales del modal de edición — solo resumen de lectura, la gestión
// completa (agregar/editar/quitar) vive únicamente en /materiales para no
// tener dos pantallas editando lo mismo.
const editMateriales   = ref([])          // ProductoMaterial[]
const editMatLoading   = ref(false)

/* ─── computed options ───────────────────────────────────── */
const categorias = computed(() => [...new Set(products.value.map(p => p.categoria).filter(Boolean))].sort())
const tipos      = computed(() => [...new Set(products.value.map(p => p.dispositivo).filter(Boolean))].sort())

const conditionOptions = [
  { value: 'OPERATIVO_OK',     label: 'Operativo OK'     },
  { value: 'OPERATIVO_70',     label: 'Operativo 70%'    },
  { value: 'OPERATIVO_50',     label: 'Operativo 50%'    },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'DEFECTUOSO',       label: 'Defectuoso'       },
  { value: 'NO_ACTIVO',        label: 'No activo'        },
]

const PRICE_LISTS = [
  { key: 'precioCafam',       label: 'CAFAM'       },
  { key: 'precioComfama',     label: 'Comfama'     },
  { key: 'precioCompensar',   label: 'Compensar'   },
  { key: 'precioColsubsidio', label: 'Colsubsidio' },
  { key: 'precioOperadores',  label: 'Operadores'  },
]

/* ─── filter + sort ─────────────────────────────────────── */
const filteredSorted = computed(() => {
  const q = search.value.toLowerCase()
  let list = products.value.filter(p => {
    const matchSearch = !q ||
      (p.nombre?.toLowerCase().includes(q))    ||
      (p.categoria?.toLowerCase().includes(q)) ||
      (p.bodega?.toLowerCase().includes(q))
    const matchCateg = !categFilter.value || p.categoria === categFilter.value
    const matchTipo  = !tipoFilter.value  || p.dispositivo === tipoFilter.value
    const matchCond  = !condFilter.value  || p.conditionStatus === condFilter.value
    return matchSearch && matchCateg && matchTipo && matchCond
  })
  if (sortKey.value) {
    const dir = sortDir.value === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const av = (a[sortKey.value] ?? '').toString().toLowerCase()
      const bv = (b[sortKey.value] ?? '').toString().toLowerCase()
      return av < bv ? -dir : av > bv ? dir : 0
    })
  }
  return list
})

/* ─── pagination ─────────────────────────────────────────── */
const currentPage = ref(1)
watch(filteredSorted, () => { currentPage.value = 1 })

const pagedRows  = computed(() => {
  const start = (currentPage.value - 1) * Number(pageSize.value)
  return filteredSorted.value.slice(start, start + Number(pageSize.value))
})
const totalPages = computed(() => Math.ceil(filteredSorted.value.length / Number(pageSize.value)))
const visiblePages = computed(() => {
  const total = totalPages.value, cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)          return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3)  return [1, '...', total-4, total-3, total-2, total-1, total]
  return [1, '...', cur-1, cur, cur+1, '...', total]
})

/* ─── sort ───────────────────────────────────────────────── */
const sortBy = (key) => {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

/* ─── badge helpers ──────────────────────────────────────── */
const condClass = (val) => ({
  OPERATIVO_OK:     'badge badge--green',
  OPERATIVO_70:     'badge badge--yellow',
  OPERATIVO_50:     'badge badge--orange',
  EN_MANTENIMIENTO: 'badge badge--blue',
  DEFECTUOSO:       'badge badge--red',
  NO_ACTIVO:        'badge badge--slate',
}[val] || 'badge badge--slate')

const condLabel = (val) => ({
  OPERATIVO_OK:     'Operativo OK',
  OPERATIVO_70:     'Operativo 70%',
  OPERATIVO_50:     'Operativo 50%',
  EN_MANTENIMIENTO: 'En mantenimiento',
  DEFECTUOSO:       'Defectuoso',
  NO_ACTIVO:        'No activo',
}[val] || val || '—')

const availClass = (val) => ({
  DISPONIBLE:    'badge badge--green',
  EN_RESERVA:    'badge badge--yellow',
  NO_DISPONIBLE: 'badge badge--red',
}[val] || 'badge badge--slate')

const availLabel = (val) => ({
  DISPONIBLE:    'Disponible',
  EN_RESERVA:    'En reserva',
  NO_DISPONIBLE: 'No disponible',
}[val] || val || '—')

const fmt = (n) => n != null ? formatCOP(n) : '—'

/* ─── fetch ──────────────────────────────────────────────── */
async function fetchProducts() {
  loading.value = true
  try {
    const res       = await getProducts()
    products.value  = res.data || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function resetFilters() {
  search.value = ''; categFilter.value = ''; tipoFilter.value = ''; condFilter.value = ''
  fetchProducts()
}

/* ─── delete ─────────────────────────────────────────────── */
function confirmDelete(product) { productToDelete.value = product; deleteModal.value = true }

async function executeDelete() {
  deleteLoading.value = true
  try {
    await deleteProduct(productToDelete.value.id)
    products.value    = products.value.filter(p => p.id !== productToDelete.value.id)
    deleteModal.value = false
    productToDelete.value = null
  } catch (e) {
    console.error(e)
  } finally {
    deleteLoading.value = false
  }
}

/* ─── edit ───────────────────────────────────────────────── */
function resetFotoPending() {
  if (newFotoLocalUrl.value) URL.revokeObjectURL(newFotoLocalUrl.value)
  newFotoFile.value     = null
  newFotoLocalUrl.value = ''
}

function openEdit(product) {
  isCreating.value    = false
  productToEdit.value = product
  editError.value     = ''
  resetFotoPending()
  Object.keys(editForm.value).forEach(k => {
    editForm.value[k] = product[k] ?? (typeof editForm.value[k] === 'string' ? '' : null)
  })
  editAccesorios.value = (product.accesorios || []).map(a => ({ nombre: a.nombre }))
  newAccesorio.value   = ''
  editModal.value      = true
  editMateriales.value  = []
  editMatLoading.value  = true
  getMaterialesByProducto(product.id)
    .then(r  => { editMateriales.value = r })
    .catch(() => {})
    .finally(() => { editMatLoading.value = false })
}

function irAMateriales() {
  router.push({ name: 'Materiales', query: { productoId: productToEdit.value.id } })
}

// ── Quitar material asignado, directo desde este modal ──────────────────
const materialToDelete = ref(null)
const deletingMatId    = ref(null)

function confirmDeleteMaterial(pm) { materialToDelete.value = pm }

async function deleteMaterial() {
  const pm = materialToDelete.value
  if (!pm) return
  deletingMatId.value = pm.id
  try {
    await removeMaterialFromProducto(pm.id)
    editMateriales.value = editMateriales.value.filter(m => m.id !== pm.id)
  } catch (e) {
    console.error('[Products] Error al quitar material:', e)
  } finally {
    deletingMatId.value = null
    materialToDelete.value = null
  }
}

function openCreate() {
  isCreating.value    = true
  productToEdit.value = null
  editError.value     = ''
  resetFotoPending()
  Object.keys(editForm.value).forEach(k => {
    editForm.value[k] = typeof editForm.value[k] === 'string' ? '' : null
  })
  editAccesorios.value = []
  newAccesorio.value   = ''
  editModal.value      = true
  editMateriales.value = []
}

function addAccesorio() {
  const n = newAccesorio.value.trim()
  if (n) { editAccesorios.value.push({ nombre: n }); newAccesorio.value = '' }
}

function removeAccesorio(i) { editAccesorios.value.splice(i, 1) }

async function saveEdit() {
  if (!editForm.value.nombre?.trim()) { editError.value = 'El nombre es obligatorio.'; return }
  editLoading.value = true; editError.value = ''
  try {
    const payload = {
      ...editForm.value,
      conditionStatus:    editForm.value.conditionStatus || undefined,
      availabilityStatus: editForm.value.availabilityStatus || undefined,
      accesorios: editAccesorios.value.map(a => a.nombre),
    }
    if (isCreating.value) {
      const res     = await createProduct(payload)
      let   created = res.data
      if (newFotoFile.value) {
        try {
          const fotoRes = await uploadProductFoto(created.id, newFotoFile.value)
          created = { ...created, linkFotoDispositivo: fotoRes.data.imageUrl }
        } catch {
          // El producto ya se creó — la foto se puede subir después desde "Editar".
        }
      }
      products.value.push(created)
    } else {
      const res     = await updateProduct(productToEdit.value.id, payload)
      const updated = res.data
      const idx     = products.value.findIndex(p => p.id === productToEdit.value.id)
      if (idx !== -1) {
        products.value[idx] = {
          ...products.value[idx],
          ...updated,
          accesorios: editAccesorios.value.map((a, i) => ({ nombre: a.nombre, orden: i + 1 })),
        }
      }
    }
    editModal.value = false
  } catch (e) {
    editError.value = e?.response?.data?.message || 'Error al guardar.'
  } finally {
    editLoading.value = false
  }
}


async function handleFotoChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  // Modo creación: el producto todavía no existe — solo se guarda el archivo
  // y se muestra un preview local; se sube de verdad en saveEdit() tras crear.
  if (isCreating.value) {
    if (newFotoLocalUrl.value) URL.revokeObjectURL(newFotoLocalUrl.value)
    newFotoFile.value     = file
    newFotoLocalUrl.value = URL.createObjectURL(file)
    return
  }

  if (!productToEdit.value) return
  fotoLoading.value = true
  fotoError.value   = ''
  try {
    const res = await uploadProductFoto(productToEdit.value.id, file)
    const newUrl = res.data.imageUrl
    // actualizar en la lista local (cache-bust para forzar recarga del img)
    const idx = products.value.findIndex(p => p.id === productToEdit.value.id)
    if (idx !== -1) products.value[idx].linkFotoDispositivo = newUrl + '?t=' + Date.now()
    editForm.value.linkFotoDispositivo = newUrl
    productToEdit.value = { ...productToEdit.value, linkFotoDispositivo: newUrl }
  } catch (e) {
    fotoError.value = e?.response?.data?.message || 'Error al subir la foto.'
  } finally {
    fotoLoading.value = false
    if (fotoInput.value) fotoInput.value.value = ''
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="pp-page">

    <!-- HEADER -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="pp-title">Productos Propios</h2>
        <p class="pp-subtitle">{{ filteredSorted.length }} productos encontrados</p>
      </div>
      <div class="pp-head-actions">
        <div class="per-page-wrap">
          <span class="per-page-lbl">Por página</span>
          <select v-model="pageSize" class="pp-input pp-input--sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
        <button class="btn-reload" @click="resetFilters">
          <RefreshCw :size="13" /> Recargar
        </button>
        <button class="btn-new-product" @click="openCreate">
          <Plus :size="13" /> Nuevo producto
        </button>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(39,200,216,.06)] grid grid-cols-2 md:grid-cols-4 gap-4">
      <input v-model="search" type="text" placeholder="Buscar nombre, categoría…" class="pp-input" />
      <select v-model="categFilter" class="pp-input">
        <option value="">Todas las categorías</option>
        <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="tipoFilter" class="pp-input">
        <option value="">Todos los tipos</option>
        <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="condFilter" class="pp-input">
        <option value="">Todas las condiciones</option>
        <option v-for="c in conditionOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <!-- TABLA -->
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(39,200,216,.06),_0_4px_16px_rgba(39,200,216,.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="pp-table">
          <thead>
            <tr class="pp-head-row">
              <th class="pp-th" style="width:36px"></th>
              <th class="pp-th pp-th-center" style="width:44px">#</th>
              <th class="pp-th" style="width:52px"></th>
              <th class="pp-th pp-th-sort" @click="sortBy('nombre')">
                Nombre
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey==='nombre'&&sortDir==='asc'  ?'sort-active':'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey==='nombre'&&sortDir==='desc' ?'sort-active':'sort-dim'" />
                </span>
              </th>
              <th class="pp-th pp-th-sort" @click="sortBy('categoria')">
                Categoría
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey==='categoria'&&sortDir==='asc'  ?'sort-active':'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey==='categoria'&&sortDir==='desc' ?'sort-active':'sort-dim'" />
                </span>
              </th>
              <th class="pp-th pp-th-sort" @click="sortBy('bodega')">
                Bodega
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey==='bodega'&&sortDir==='asc'  ?'sort-active':'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey==='bodega'&&sortDir==='desc' ?'sort-active':'sort-dim'" />
                </span>
              </th>
              <th class="pp-th pp-th-sort" @click="sortBy('conditionStatus')">
                Condición
                <span class="sort-icons">
                  <ChevronUp   :size="11" :class="sortKey==='conditionStatus'&&sortDir==='asc'  ?'sort-active':'sort-dim'" />
                  <ChevronDown :size="11" :class="sortKey==='conditionStatus'&&sortDir==='desc' ?'sort-active':'sort-dim'" />
                </span>
              </th>
              <th class="pp-th">Disponibilidad</th>
              <th class="pp-th" style="width:90px">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="n in 5" :key="`sk-${n}`" class="pp-row">
                <td class="pp-td" v-for="c in 9" :key="c"><div class="sk-box" style="width:80px"></div></td>
              </tr>
            </template>

            <template v-else>
              <template v-for="(row, index) in pagedRows" :key="row.id">

                <!-- Fila principal -->
                <tr class="pp-row" @click="toggleRow(row.id)">
                  <td class="pp-td pp-td-center">
                    <ChevronDown :size="14" class="pp-chevron" :class="{ 'pp-chevron-open': expandedRow === row.id }" />
                  </td>
                  <td class="pp-td pp-td-center pp-idx">
                    {{ index + 1 + (currentPage - 1) * Number(pageSize) }}
                  </td>
                  <td class="pp-td pp-td-center">
                    <div
                      class="pp-thumb-wrap"
                      @mouseenter="row.linkFotoDispositivo && showThumbPreview($event, row.linkFotoDispositivo)"
                      @mouseleave="hideThumbPreview"
                    >
                      <img
                        v-if="row.linkFotoDispositivo"
                        :src="row.linkFotoDispositivo"
                        class="pp-thumb"
                        alt=""
                        @error="$event.target.style.display='none'"
                      />
                      <div v-else class="pp-thumb-empty"><Camera :size="14" /></div>
                    </div>
                  </td>
                  <td class="pp-td">
                    <div class="pp-disp-cell">
                      <span class="pp-disp-name">{{ row.nombre || '—' }}</span>
                      <span v-if="row.dispositivo" class="pp-tipo-badge">{{ row.dispositivo }}</span>
                    </div>
                  </td>
                  <td class="pp-td"><span class="pp-categ">{{ row.categoria || '—' }}</span></td>
                  <td class="pp-td"><span class="pp-bodega">{{ row.bodega || '—' }}</span></td>
                  <td class="pp-td"><span :class="condClass(row.conditionStatus)">{{ condLabel(row.conditionStatus) }}</span></td>
                  <td class="pp-td"><span :class="availClass(row.availabilityStatus)">{{ availLabel(row.availabilityStatus) }}</span></td>
                  <td class="pp-td" @click.stop>
                    <div class="pp-actions">
                      <button class="act-btn act-sim" title="Simular en Parámetros de Cotización" @click.stop="simularProducto(row)"><Calculator :size="12" /></button>
                      <button class="act-btn act-edit" title="Editar" @click.stop="openEdit(row)"><Pencil :size="12" /></button>
                      <button class="act-btn act-del"  title="Eliminar" @click.stop="confirmDelete(row)"><Trash2 :size="12" /></button>
                    </div>
                  </td>
                </tr>

                <!-- Fila expandida -->
                <tr class="pp-exp-tr">
                  <td colspan="9" class="pp-exp-td">
                    <div class="pp-exp-panel" :class="{ 'pp-exp-open': expandedRow === row.id }">
                      <div class="pp-exp-inner">

                        <!-- Foto + Descripción -->
                        <div class="pp-exp-top">
                          <div v-if="row.linkFotoDispositivo" class="pp-exp-foto-wrap">
                            <img :src="row.linkFotoDispositivo" class="pp-exp-foto" alt="" />
                          </div>
                          <div class="pp-exp-top-content">
                            <div v-if="row.descripcion" class="pp-exp-desc">{{ row.descripcion }}</div>
                          </div>
                        </div>

                        <!-- Especificaciones técnicas -->
                        <p class="pp-exp-section">Especificaciones</p>
                        <div class="pp-exp-grid">
                          <div class="pp-exp-field"><span class="pp-exp-label">Amperios</span><span class="pp-exp-val">{{ row.amperios ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Medidas</span><span class="pp-exp-val">{{ row.medidas || '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Motores</span><span class="pp-exp-val">{{ row.qMotores ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Operarios</span><span class="pp-exp-val">{{ row.qOperarios ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">m²</span><span class="pp-exp-val">{{ row.m2Dispositivo ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Peso (kg)</span><span class="pp-exp-val">{{ row.pesoAproxDisp ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">m³ Transporte</span><span class="pp-exp-val">{{ row.m3Transporte ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Hs. Operación</span><span class="pp-exp-val">{{ row.qHorasOperacion ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Hs. Montaje</span><span class="pp-exp-val">{{ row.qHorasMontaje ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Personal Montaje</span><span class="pp-exp-val">{{ row.qPersonalMontaje ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Año</span><span class="pp-exp-val">{{ row.anioDispositivo ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Montacarga</span><span class="pp-exp-val">{{ row.montacarga || '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Pesos/Estacas</span><span class="pp-exp-val">{{ row.qPesosEstacas ?? '—' }}</span></div>
                          <div class="pp-exp-field"><span class="pp-exp-label">Extintores</span><span class="pp-exp-val">{{ row.qExtintores ?? '—' }}</span></div>
                        </div>

                        <!-- Precios -->
                        <p class="pp-exp-section">Precios por lista</p>
                        <div class="pp-prices-grid">
                          <div class="pp-price-item pp-price-item--directo">
                            <span class="pp-price-label">Cliente directo</span>
                            <span class="pp-price-val">{{ fmt(row.valorCuadroCotizador) }}</span>
                          </div>
                          <div v-for="pl in PRICE_LISTS" :key="pl.key" class="pp-price-item">
                            <span class="pp-price-label">{{ pl.label }}</span>
                            <span class="pp-price-val">{{ fmt(row[pl.key]) }}</span>
                          </div>
                          <div class="pp-price-item pp-price-item--cop">
                            <span class="pp-price-label">COP (costo)</span>
                            <span class="pp-price-val">{{ fmt(row.cop) }}</span>
                          </div>
                        </div>

                        <!-- Accesorios -->
                        <template v-if="row.accesorios?.length">
                          <p class="pp-exp-section">Accesorios / Lista de materiales</p>
                          <div class="pp-acc-list">
                            <span v-for="a in row.accesorios" :key="a.id" class="pp-acc-chip">{{ a.nombre }}</span>
                          </div>
                        </template>

                      </div>
                    </div>
                  </td>
                </tr>

              </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Vacío -->
      <div v-if="!loading && pagedRows.length === 0" class="py-16 flex flex-col items-center gap-3 text-text-3">
        <Inbox class="w-10 h-10 opacity-40" />
        <p class="text-[14px]">No se encontraron productos</p>
      </div>

      <!-- Paginación -->
      <div class="pp-pagination">
        <span class="pg-info">
          {{ (currentPage - 1) * Number(pageSize) + 1 }}–{{ Math.min(currentPage * Number(pageSize), filteredSorted.length) }}
          de {{ filteredSorted.length }}
        </span>
        <div class="pg-pages">
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage = 1"><ChevronsLeft :size="14" /></button>
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft :size="14" /></button>
          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="pg-ellipsis">…</span>
            <button v-else class="pg-btn pg-num" :class="{ 'pg-active': p === currentPage }" @click="currentPage = p">{{ p }}</button>
          </template>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight :size="14" /></button>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages"><ChevronsRight :size="14" /></button>
        </div>
      </div>
    </div>

    <!-- ══ MODAL: Editar producto ══ -->
    <ModalReutilizable :show="editModal" @close="editModal = false">
      <div class="edit-modal-wrap">
        <h2 class="modal-title mb-1">{{ isCreating ? 'Nuevo producto' : 'Editar producto' }}</h2>
        <p class="edit-modal-sub">{{ isCreating ? 'Complete los datos del producto propio' : productToEdit?.nombre }}</p>
        <div v-if="editError" class="edit-error">{{ editError }}</div>

        <!-- Foto del producto -->
        <div class="edit-foto-section">
          <div class="edit-foto-preview">
            <img
              v-if="fotoPreviewUrl"
              :src="fotoPreviewUrl"
              class="edit-foto-img"
              alt=""
            />
            <div v-else class="edit-foto-placeholder">
              <Camera :size="32" class="edit-foto-ico" />
              <span>Sin foto</span>
            </div>
          </div>
          <div class="edit-foto-actions">
            <input
              ref="fotoInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              style="display:none"
              @change="handleFotoChange"
            />
            <button
              class="btn-foto-upload"
              :disabled="fotoLoading"
              @click="fotoInput.click()"
            >
              <Camera :size="13" />
              {{ fotoLoading ? 'Subiendo…' : fotoPreviewUrl ? 'Cambiar foto' : 'Subir foto' }}
            </button>
            <p v-if="isCreating && newFotoFile" class="edit-foto-hint">Se subirá al crear el producto.</p>
            <p v-if="fotoError" class="foto-error">{{ fotoError }}</p>
          </div>
        </div>

        <div class="edit-form-grid">

          <!-- Identificación -->
          <p class="edit-section-label" style="grid-column:1/-1">Identificación</p>
          <div class="edit-field edit-field--wide">
            <label class="edit-label">Nombre *</label>
            <input v-model="editForm.nombre" class="edit-input" placeholder="Nombre del producto" />
          </div>
          <div class="edit-field edit-field--wide">
            <label class="edit-label">Tipo / Característica</label>
            <input v-model="editForm.dispositivo" class="edit-input" placeholder="Ej: DISPOSITIVO ENTRETENIMIENTO" />
          </div>
          <div class="edit-field">
            <label class="edit-label">Categoría</label>
            <SelectLabel
              class="edit-select"
              v-model="editForm.categoria"
              :options="categorias"
              :creatable="true"
              placeholder="Selecciona o crea una categoría"
              search-placeholder="Buscar o crear categoría…"
            />
          </div>
          <div class="edit-field">
            <label class="edit-label">Bodega</label>
            <input v-model="editForm.bodega" class="edit-input" />
          </div>

          <!-- Estado -->
          <p class="edit-section-label" style="grid-column:1/-1">Estado</p>
          <div class="edit-field">
            <label class="edit-label">Condición</label>
            <select v-model="editForm.conditionStatus" class="edit-input">
              <option value="">— Seleccionar —</option>
              <option v-for="o in conditionOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <div class="edit-field">
            <label class="edit-label">Disponibilidad</label>
            <select v-model="editForm.availabilityStatus" class="edit-input">
              <option value="">— Seleccionar —</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_RESERVA">En reserva</option>
              <option value="NO_DISPONIBLE">No disponible</option>
            </select>
          </div>
          <div class="edit-field">
            <label class="edit-label">Año</label>
            <input v-model.number="editForm.anioDispositivo" type="number" class="edit-input" />
          </div>

          <!-- Especificaciones -->
          <p class="edit-section-label" style="grid-column:1/-1">Especificaciones técnicas</p>
          <div class="edit-field"><label class="edit-label">Amperios</label><input v-model.number="editForm.amperios" type="number" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Medidas</label><input v-model="editForm.medidas" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Motores</label><input v-model.number="editForm.qMotores" type="number" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Operarios</label><input v-model.number="editForm.qOperarios" type="number" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">m²</label><input v-model.number="editForm.m2Dispositivo" type="number" step="0.01" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Peso aprox (kg)</label><input v-model.number="editForm.pesoAproxDisp" type="number" step="0.1" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">m³ Transporte</label><input v-model.number="editForm.m3Transporte" type="number" step="0.01" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Pesos/Estacas</label><input v-model.number="editForm.qPesosEstacas" type="number" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Extintores</label><input v-model.number="editForm.qExtintores" type="number" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Montacarga</label><input v-model="editForm.montacarga" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Hs. Operación</label><input v-model.number="editForm.qHorasOperacion" type="number" step="0.5" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Hs. Montaje</label><input v-model.number="editForm.qHorasMontaje" type="number" step="0.5" class="edit-input" /></div>
          <div class="edit-field"><label class="edit-label">Personal Montaje</label><input v-model.number="editForm.qPersonalMontaje" type="number" class="edit-input" /></div>

          <!-- Precios -->
          <p class="edit-section-label" style="grid-column:1/-1">Precios por lista</p>
          <div class="edit-field">
            <label class="edit-label">Precio cliente directo</label>
            <input v-model.number="editForm.valorCuadroCotizador" type="number" step="1000" class="edit-input" placeholder="$ 0" />
          </div>
          <div class="edit-field">
            <label class="edit-label">COP (costo)</label>
            <input v-model.number="editForm.cop" type="number" step="1000" class="edit-input" placeholder="$ 0" />
          </div>
          <div v-for="pl in PRICE_LISTS" :key="pl.key" class="edit-field">
            <label class="edit-label">{{ pl.label }}</label>
            <input v-model.number="editForm[pl.key]" type="number" step="1000" class="edit-input" placeholder="$ 0" />
          </div>

          <!-- Descripción y notas -->
          <p class="edit-section-label" style="grid-column:1/-1">Descripción y notas</p>
          <div class="edit-field" style="grid-column:1/-1">
            <label class="edit-label">Descripción</label>
            <textarea v-model="editForm.descripcion" class="edit-input edit-textarea" rows="3"></textarea>
          </div>
          <div class="edit-field" style="grid-column:1/-1">
            <label class="edit-label">Notas</label>
            <textarea v-model="editForm.notas" class="edit-input edit-textarea" rows="2"></textarea>
          </div>

          <!-- Accesorios -->
          <p class="edit-section-label" style="grid-column:1/-1">Accesorios / Lista de materiales</p>
          <div style="grid-column:1/-1">
            <div class="acc-chips-wrap">
              <div v-for="(a, i) in editAccesorios" :key="i" class="acc-chip-edit">
                <span>{{ a.nombre }}</span>
                <button class="acc-chip-rm" @click="removeAccesorio(i)"><X :size="10" /></button>
              </div>
            </div>
            <div class="acc-add-row">
              <input
                v-model="newAccesorio"
                class="edit-input"
                placeholder="Nuevo accesorio…"
                @keydown.enter.prevent="addAccesorio"
                style="flex:1"
              />
              <button class="btn-add-acc" @click="addAccesorio"><Plus :size="13" /> Agregar</button>
            </div>
          </div>

          <!-- Materiales del catálogo — lista con eliminar inline. Agregar/editar
               cantidad/importar desde texto sigue viviendo solo en /materiales,
               para no tener dos pantallas con esa parte completa duplicada. -->
          <div v-if="!isCreating" style="grid-column:1/-1" class="mat-section">
            <div class="mat-section-header">
              <span class="edit-section-label" style="margin:0">
                Materiales del catálogo
                <span class="mat-count-badge">{{ editMateriales.length }}</span>
              </span>
              <button class="btn-mat-text btn-mat-primary" @click="irAMateriales">
                Gestionar materiales
              </button>
            </div>

            <div v-if="editMatLoading" class="mat-loading">Cargando materiales…</div>
            <div v-else-if="!editMateriales.length" class="mat-empty">Sin materiales asignados desde el catálogo.</div>
            <ul v-else class="mat-summary-list">
              <li v-for="pm in editMateriales" :key="pm.id" class="mat-summary-item">
                <span class="mat-nombre">{{ pm.materialBase?.nombre }}</span>
                <span class="mat-summary-meta">{{ pm.cantidad }} {{ pm.materialBase?.unidad || '' }}</span>
                <span :class="pm.esOpcional ? 'mat-badge-opt' : 'mat-badge-req'">
                  {{ pm.esOpcional ? 'Opcional' : 'Requerido' }}
                </span>
                <button
                  class="act-btn act-del mat-del-btn"
                  title="Quitar material"
                  :disabled="deletingMatId === pm.id"
                  @click="confirmDeleteMaterial(pm)"
                >
                  <Trash2 :size="11" />
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div class="edit-footer">
          <button @click="editModal = false" class="btn-cancel" :disabled="editLoading">Cancelar</button>
          <button @click="saveEdit" class="btn-save" :disabled="editLoading">
            <span v-if="editLoading" class="edit-spinner"></span>
            {{ editLoading ? 'Guardando…' : (isCreating ? 'Crear producto' : 'Guardar cambios') }}
          </button>
        </div>
      </div>
    </ModalReutilizable>

    <!-- ══ MODAL: Confirmar eliminación ══ -->
    <ModalReutilizable :show="deleteModal" @close="deleteModal = false">
      <div class="text-center p-2">
        <div class="flex justify-center mb-4">
          <div class="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <Trash2 :size="22" class="text-[#B91C1C]" />
          </div>
        </div>
        <h2 class="modal-title text-center">Eliminar producto</h2>
        <p class="text-[13px] text-[#64748B] mt-2 mb-6 leading-relaxed">
          ¿Seguro que deseas eliminar <strong>{{ productToDelete?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div class="flex justify-center gap-3">
          <button @click="deleteModal = false" class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E5EAF0] rounded-[8px] hover:bg-[#E5EAF0] transition" :disabled="deleteLoading">
            Cancelar
          </button>
          <button @click="executeDelete" class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#B91C1C] text-white rounded-[8px] hover:bg-[#991B1B] transition flex items-center gap-2" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="edit-spinner"></span>
            <Trash2 v-else :size="14" /> Eliminar
          </button>
        </div>
      </div>
    </ModalReutilizable>

  </div>

  <ConfirmModal
    :show="!!materialToDelete"
    title="¿Quitar material?"
    :message="`Vas a quitar «${materialToDelete?.materialBase?.nombre}» de este producto.`"
    confirm-label="Sí, quitar"
    cancel-label="Cancelar"
    variant="danger"
    @confirm="deleteMaterial"
    @cancel="materialToDelete = null"
  />

  <ThumbHoverPreview :preview="thumbPreview" />
</template>

<style scoped>
.pp-page { width: 100%; }

.pp-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px; font-weight: 700; color: var(--text-1, #0F1A2E);
  margin: 0 0 4px; line-height: 1.2;
}
.pp-subtitle { font-size: 13px; color: var(--text-3, #94A3B8); font-family: 'Inter', sans-serif; margin: 0; }
.pp-head-actions { display: flex; align-items: center; gap: 8px; }

.btn-reload {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; font-size: 12px; font-weight: 600;
  font-family: 'Inter', sans-serif; border-radius: 8px;
  border: 1px solid #E2EBF6; background: #F8FAFC; color: #64748B;
  cursor: pointer; transition: background 0.15s;
}
.btn-reload:hover { background: #E2EBF6; }

.btn-new-product {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; font-size: 12px; font-weight: 600;
  font-family: 'Inter', sans-serif; border-radius: 8px;
  border: none; background: #27C8D8; color: #fff;
  cursor: pointer; transition: background 0.15s;
}
.btn-new-product:hover { background: #0F1A2E; }

.per-page-wrap { display: flex; align-items: center; gap: 8px; }
.per-page-lbl  { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; white-space: nowrap; }

.pp-input {
  width: 100%; background: #F8FAFC; border: 1px solid #E2EBF6;
  border-radius: 999px; padding: 8px 16px;
  font-size: 13px; color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s; appearance: auto;
}
.pp-input:focus { border-color: var(--primary, #27C8D8); box-shadow: 0 0 0 3px rgba(39,200,216,.1); }
.pp-input::placeholder { color: var(--text-3, #94A3B8); }
.pp-input--sm { width: 70px; text-align: center; }

.pp-table { width: 100%; border-collapse: separate; border-spacing: 0; font-family: 'Inter', sans-serif; }
.pp-head-row { background: #F0FAFB; }
.pp-th {
  padding: 12px 16px; font-size: 11px; font-weight: 600;
  color: var(--text-2, #64748B); text-transform: uppercase;
  letter-spacing: 0.5px; text-align: left; white-space: nowrap;
  border-bottom: 1px solid #E2EBF6;
}
.pp-th-center { text-align: center; }
.pp-th-sort { cursor: pointer; user-select: none; transition: color 0.12s; }
.pp-th-sort:hover { color: #27C8D8; }
.sort-icons { display: inline-flex; flex-direction: column; align-items: center; margin-left: 4px; vertical-align: middle; gap: 0; line-height: 0; }
.sort-active { color: #27C8D8; }
.sort-dim    { color: #CBD5E1; }

.pp-row { background: #FFFFFF; cursor: pointer; transition: background 0.15s; }
.pp-row:hover { background: #F0F7FF; }
.pp-td {
  padding: 14px 16px; font-size: 13px; color: var(--text-1, #0F1A2E);
  border-bottom: 1px solid #F0FAFB; vertical-align: middle; white-space: nowrap;
}
.pp-td-center { text-align: center; }
.pp-idx { font-size: 12px; color: var(--text-3, #94A3B8); font-weight: 500; }

.pp-chevron { color: var(--text-3, #94A3B8); transition: transform 0.2s, color 0.15s; display: block; margin: 0 auto; }
.pp-chevron-open { transform: rotate(180deg); color: #27C8D8; }

.pp-disp-cell { display: flex; flex-direction: column; gap: 4px; }
.pp-disp-name { font-weight: 600; font-size: 13px; color: var(--text-1, #0F1A2E); white-space: normal; }
.pp-tipo-badge {
  display: inline-block; padding: 2px 7px; border-radius: 999px;
  font-size: 10px; font-weight: 600; font-family: 'Inter', sans-serif;
  background: #F0FAFB; color: #27C8D8; white-space: nowrap; width: fit-content;
}
.pp-categ  { font-size: 13px; color: var(--text-2, #64748B); }
.pp-bodega { font-size: 13px; color: var(--text-2, #64748B); }

.badge { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; font-family: 'Inter', sans-serif; white-space: nowrap; }
.badge--green  { background: #DCFCE7; color: #16A34A; }
.badge--yellow { background: #FEF3C7; color: #B45309; }
.badge--orange { background: #FFEDD5; color: #C2410C; }
.badge--blue   { background: #CCEFF2; color: #27C8D8; }
.badge--red    { background: #FEE2E2; color: #B91C1C; }
.badge--slate  { background: #F1F5F9; color: #64748B; }

.pp-actions { display: flex; align-items: center; gap: 6px; }
.act-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 10px; font-size: 11px; font-weight: 600;
  font-family: 'Inter', sans-serif; border-radius: 8px;
  border: none; cursor: pointer; transition: background 0.15s; white-space: nowrap; line-height: 1;
}
.act-sim        { background: #EDE9FE; color: #7C3AED; }
.act-sim:hover  { background: #DDD6FE; }
.act-edit       { background: #FEF3C7; color: #B45309; }
.act-edit:hover { background: #FDE68A; }
.act-del        { background: #FEE2E2; color: #B91C1C; }
.act-del:hover  { background: #FECACA; }

/* ─── Fila expandida ─── */
.pp-exp-td { padding: 0 !important; border-bottom: 1px solid #F0FAFB; }
.pp-exp-panel { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pp-exp-open  { max-height: 1000px; }
.pp-exp-inner { background: #F8FBFF; border-left: 3px solid #27C8D8; padding: 16px 24px; display: flex; flex-direction: column; gap: 12px; }

.pp-exp-desc { font-size: 12px; color: #64748B; font-style: italic; }
.pp-exp-section {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #27C8D8; font-family: 'Inter', sans-serif;
  margin: 0; border-bottom: 1px solid #E2EBF6; padding-bottom: 4px;
}
.pp-exp-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 20px;
}
@media (max-width: 768px) { .pp-exp-grid { grid-template-columns: repeat(2, 1fr); } }

.pp-exp-field { display: flex; flex-direction: column; gap: 3px; }
.pp-exp-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3, #94A3B8); }
.pp-exp-val   { font-size: 13px; color: var(--text-1, #0F1A2E); font-weight: 500; white-space: normal; word-break: break-word; }

.pp-prices-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;
}
@media (max-width: 900px) { .pp-prices-grid { grid-template-columns: repeat(3, 1fr); } }

.pp-price-item {
  background: #fff; border: 1px solid #E2EBF6; border-radius: 10px;
  padding: 8px 12px; display: flex; flex-direction: column; gap: 3px;
}
.pp-price-item--cop { border-color: #CBD5E1; background: #F8FAFC; }
.pp-price-item--directo { border-color: #7C3AED; background: #F5F3FF; }
.pp-price-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B; }
.pp-price-val   { font-size: 13px; font-weight: 700; color: #27C8D8; font-family: 'Inter', sans-serif; }
.pp-price-item--cop .pp-price-val { color: #374151; }
.pp-price-item--directo .pp-price-val { color: #7C3AED; }

.pp-acc-list { display: flex; flex-wrap: wrap; gap: 6px; }
.pp-acc-chip {
  background: #F0FAFB; color: #27C8D8; border-radius: 999px;
  padding: 3px 10px; font-size: 11px; font-weight: 500;
}

/* ─── Skeleton ─── */
.sk-box { height: 14px; border-radius: 6px; background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ─── Paginación ─── */
.pp-pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #F0FAFB; flex-wrap: wrap; gap: 8px; }
.pg-info { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; }
.pg-pages { display: flex; align-items: center; gap: 4px; }
.pg-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #E2EBF6; background: #FFFFFF; color: #64748B; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
.pg-btn:hover:not(:disabled) { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-active { background: #27C8D8 !important; color: #FFFFFF !important; border-color: #27C8D8 !important; font-weight: 600; }
.pg-ellipsis { color: #94A3B8; font-size: 13px; padding: 0 4px; }

/* ─── Modal ─── */
.modal-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; color: #0F1A2E; margin: 0; }
.edit-modal-wrap { display: flex; flex-direction: column; gap: 16px; }
.edit-modal-sub  { font-size: 13px; color: #64748B; font-family: 'Inter', sans-serif; margin: -10px 0 0; }
.edit-error      { background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; border-radius: 8px; padding: 10px 14px; font-size: 13px; }

.edit-form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 16px; max-height: 62vh; overflow-y: auto; padding-right: 4px; }
@media (max-width: 768px) { .edit-form-grid { grid-template-columns: repeat(2, 1fr); } }

.edit-section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #27C8D8; padding: 6px 0 2px; border-bottom: 1px solid #F0FAFB; margin-bottom: 2px; }
.edit-field { display: flex; flex-direction: column; gap: 5px; }
.edit-field--wide { grid-column: span 2; }
.edit-label  { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; }
.edit-input  { background: #F8FAFC; border: 1px solid #E2EBF6; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #0F1A2E; font-family: 'Inter', sans-serif; outline: none; width: 100%; transition: border-color 0.15s, box-shadow 0.15s; appearance: auto; }
.edit-input:focus { border-color: #27C8D8; box-shadow: 0 0 0 3px rgba(39,200,216,.1); }
.edit-input::placeholder { color: #94A3B8; }
.edit-textarea { resize: vertical; border-radius: 8px; min-height: 60px; }

/* ── Categoría (SelectLabel) para que combine con el resto del formulario ── */
.edit-select :deep(.sl-trigger) {
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
}
.edit-select :deep(.sl-trigger--open),
.edit-select :deep(.sl-trigger:focus-visible) {
  border-color: #27C8D8;
  box-shadow: 0 0 0 3px rgba(39,200,216,.1);
}
.edit-select :deep(.sl-trigger-placeholder) { color: #94A3B8; }

.acc-chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; min-height: 28px; }
.acc-chip-edit {
  display: inline-flex; align-items: center; gap: 5px;
  background: #F0FAFB; color: #27C8D8; border-radius: 999px;
  padding: 4px 10px; font-size: 12px; font-weight: 500;
}
.acc-chip-rm {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%; border: none;
  background: #A7EEF5; color: #27C8D8; cursor: pointer; padding: 0;
}
.acc-chip-rm:hover { background: #8EEAF3; }
.acc-add-row { display: flex; gap: 8px; align-items: center; }
.btn-add-acc {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 14px; font-size: 12px; font-weight: 600;
  border-radius: 8px; border: 1.5px solid #27C8D8;
  background: #F0FAFB; color: #27C8D8; cursor: pointer; white-space: nowrap;
  transition: background 0.15s;
}
.btn-add-acc:hover { background: #CCEFF2; }

.edit-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; border-top: 1px solid #F0FAFB; }
.btn-cancel { padding: 9px 20px; font-size: 13px; font-weight: 600; border-radius: 8px; border: 1px solid #E2EBF6; background: #F1F5F9; color: #64748B; cursor: pointer; transition: background 0.15s; }
.btn-cancel:hover:not(:disabled) { background: #E2EBF6; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { display: inline-flex; align-items: center; gap: 8px; padding: 9px 22px; font-size: 13px; font-weight: 600; border-radius: 8px; border: none; background: #27C8D8; color: #fff; cursor: pointer; box-shadow: 0 1px 4px rgba(39,200,216,.25); transition: background 0.15s; }
.btn-save:hover:not(:disabled) { background: #1BAEBB; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.edit-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── thumbnail en fila ──────────────────────────────── */
.pp-thumb-wrap { width: 40px; height: 40px; border-radius: 8px; overflow: hidden; background: #F1F5F9; display: flex; align-items: center; justify-content: center; border: 1px solid #E2EBF6; }
.pp-thumb { width: 40px; height: 40px; object-fit: cover; display: block; }
.pp-thumb-empty { color: #CBD5E1; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }

/* ── foto en panel expandido ────────────────────────── */
.pp-exp-top { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 14px; }
.pp-exp-foto-wrap { flex-shrink: 0; width: 180px; height: 130px; border-radius: 10px; overflow: hidden; background: #F8FAFC; border: 1px solid #E2EBF6; }
.pp-exp-foto { width: 100%; height: 100%; object-fit: cover; display: block; }
.pp-exp-top-content { flex: 1; }

/* ── foto en modal de edición ───────────────────────── */
.edit-foto-section { display: flex; align-items: center; gap: 16px; padding: 14px; background: #F8FAFC; border: 1px solid #E2EBF6; border-radius: 10px; }
.edit-foto-preview { width: 100px; height: 80px; border-radius: 8px; overflow: hidden; background: #EFF4FB; border: 1px solid #D9E8F8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.edit-foto-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.edit-foto-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #94A3B8; font-size: 11px; font-family: 'Inter', sans-serif; }
.edit-foto-ico { color: #CBD5E1; }
.edit-foto-actions { display: flex; flex-direction: column; gap: 6px; }
.btn-foto-upload {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; font-size: 12px; font-weight: 600; font-family: 'Inter', sans-serif;
  border-radius: 8px; border: 1.5px solid #27C8D8; background: #F0FAFB; color: #27C8D8;
  cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
.btn-foto-upload:hover:not(:disabled) { background: #CCEFF2; }
.btn-foto-upload:disabled { opacity: 0.6; cursor: not-allowed; }
.foto-error { font-size: 12px; color: #B91C1C; margin: 0; }
.edit-foto-hint { font-size: 12px; color: #64748B; margin: 0; }

/* ─── materiales en modal (resumen de solo lectura) ─────────── */
.mat-section { position: relative; }
.mat-section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.mat-count-badge {
  display: inline-flex; align-items: center; justify-content: center;
  background: #CCEFF2; color: #27C8D8;
  border-radius: 9999px; font-size: 11px; font-weight: 600;
  min-width: 18px; height: 18px; padding: 0 5px; margin-left: 6px;
}
.btn-mat-text {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500;
  border: 1px solid #CBD5E1; background: #fff; cursor: pointer;
  color: #475569; transition: background 0.15s;
}
.btn-mat-text:hover { background: #F1F5F9; }
.btn-mat-primary { background: #E0F9FA; border-color: #8EEAF3; color: #27C8D8; }
.btn-mat-primary:hover { background: #CCEFF2; }

.mat-loading, .mat-empty { font-size: 12px; color: #94A3B8; padding: 10px 0; text-align: center; }
.mat-summary-list { list-style: none; margin: 0; padding: 0; }
.mat-summary-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 0; border-bottom: 1px solid #F1F5F9; font-size: 12px;
}
.mat-summary-item:last-child { border-bottom: none; }
.mat-nombre { font-weight: 500; color: #0F172A; flex: 1; }
.mat-summary-meta { color: #64748B; }
.mat-badge-req {
  display: inline-block; padding: 2px 7px; border-radius: 9999px;
  font-size: 10px; font-weight: 600; background: #E0F9FA; color: #27C8D8;
}
.mat-badge-opt {
  display: inline-block; padding: 2px 7px; border-radius: 9999px;
  font-size: 10px; font-weight: 600; background: #FFF7ED; color: #C2410C;
}
.mat-del-btn { flex-shrink: 0; }
.mat-del-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
