<script setup>
import { ref, onMounted, computed } from "vue";
import { getQuotations } from "../../services/quotation.service";
import Badge from "../../components/badge/Badge.vue";
import { useRouter } from "vue-router";
import { cancelReservation, confirmReservation } from "../../services/reservation.service";
import BaseTable from "../../components/ui/BaseTable.vue";
import { ChevronDown, Eye, CheckCircle, XCircle, FileText, Inbox } from 'lucide-vue-next';

const { push } = useRouter();

const quotations = ref([]);
const isModalOpen = ref(false);
const selectedQuotation = ref(null);

//  NUEVO → modal de éxito
const isSuccessModalOpen = ref(false);
const confirmedQuotation = ref(null);

//  NUEVO → modal vista cliente
const isClientPreviewOpen = ref(false);
const quotationPreview = ref(null);

// ----------------------
// FILTROS
// ----------------------
const search = ref("");
const estadoFiltro = ref("");
const fechaInicioFiltro = ref("");
const fechaFinFiltro = ref("");

const estados = [
  { label: "Pendiente", value: "Pendiente" },
  { label: "Aprobada", value: "Aprobada" },
  { label: "Rechazada", value: "Rechazada" },
];

// FILTROS COMPUTADOS
const filteredQuotations = computed(() => {
  return quotations.value.filter((q) => {
    const texto = search.value.toLowerCase();

    const coincideTexto =
      q.numero?.toLowerCase().includes(texto) ||
      q.empresa?.toLowerCase().includes(texto) ||
      q?.cliente?.name?.toLowerCase().includes(texto);

    const coincideEstado =
      !estadoFiltro.value || q.quotationStatus?.name === estadoFiltro.value;

    const fechaCot = new Date(q.fechaCotizacion);

    const dentroInicio =
      !fechaInicioFiltro.value ||
      fechaCot >= new Date(fechaInicioFiltro.value);

    const dentroFin =
      !fechaFinFiltro.value || fechaCot <= new Date(fechaFinFiltro.value);

    return coincideTexto && coincideEstado && dentroInicio && dentroFin;
  });
});

// ----------------------
// OBTENER COTIZACIONES
// ----------------------
const loadQuotations = async () => {
  try {
    const response = await getQuotations();
    quotations.value = response.data;
  } catch (error) {
    console.error("Error cargando cotizaciones:", error);
  }
};

onMounted(() => {
  loadQuotations();
});

// ----------------------
// ACCIONES
// ----------------------
const openModal = (quotation) => {
  selectedQuotation.value = { ...quotation };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedQuotation.value = null;
};

const saveChanges = () => {
  console.log("Guardar cambios:", selectedQuotation.value);
  closeModal();
};

const seeTheQuote = (id) => {
  push(`/admin/cotizar/${id}`);
};

//  AJUSTADO → confirmar + abrir modal
const confirmQuotation = async (quotation) => {
  try {
    await confirmReservation(quotation.id, true);

    confirmedQuotation.value = quotation;
    isSuccessModalOpen.value = true;

    await loadQuotations();

    console.log("Cotización confirmada:", quotation.id);
  } catch (error) {
    console.error("No se pudo confirmar la cotización", error);
  }
};

const cancelQuotation = async (quotation) => {
  try {
    await cancelReservation(quotation.id);

    confirmedQuotation.value = quotation;
    isSuccessModalOpen.value = true;

    await loadQuotations();

    console.log("Cotización cancelada:", quotation.id);
  } catch (error) {
    console.error("No se pudo cancelar la cotización", error);
  }
}

//  NUEVO
const closeSuccessModal = () => {
  isSuccessModalOpen.value = false;
  confirmedQuotation.value = null;
};

// ----------------------
// VISTA CLIENTE + PDF
// ----------------------
const openClientPreview = (quotation) => {
  quotationPreview.value = quotation;
  isClientPreviewOpen.value = true;
};

const closeClientPreview = () => {
  quotationPreview.value = null;
  isClientPreviewOpen.value = false;
};

const downloadPDF = async () => {
  await nextTick();
  const element = document.getElementById("client-pdf");

  html2pdf().set({
    margin: 10,
    filename: `Cotizacion_${quotationPreview.value.numero}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  }).from(element).save();
};

// ----------------------
// ACCORDION
// ----------------------
const expandedRow = ref(null);
const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};
</script>

<template>
  <div class="vc-page">

    <!-- ══════════════════════════════════════════ -->
    <!-- HEADER                                     -->
    <!-- ══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="vc-title">Cotizaciones</h2>
        <p class="vc-subtitle">{{ filteredQuotations.length }} cotizaciones encontradas</p>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- FILTROS                                    -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(5,78,175,.06)] grid grid-cols-1 md:grid-cols-4 gap-4">

      <input
        v-model="search"
        type="text"
        placeholder="Número, empresa o cliente…"
        class="vc-input"
      />

      <select v-model="estadoFiltro" class="vc-input">
        <option value="">Todos los estados</option>
        <option v-for="e in estados" :key="e.value" :value="e.value">
          {{ e.label }}
        </option>
      </select>

      <input v-model="fechaInicioFiltro" type="date" class="vc-input" />
      <input v-model="fechaFinFiltro"    type="date" class="vc-input" />

    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA                                      -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(5,78,175,.06),_0_4px_16px_rgba(5,78,175,.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="vc-table">

          <!-- HEAD -->
          <thead>
            <tr class="vc-head-row">
              <th class="vc-th" style="width:36px"></th>
              <th class="vc-th vc-th-center" style="width:44px">#</th>
              <th class="vc-th">Cotización</th>
              <th class="vc-th">Cliente</th>
              <th class="vc-th">Agente</th>
              <th class="vc-th">Evento</th>
              <th class="vc-th vc-th-center" style="width:100px">Asistentes</th>
              <th class="vc-th">Acciones</th>
            </tr>
          </thead>

          <!-- BODY -->
          <tbody>
            <template v-for="(q, index) in filteredQuotations" :key="q.id">

              <!-- ── Fila principal ── -->
              <tr class="vc-row" @click="toggleRow(q.id)">

                <!-- Toggle chevron -->
                <td class="vc-td vc-td-center">
                  <ChevronDown
                    :size="14"
                    class="vc-chevron"
                    :class="{ 'vc-chevron-open': expandedRow === q.id }"
                  />
                </td>

                <!-- # -->
                <td class="vc-td vc-td-center vc-idx">{{ index + 1 }}</td>

                <!-- Cotización: número + badge estado -->
                <td class="vc-td">
                  <div class="vc-quot-cell">
                    <span class="vc-num">{{ q.numero }}-2026</span>
                    <Badge :estado="q.quotationStatus?.name" />
                  </div>
                </td>

                <!-- Cliente: empresa + nombre -->
                <td class="vc-td">
                  <div class="vc-client-cell">
                    <span class="vc-empresa">{{ q.empresa }}</span>
                    <span class="vc-client-name">{{ q?.cliente?.name }}</span>
                  </div>
                </td>

                <!-- Agente -->
                <td class="vc-td">{{ q.agenteComercial }}</td>

                <!-- Evento: ubicación + fecha inicio -->
                <td class="vc-td">
                  <div class="vc-event-cell">
                    <span class="vc-ubicacion">{{ q.ubicacion }}</span>
                    <span class="vc-fecha-ev">
                      {{ q.fechaInicioEvento ? new Date(q.fechaInicioEvento).toLocaleDateString('es-CO') : '—' }}
                    </span>
                  </div>
                </td>

                <!-- Asistentes -->
                <td class="vc-td vc-td-center">{{ q.asistentes }}</td>

                <!-- Acciones — @click.stop en el <td> evita el toggle del accordion -->
                <td class="vc-td" @click.stop>
                  <div class="vc-actions">

                    <!-- Ver -->
                    <button
                      @click.stop="seeTheQuote(q.id)"
                      class="act-btn act-view"
                    >
                      <Eye :size="12" /> Ver
                    </button>

                    <!-- Confirmar (lógica original exacta) -->
                    <button
                      :disabled="q?.isPublished"
                      @click.stop="confirmQuotation(q)"
                      :class="q?.isPublished ? 'act-btn act-disabled' : 'act-btn act-confirm'"
                    >
                      <CheckCircle :size="12" /> Confirmar
                    </button>

                    <!-- Cancelar (lógica original exacta) -->
                    <button
                      :disabled="!q?.isPublished"
                      @click.stop="cancelQuotation(q)"
                      :class="!q?.isPublished ? 'act-btn act-disabled' : 'act-btn act-cancel'"
                    >
                      <XCircle :size="12" /> Cancelar
                    </button>

                    <!-- Vista cliente -->
                    <button
                      @click.stop="openClientPreview(q)"
                      class="act-btn act-preview"
                    >
                      <FileText :size="12" /> Vista cliente
                    </button>

                  </div>
                </td>
              </tr>

              <!-- ── Fila expandida (siempre en DOM, transición max-height) ── -->
              <tr class="vc-exp-tr">
                <td colspan="8" class="vc-exp-td">
                  <div
                    class="vc-exp-panel"
                    :class="{ 'vc-exp-open': expandedRow === q.id }"
                  >
                    <div class="vc-exp-inner">
                      <div class="vc-exp-grid">

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Fecha cotización</span>
                          <span class="vc-exp-val">
                            {{ q.fechaCotizacion ? new Date(q.fechaCotizacion).toLocaleDateString('es-CO') : '—' }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Fecha fin evento</span>
                          <span class="vc-exp-val">
                            {{ q.fechaFinEvento ? new Date(q.fechaFinEvento).toLocaleDateString('es-CO') : '—' }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Horario</span>
                          <span class="vc-exp-val">{{ q.horarioInicio }} – {{ q.horarioFin }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Tipo suelo</span>
                          <span class="vc-exp-val">{{ q.tipoSuelo || '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Unidad ejecución</span>
                          <span class="vc-exp-val">{{ q.unidadEjecucion || '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Asistentes</span>
                          <span class="vc-exp-val">{{ q.asistentes }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Jornadas</span>
                          <span class="vc-exp-val">{{ q.cantidadJornada }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Cantidad producto</span>
                          <span class="vc-exp-val">{{ q.cantidadProducto }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Celular</span>
                          <span class="vc-exp-val">{{ q.celular || '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Correo</span>
                          <span class="vc-exp-val">{{ q.correo || '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Contacto</span>
                          <span class="vc-exp-val">{{ q.contacto || '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Vigencia</span>
                          <span class="vc-exp-val">{{ q.vigencia || '—' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Publicado</span>
                          <span class="vc-exp-val">{{ q.isPublished ? 'Sí' : 'No' }}</span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Link mapa</span>
                          <span class="vc-exp-val">
                            <a v-if="q.linkMaps" :href="q.linkMaps" target="_blank" class="vc-link">
                              Ver mapa
                            </a>
                            <span v-else>—</span>
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Creado</span>
                          <span class="vc-exp-val">
                            {{ q.createdAt ? new Date(q.createdAt).toLocaleString('es-CO') : '—' }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Actualizado</span>
                          <span class="vc-exp-val">
                            {{ q.updatedAt ? new Date(q.updatedAt).toLocaleString('es-CO') : '—' }}
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>
                </td>
              </tr>

            </template>
          </tbody>

        </table>
      </div>

      <!-- ── Estado vacío ── -->
      <div
        v-if="filteredQuotations.length === 0"
        class="py-16 flex flex-col items-center gap-3 text-text-3"
      >
        <Inbox class="w-10 h-10 opacity-40" />
        <p class="text-[14px]">No se encontraron cotizaciones</p>
      </div>

    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL ÉXITO                                -->
    <!-- ══════════════════════════════════════════ -->
    <div
      v-if="isSuccessModalOpen"
      class="fixed inset-0 bg-[rgba(15,26,46,0.4)] backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-[var(--r-2xl)] shadow-[var(--shadow-modal)] max-w-md w-full p-6 space-y-4">
        <h3 class="text-[16px] font-semibold text-[#16A34A] font-['Plus_Jakarta_Sans',sans-serif]">
          Cotización confirmada con éxito
        </h3>
        <p class="text-[13px] text-text-2">
          Los productos agregados en esta cotización no estarán disponibles
          en las fechas establecidas.
        </p>
        <div class="flex justify-end">
          <button
            @click="closeSuccessModal"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-primary-dark transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ─── Page ──────────────────────────────────────────── */
.vc-page { width: 100%; }

/* ─── Header ────────────────────────────────────────── */
.vc-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 0 0 4px;
  line-height: 1.2;
}

.vc-subtitle {
  font-size: 13px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* ─── Inputs / selects compartidos ──────────────────── */
.vc-input {
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

.vc-input:focus {
  border-color: var(--primary, #054EAF);
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.1);
}

.vc-input::placeholder { color: var(--text-3, #94A3B8); }

/* ─── Tabla ─────────────────────────────────────────── */
.vc-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

/* ─── Head ──────────────────────────────────────────── */
.vc-head-row { background: #EBF3FC; }

.vc-th {
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

.vc-th-center { text-align: center; }

/* ─── Filas ─────────────────────────────────────────── */
.vc-row {
  background: #FFFFFF;
  cursor: pointer;
  transition: background 0.15s ease;
}

.vc-row:hover { background: #F0F7FF; }

.vc-td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  border-bottom: 1px solid #EBF3FC;
  vertical-align: middle;
  white-space: nowrap;
}

.vc-td-center { text-align: center; }

.vc-idx {
  font-size: 12px;
  color: var(--text-3, #94A3B8);
  font-weight: 500;
}

/* ─── Chevron toggle ────────────────────────────────── */
.vc-chevron {
  color: var(--text-3, #94A3B8);
  transition: transform 0.2s ease, color 0.15s ease;
  display: block;
  margin: 0 auto;
}

.vc-chevron-open {
  transform: rotate(180deg);
  color: #054EAF;
}

/* ─── Cell: cotización ──────────────────────────────── */
.vc-quot-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.vc-num {
  font-weight: 700;
  font-size: 13px;
  color: #054EAF;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  letter-spacing: -0.01em;
}

/* ─── Cell: cliente ─────────────────────────────────── */
.vc-client-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vc-empresa {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
}

.vc-client-name {
  font-size: 11px;
  color: var(--text-3, #94A3B8);
}

/* ─── Cell: evento ──────────────────────────────────── */
.vc-event-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vc-ubicacion {
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-weight: 500;
}

.vc-fecha-ev {
  font-size: 11px;
  color: var(--text-3, #94A3B8);
}

/* ─── Botones de acción ─────────────────────────────── */
.vc-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

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

.act-view            { background: #DBEAFE; color: #1D4ED8; }
.act-view:hover      { background: #BFDBFE; }

.act-confirm         { background: #DCFCE7; color: #16A34A; }
.act-confirm:hover   { background: #BBF7D0; }

.act-cancel          { background: #FEE2E2; color: #B91C1C; }
.act-cancel:hover    { background: #FECACA; }

.act-preview         { background: #EDE9FE; color: #7C3AED; }
.act-preview:hover   { background: #DDD6FE; }

.act-disabled {
  background: #F1F5F9;
  color: var(--text-3, #94A3B8);
  cursor: not-allowed;
}

/* ─── Fila expandida ────────────────────────────────── */
.vc-exp-td {
  padding: 0 !important;
  border-bottom: 1px solid #EBF3FC;
}

/* El div interno hace la transición — el <tr> siempre está en el DOM */
.vc-exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}

.vc-exp-open { max-height: 600px; }

.vc-exp-inner {
  background: #F8FBFF;
  border-left: 3px solid #054EAF;
  padding: 16px 24px;
}

.vc-exp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
}

@media (max-width: 768px) {
  .vc-exp-grid { grid-template-columns: repeat(2, 1fr); }
}

.vc-exp-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vc-exp-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
}

.vc-exp-val {
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  white-space: normal;
  word-break: break-word;
}

.vc-link {
  color: #054EAF;
  text-decoration: underline;
  font-size: 13px;
  font-weight: 500;
}

.vc-link:hover { color: #0342A0; }
</style>
