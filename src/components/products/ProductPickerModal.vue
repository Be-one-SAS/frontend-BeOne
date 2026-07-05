<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="pp-overlay"
      >
        <div
          class="pp-content"
        >

          <!-- ── Header ─────────────────────────────────────── -->
          <div class="pp-header">
            <h2 class="pp-title">Seleccionar Producto</h2>

            <!-- Buscador -->
            <div class="pp-search-wrap">
              <Search :size="14" class="pp-search-icon" />
              <input
                v-model="busqueda"
                type="text"
                placeholder="Buscar por nombre, dispositivo o descripción..."
                class="pp-search-input"
                @input="resetPagina"
              />
            </div>

            <!-- Contador -->
            <div class="pp-counter">
              <span class="pp-counter-num">{{ productosFiltradosLocal.length }}</span>
              <span class="pp-counter-label">encontrados</span>
            </div>

            <!-- Cerrar -->
            <button
              @click="$emit('close')"
              class="pp-close"
            >×</button>
          </div>

          <!-- ── Filtros rápidos ─────────────────────────────── -->
          <div class="pp-filters">
            <button
              v-for="f in filtros"
              :key="f.value"
              @click="setFiltro(f.value)"
              :class="[
                'pp-filter-btn',
                filtroActivo === f.value ? 'pp-filter-active' : 'pp-filter-idle'
              ]"
            >
              {{ f.label }}
              <span :class="['pp-filter-count', filtroActivo === f.value ? 'pp-filter-count-active' : 'pp-filter-count-idle']">
                ({{ contarPorFiltro(f.value) }})
              </span>
            </button>
          </div>

          <!-- ── Grid (scrollable) ───────────────────────────── -->
          <div ref="gridRef" class="pp-grid-scroll">

            <!-- Estado vacío -->
            <div
              v-if="productosFiltradosLocal.length === 0"
              class="pp-empty"
            >
              <div class="pp-empty-icon-wrap">
                <Package :size="22" class="text-text-3" />
              </div>
              <p class="pp-empty-title">Sin resultados</p>
              <p class="pp-empty-sub">
                {{ busqueda ? `No hay coincidencias para "${busqueda}"` : 'No hay productos en esta categoría' }}
              </p>
            </div>

            <!-- Grid de productos -->
            <div
              v-else
              class="pp-grid"
            >
              <ProductCard
                v-for="producto in paginaActual"
                :key="producto.id"
                :producto="producto"
                @select="onSelect"
              />
            </div>
          </div>

          <!-- ── Footer: paginación ─────────────────────────── -->
          <div
            v-if="totalPaginas > 1"
            class="pp-pagination"
          >
            <button
              @click="irAPagina(pagina - 1)"
              :disabled="pagina === 1"
              class="pp-page-btn"
            >
              Anterior
            </button>

            <div class="pp-page-numbers">
              <template v-for="p in paginasVisibles" :key="String(p) + '_' + pagina">
                <span v-if="p === '...'" class="pp-page-ellipsis">…</span>
                <button
                  v-else
                  @click="irAPagina(p)"
                  :class="['pp-page-num', p === pagina ? 'pp-page-active' : 'pp-page-idle']"
                >{{ p }}</button>
              </template>
            </div>

            <button
              @click="irAPagina(pagina + 1)"
              :disabled="pagina === totalPaginas"
              class="pp-page-btn"
            >
              Siguiente
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Package } from 'lucide-vue-next'
import ProductCard from './ProductCard.vue'

const POR_PAGINA = 20

const props = defineProps({
  show: Boolean,
  productos: Array
})

const emit = defineEmits(['close', 'select'])

const busqueda     = ref('')
const filtroActivo = ref('TODOS')
const pagina       = ref(1)
const gridRef      = ref(null)

const filtros = [
  { value: 'TODOS',         label: 'Todos' },
  { value: 'DISPONIBLE',    label: 'Disponible' },
  { value: 'EN_RESERVA',    label: 'En Reserva' },
  { value: 'NO_DISPONIBLE', label: 'No Disponible' },
]

// Reset state when modal opens
watch(() => props.show, (val) => {
  if (val) {
    busqueda.value     = ''
    filtroActivo.value = 'TODOS'
    pagina.value       = 1
  }
})

const filtrarLista = (lista, filtro, q) => {
  if (filtro !== 'TODOS') {
    lista = lista.filter(p => p.availabilityStatus === filtro)
  }
  if (q) {
    lista = lista.filter(p =>
      (p.nombre      || '').toLowerCase().includes(q) ||
      (p.dispositivo || '').toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q)
    )
  }
  return lista
}

const productosFiltradosLocal = computed(() => {
  if (!props.productos?.length) return []
  const q = busqueda.value.trim().toLowerCase()
  return filtrarLista([...props.productos], filtroActivo.value, q)
})

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(productosFiltradosLocal.value.length / POR_PAGINA))
)

const paginaActual = computed(() => {
  const start = (pagina.value - 1) * POR_PAGINA
  return productosFiltradosLocal.value.slice(start, start + POR_PAGINA)
})

const paginasVisibles = computed(() => {
  const total = totalPaginas.value
  const curr  = pagina.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = [1]
  if (curr > 3) pages.push('...')
  for (let i = Math.max(2, curr - 1); i <= Math.min(total - 1, curr + 1); i++) {
    pages.push(i)
  }
  if (curr < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const contarPorFiltro = (filtro) => {
  if (!props.productos?.length) return 0
  const q = busqueda.value.trim().toLowerCase()
  return filtrarLista([...props.productos], filtro, q).length
}

const setFiltro = (f) => {
  filtroActivo.value = f
  pagina.value = 1
  scrollGridTop()
}

const resetPagina = () => {
  pagina.value = 1
}

const irAPagina = (p) => {
  if (p < 1 || p > totalPaginas.value) return
  pagina.value = p
  scrollGridTop()
}

const scrollGridTop = () => {
  if (gridRef.value) gridRef.value.scrollTop = 0
}

const onSelect = (producto) => {
  emit('select', producto)
  emit('close')
}
</script>

<style scoped>
/* ── Overlay ──────────────────────────────────────────── */
.pp-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 26, 46, 0.4);
  backdrop-filter: blur(4px);
  padding: 24px;
}

.pp-content {
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(15, 26, 46, 0.18);
  width: 100%;
  max-width: 1152px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* ── Header ──────────────────────────────────────────── */
.pp-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid #E5EAF0;
  flex-shrink: 0;
}

.pp-title {
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
}

.pp-search-wrap {
  flex: 1;
  position: relative;
  min-width: 0;
}

.pp-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}

.pp-search-input {
  width: 100%;
  padding: 7px 10px 7px 32px;
  font-size: 13px;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 8px;
  color: #0F1A2E;
  outline: none;
  transition: border-color 0.15s;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}
.pp-search-input:focus { border-color: #27C8D8; }
.pp-search-input::placeholder { color: #94A3B8; }

.pp-counter {
  font-size: 12px;
  color: #64748B;
  white-space: nowrap;
  flex-shrink: 0;
}
.pp-counter-num { font-weight: 700; color: #27C8D8; }
.pp-counter-label { margin-left: 4px; }

.pp-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F1F5F9;
  color: #64748B;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.pp-close:hover { background: #E5EAF0; color: #0F1A2E; }

/* ── Filters ─────────────────────────────────────────── */
.pp-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border-bottom: 1px solid #E5EAF0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.pp-filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
.pp-filter-active { background: #27C8D8; color: #FFFFFF; }
.pp-filter-idle { background: #F1F5F9; color: #64748B; }
.pp-filter-idle:hover { background: #E5EAF0; }

.pp-filter-count { font-size: 11px; }
.pp-filter-count-active { color: rgba(255,255,255,0.7); }
.pp-filter-count-idle { color: #94A3B8; }

/* ── Grid scrollable ────────────────────────────────── */
.pp-grid-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  min-height: 0;
}
.pp-grid-scroll::-webkit-scrollbar { width: 4px; }
.pp-grid-scroll::-webkit-scrollbar-thumb { background: #E5EAF0; border-radius: 99px; }

.pp-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* ── Empty ──────────────────────────────────────────── */
.pp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}
.pp-empty-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.pp-empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F1A2E;
  margin: 0;
}
.pp-empty-sub {
  font-size: 12px;
  color: #94A3B8;
  margin: 4px 0 0;
}

/* ── Pagination ─────────────────────────────────────── */
.pp-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid #E5EAF0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.pp-page-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid #E5EAF0;
  background: #FFFFFF;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: 'Inter', sans-serif;
}
.pp-page-btn:hover:not(:disabled) { background: #F1F5F9; color: #27C8D8; }
.pp-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.pp-page-numbers { display: flex; align-items: center; gap: 4px; }

.pp-page-num {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: 'Inter', sans-serif;
}
.pp-page-active { background: #27C8D8; color: #FFFFFF; }
.pp-page-idle { background: transparent; color: #64748B; }
.pp-page-idle:hover { background: #F1F5F9; }

.pp-page-ellipsis {
  color: #94A3B8;
  font-size: 12px;
  padding: 0 2px;
  user-select: none;
}

/* ── Transition ──────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

/* ── Responsive ──────────────────────────────────────── */
@media (min-width: 640px) {
  .pp-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .pp-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 1024px) {
  .pp-overlay { padding: 16px; }
  .pp-header { padding: 14px 18px; gap: 10px; }
  .pp-filters { padding: 8px 18px; }
  .pp-grid-scroll { padding: 12px 18px; }
  .pp-pagination { padding: 10px 18px; }
}

@media (max-width: 640px) {
  .pp-overlay { padding: 0; align-items: flex-end; }
  .pp-content { border-radius: 20px 20px 0 0; max-height: 92vh; }
  .pp-header { flex-wrap: wrap; padding: 14px 16px; gap: 8px; }
  .pp-title { font-size: 15px; }
  .pp-search-wrap { order: 10; flex: 1 1 100%; }
  .pp-counter-label { display: none; }
  .pp-filters { padding: 8px 16px; gap: 4px; }
  .pp-filter-btn { padding: 4px 10px; font-size: 11px; }
  .pp-grid-scroll { padding: 10px 16px; }
  .pp-grid { gap: 8px; }
  .pp-pagination { padding: 8px 16px; gap: 4px; }
  .pp-page-btn { padding: 5px 10px; font-size: 11px; }
  .pp-page-num { width: 28px; height: 28px; font-size: 11px; }
}

@media (max-width: 480px) {
  .pp-overlay { padding: 0; }
  .pp-content { border-radius: 16px 16px 0 0; }
  .pp-header { padding: 12px 14px; }
  .pp-title { font-size: 14px; }
  .pp-filters { padding: 6px 14px; }
  .pp-grid-scroll { padding: 8px 14px; }
  .pp-grid { grid-template-columns: 1fr; gap: 10px; }
  .pp-pagination { padding: 8px 14px; }
  .pp-counter-num { font-size: 11px; }
  .pp-empty { padding: 40px 16px; }
}
</style>
