<template>
  <div class="bt-wrap">

    <!-- ── Tabla ──────────────────────────────────────── -->
    <div class="bt-card">
      <div class="bt-scroll">
        <table class="bt-table">

          <!-- HEAD -->
          <thead class="bt-head">
            <tr>
              <!-- Checkbox "select all" -->
              <th v-if="selectable" class="bt-th bt-th-check">
                <input
                  type="checkbox"
                  class="bt-checkbox"
                  :checked="allSelected"
                  :indeterminate="someSelected"
                  @change="toggleAll"
                />
              </th>
              <!-- Expand placeholder -->
              <th v-if="expandable" class="bt-th bt-th-exp"></th>
              <!-- Columnas -->
              <th
                v-for="col in columns"
                :key="col.key"
                class="bt-th"
                :style="col.width ? `width:${col.width}` : ''"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>

          <!-- BODY -->
          <tbody class="bt-body">

            <!-- ── Skeleton ──────────────────────────── -->
            <template v-if="loading">
              <tr v-for="n in skeletonRows" :key="`sk-${n}`" class="bt-row">
                <td v-if="selectable" class="bt-td bt-td-check">
                  <div class="sk-box sk-check"></div>
                </td>
                <td v-if="expandable" class="bt-td bt-td-exp"></td>
                <td v-for="col in columns" :key="col.key" class="bt-td">
                  <div class="sk-box" :style="`width:${skWidth()}`"></div>
                </td>
              </tr>
            </template>

            <!-- ── Empty state ──────────────────────── -->
            <template v-else-if="!rows.length">
              <tr>
                <td
                  :colspan="totalCols"
                  class="bt-td bt-empty"
                >
                  <div class="empty-wrap">
                    <Inbox :size="40" class="empty-icon" />
                    <p class="empty-text">{{ emptyText }}</p>
                  </div>
                </td>
              </tr>
            </template>

            <!-- ── Filas reales ─────────────────────── -->
            <template v-else>
              <template v-for="(row, rIdx) in pagedRows" :key="row.id ?? rIdx">

                <!-- Fila principal -->
                <tr
                  class="bt-row"
                  :class="{ 'bt-row-selected': isSelected(row), 'bt-row-clickable': !!$slots['row-click'] || true }"
                  @click="onRowClick(row)"
                >
                  <!-- Checkbox -->
                  <td v-if="selectable" class="bt-td bt-td-check" @click.stop>
                    <input
                      type="checkbox"
                      class="bt-checkbox"
                      :checked="isSelected(row)"
                      @change="toggleRow(row)"
                    />
                  </td>

                  <!-- Toggle expand -->
                  <td v-if="expandable" class="bt-td bt-td-exp" @click.stop="toggleExpand(row, rIdx)">
                    <ChevronDown
                      :size="14"
                      class="exp-icon"
                      :class="{ 'exp-open': expandedRows.has(rIdx) }"
                    />
                  </td>

                  <!-- Celdas -->
                  <td v-for="col in columns" :key="col.key" class="bt-td">
                    <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                      {{ row[col.key] }}
                    </slot>
                  </td>
                </tr>

                <!-- Fila expandida -->
                <tr v-if="expandable" class="bt-row-exp-wrapper" :key="`exp-${rIdx}`">
                  <td :colspan="totalCols" class="bt-td-exp-content" style="padding:0">
                    <div
                      class="exp-panel"
                      :class="{ 'exp-panel-open': expandedRows.has(rIdx) }"
                    >
                      <div class="exp-inner">
                        <slot name="expanded" :row="row" />
                      </div>
                    </div>
                  </td>
                </tr>

              </template>
            </template>

          </tbody>
        </table>
      </div>

      <!-- ── Paginación ──────────────────────────────── -->
      <div v-if="!loading && totalPages > 1" class="bt-pagination">
        <span class="pg-info">
          {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, rows.length) }}
          de {{ rows.length }}
        </span>
        <div class="pg-pages">
          <button
            class="pg-btn"
            :disabled="currentPage === 1"
            @click="currentPage = 1"
          ><ChevronsLeft :size="14" /></button>
          <button
            class="pg-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          ><ChevronLeft :size="14" /></button>

          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="pg-ellipsis">…</span>
            <button
              v-else
              class="pg-btn pg-num"
              :class="{ 'pg-active': p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</button>
          </template>

          <button
            class="pg-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          ><ChevronRight :size="14" /></button>
          <button
            class="pg-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage = totalPages"
          ><ChevronsRight :size="14" /></button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Inbox, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
} from 'lucide-vue-next'

// ── Props ────────────────────────────────────────────────
const props = defineProps({
  columns:     { type: Array,   default: () => [] },   // [{ key, label, width? }]
  rows:        { type: Array,   default: () => [] },
  loading:     { type: Boolean, default: false },
  emptyText:   { type: String,  default: 'No hay datos disponibles' },
  expandable:  { type: Boolean, default: false },
  selectable:  { type: Boolean, default: false },
  pageSize:    { type: Number,  default: 10 },
})

// ── Emits ────────────────────────────────────────────────
const emit = defineEmits(['row-click', 'action', 'expand', 'select'])

// ── Paginación ───────────────────────────────────────────
const currentPage = ref(1)
watch(() => props.rows, () => { currentPage.value = 1 })

const totalPages = computed(() => Math.ceil(props.rows.length / props.pageSize))

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return props.rows.slice(start, start + props.pageSize)
})

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

// ── Expandible ───────────────────────────────────────────
const expandedRows = ref(new Set())

const toggleExpand = (row, idx) => {
  if (expandedRows.value.has(idx)) {
    expandedRows.value.delete(idx)
  } else {
    expandedRows.value.add(idx)
  }
  expandedRows.value = new Set(expandedRows.value) // trigger reactivity
  emit('expand', { row, expanded: expandedRows.value.has(idx) })
}

// Reset expandidos al cambiar de página
watch(currentPage, () => { expandedRows.value = new Set() })

// ── Selección ────────────────────────────────────────────
const selectedRows = ref(new Set())

const isSelected   = (row) => selectedRows.value.has(row.id)
const allSelected  = computed(() => props.rows.length > 0 && props.rows.every(r => selectedRows.value.has(r.id)))
const someSelected = computed(() => props.rows.some(r => selectedRows.value.has(r.id)) && !allSelected.value)

const toggleRow = (row) => {
  const next = new Set(selectedRows.value)
  next.has(row.id) ? next.delete(row.id) : next.add(row.id)
  selectedRows.value = next
  emit('select', [...selectedRows.value])
}

const toggleAll = () => {
  if (allSelected.value) {
    selectedRows.value = new Set()
  } else {
    selectedRows.value = new Set(props.rows.map(r => r.id))
  }
  emit('select', [...selectedRows.value])
}

// ── Click fila ───────────────────────────────────────────
const onRowClick = (row) => emit('row-click', row)

// ── Helpers ──────────────────────────────────────────────
const skeletonRows = 5
const totalCols = computed(() => {
  let n = props.columns.length
  if (props.selectable) n++
  if (props.expandable) n++
  return n
})
const skWidth = () => {
  const widths = ['40%', '55%', '70%', '45%', '60%']
  return widths[Math.floor(Math.random() * widths.length)]
}
</script>

<style scoped>
/* ─── Wrapper ───────────────────────────────────────── */
.bt-wrap { width: 100%; }

/* ─── Card / scroll ─────────────────────────────────── */
.bt-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid #EEF1F7;
  box-shadow: 0 2px 12px rgba(5, 78, 175, 0.06);
  overflow: hidden;
}

.bt-scroll { overflow-x: auto; }

/* ─── Tabla ─────────────────────────────────────────── */
.bt-table {
  width: 100%;
  min-width: max-content;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

/* ─── Head ──────────────────────────────────────────── */
.bt-head { background: #F8FAFC; }

.bt-th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  border-bottom: 1px solid #EEF1F7;
  text-align: left;
}

.bt-th-check,
.bt-th-exp {
  width: 40px;
  padding: 12px 8px 12px 16px;
}

/* ─── Body ──────────────────────────────────────────── */
.bt-body { }

.bt-row {
  transition: background 0.12s ease;
}

.bt-row:hover { background: #F8FAFC; }

.bt-row-selected { background: #EEF4FF; }

.bt-td {
  padding: 14px 16px;
  font-size: 13px;
  color: #0F1A2E;
  border-bottom: 1px solid #F1F5FA;
  vertical-align: middle;
  white-space: nowrap;
}

.bt-td-check,
.bt-td-exp {
  padding: 14px 8px 14px 16px;
  width: 40px;
}

/* ─── Checkbox ──────────────────────────────────────── */
.bt-checkbox {
  width: 15px;
  height: 15px;
  accent-color: #054EAF;
  cursor: pointer;
  border-radius: 4px;
}

/* ─── Expand icon ───────────────────────────────────── */
.exp-icon {
  color: #94A3B8;
  cursor: pointer;
  transition: transform 0.22s ease, color 0.15s ease;
  display: block;
}

.exp-open {
  transform: rotate(180deg);
  color: #054EAF;
}

/* ─── Panel expandido ───────────────────────────────── */
.exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.28s ease;
  background: #F8FAFC;
}

.exp-panel-open { max-height: 600px; }

.exp-inner {
  padding: 20px 24px;
  border-top: 1px solid #EEF1F7;
}

/* ─── Empty state ───────────────────────────────────── */
.bt-empty { padding: 48px 16px; text-align: center; }

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon { color: #CBD5E1; }

.empty-text {
  font-size: 13px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

/* ─── Skeleton ──────────────────────────────────────── */
.sk-box {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}

.sk-check { width: 15px; height: 15px; border-radius: 3px; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Paginación ────────────────────────────────────── */
.bt-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #F1F5FA;
  flex-wrap: wrap;
  gap: 8px;
}

.pg-info {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

.pg-pages {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pg-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #EEF1F7;
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

.pg-btn:hover:not(:disabled) {
  background: #EEF4FF;
  color: #054EAF;
  border-color: #BFDBFE;
}

.pg-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pg-active {
  background: #054EAF !important;
  color: #FFFFFF !important;
  border-color: #054EAF !important;
  font-weight: 600;
}

.pg-ellipsis {
  color: #94A3B8;
  font-size: 13px;
  padding: 0 4px;
}
</style>
