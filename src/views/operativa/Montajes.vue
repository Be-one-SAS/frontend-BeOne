<template>
  <div class="mont-page">
    <!-- Header -->
    <div class="mont-header">
      <h1 class="mont-title">Montajes</h1>
      <button class="mont-refresh-btn" :disabled="loading" @click="load">
        <RefreshCw :size="16" :class="{ 'spin': loading }" />
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="mont-tabs">
      <button
        v-for="tab in TABS"
        :key="tab.value"
        :class="['mont-tab', { active: activeTab === tab.value }]"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Search -->
    <div class="mont-search-wrap">
      <Search :size="15" class="mont-search-icon" />
      <input
        v-model="search"
        class="mont-search"
        placeholder="Buscar evento o producto..."
        type="search"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="mont-loading">
      <div class="mont-spinner" />
      <span>Cargando eventos...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="mont-error">
      <AlertCircle :size="20" />
      <span>{{ error }}</span>
      <button @click="load">Reintentar</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredEvents.length === 0" class="mont-empty">
      <PackageCheck :size="36" color="#CBD5E1" />
      <p>No hay eventos confirmados</p>
    </div>

    <!-- Events list -->
    <div v-else class="mont-events">
      <div
        v-for="ev in filteredEvents"
        :key="ev.id"
        class="mont-event"
      >
        <!-- Event header -->
        <div class="mont-event-head" @click="toggleEvent(ev.id)">
          <div class="mont-event-meta">
            <span class="mont-event-num">#{{ ev.numero }}</span>
            <span class="mont-event-name">{{ ev.empresa || ev.contacto || ev.cliente?.name || '—' }}</span>
          </div>
          <div class="mont-event-right">
            <div class="mont-progress-wrap">
              <div
                class="mont-progress-bar"
                :style="{ width: progressPct(ev) + '%' }"
                :class="progressPct(ev) === 100 ? 'complete' : ''"
              />
            </div>
            <span class="mont-progress-label">{{ ev.progress.completados }}/{{ ev.progress.total }}</span>
            <ChevronDown
              :size="16"
              class="mont-chevron"
              :class="{ rotated: expandedEvents.has(ev.id) }"
            />
          </div>
        </div>

        <!-- Event date -->
        <div v-if="ev.operationWindow" class="mont-event-dates">
          <Calendar :size="12" />
          {{ fmtDate(ev.operationWindow.eventStartAt) }}
          <span v-if="ev.ubicacion" class="mont-event-loc">· {{ ev.ubicacion }}</span>
        </div>

        <!-- Collapsed body -->
        <div v-if="expandedEvents.has(ev.id)" class="mont-event-body">

          <!-- Notas operativas -->
          <div v-if="ev.notasOperativas" class="mont-op-notes">
            <FileText :size="13" />
            <span>{{ ev.notasOperativas }}</span>
          </div>

          <!-- Section: Productos propios -->
          <template v-if="visibleProducts(ev).length">
            <div class="mont-section-label">
              <Package :size="13" /> Equipos propios
            </div>
            <div
              v-for="item in visibleProducts(ev)"
              :key="'p-' + item.id"
              :class="['mont-item', { completed: item.check.completado }]"
            >
              <button
                class="mont-checkbox"
                :class="{ checked: item.check.completado }"
                @click="toggleCheck(ev.id, item)"
              >
                <Check v-if="item.check.completado" :size="14" />
              </button>
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                class="mont-item-img"
                alt=""
              />
              <div v-else class="mont-item-img-placeholder">
                <Package :size="16" color="#94A3B8" />
              </div>
              <div class="mont-item-info">
                <span class="mont-item-name">{{ item.nombre }}</span>
                <span class="mont-item-sub">
                  {{ item.dispositivo || item.categoria }}
                  <span v-if="item.cantidad > 1" class="mont-item-qty">× {{ item.cantidad }}</span>
                </span>
                <span v-if="item.qPersonalMontaje" class="mont-item-badge">
                  <Users :size="11" /> {{ item.qPersonalMontaje }} personas
                </span>
              </div>
              <button
                class="mont-note-btn"
                :class="{ active: item.check.nota }"
                @click.stop="openNote(ev.id, item)"
                title="Agregar nota"
              >
                <MessageSquare :size="14" />
              </button>
            </div>
          </template>

          <!-- Section: Terceros -->
          <template v-if="visibleThirdParty(ev).length">
            <div class="mont-section-label">
              <Truck :size="13" /> Equipos de terceros
            </div>
            <div
              v-for="item in visibleThirdParty(ev)"
              :key="'tp-' + item.id"
              :class="['mont-item', { completed: item.check.completado }]"
            >
              <button
                class="mont-checkbox"
                :class="{ checked: item.check.completado }"
                @click="toggleCheck(ev.id, item)"
              >
                <Check v-if="item.check.completado" :size="14" />
              </button>
              <div class="mont-item-img-placeholder">
                <Truck :size="16" color="#94A3B8" />
              </div>
              <div class="mont-item-info">
                <span class="mont-item-name">{{ item.nombre }}</span>
                <span class="mont-item-sub">
                  {{ item.categoria }}
                  <span v-if="item.cantidad > 1" class="mont-item-qty">× {{ item.cantidad }}</span>
                </span>
              </div>
              <button
                class="mont-note-btn"
                :class="{ active: item.check.nota }"
                @click.stop="openNote(ev.id, item)"
                title="Agregar nota"
              >
                <MessageSquare :size="14" />
              </button>
            </div>
          </template>

          <!-- Section: Materiales -->
          <template v-if="visibleMaterials(ev).length">
            <div class="mont-section-label">
              <Layers :size="13" /> Materiales
            </div>
            <div
              v-for="item in visibleMaterials(ev)"
              :key="'m-' + item.id"
              :class="['mont-item', { completed: item.check.completado }]"
            >
              <button
                class="mont-checkbox"
                :class="{ checked: item.check.completado }"
                @click="toggleCheck(ev.id, item)"
              >
                <Check v-if="item.check.completado" :size="14" />
              </button>
              <div class="mont-item-img-placeholder" :style="{ background: item.categoria?.color + '22' }">
                <span class="mont-mat-icon">{{ item.categoria?.icono || '📦' }}</span>
              </div>
              <div class="mont-item-info">
                <span class="mont-item-name">{{ item.nombre }}</span>
                <span class="mont-item-sub">
                  {{ item.cantidad }} {{ item.unidad }}
                  <span v-if="item.categoria" class="mont-item-cat">· {{ item.categoria.nombre }}</span>
                </span>
              </div>
              <button
                class="mont-note-btn"
                :class="{ active: item.check.nota }"
                @click.stop="openNote(ev.id, item)"
                title="Agregar nota"
              >
                <MessageSquare :size="14" />
              </button>
            </div>
          </template>

          <!-- Empty section after filter -->
          <div
            v-if="!visibleProducts(ev).length && !visibleThirdParty(ev).length && !visibleMaterials(ev).length"
            class="mont-section-empty"
          >
            No hay items en esta categoría
          </div>
        </div>
      </div>
    </div>

    <!-- Note modal -->
    <Transition name="fade">
      <div v-if="noteModal.open" class="mont-modal-backdrop" @click.self="closeNote">
        <div class="mont-modal">
          <h3 class="mont-modal-title">Nota</h3>
          <p class="mont-modal-item-name">{{ noteModal.item?.nombre }}</p>
          <textarea
            v-model="noteModal.text"
            class="mont-modal-textarea"
            placeholder="Agrega una nota sobre este ítem..."
            rows="4"
            autofocus
          />
          <div class="mont-modal-actions">
            <button class="mont-modal-cancel" @click="closeNote">Cancelar</button>
            <button class="mont-modal-save" :disabled="noteModal.saving" @click="saveNote">
              <span v-if="noteModal.saving">Guardando...</span>
              <span v-else>Guardar</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  RefreshCw, Search, AlertCircle, PackageCheck, ChevronDown,
  Calendar, FileText, Package, Truck, Layers, Check, MessageSquare,
  Users,
} from 'lucide-vue-next'
import { getMontajes, upsertCheck } from '@/services/montajes.service.js'

const TABS = [
  { value: 'all',       label: 'Todos' },
  { value: 'pending',   label: 'Pendientes' },
  { value: 'completed', label: 'Completados' },
]

const loading       = ref(false)
const error         = ref(null)
const events        = ref([])
const activeTab     = ref('all')
const search        = ref('')
const expandedEvents = ref(new Set())

const noteModal = ref({
  open: false,
  quotationId: null,
  item: null,
  text: '',
  saving: false,
})

async function load() {
  loading.value = true
  error.value   = null
  try {
    events.value = await getMontajes()
    if (events.value.length > 0 && expandedEvents.value.size === 0) {
      expandedEvents.value = new Set([events.value[0].id])
    }
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando montajes'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function toggleEvent(id) {
  const s = new Set(expandedEvents.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedEvents.value = s
}

function progressPct(ev) {
  if (!ev.progress.total) return 0
  return Math.round((ev.progress.completados / ev.progress.total) * 100)
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function matchesSearch(ev) {
  if (!search.value.trim()) return true
  const q = search.value.toLowerCase()
  const name = (ev.empresa || ev.contacto || ev.cliente?.name || '').toLowerCase()
  const num  = String(ev.numero)
  const allNames = [
    ...ev.products.map(i => i.nombre),
    ...ev.thirdPartyItems.map(i => i.nombre),
    ...ev.materials.map(i => i.nombre),
  ].join(' ').toLowerCase()
  return name.includes(q) || num.includes(q) || allNames.includes(q)
}

const filteredEvents = computed(() => {
  return events.value.filter(ev => {
    if (!matchesSearch(ev)) return false
    if (activeTab.value === 'completed') return ev.progress.completados === ev.progress.total && ev.progress.total > 0
    if (activeTab.value === 'pending')   return ev.progress.completados < ev.progress.total
    return true
  })
})

function filterItems(items) {
  if (activeTab.value === 'completed') return items.filter(i => i.check.completado)
  if (activeTab.value === 'pending')   return items.filter(i => !i.check.completado)
  return items
}

function visibleProducts(ev)   { return filterItems(ev.products) }
function visibleThirdParty(ev) { return filterItems(ev.thirdPartyItems) }
function visibleMaterials(ev)  { return filterItems(ev.materials) }

function findItem(ev, item) {
  const lists = [ev.products, ev.thirdPartyItems, ev.materials]
  for (const list of lists) {
    const found = list.find(i => i.type === item.type && i.id === item.id)
    if (found) return found
  }
  return null
}

async function toggleCheck(quotationId, item) {
  const ev = events.value.find(e => e.id === quotationId)
  if (!ev) return

  const target = findItem(ev, item)
  if (!target) return

  const newVal = !target.check.completado
  target.check.completado = newVal
  updateProgress(ev)

  try {
    await upsertCheck({
      quotationId,
      itemType:   item.type,
      itemId:     item.id,
      completado: newVal,
      nota:       target.check.nota,
    })
  } catch {
    target.check.completado = !newVal
    updateProgress(ev)
  }
}

function updateProgress(ev) {
  const all = [...ev.products, ...ev.thirdPartyItems, ...ev.materials]
  ev.progress.total       = all.length
  ev.progress.completados = all.filter(i => i.check.completado).length
}

function openNote(quotationId, item) {
  noteModal.value = {
    open: true,
    quotationId,
    item,
    text: item.check.nota || '',
    saving: false,
  }
}

function closeNote() {
  noteModal.value.open = false
}

async function saveNote() {
  const { quotationId, item, text } = noteModal.value
  if (!item) return

  noteModal.value.saving = true

  const ev     = events.value.find(e => e.id === quotationId)
  const target = ev ? findItem(ev, item) : null

  try {
    await upsertCheck({
      quotationId,
      itemType:   item.type,
      itemId:     item.id,
      completado: item.check.completado,
      nota:       text || null,
    })
    if (target) target.check.nota = text || null
    closeNote()
  } catch {
    // keep modal open
  } finally {
    noteModal.value.saving = false
  }
}
</script>

<style scoped>
.mont-page {
  padding: 16px;
  max-width: 720px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
}

/* Header */
.mont-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.mont-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}
.mont-refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: #64748B;
  transition: background 0.15s;
}
.mont-refresh-btn:hover { background: #F8FAFC; }
.mont-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Tabs */
.mont-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.mont-tab {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid #E2E8F0;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s;
}
.mont-tab.active {
  background: #054EAF;
  color: #fff;
  border-color: #054EAF;
}

/* Search */
.mont-search-wrap {
  position: relative;
  margin-bottom: 16px;
}
.mont-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
}
.mont-search {
  width: 100%;
  padding: 9px 12px 9px 32px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  outline: none;
  box-sizing: border-box;
  background: #fff;
  transition: border-color 0.15s;
}
.mont-search:focus { border-color: #054EAF; }

/* Loading / error / empty */
.mont-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 0;
  color: #64748B;
  font-size: 13px;
}
.mont-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #E2E8F0;
  border-top-color: #054EAF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.mont-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 10px;
  color: #DC2626;
  font-size: 13px;
}
.mont-error button {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid #DC2626;
  border-radius: 6px;
  background: none;
  color: #DC2626;
  cursor: pointer;
  font-size: 12px;
}
.mont-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 0;
  color: #94A3B8;
  font-size: 14px;
}

/* Events */
.mont-events { display: flex; flex-direction: column; gap: 12px; }

.mont-event {
  border: 1.5px solid #E2E8F0;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.mont-event-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  cursor: pointer;
  user-select: none;
}
.mont-event-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.mont-event-num {
  font-size: 11px;
  font-weight: 600;
  color: #054EAF;
  letter-spacing: 0.4px;
}
.mont-event-name {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mont-event-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 10px;
}
.mont-progress-wrap {
  width: 60px;
  height: 5px;
  background: #E2E8F0;
  border-radius: 99px;
  overflow: hidden;
}
.mont-progress-bar {
  height: 100%;
  background: #054EAF;
  border-radius: 99px;
  transition: width 0.3s ease;
}
.mont-progress-bar.complete { background: #16A34A; }
.mont-progress-label {
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
  white-space: nowrap;
}
.mont-chevron {
  color: #94A3B8;
  transition: transform 0.2s;
}
.mont-chevron.rotated { transform: rotate(180deg); }

.mont-event-dates {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 16px 10px;
  font-size: 12px;
  color: #64748B;
}
.mont-event-loc { color: #94A3B8; }

/* Event body */
.mont-event-body { padding: 0 12px 12px; }

.mont-op-notes {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  padding: 10px 12px;
  background: #FFF9F0;
  border: 1px solid #FDE68A;
  border-radius: 8px;
  font-size: 12px;
  color: #92400E;
  margin-bottom: 12px;
  line-height: 1.5;
}
.mont-op-notes svg { flex-shrink: 0; margin-top: 1px; color: #F59E0B; }

.mont-section-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 4px 6px;
}

.mont-section-empty {
  font-size: 12px;
  color: #CBD5E1;
  padding: 10px 4px;
  text-align: center;
}

/* Item */
.mont-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 4px;
  border-bottom: 1px solid #F1F5F9;
  transition: opacity 0.15s;
}
.mont-item:last-child { border-bottom: none; }
.mont-item.completed { opacity: 0.55; }

.mont-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid #CBD5E1;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
  color: #fff;
}
.mont-checkbox.checked {
  background: #16A34A;
  border-color: #16A34A;
}
.mont-checkbox:active { transform: scale(0.92); }

.mont-item-img {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: #F1F5F9;
}
.mont-item-img-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mont-mat-icon { font-size: 17px; }

.mont-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mont-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mont-item-sub {
  font-size: 11px;
  color: #64748B;
}
.mont-item-qty {
  font-weight: 700;
  color: #054EAF;
}
.mont-item-cat { color: #94A3B8; }
.mont-item-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  color: #6D28D9;
  background: #EDE9FE;
  padding: 2px 6px;
  border-radius: 10px;
  width: fit-content;
}

.mont-note-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid #E2E8F0;
  background: #fff;
  color: #94A3B8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.mont-note-btn:hover { border-color: #054EAF; color: #054EAF; }
.mont-note-btn.active { border-color: #F59E0B; color: #F59E0B; background: #FFFBEB; }

/* Modal */
.mont-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0 16px 24px;
}
.mont-modal {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
}
.mont-modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 4px;
}
.mont-modal-item-name {
  font-size: 13px;
  color: #64748B;
  margin: 0 0 14px;
}
.mont-modal-textarea {
  width: 100%;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  resize: none;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
}
.mont-modal-textarea:focus { border-color: #054EAF; }
.mont-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.mont-modal-cancel {
  flex: 1;
  padding: 10px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
}
.mont-modal-save {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: #054EAF;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}
.mont-modal-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
