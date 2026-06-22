<template>
  <div class="ncp-wrap">
    <div class="ncp-header">
      <StickyNote :size="14" class="ncp-header-icon" />
      <span class="ncp-header-title">Notas</span>
      <span v-if="notas.length" class="ncp-count">{{ notas.length }}</span>
    </div>

    <!-- Lista de notas -->
    <div v-if="cargando" class="ncp-empty">Cargando…</div>

    <div v-else-if="notas.length" class="ncp-list">
      <div v-for="nota in notas" :key="nota.id" class="ncp-nota" :data-area="nota.area">
        <div class="ncp-nota-top">
          <span class="ncp-area-badge" :data-area="nota.area">{{ nota.area }}</span>
          <span class="ncp-fecha">{{ fmtDate(nota.createdAt) }}</span>
          <button class="ncp-del" @click="eliminar(nota.id)" title="Eliminar nota">
            <X :size="12" />
          </button>
        </div>
        <p class="ncp-contenido">{{ nota.contenido }}</p>
      </div>
    </div>

    <div v-else class="ncp-empty">Sin notas para esta sección</div>

    <!-- Formulario inline -->
    <div class="ncp-form" :class="{ open: formOpen }">
      <template v-if="formOpen">
        <div class="ncp-form-fields">
          <select v-model="form.area" class="ncp-select">
            <option value="" disabled>Área…</option>
            <option v-for="a in areasFiltro" :key="a" :value="a">{{ a }}</option>
          </select>
          <textarea
            v-model="form.contenido"
            class="ncp-textarea"
            placeholder="Escribe la nota…"
            rows="2"
          />
        </div>
        <div class="ncp-form-actions">
          <button class="ncp-btn-cancel" @click="formOpen = false">Cancelar</button>
          <button
            class="ncp-btn-add"
            @click="guardar"
            :disabled="!form.contenido.trim() || !form.area || guardando"
          >
            {{ guardando ? 'Guardando…' : 'Agregar' }}
          </button>
        </div>
      </template>
      <button v-else class="ncp-btn-open" @click="formOpen = true">
        <Plus :size="13" /> Agregar nota
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { StickyNote, Plus, X } from 'lucide-vue-next'
import {
  getNotasByCotizacion,
  createNotaCotizacion,
  deleteNotaCotizacion,
} from '@/services/nota-cotizacion.service'

const props = defineProps({
  quotationId: { type: Number, default: null },
  areasFiltro: { type: Array, default: () => ['Comercial', 'Operativo', 'Administrativo', 'Logístico'] },
})

const notas    = ref([])
const cargando = ref(false)
const guardando = ref(false)
const formOpen  = ref(false)
const form      = ref({ area: '', contenido: '' })

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const cargar = async () => {
  if (!props.quotationId) return
  cargando.value = true
  try {
    const todas = await getNotasByCotizacion(props.quotationId)
    notas.value = todas.filter((n) => props.areasFiltro.includes(n.area))
  } catch (e) {
    console.error('[NotasCotizacionPanel] Error cargando:', e)
  } finally {
    cargando.value = false
  }
}

const guardar = async () => {
  if (!form.value.contenido.trim() || !form.value.area) return
  guardando.value = true
  try {
    const creada = await createNotaCotizacion({
      contenido: form.value.contenido.trim(),
      area: form.value.area,
      cotizacionId: props.quotationId,
    })
    notas.value.unshift(creada)
    form.value = { area: '', contenido: '' }
    formOpen.value = false
  } catch (e) {
    console.error('[NotasCotizacionPanel] Error guardando:', e)
  } finally {
    guardando.value = false
  }
}

const eliminar = async (id) => {
  if (!confirm('¿Eliminar esta nota?')) return
  try {
    await deleteNotaCotizacion(id)
    notas.value = notas.value.filter((n) => n.id !== id)
  } catch (e) {
    console.error('[NotasCotizacionPanel] Error eliminando:', e)
  }
}

watch(() => props.quotationId, (val) => { if (val) cargar() }, { immediate: true })
</script>

<style scoped>
.ncp-wrap {
  margin-top: 16px;
  background: #FFFBEB;
  border: 1.5px solid #FDE68A;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ncp-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ncp-header-icon { color: #D97706; flex-shrink: 0; }

.ncp-header-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #92400E;
  font-family: 'Inter', sans-serif;
}

.ncp-count {
  font-size: 10px;
  font-weight: 700;
  background: #FCD34D;
  color: #78350F;
  border-radius: 99px;
  padding: 1px 7px;
  font-family: 'Inter', sans-serif;
}

/* Lista */
.ncp-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ncp-nota {
  background: white;
  border-radius: 9px;
  padding: 8px 10px;
  border-left: 3px solid #FCD34D;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
}

.ncp-nota[data-area="Comercial"]      { border-left-color: #3B82F6; }
.ncp-nota[data-area="Operativo"]      { border-left-color: #10B981; }
.ncp-nota[data-area="Administrativo"] { border-left-color: #F59E0B; }
.ncp-nota[data-area="Logístico"]      { border-left-color: #8B5CF6; }

.ncp-nota-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ncp-area-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 7px;
  border-radius: 99px;
  font-family: 'Inter', sans-serif;
}
.ncp-area-badge[data-area="Comercial"]      { background: #DBEAFE; color: #1D4ED8; }
.ncp-area-badge[data-area="Operativo"]      { background: #D1FAE5; color: #065F46; }
.ncp-area-badge[data-area="Administrativo"] { background: #FEF3C7; color: #92400E; }
.ncp-area-badge[data-area="Logístico"]      { background: #EDE9FE; color: #5B21B6; }

.ncp-fecha {
  font-size: 10px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin-left: auto;
}

.ncp-del {
  background: none;
  border: none;
  cursor: pointer;
  color: #CBD5E1;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.ncp-del:hover { color: #B91C1C; background: #FEE2E2; }

.ncp-contenido {
  font-size: 12px;
  color: #374151;
  font-family: 'Inter', sans-serif;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.ncp-empty {
  font-size: 12px;
  color: #92400E;
  font-family: 'Inter', sans-serif;
  opacity: 0.6;
  text-align: center;
  padding: 4px 0;
}

/* Formulario */
.ncp-form { display: flex; flex-direction: column; gap: 8px; }

.ncp-btn-open {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #92400E;
  background: none;
  border: 1px dashed #FCD34D;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: 'Inter', sans-serif;
  width: 100%;
  justify-content: center;
}
.ncp-btn-open:hover { background: #FEF3C7; }

.ncp-form-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ncp-select {
  width: 100%;
  background: white;
  border: 1px solid #FDE68A;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  appearance: none;
  cursor: pointer;
}
.ncp-select:focus { border-color: #D97706; box-shadow: 0 0 0 2px rgba(217,119,6,.15); }

.ncp-textarea {
  width: 100%;
  background: white;
  border: 1px solid #FDE68A;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  resize: none;
  line-height: 1.5;
  box-sizing: border-box;
}
.ncp-textarea:focus { border-color: #D97706; box-shadow: 0 0 0 2px rgba(217,119,6,.15); }
.ncp-textarea::placeholder { color: #94A3B8; }

.ncp-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.ncp-btn-cancel {
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid #E5EAF0;
  background: #F1F5F9;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s;
}
.ncp-btn-cancel:hover { background: #E2E8F0; }

.ncp-btn-add {
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  padding: 5px 14px;
  border-radius: 7px;
  border: none;
  background: #D97706;
  color: white;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.ncp-btn-add:hover:not(:disabled) { background: #B45309; }
.ncp-btn-add:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
