<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,26,46,0.4)] backdrop-blur-sm p-4"
      >
        <div
          class="bg-card rounded-[var(--r-2xl)] shadow-[var(--shadow-modal)] w-full max-w-6xl flex flex-col"
          style="max-height: 90vh;"
        >

          <!-- ── Header ─────────────────────────────────────── -->
          <div class="flex items-center gap-4 px-6 py-4 border-b border-border flex-shrink-0">
            <h2 class="text-[16px] font-bold text-text-1 font-['Plus_Jakarta_Sans',sans-serif] whitespace-nowrap">
              Seleccionar Producto
            </h2>

            <!-- Buscador -->
            <div class="flex-1 relative min-w-0">
              <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" />
              <input
                v-model="busqueda"
                type="text"
                placeholder="Buscar por nombre, dispositivo o descripción..."
                class="w-full pl-8 pr-3 py-[7px] text-[13px] bg-[#F8FAFC] border border-border rounded-[var(--r-md)] focus:outline-none focus:border-primary text-text-1 placeholder:text-text-3 transition"
                @input="resetPagina"
              />
            </div>

            <!-- Contador -->
            <div class="text-[12px] text-text-2 whitespace-nowrap flex-shrink-0">
              <span class="font-semibold text-primary">{{ productosFiltradosLocal.length }}</span>
              <span class="ml-1">encontrados</span>
            </div>

            <!-- Cerrar -->
            <button
              @click="$emit('close')"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F5F9] text-text-2 hover:bg-border transition text-xl leading-none flex-shrink-0"
            >×</button>
          </div>

          <!-- ── Filtros rápidos ─────────────────────────────── -->
          <div class="flex items-center gap-2 px-6 py-3 border-b border-border flex-shrink-0 flex-wrap">
            <button
              v-for="f in filtros"
              :key="f.value"
              @click="setFiltro(f.value)"
              :class="[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition',
                filtroActivo === f.value
                  ? 'bg-primary text-white shadow-[var(--shadow-btn)]'
                  : 'bg-[#F1F5F9] text-text-2 hover:bg-border'
              ]"
            >
              {{ f.label }}
              <span :class="['text-[11px]', filtroActivo === f.value ? 'text-white/70' : 'text-text-3']">
                ({{ contarPorFiltro(f.value) }})
              </span>
            </button>
          </div>

          <!-- ── Grid (scrollable) ───────────────────────────── -->
          <div ref="gridRef" class="flex-1 overflow-y-auto px-6 py-4 min-h-0">

            <!-- Estado vacío -->
            <div
              v-if="productosFiltradosLocal.length === 0"
              class="flex flex-col items-center justify-center py-16 text-center"
            >
              <div class="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
                <Package :size="22" class="text-text-3" />
              </div>
              <p class="text-[14px] font-semibold text-text-1">Sin resultados</p>
              <p class="text-[12px] text-text-3 mt-1">
                {{ busqueda ? `No hay coincidencias para "${busqueda}"` : 'No hay productos en esta categoría' }}
              </p>
            </div>

            <!-- Grid de productos -->
            <div
              v-else
              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
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
            class="flex items-center justify-center gap-1.5 px-6 py-3 border-t border-border flex-shrink-0 flex-wrap"
          >
            <button
              @click="irAPagina(pagina - 1)"
              :disabled="pagina === 1"
              class="px-3 py-1.5 text-[12px] font-medium rounded-[var(--r-md)] border border-border text-text-2 hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Anterior
            </button>

            <template v-for="p in paginasVisibles" :key="String(p) + '_' + pagina">
              <span v-if="p === '...'" class="px-1 text-text-3 text-[12px] select-none">…</span>
              <button
                v-else
                @click="irAPagina(p)"
                :class="[
                  'w-8 h-8 flex items-center justify-center text-[12px] font-medium rounded-[var(--r-md)] transition',
                  p === pagina
                    ? 'bg-primary text-white shadow-[var(--shadow-btn)]'
                    : 'border border-border text-text-2 hover:bg-[#F1F5F9]'
                ]"
              >{{ p }}</button>
            </template>

            <button
              @click="irAPagina(pagina + 1)"
              :disabled="pagina === totalPaginas"
              class="px-3 py-1.5 text-[12px] font-medium rounded-[var(--r-md)] border border-border text-text-2 hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition"
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
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
