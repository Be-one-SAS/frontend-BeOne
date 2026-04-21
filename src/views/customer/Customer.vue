<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getCustomer } from '../../services/customer.service'
import ModalReutilizable from '../../components/modal/ModalReutilizable.vue'
import { updateClient, createClient } from '../../services/suppliers.service'
import {
  ChevronDown, Inbox, Pencil,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-vue-next'

const data    = ref([])
const loading = ref(true)

const searchQuery = ref('')
const typeFilter  = ref('')
const pageSize    = ref(25)

const showModal       = ref(false)
const showCreateModal = ref(false)
const selectedCustomer = ref(null)

const nuevoCliente = ref({
  name:        undefined,
  nit:         undefined,
  email:       undefined,
  phone:       undefined,
  document:    undefined,
  contactName: undefined,
  reference:   undefined,
  type:        'INDIRECTO',
})

/* ─── accordion ─────────────────────────────────────────── */
const expandedRow = ref(null)
const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

/* ─── filter ────────────────────────────────────────────── */
const filteredData = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return data.value.filter(item => {
    const matchSearch = !q || Object.values(item).some(v => String(v).toLowerCase().includes(q))
    const matchType   = !typeFilter.value || item.type === typeFilter.value
    return matchSearch && matchType
  })
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

/* ─── badge helpers ─────────────────────────────────────── */
const typeClass = (val) => val === 'DIRECTO' ? 'badge badge--blue' : 'badge badge--slate'

/* ─── edit modal ────────────────────────────────────────── */
const openCustomerModal = (row) => {
  selectedCustomer.value         = { ...row }
  nuevoCliente.value.name        = row.name        || ''
  nuevoCliente.value.nit         = row.nit         || ''
  nuevoCliente.value.email       = row.email       || ''
  nuevoCliente.value.phone       = row.phoneOne    || ''
  nuevoCliente.value.document    = row.document    || ''
  nuevoCliente.value.contactName = row.contactName || ''
  nuevoCliente.value.reference   = row.reference   || ''
  nuevoCliente.value.type        = row.type
  showModal.value = true
}

const closeModal = () => {
  showModal.value        = false
  selectedCustomer.value = null
}

/* ─── create modal ──────────────────────────────────────── */
const openCreateModal = () => {
  nuevoCliente.value = {
    name: undefined, nit: undefined, email: undefined,
    phone: undefined, document: undefined, contactName: undefined,
    reference: undefined, type: 'INDIRECTO',
  }
  showCreateModal.value = true
}

const openNewCustomerModal = async () => {
  try {
    await createClient({
      name:        nuevoCliente.value.name,
      nit:         nuevoCliente.value.nit,
      email:       nuevoCliente.value.email,
      phone:       nuevoCliente.value.phone,
      document:    nuevoCliente.value.document,
      contactName: nuevoCliente.value.contactName,
      reference:   nuevoCliente.value.reference,
      type:        nuevoCliente.value.type,
    })
    showCreateModal.value = false
    const customer = await getCustomer()
    data.value = customer.data
  } catch (error) {
    console.error('Error al crear el cliente:', error)
  }
}

/* ─── update ────────────────────────────────────────────── */
async function actualizarCliente() {
  try {
    const response = await updateClient(selectedCustomer.value.id, {
      name:        nuevoCliente.value.name,
      nit:         nuevoCliente.value.nit,
      email:       nuevoCliente.value.email,
      phone:       nuevoCliente.value.phone,
      document:    nuevoCliente.value.document,
      contactName: nuevoCliente.value.contactName,
      reference:   nuevoCliente.value.reference,
      type:        nuevoCliente.value.type,
    })
    console.log('Cliente actualizado:', response.data)
    closeModal()
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
  }
}

/* ─── fetch ─────────────────────────────────────────────── */
onMounted(async () => {
  try {
    const customer = await getCustomer()
    data.value = customer.data
  } catch (error) {
    console.error('Error al cargar clientes:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="cu-page">

    <!-- ══════════════════════════════════════════ -->
    <!-- HEADER                                     -->
    <!-- ══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="cu-title">Clientes</h2>
        <p class="cu-subtitle">{{ filteredData.length }} clientes encontrados</p>
      </div>
      <div class="cu-head-actions">
        <div class="per-page-wrap">
          <span class="per-page-lbl">Por página</span>
          <select v-model="pageSize" class="cu-input cu-input--sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
        <button class="btn-new" @click="openCreateModal">
          + Nuevo cliente
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- FILTROS                                    -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(5,78,175,.06)] grid grid-cols-1 md:grid-cols-2 gap-4">

      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nombre, correo, NIT…"
        class="cu-input"
      />

      <select v-model="typeFilter" class="cu-input">
        <option value="">Todos los tipos</option>
        <option value="DIRECTO">Directo</option>
        <option value="INDIRECTO">Indirecto</option>
      </select>

    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA                                      -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(5,78,175,.06),_0_4px_16px_rgba(5,78,175,.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="cu-table">

          <!-- HEAD -->
          <thead>
            <tr class="cu-head-row">
              <th class="cu-th" style="width:36px"></th>
              <th class="cu-th cu-th-center" style="width:44px">#</th>
              <th class="cu-th">Nombre</th>
              <th class="cu-th">Tipo</th>
              <th class="cu-th">Correo</th>
              <th class="cu-th">Teléfono</th>
              <th class="cu-th">NIT / Identificación</th>
              <th class="cu-th" style="width:90px">Acciones</th>
            </tr>
          </thead>

          <!-- BODY -->
          <tbody>

            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="n in 6" :key="`sk-${n}`" class="cu-row">
                <td class="cu-td"></td>
                <td class="cu-td"><div class="sk-box" style="width:28px"></div></td>
                <td class="cu-td"><div class="sk-box" style="width:150px"></div></td>
                <td class="cu-td"><div class="sk-box" style="width:70px"></div></td>
                <td class="cu-td"><div class="sk-box" style="width:160px"></div></td>
                <td class="cu-td"><div class="sk-box" style="width:100px"></div></td>
                <td class="cu-td"><div class="sk-box" style="width:110px"></div></td>
                <td class="cu-td"><div class="sk-box" style="width:50px"></div></td>
              </tr>
            </template>

            <!-- Filas reales -->
            <template v-else>
              <template v-for="(row, index) in pagedRows" :key="row.id">

                <!-- ── Fila principal ── -->
                <tr class="cu-row" @click="toggleRow(row.id)">

                  <!-- Chevron -->
                  <td class="cu-td cu-td-center">
                    <ChevronDown
                      :size="14"
                      class="cu-chevron"
                      :class="{ 'cu-chevron-open': expandedRow === row.id }"
                    />
                  </td>

                  <!-- # -->
                  <td class="cu-td cu-td-center cu-idx">
                    {{ index + 1 + (currentPage - 1) * Number(pageSize) }}
                  </td>

                  <!-- Nombre -->
                  <td class="cu-td">
                    <div class="cu-name-cell">
                      <span class="cu-name">{{ row.name || '—' }}</span>
                      <span v-if="row.contactName" class="cu-sub">{{ row.contactName }}</span>
                    </div>
                  </td>

                  <!-- Tipo -->
                  <td class="cu-td">
                    <span :class="typeClass(row.type)">{{ row.type || '—' }}</span>
                  </td>

                  <!-- Correo -->
                  <td class="cu-td">{{ row.email || '—' }}</td>

                  <!-- Teléfono -->
                  <td class="cu-td">{{ row.phoneOne || '—' }}</td>

                  <!-- NIT -->
                  <td class="cu-td">{{ row.nit || '—' }}</td>

                  <!-- Acciones — @click.stop evita el toggle -->
                  <td class="cu-td" @click.stop>
                    <button class="act-btn act-edit" @click.stop="openCustomerModal(row)">
                      <Pencil :size="12" /> Editar
                    </button>
                  </td>
                </tr>

                <!-- ── Fila expandida (siempre en DOM, transición max-height) ── -->
                <tr class="cu-exp-tr">
                  <td colspan="8" class="cu-exp-td">
                    <div
                      class="cu-exp-panel"
                      :class="{ 'cu-exp-open': expandedRow === row.id }"
                    >
                      <div class="cu-exp-inner">
                        <div class="cu-exp-grid">

                          <div v-if="row.phoneTwo" class="cu-exp-field">
                            <span class="cu-exp-label">Teléfono 2</span>
                            <span class="cu-exp-val">{{ row.phoneTwo }}</span>
                          </div>
                          <div v-if="row.address" class="cu-exp-field">
                            <span class="cu-exp-label">Dirección</span>
                            <span class="cu-exp-val">{{ row.address }}</span>
                          </div>
                          <div v-if="row.city" class="cu-exp-field">
                            <span class="cu-exp-label">Ciudad</span>
                            <span class="cu-exp-val">{{ row.city }}</span>
                          </div>
                          <div v-if="row.document" class="cu-exp-field">
                            <span class="cu-exp-label">Documento</span>
                            <span class="cu-exp-val">{{ row.document }}</span>
                          </div>
                          <div v-if="row.reference" class="cu-exp-field cu-exp-field--wide">
                            <span class="cu-exp-label">Referencia</span>
                            <span class="cu-exp-val">{{ row.reference }}</span>
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
        <p class="text-[14px]">No se encontraron clientes</p>
      </div>

      <!-- Paginación -->
      <div v-if="!loading && totalPages > 1" class="cu-pagination">
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

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL: Editar cliente                      -->
    <!-- ══════════════════════════════════════════ -->
    <ModalReutilizable :show="showModal" @close="closeModal">
      <div>
        <h2 class="modal-title">Editar cliente</h2>
        <div class="modal-form">
          <input v-model="nuevoCliente.name"        placeholder="Nombre"              class="cu-input" />
          <input v-model="nuevoCliente.nit"         placeholder="NIT"                 class="cu-input" />
          <input v-model="nuevoCliente.email"       placeholder="Correo electrónico"  class="cu-input" type="email" />
          <input v-model="nuevoCliente.phone"       placeholder="Teléfono"            class="cu-input" />
          <input v-model="nuevoCliente.document"    placeholder="Documento"           class="cu-input" />
          <input v-model="nuevoCliente.contactName" placeholder="Nombre de contacto"  class="cu-input" />
          <input v-model="nuevoCliente.reference"   placeholder="Referencia"          class="cu-input" />
          <select v-model="nuevoCliente.type"       class="cu-input">
            <option value="DIRECTO">Directo</option>
            <option value="INDIRECTO">Indirecto</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button
            @click="closeModal"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2EBF6] rounded-[8px] hover:bg-[#E2EBF6] transition"
          >Cancelar</button>
          <button
            @click="actualizarCliente"
            :disabled="!nuevoCliente.name"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#054EAF] text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-[#03368A] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >Guardar cambios</button>
        </div>
      </div>
    </ModalReutilizable>

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL: Nuevo cliente                       -->
    <!-- ══════════════════════════════════════════ -->
    <ModalReutilizable :show="showCreateModal" @close="showCreateModal = false">
      <div>
        <h2 class="modal-title">Nuevo cliente</h2>
        <div class="modal-form">
          <input v-model="nuevoCliente.name"        placeholder="Nombre"              class="cu-input" />
          <input v-model="nuevoCliente.nit"         placeholder="NIT"                 class="cu-input" type="number" />
          <input v-model="nuevoCliente.email"       placeholder="Correo electrónico"  class="cu-input" type="email" />
          <input v-model="nuevoCliente.phone"       placeholder="Teléfono"            class="cu-input" />
          <input v-model="nuevoCliente.document"    placeholder="Documento"           class="cu-input" />
          <input v-model="nuevoCliente.contactName" placeholder="Nombre de contacto"  class="cu-input" />
          <input v-model="nuevoCliente.reference"   placeholder="Referencia / Nota"   class="cu-input" />
          <select v-model="nuevoCliente.type"       class="cu-input">
            <option value="DIRECTO">Directo</option>
            <option value="INDIRECTO">Indirecto</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button
            @click="showCreateModal = false"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2EBF6] rounded-[8px] hover:bg-[#E2EBF6] transition"
          >Cancelar</button>
          <button
            @click="openNewCustomerModal"
            :disabled="!nuevoCliente.name"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#054EAF] text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-[#03368A] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >Crear cliente</button>
        </div>
      </div>
    </ModalReutilizable>

  </div>
</template>

<style scoped>
/* ─── Page ──────────────────────────────────────────────── */
.cu-page { width: 100%; }

/* ─── Header ────────────────────────────────────────────── */
.cu-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 0 0 4px;
  line-height: 1.2;
}
.cu-subtitle {
  font-size: 13px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
  margin: 0;
}
.cu-head-actions { display: flex; align-items: center; gap: 8px; }

.btn-new {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #054EAF;
  color: #fff;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  transition: background 0.15s;
}
.btn-new:hover { background: #03368A; }

.per-page-wrap { display: flex; align-items: center; gap: 8px; }
.per-page-lbl  { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; white-space: nowrap; }

/* ─── Inputs / selects ──────────────────────────────────── */
.cu-input {
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
.cu-input:focus {
  border-color: var(--primary, #054EAF);
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.1);
}
.cu-input::placeholder { color: var(--text-3, #94A3B8); }
.cu-input--sm { width: 70px; text-align: center; }

/* ─── Tabla ─────────────────────────────────────────────── */
.cu-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

/* ─── Head ──────────────────────────────────────────────── */
.cu-head-row { background: #EBF3FC; }

.cu-th {
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
.cu-th-center { text-align: center; }

/* ─── Filas ─────────────────────────────────────────────── */
.cu-row {
  background: #FFFFFF;
  cursor: pointer;
  transition: background 0.15s ease;
}
.cu-row:hover { background: #F0F7FF; }

.cu-td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  border-bottom: 1px solid #EBF3FC;
  vertical-align: middle;
  white-space: nowrap;
}
.cu-td-center { text-align: center; }

.cu-idx { font-size: 12px; color: var(--text-3, #94A3B8); font-weight: 500; }

/* ─── Chevron toggle ────────────────────────────────────── */
.cu-chevron {
  color: var(--text-3, #94A3B8);
  transition: transform 0.2s ease, color 0.15s ease;
  display: block;
  margin: 0 auto;
}
.cu-chevron-open {
  transform: rotate(180deg);
  color: #054EAF;
}

/* ─── Cell: nombre ──────────────────────────────────────── */
.cu-name-cell { display: flex; flex-direction: column; gap: 2px; }
.cu-name      { font-weight: 600; font-size: 13px; color: var(--text-1, #0F1A2E); }
.cu-sub       { font-size: 11px; color: var(--text-3, #94A3B8); }

/* ─── Badges ────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
.badge--blue  { background: #DBEAFE; color: #1D4ED8; }
.badge--slate { background: #F1F5F9; color: #64748B; }

/* ─── Botones de acción ─────────────────────────────────── */
.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
  line-height: 1;
}
.act-edit       { background: #FEF3C7; color: #B45309; }
.act-edit:hover { background: #FDE68A; }

/* ─── Fila expandida ────────────────────────────────────── */
.cu-exp-td {
  padding: 0 !important;
  border-bottom: 1px solid #EBF3FC;
}

.cu-exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}
.cu-exp-open { max-height: 400px; }

.cu-exp-inner {
  background: #F8FBFF;
  border-left: 3px solid #054EAF;
  padding: 16px 24px;
}

.cu-exp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
}
@media (max-width: 768px) { .cu-exp-grid { grid-template-columns: repeat(2, 1fr); } }

.cu-exp-field { display: flex; flex-direction: column; gap: 4px; }
.cu-exp-field--wide { grid-column: span 2; }

.cu-exp-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
}
.cu-exp-val {
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
.cu-pagination {
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

/* ─── Modal ─────────────────────────────────────────────── */
.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 16px;
}
.modal-form { display: flex; flex-direction: column; gap: 8px; }
</style>
