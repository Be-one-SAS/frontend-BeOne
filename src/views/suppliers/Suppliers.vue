<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/suppliers.service'
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import ConfirmModal from '@/components/modal/ConfirmModal.vue'
import { useActionAccess } from '@/composables/useActionAccess'
import {
  ChevronDown, Inbox, Plus, Pencil, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-vue-next'

const { canDo } = useActionAccess()

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
async function fetchSuppliers() {
  loading.value = true
  try {
    const res = await listSuppliers()
    data.value = res.data
  } catch (error) {
    console.error('Error al cargar proveedores:', error)
  } finally {
    loading.value = false
  }
}
onMounted(fetchSuppliers)

/* ─── crear / editar ────────────────────────────────────── */
const EMPTY_FORM = {
  name: '', email: '', phoneOne: '', phoneThwo: '', category: '',
  contactPerson: '', address: '', city: '', country: '',
  zoneOperation: '', website: '', portfolioLink: '', reliability: '', notes: '',
}

const formModal   = ref(false)
const isEditing   = ref(false)
const editingId   = ref(null)
const form        = reactive({ ...EMPTY_FORM })
const formSaving  = ref(false)
const formError   = ref('')

function openCreate() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, EMPTY_FORM)
  formError.value = ''
  formModal.value = true
}

function openEdit(row) {
  isEditing.value = true
  editingId.value = row.id
  Object.assign(form, EMPTY_FORM, row)
  formError.value = ''
  formModal.value = true
}

function closeForm() {
  formModal.value = false
}

async function saveForm() {
  if (!form.name?.trim()) {
    formError.value = 'El nombre es obligatorio.'
    return
  }
  formSaving.value = true
  formError.value = ''
  try {
    const payload = { ...form }
    if (isEditing.value) {
      await updateSupplier(editingId.value, payload)
    } else {
      await createSupplier(payload)
    }
    formModal.value = false
    await fetchSuppliers()
  } catch (error) {
    formError.value = error?.response?.data?.message || 'Error al guardar el proveedor.'
  } finally {
    formSaving.value = false
  }
}

/* ─── eliminar ──────────────────────────────────────────── */
const deleteTarget  = ref(null)
const deleteLoading = ref(false)

function confirmDelete(row) { deleteTarget.value = row }

async function executeDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await deleteSupplier(deleteTarget.value.id)
    data.value = data.value.filter(s => s.id !== deleteTarget.value.id)
    deleteTarget.value = null
  } catch (error) {
    console.error('Error al eliminar proveedor:', error)
  } finally {
    deleteLoading.value = false
  }
}
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
        <button v-if="canDo('ProveedorCrear', ['ADMINISTRADOR'])" class="sp-btn-add" @click="openCreate">
          <Plus :size="14" /> Nuevo proveedor
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- FILTROS                                    -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(39,200,216,.06)] grid grid-cols-1 gap-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nombre, categoría, correo…"
        class="sp-input"
      />
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA                                      -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(39,200,216,.06),_0_4px_16px_rgba(39,200,216,.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="sp-table">

          <!-- HEAD -->
          <thead>
            <tr class="sp-head-row">
              <th class="sp-th" style="width:36px"></th>
              <th class="sp-th sp-th-center" style="width:44px">#</th>
              <th class="sp-th">Nombre</th>
              <th class="sp-th">Categoría</th>
              <th class="sp-th">Contacto</th>
              <th class="sp-th">Correo</th>
              <th class="sp-th">Teléfono</th>
              <th class="sp-th">Zona de operación</th>
              <th class="sp-th sp-th-center" style="width:90px">Acciones</th>
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
                <td class="sp-td"><div class="sk-box" style="width:120px"></div></td>
                <td class="sp-td"><div class="sk-box" style="width:180px"></div></td>
                <td class="sp-td"><div class="sk-box" style="width:110px"></div></td>
                <td class="sp-td"><div class="sk-box" style="width:130px"></div></td>
                <td class="sp-td"></td>
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

                  <!-- Categoría -->
                  <td class="sp-td">{{ row.category || '—' }}</td>

                  <!-- Contacto -->
                  <td class="sp-td">{{ row.contactPerson || '—' }}</td>

                  <!-- Correo -->
                  <td class="sp-td">{{ row.email || '—' }}</td>

                  <!-- Teléfono -->
                  <td class="sp-td">{{ row.phoneOne || '—' }}</td>

                  <!-- Zona -->
                  <td class="sp-td">{{ row.zoneOperation || '—' }}</td>

                  <!-- Acciones -->
                  <td class="sp-td sp-td-center" @click.stop>
                    <div class="sp-actions">
                      <button v-if="canDo('ProveedorEditar', ['ADMINISTRADOR'])" class="sp-action-btn sp-action-edit" title="Editar" @click="openEdit(row)">
                        <Pencil :size="13" />
                      </button>
                      <button v-if="canDo('ProveedorEliminar', ['ADMINISTRADOR'])" class="sp-action-btn sp-action-del" title="Eliminar" @click="confirmDelete(row)">
                        <Trash2 :size="13" />
                      </button>
                    </div>
                  </td>

                </tr>

                <!-- ── Fila expandida (siempre en DOM, transición max-height) ── -->
                <tr class="sp-exp-tr">
                  <td colspan="9" class="sp-exp-td">
                    <div
                      class="sp-exp-panel"
                      :class="{ 'sp-exp-open': expandedRow === row.id }"
                    >
                      <div class="sp-exp-inner">
                        <div class="sp-exp-grid">

                          <div v-if="row.phoneThwo" class="sp-exp-field">
                            <span class="sp-exp-label">Teléfono 2</span>
                            <span class="sp-exp-val">{{ row.phoneThwo }}</span>
                          </div>
                          <div v-if="row.city" class="sp-exp-field">
                            <span class="sp-exp-label">Ciudad</span>
                            <span class="sp-exp-val">{{ row.city }}</span>
                          </div>
                          <div v-if="row.country" class="sp-exp-field">
                            <span class="sp-exp-label">País</span>
                            <span class="sp-exp-val">{{ row.country }}</span>
                          </div>
                          <div v-if="row.reliability" class="sp-exp-field">
                            <span class="sp-exp-label">Confiabilidad</span>
                            <span class="sp-exp-val">{{ row.reliability }}</span>
                          </div>
                          <div v-if="row.address" class="sp-exp-field sp-exp-field--wide">
                            <span class="sp-exp-label">Dirección</span>
                            <span class="sp-exp-val">{{ row.address }}</span>
                          </div>
                          <div v-if="row.website" class="sp-exp-field">
                            <span class="sp-exp-label">Sitio web</span>
                            <span class="sp-exp-val">
                              <a :href="row.website" target="_blank" rel="noopener" @click.stop>{{ row.website }}</a>
                            </span>
                          </div>
                          <div v-if="row.portfolioLink" class="sp-exp-field">
                            <span class="sp-exp-label">Portafolio</span>
                            <span class="sp-exp-val">
                              <a :href="row.portfolioLink" target="_blank" rel="noopener" @click.stop>Ver portafolio</a>
                            </span>
                          </div>
                          <div v-if="row.notes" class="sp-exp-field sp-exp-field--wide">
                            <span class="sp-exp-label">Notas</span>
                            <span class="sp-exp-val">{{ row.notes }}</span>
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
      <div class="sp-pagination">
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

  <!-- ══════════════════════════════════════════ -->
  <!-- MODAL: CREAR / EDITAR                       -->
  <!-- ══════════════════════════════════════════ -->
  <ModalReutilizable :show="formModal" @close="closeForm">
    <div class="sp-form">
      <h3 class="sp-form-title">{{ isEditing ? 'Editar proveedor' : 'Nuevo proveedor' }}</h3>

      <div class="sp-form-grid">
        <div class="sp-form-field sp-form-field--full">
          <label class="sp-form-lbl">Nombre <span class="sp-req">*</span></label>
          <input v-model="form.name" type="text" class="sp-form-input" placeholder="Ej: Sonido y Luces S.A.S" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Categoría</label>
          <input v-model="form.category" type="text" class="sp-form-input" placeholder="Ej: Audio y video" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Persona de contacto</label>
          <input v-model="form.contactPerson" type="text" class="sp-form-input" placeholder="Ej: Carlos Gómez" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Correo</label>
          <input v-model="form.email" type="email" class="sp-form-input" placeholder="Ej: contacto@proveedor.com" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Teléfono 1</label>
          <input v-model="form.phoneOne" type="text" class="sp-form-input" placeholder="Ej: 3001234567" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Teléfono 2</label>
          <input v-model="form.phoneThwo" type="text" class="sp-form-input" placeholder="Ej: 3007654321" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Zona de operación</label>
          <input v-model="form.zoneOperation" type="text" class="sp-form-input" placeholder="Ej: Antioquia" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Ciudad</label>
          <input v-model="form.city" type="text" class="sp-form-input" placeholder="Ej: Medellín" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">País</label>
          <input v-model="form.country" type="text" class="sp-form-input" placeholder="Ej: Colombia" />
        </div>
        <div class="sp-form-field sp-form-field--full">
          <label class="sp-form-lbl">Dirección</label>
          <input v-model="form.address" type="text" class="sp-form-input" placeholder="Ej: Cra 43A #1-50, Medellín" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Sitio web</label>
          <input v-model="form.website" type="text" class="sp-form-input" placeholder="Ej: https://proveedor.com" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Link de portafolio</label>
          <input v-model="form.portfolioLink" type="text" class="sp-form-input" placeholder="Ej: https://drive.google.com/…" />
        </div>
        <div class="sp-form-field">
          <label class="sp-form-lbl">Confiabilidad</label>
          <input v-model="form.reliability" type="text" class="sp-form-input" placeholder="Ej: Alta" />
        </div>
        <div class="sp-form-field sp-form-field--full">
          <label class="sp-form-lbl">Notas</label>
          <textarea v-model="form.notes" class="sp-form-input sp-form-textarea" rows="3" placeholder="Observaciones sobre este proveedor…"></textarea>
        </div>
      </div>

      <p v-if="formError" class="sp-form-error">{{ formError }}</p>

      <div class="sp-form-actions">
        <button class="sp-btn-cancel" :disabled="formSaving" @click="closeForm">Cancelar</button>
        <button class="sp-btn-save" :disabled="formSaving" @click="saveForm">
          {{ formSaving ? 'Guardando…' : (isEditing ? 'Guardar cambios' : 'Crear proveedor') }}
        </button>
      </div>
    </div>
  </ModalReutilizable>

  <!-- ══════════════════════════════════════════ -->
  <!-- CONFIRMAR ELIMINAR                          -->
  <!-- ══════════════════════════════════════════ -->
  <ConfirmModal
    :show="!!deleteTarget"
    title="¿Eliminar proveedor?"
    :message="`Vas a eliminar a «${deleteTarget?.name}» de forma permanente.`"
    confirm-label="Sí, eliminar"
    cancel-label="Cancelar"
    variant="danger"
    @confirm="executeDelete"
    @cancel="deleteTarget = null"
  />
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
  border-color: var(--primary, #27C8D8);
  box-shadow: 0 0 0 3px rgba(39,200,216, 0.1);
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
.sp-head-row { background: #F0FAFB; }

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
  border-bottom: 1px solid #F0FAFB;
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
  color: #27C8D8;
}

/* ─── Fila expandida ────────────────────────────────────── */
.sp-exp-td {
  padding: 0 !important;
  border-bottom: 1px solid #F0FAFB;
}

.sp-exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}
.sp-exp-open { max-height: 300px; }

.sp-exp-inner {
  background: #F8FBFF;
  border-left: 3px solid #27C8D8;
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
  border-top: 1px solid #F0FAFB;
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
.pg-btn:hover:not(:disabled) { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-active { background: #27C8D8 !important; color: #FFFFFF !important; border-color: #27C8D8 !important; font-weight: 600; }
.pg-ellipsis { color: #94A3B8; font-size: 13px; padding: 0 4px; }

/* ─── Botón agregar ─────────────────────────────────────── */
.sp-btn-add {
  display: flex; align-items: center; gap: 6px;
  height: 37px; padding: 0 16px; border-radius: 999px; border: none;
  background: #27C8D8; color: #fff; font-size: 13px; font-weight: 600;
  font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.15s;
  white-space: nowrap;
}
.sp-btn-add:hover { background: #1BAEBB; }

/* ─── Acciones de fila ──────────────────────────────────── */
.sp-actions { display: flex; align-items: center; justify-content: center; gap: 6px; }
.sp-action-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: background 0.15s;
}
.sp-action-edit { background: #E0F9FA; color: #27C8D8; }
.sp-action-edit:hover { background: #CCEFF2; }
.sp-action-del  { background: #FEE2E2; color: #B91C1C; }
.sp-action-del:hover  { background: #FECACA; }

/* ─── Formulario crear/editar ───────────────────────────── */
.sp-form { width: min(640px, 90vw); max-height: 80vh; overflow-y: auto; padding: 4px; }
.sp-form-title {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700;
  color: #0F1A2E; margin: 0 0 16px;
}
.sp-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 16px; }
.sp-form-field { display: flex; flex-direction: column; gap: 5px; }
.sp-form-field--full { grid-column: 1 / -1; }
.sp-form-lbl { font-size: 12px; font-weight: 600; color: #475569; font-family: 'Inter', sans-serif; }
.sp-req { color: #B91C1C; }
.sp-form-input {
  width: 100%; background: #F8FAFC; border: 1px solid #E2EBF6; border-radius: 8px;
  padding: 9px 12px; font-size: 13px; color: #0F1A2E; font-family: 'Inter', sans-serif;
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.sp-form-input:focus { border-color: #27C8D8; box-shadow: 0 0 0 3px rgba(39,200,216,0.1); }
.sp-form-textarea { resize: vertical; }
.sp-form-error { font-size: 12px; color: #B91C1C; margin: 14px 0 0; }
.sp-form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.sp-btn-cancel {
  height: 38px; padding: 0 18px; border-radius: 8px; border: 1px solid #E2EBF6;
  background: #F8FAFC; color: #475569; font-size: 13px; font-weight: 600;
  font-family: 'Inter', sans-serif; cursor: pointer;
}
.sp-btn-cancel:hover:not(:disabled) { background: #F1F5F9; }
.sp-btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.sp-btn-save {
  height: 38px; padding: 0 20px; border-radius: 8px; border: none;
  background: #27C8D8; color: #fff; font-size: 13px; font-weight: 600;
  font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.15s, opacity 0.15s;
}
.sp-btn-save:hover:not(:disabled) { background: #1BAEBB; }
.sp-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 640px) {
  .sp-form-grid { grid-template-columns: 1fr; }
}
</style>
