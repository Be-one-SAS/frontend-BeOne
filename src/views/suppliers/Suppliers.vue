<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getSuppliers } from '../../services/suppliers.service'
import {
  ChevronDown, Inbox,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-vue-next'

const data    = ref([])
const loading = ref(true)

const searchQuery = ref('')
const pageSize    = ref(25)

/* ─── accordion ─────────────────────────────────────────── */
const expandedRow = ref(null)
const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

/* ─── filter ────────────────────────────────────────────── */
const filteredData = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return data.value
  return data.value.filter(item =>
    Object.values(item).some(v => String(v).toLowerCase().includes(q))
  )
})

/* ─── pagination ────────────────────────────────────────── */
const currentPage = ref(1)
watch(filteredData, () => { currentPage.value = 1 })

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * Number(pageSize.value)
  return filteredData.value.slice(start, start + Number(pageSize.value))
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / Number(pageSize.value)))

const visiblePages = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (cur <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total)
  } else if (cur >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', cur - 1, cur, cur + 1, '...', total)
  }
  return pages
})

/* ─── fetch ─────────────────────────────────────────────── */
onMounted(async () => {
  try {
    const suppliers = await getSuppliers()
    data.value = suppliers.data
  } catch (error) {
    console.error('Error al cargar proveedores:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="sp-page">

    <!-- ══════════════════════════════════════════ -->
    <!-- HEADER                                     -->
    <!-- ══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="sp-title">Proveedores</h2>
        <p class="sp-subtitle">{{ filteredData.length }} proveedores registrados</p>
      </div>
      <div class="sp-head-actions">
        <div class="per-page-wrap">
          <span class="per-page-lbl">Por página</span>
          <select v-model="pageSize" class="sp-input sp-input--sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- FILTROS                                    -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(5,78,175,.06)] grid grid-cols-1 gap-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nombre, NIT, correo…"
        class="sp-input"
      />
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA                                      -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(5,78,175,.06),_0_4px_16px_rgba(5,78,175,.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="sp-table">

          <!-- HEAD -->
          <thead>
            <tr class="sp-head-row">
              <th class="sp-th" style="width:36px"></th>
              <th class="sp-th sp-th-center" style="width:44px">#</th>
              <th class="sp-th">Nombre</th>
              <th class="sp-th">NIT</th>
              <th class="sp-th">Correo</th>
              <th class="sp-th">Teléfono</th>
              <th class="sp-th">Zona de operación</th>
            </tr>
          </thead>

          <!-- BODY -->
          <tbody>

            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="n in 6" :key="`sk-${n}`" class="sp-row">
                <td class="sp-td"></td>
                <td class="sp-td"><div class="sk-box" style="width:28px"></div></td>
                <td class="sp-td"><div class="sk-box" style="width:160px"></div></td>
                <td class="sp-td"><div class="sk-box" style="width:100px"></div></td>
                <td class="sp-td"><div class="sk-box" style="width:180px"></div></td>
                <td class="sp-td"><div class="sk-box" style="width:110px"></div></td>
                <td class="sp-td"><div class="sk-box" style="width:130px"></div></td>
              </tr>
            </template>

            <!-- Filas reales -->
            <template v-else>
              <template v-for="(row, index) in pagedRows" :key="row.id">

                <!-- ── Fila principal ── -->
                <tr class="sp-row" @click="toggleRow(row.id)">

                  <!-- Chevron -->
                  <td class="sp-td sp-td-center">
                    <ChevronDown
                      :size="14"
                      class="sp-chevron"
                      :class="{ 'sp-chevron-open': expandedRow === row.id }"
                    />
                  </td>

                  <!-- # -->
                  <td class="sp-td sp-td-center sp-idx">
                    {{ index + 1 + (currentPage - 1) * Number(pageSize) }}
                  </td>

                  <!-- Nombre -->
                  <td class="sp-td">
                    <span class="sp-name">{{ row.name || '—' }}</span>
                  </td>

                  <!-- NIT -->
                  <td class="sp-td">{{ row.nit || '—' }}</td>

                  <!-- Correo -->
                  <td class="sp-td">{{ row.email || '—' }}</td>

                  <!-- Teléfono -->
                  <td class="sp-td">{{ row.phoneOne || '—' }}</td>

                  <!-- Zona -->
                  <td class="sp-td">{{ row.zoneOperation || '—' }}</td>

                </tr>

                <!-- ── Fila expandida (siempre en DOM, transición max-height) ── -->
                <tr class="sp-exp-tr">
                  <td colspan="7" class="sp-exp-td">
                    <div
                      class="sp-exp-panel"
                      :class="{ 'sp-exp-open': expandedRow === row.id }"
                    >
                      <div class="sp-exp-inner">
                        <div class="sp-exp-grid">

                          <div v-if="row.phoneTwo" class="sp-exp-field">
                            <span class="sp-exp-label">Teléfono 2</span>
                            <span class="sp-exp-val">{{ row.phoneTwo }}</span>
                          </div>
                          <div v-if="row.reference" class="sp-exp-field sp-exp-field--wide">
                            <span class="sp-exp-label">Referencia</span>
                            <span class="sp-exp-val">{{ row.reference }}</span>
                          </div>

                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

              </template>
            </template>

          </tbody>
        </table>
      </div>

      <!-- Estado vacío -->
      <div
        v-if="!loading && pagedRows.length === 0"
        class="py-16 flex flex-col items-center gap-3 text-text-3"
      >
        <Inbox class="w-10 h-10 opacity-40" />
        <p class="text-[14px]">No se encontraron proveedores</p>
      </div>

      <!-- Paginación -->
      <div v-if="!loading && totalPages > 1" class="sp-pagination">
        <span class="pg-info">
          {{ (currentPage - 1) * Number(pageSize) + 1 }}–{{ Math.min(currentPage * Number(pageSize), filteredData.length) }}
          de {{ filteredData.length }}
        </span>
        <div class="pg-pages">
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage = 1">
            <ChevronsLeft :size="14" />
          </button>
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">
            <ChevronLeft :size="14" />
          </button>
          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="pg-ellipsis">…</span>
            <button
              v-else
              class="pg-btn pg-num"
              :class="{ 'pg-active': p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</button>
          </template>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">
            <ChevronRight :size="14" />
          </button>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">
            <ChevronsRight :size="14" />
          </button>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
/* ─── Page ──────────────────────────────────────────────── */
.sp-page { width: 100%; }

/* ─── Header ────────────────────────────────────────────── */
.sp-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 0 0 4px;
  line-height: 1.2;
}
.sp-subtitle {
  font-size: 13px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
  margin: 0;
}
.sp-head-actions { display: flex; align-items: center; gap: 8px; }
.per-page-wrap   { display: flex; align-items: center; gap: 8px; }
.per-page-lbl    { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; white-space: nowrap; }

/* ─── Input ─────────────────────────────────────────────── */
.sp-input {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  appearance: auto;
}
.sp-input:focus {
  border-color: var(--primary, #054EAF);
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.1);
}
.sp-input::placeholder { color: var(--text-3, #94A3B8); }
.sp-input--sm { width: 70px; text-align: center; }

/* ─── Tabla ─────────────────────────────────────────────── */
.sp-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

/* ─── Head ──────────────────────────────────────────────── */
.sp-head-row { background: #EBF3FC; }

.sp-th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2, #64748B);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #E2EBF6;
}
.sp-th-center { text-align: center; }

/* ─── Filas ─────────────────────────────────────────────── */
.sp-row {
  background: #FFFFFF;
  cursor: pointer;
  transition: background 0.15s ease;
}
.sp-row:hover { background: #F0F7FF; }

.sp-td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  border-bottom: 1px solid #EBF3FC;
  vertical-align: middle;
  white-space: nowrap;
}
.sp-td-center { text-align: center; }

.sp-idx  { font-size: 12px; color: var(--text-3, #94A3B8); font-weight: 500; }
.sp-name { font-weight: 600; }

/* ─── Chevron toggle ────────────────────────────────────── */
.sp-chevron {
  color: var(--text-3, #94A3B8);
  transition: transform 0.2s ease, color 0.15s ease;
  display: block;
  margin: 0 auto;
}
.sp-chevron-open {
  transform: rotate(180deg);
  color: #054EAF;
}

/* ─── Fila expandida ────────────────────────────────────── */
.sp-exp-td {
  padding: 0 !important;
  border-bottom: 1px solid #EBF3FC;
}

.sp-exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}
.sp-exp-open { max-height: 300px; }

.sp-exp-inner {
  background: #F8FBFF;
  border-left: 3px solid #054EAF;
  padding: 16px 24px;
}

.sp-exp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
}
@media (max-width: 768px) { .sp-exp-grid { grid-template-columns: repeat(2, 1fr); } }

.sp-exp-field { display: flex; flex-direction: column; gap: 4px; }
.sp-exp-field--wide { grid-column: span 2; }

.sp-exp-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
}
.sp-exp-val {
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  white-space: normal;
  word-break: break-word;
}

/* ─── Skeleton ──────────────────────────────────────────── */
.sk-box {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Paginación ────────────────────────────────────────── */
.sp-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #EBF3FC;
  flex-wrap: wrap;
  gap: 8px;
}
.pg-info { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; }
.pg-pages { display: flex; align-items: center; gap: 4px; }
.pg-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: #FFFFFF;
  color: #64748B;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
}
.pg-btn:hover:not(:disabled) { background: #EEF4FF; color: #054EAF; border-color: #BFDBFE; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-active { background: #054EAF !important; color: #FFFFFF !important; border-color: #054EAF !important; font-weight: 600; }
.pg-ellipsis { color: #94A3B8; font-size: 13px; padding: 0 4px; }
</style>
