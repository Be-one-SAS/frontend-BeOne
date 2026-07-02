<template>
  <div class="aa-page">

    <!-- Header — oculto cuando está embebido dentro de Checkins.vue -->
    <div v-if="!embedded" class="aa-header">
      <div class="aa-header-left">
        <button class="aa-back-btn" @click="router.push('/operativa/checkins')">
          <ArrowLeft :size="16" />
        </button>
        <h1 class="aa-title">Aspectos de inspección</h1>
      </div>
      <button class="aa-add-btn" @click="openAdd">
        <Plus :size="15" /> Agregar aspecto
      </button>
    </div>

    <!-- Acciones cuando está embebido -->
    <div v-if="embedded" class="aa-embedded-actions">
      <button class="aa-add-btn" @click="openAdd">
        <Plus :size="15" /> Agregar aspecto
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="aa-loading">
      <Loader2 :size="22" class="spin" /> Cargando aspectos…
    </div>

    <!-- Error -->
    <div v-else-if="error" class="aa-error">
      <AlertCircle :size="16" /> {{ error }}
      <button class="aa-retry-btn" @click="load">Reintentar</button>
    </div>

    <!-- Tabla -->
    <div v-else class="aa-card">
      <div v-if="aspectos.length === 0" class="aa-empty">
        No hay aspectos registrados.
      </div>

      <table v-else class="aa-table">
        <thead>
          <tr>
            <th class="aa-th-num">#</th>
            <th>Texto</th>
            <th class="aa-th-estado">Estado</th>
            <th class="aa-th-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(asp, idx) in aspectos"
            :key="asp.id"
            class="aa-row"
            :class="{ 'aa-row-inactive': !asp.activo }"
          >
            <td class="aa-td-num">{{ asp.orden }}</td>
            <td class="aa-td-texto">{{ asp.texto }}</td>
            <td class="aa-td-estado">
              <button
                class="aa-toggle-btn"
                :class="asp.activo ? 'aa-toggle-on' : 'aa-toggle-off'"
                :disabled="saving === `toggle-${asp.id}`"
                @click="handleToggle(asp)"
              >
                <Loader2 v-if="saving === `toggle-${asp.id}`" :size="12" class="spin" />
                <template v-else>
                  {{ asp.activo ? 'Activo' : 'Inactivo' }}
                </template>
              </button>
            </td>
            <td class="aa-td-acciones">
              <div class="aa-actions-row">
                <!-- Reordenar -->
                <button
                  class="aa-icon-btn"
                  title="Subir"
                  :disabled="idx === 0 || !!saving"
                  @click="moveUp(idx)"
                >
                  <ChevronUp :size="14" />
                </button>
                <button
                  class="aa-icon-btn"
                  title="Bajar"
                  :disabled="idx === aspectos.length - 1 || !!saving"
                  @click="moveDown(idx)"
                >
                  <ChevronDown :size="14" />
                </button>

                <!-- Editar -->
                <button class="aa-icon-btn aa-icon-edit" title="Editar" @click="openEdit(asp)">
                  <Pencil :size="14" />
                </button>

                <!-- Eliminar -->
                <button class="aa-icon-btn aa-icon-delete" title="Eliminar" @click="confirmDelete(asp)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ─── Modal: Agregar / Editar ─── -->
    <ModalReutilizable :show="showModal" @close="closeModal">
      <h2 class="aa-modal-title">{{ editTarget ? 'Editar aspecto' : 'Agregar aspecto' }}</h2>
      <div class="aa-modal-body">
        <label class="aa-modal-label">Texto del aspecto <span class="aa-req">*</span></label>
        <textarea
          v-model="modalTexto"
          class="aa-modal-textarea"
          :class="{ 'aa-modal-textarea-err': modalError }"
          rows="4"
          placeholder="Escribe el aspecto de inspección…"
          @input="modalError = ''"
        />
        <span v-if="modalError" class="aa-modal-error">{{ modalError }}</span>
      </div>
      <div class="aa-modal-footer">
        <button class="aa-modal-cancel" @click="closeModal">Cancelar</button>
        <button class="aa-modal-save" :disabled="modalSaving" @click="handleSave">
          <Loader2 v-if="modalSaving" :size="14" class="spin" />
          <span v-else>{{ editTarget ? 'Guardar cambios' : 'Agregar' }}</span>
        </button>
      </div>
    </ModalReutilizable>

    <!-- ─── Modal: Confirmar eliminación ─── -->
    <ModalReutilizable :show="showDeleteModal" @close="showDeleteModal = false">
      <h2 class="aa-modal-title">Eliminar aspecto</h2>
      <div class="aa-modal-body">
        <p class="aa-delete-msg">
          ¿Seguro que deseas eliminar este aspecto? Esta acción no se puede deshacer.
        </p>
        <p class="aa-delete-texto">{{ deleteTarget?.texto }}</p>
      </div>
      <div class="aa-modal-footer">
        <button class="aa-modal-cancel" @click="showDeleteModal = false">Cancelar</button>
        <button class="aa-modal-delete" :disabled="modalSaving" @click="handleDelete">
          <Loader2 v-if="modalSaving" :size="14" class="spin" />
          <span v-else>Eliminar</span>
        </button>
      </div>
    </ModalReutilizable>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Plus, Loader2, AlertCircle,
  ChevronUp, ChevronDown, Pencil, Trash2,
} from 'lucide-vue-next'
import ModalReutilizable from '../../components/modal/ModalReutilizable.vue'
import {
  getAspectosAdmin, createAspecto, updateAspecto,
  toggleAspecto, deleteAspecto, reorderAspectos,
} from '../../services/aspectos.service.js'

defineProps({ embedded: { type: Boolean, default: false } })

const router = useRouter()

// ─── Estado ──────────────────────────────────────────────────────────────────
const aspectos = ref([])
const loading  = ref(false)
const error    = ref(null)
const saving   = ref(null) // string key to track which row is saving

// ─── Carga ───────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value   = null
  try {
    aspectos.value = await getAspectosAdmin()
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al cargar los aspectos'
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ─── Reordenar (↑↓) ──────────────────────────────────────────────────────────
async function moveUp(idx) {
  if (idx === 0 || saving.value) return
  swap(idx, idx - 1)
  await pushReorder()
}

async function moveDown(idx) {
  if (idx === aspectos.value.length - 1 || saving.value) return
  swap(idx, idx + 1)
  await pushReorder()
}

function swap(i, j) {
  const arr = aspectos.value
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

async function pushReorder() {
  saving.value = 'reorder'
  try {
    const ids = aspectos.value.map(a => a.id)
    await reorderAspectos(ids)
    // Update local orden values to reflect backend state
    aspectos.value.forEach((a, i) => { a.orden = i + 1 })
  } catch {
    // On error reload from server to restore consistent state
    await load()
  } finally {
    saving.value = null
  }
}

// ─── Toggle activo ────────────────────────────────────────────────────────────
async function handleToggle(asp) {
  saving.value = `toggle-${asp.id}`
  try {
    const updated = await toggleAspecto(asp.id)
    asp.activo = updated.activo
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al cambiar el estado'
  } finally {
    saving.value = null
  }
}

// ─── Modal Agregar / Editar ───────────────────────────────────────────────────
const showModal  = ref(false)
const editTarget = ref(null)
const modalTexto = ref('')
const modalError = ref('')
const modalSaving = ref(false)

function openAdd() {
  editTarget.value = null
  modalTexto.value = ''
  modalError.value = ''
  showModal.value  = true
}

function openEdit(asp) {
  editTarget.value = asp
  modalTexto.value = asp.texto
  modalError.value = ''
  showModal.value  = true
}

function closeModal() {
  showModal.value  = false
  editTarget.value = null
  modalTexto.value = ''
  modalError.value = ''
}

async function handleSave() {
  const texto = modalTexto.value.trim()
  if (!texto) { modalError.value = 'El texto es requerido'; return }

  modalSaving.value = true
  try {
    if (editTarget.value) {
      const updated = await updateAspecto(editTarget.value.id, texto)
      const idx = aspectos.value.findIndex(a => a.id === editTarget.value.id)
      if (idx !== -1) aspectos.value[idx] = updated
    } else {
      const created = await createAspecto(texto)
      aspectos.value.push(created)
    }
    closeModal()
  } catch (e) {
    modalError.value = e?.response?.data?.message || 'Error al guardar'
  } finally {
    modalSaving.value = false
  }
}

// ─── Eliminar ─────────────────────────────────────────────────────────────────
const showDeleteModal = ref(false)
const deleteTarget    = ref(null)

function confirmDelete(asp) {
  deleteTarget.value  = asp
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  modalSaving.value = true
  try {
    await deleteAspecto(deleteTarget.value.id)
    aspectos.value = aspectos.value.filter(a => a.id !== deleteTarget.value.id)
    aspectos.value.forEach((a, i) => { a.orden = i + 1 })
    showDeleteModal.value = false
    deleteTarget.value    = null
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al eliminar'
    showDeleteModal.value = false
  } finally {
    modalSaving.value = false
  }
}
</script>

<style scoped>
.aa-page {
  padding: 24px;
  font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
  max-width: 900px;
  margin: 0 auto;
}

/* ── Header ── */
.aa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
}
.aa-header-left { display: flex; align-items: center; gap: 12px; }
.aa-back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  border: 1.5px solid #E2E8F0; background: #fff;
  cursor: pointer; color: #475569; flex-shrink: 0;
  transition: border-color 0.15s;
}
.aa-back-btn:hover { border-color: #27C8D8; color: #27C8D8; }
.aa-title { font-size: 20px; font-weight: 700; color: #0F172A; margin: 0; }
.aa-add-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px; border: none;
  background: #27C8D8; color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
.aa-add-btn:hover { background: #1BAEBB; }

/* ── Loading / Error ── */
.aa-loading {
  display: flex; align-items: center; gap: 8px;
  color: #64748B; font-size: 14px; padding: 32px 0; justify-content: center;
}
.aa-error {
  display: flex; align-items: center; gap: 8px;
  color: #DC2626; font-size: 14px; padding: 20px;
  background: #FEF2F2; border-radius: 10px;
}
.aa-retry-btn {
  margin-left: auto; padding: 4px 12px; border-radius: 6px;
  border: 1.5px solid #DC2626; background: transparent;
  color: #DC2626; font-size: 12px; cursor: pointer;
}
.aa-retry-btn:hover { background: #FEE2E2; }

/* ── Tabla ── */
.aa-card {
  background: #fff; border-radius: 12px;
  border: 1.5px solid #E2E8F0;
  overflow: hidden;
}
.aa-empty {
  padding: 32px; text-align: center;
  color: #94A3B8; font-size: 14px;
}
.aa-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.aa-table th {
  background: #F8FAFC; padding: 10px 14px;
  text-align: left; font-size: 11px; font-weight: 700;
  color: #64748B; text-transform: uppercase; letter-spacing: 0.4px;
  border-bottom: 1.5px solid #E2E8F0;
}
.aa-th-num    { width: 48px; text-align: center; }
.aa-th-estado { width: 100px; text-align: center; }
.aa-th-acciones { width: 140px; text-align: center; }

.aa-row { border-bottom: 1px solid #F1F5F9; transition: background 0.1s; }
.aa-row:hover { background: #F8FAFC; }
.aa-row:last-child { border-bottom: none; }
.aa-row-inactive { opacity: 0.55; }

.aa-td-num   { padding: 12px 14px; text-align: center; color: #94A3B8; font-weight: 600; }
.aa-td-texto { padding: 12px 14px; color: #0F172A; line-height: 1.5; }
.aa-td-estado { padding: 12px 14px; text-align: center; }
.aa-td-acciones { padding: 8px 14px; }

/* ── Toggle ── */
.aa-toggle-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
  border: none; cursor: pointer; min-width: 70px; gap: 4px;
  transition: opacity 0.15s;
}
.aa-toggle-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.aa-toggle-on  { background: #DCFCE7; color: #16A34A; }
.aa-toggle-off { background: #F1F5F9; color: #64748B; }
.aa-toggle-on:hover:not(:disabled)  { background: #BBF7D0; }
.aa-toggle-off:hover:not(:disabled) { background: #E2E8F0; }

/* ── Acciones ── */
.aa-actions-row { display: flex; align-items: center; justify-content: center; gap: 4px; }
.aa-icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  border: 1.5px solid #E2E8F0; background: #fff;
  cursor: pointer; color: #64748B; transition: all 0.15s;
  flex-shrink: 0;
}
.aa-icon-btn:hover:not(:disabled) { border-color: #27C8D8; color: #27C8D8; background: #E0F9FA; }
.aa-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.aa-icon-edit:hover:not(:disabled)   { border-color: #D97706; color: #D97706; background: #FFFBEB; }
.aa-icon-delete:hover:not(:disabled) { border-color: #DC2626; color: #DC2626; background: #FEF2F2; }

/* ── Modales ── */
.aa-modal-title {
  font-size: 16px; font-weight: 700; color: #0F172A;
  margin: 0 0 16px; padding-right: 32px;
}
.aa-modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  margin-top: 20px; padding-top: 16px;
  border-top: 1px solid #F1F5F9;
}
.aa-modal-body { padding: 0 0 4px; }
.aa-modal-label {
  display: block; font-size: 12px; font-weight: 600;
  color: #374151; margin-bottom: 6px;
}
.aa-req { color: #DC2626; }
.aa-modal-textarea {
  width: 100%; border: 1.5px solid #E2E8F0; border-radius: 8px;
  padding: 10px 12px; font-size: 13px; font-family: inherit;
  color: #0F172A; resize: vertical; transition: border-color 0.15s;
  box-sizing: border-box;
}
.aa-modal-textarea:focus { outline: none; border-color: #27C8D8; }
.aa-modal-textarea-err  { border-color: #DC2626; }
.aa-modal-error { display: block; font-size: 11px; color: #DC2626; margin-top: 4px; }

.aa-modal-cancel {
  padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: 1.5px solid #E2E8F0; background: #fff; color: #374151; cursor: pointer;
  transition: background 0.15s;
}
.aa-modal-cancel:hover { background: #F1F5F9; }
.aa-modal-save {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: none; background: #27C8D8; color: #fff; cursor: pointer;
  transition: background 0.15s; min-width: 100px; justify-content: center;
}
.aa-modal-save:hover:not(:disabled) { background: #1BAEBB; }
.aa-modal-save:disabled { opacity: 0.6; cursor: not-allowed; }
.aa-modal-delete {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: none; background: #DC2626; color: #fff; cursor: pointer;
  transition: background 0.15s; min-width: 100px; justify-content: center;
}
.aa-modal-delete:hover:not(:disabled) { background: #B91C1C; }
.aa-modal-delete:disabled { opacity: 0.6; cursor: not-allowed; }

.aa-delete-msg  { font-size: 14px; color: #374151; margin: 0 0 10px; }
.aa-delete-texto {
  font-size: 13px; color: #64748B; background: #F8FAFC;
  border-radius: 8px; padding: 10px 12px; margin: 0;
  border-left: 3px solid #E2E8F0;
}

.spin { animation: aa-spin 0.9s linear infinite; }
@keyframes aa-spin { to { transform: rotate(360deg); } }

/* Modo embebido */
.aa-embedded-actions {
  display: flex; justify-content: flex-end;
  padding: 0 0 16px;
}
</style>
