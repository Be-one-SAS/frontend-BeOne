<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { getQuotations, getQuotationById } from "../../services/quotation.service";
import Badge from "../../components/badge/Badge.vue";
import { useRouter } from "vue-router";
import { cancelReservation, confirmReservation } from "../../services/reservation.service";
import BaseTable from "../../components/ui/BaseTable.vue";
import CollaboratorsManager from "./components/CollaboratorsManager.vue";
import { ChevronDown, Eye, CheckCircle, XCircle, FileText, Inbox, Users, Download, X, Printer } from 'lucide-vue-next';

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

//  NUEVO → modal colaboradores
const isCollabModalOpen = ref(false);
const selectedQuotationForCollab = ref(null);

const openCollaboratorsModal = (quotation) => {
  selectedQuotationForCollab.value = quotation;
  isCollabModalOpen.value = true;
};

const closeCollabModal = () => {
  selectedQuotationForCollab.value = null;
  isCollabModalOpen.value = false;
};

const updateQuotationMembersLocal = (newMembers) => {
  if (selectedQuotationForCollab.value) {
    selectedQuotationForCollab.value.members = newMembers;
  }
};

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

    // q.numero es INTEGER en la BD — se convierte a string antes de comparar
    const coincideTexto =
      String(q.numero ?? '').toLowerCase().includes(texto) ||
      (q.empresa ?? '').toLowerCase().includes(texto) ||
      (q?.cliente?.name ?? '').toLowerCase().includes(texto);

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
const isLoadingPreview = ref(false);

const openClientPreview = async (quotation) => {
  isLoadingPreview.value = true;
  try {
    // Obtener detalles completos de la cotización con productos
    const response = await getQuotationById(quotation.id);
    quotationPreview.value = response.data;
    isClientPreviewOpen.value = true;
  } catch (error) {
    console.error("Error cargando detalles de cotización:", error);
  } finally {
    isLoadingPreview.value = false;
  }
};

const closeClientPreview = () => {
  quotationPreview.value = null;
  isClientPreviewOpen.value = false;
};

const downloadPDF = async () => {
  await nextTick();
  const element = document.getElementById("client-pdf");
  
  // Crear un clone con estilos en línea
  const clonedElement = element.cloneNode(true);
  
  // Agregar estilos en línea para el PDF
  const style = document.createElement('style');
  style.textContent = `
    * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
    .pdf-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 2px solid #054EAF; margin-bottom: 24px; }
    .pdf-logo { height: 48px; object-fit: contain; }
    .pdf-title { font-size: 20px; font-weight: 700; color: #0F1A2E; margin: 0; }
    .pdf-subtitle { font-size: 12px; color: #6B7280; margin: 4px 0 0; }
    .pdf-number { text-align: right; }
    .pdf-number-label { font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
    .pdf-number-val { font-size: 18px; font-weight: 700; color: #054EAF; font-family: 'JetBrains Mono', monospace; margin: 4px 0 0; }
    .pdf-section { margin-bottom: 24px; }
    .pdf-section-title { font-size: 14px; font-weight: 600; color: #054EAF; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .pdf-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; background: #F9FAFB; padding: 16px; border-radius: 8px; }
    .pdf-field { display: flex; flex-direction: column; gap: 4px; }
    .pdf-label { font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .pdf-value { font-size: 13px; color: #0F1A2E; font-weight: 500; }
    .pdf-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .pdf-table thead { background: #054EAF; color: white; }
    .pdf-table th { text-align: left; padding: 12px; font-weight: 600; }
    .pdf-table th.text-center { text-align: center; }
    .pdf-table th.text-right { text-align: right; }
    .pdf-table td { padding: 12px; border-top: 1px solid #E5E7EB; color: #0F1A2E; }
    .pdf-table td.text-center { text-align: center; color: #4B5563; }
    .pdf-table td.text-right { text-align: right; }
    .pdf-table td.total { font-weight: 600; color: #054EAF; }
    .pdf-footer { margin-top: 32px; padding-top: 24px; border-top: 2px solid #054EAF; text-align: center; }
    .pdf-footer-text { font-size: 11px; color: #6B7280; margin: 4px 0 0; }
    .pdf-footer-date { font-size: 10px; color: #9CA3AF; margin: 4px 0 0; }
  `;
  clonedElement.insertBefore(style, clonedElement.firstChild);
  
  const opt = {
    margin: 0,
    filename: `Cotizacion_${quotationPreview.value.numero}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  
  if (typeof html2pdf !== 'undefined') {
    html2pdf().set(opt).from(clonedElement).save();
  } else {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cotización ${quotationPreview.value.numero}</title>
          ${style.outerHTML}
        </head>
        <body>${clonedElement.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

// ----------------------
// DATE HELPERS
// ----------------------
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'

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
                      {{ formatDate(q.operationWindow?.eventStartAt) }}
                    </span>
                  </div>
                </td>

                <!-- Asistentes -->
                <td class="vc-td vc-td-center">{{ q.asistentes }}</td>

                <!-- Acciones — @click.stop en el <td> evita el toggle del accordion -->
                <td class="vc-td" @click.stop>
                  <div class="vc-actions">

                    <!-- Actualizar -->
                    <button
                      @click.stop="seeTheQuote(q.id)"
                      class="act-btn act-view"
                    >
                      <Eye :size="12" /> Actualizar
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

                    <!-- Ver -->
                    <button
                      @click.stop="openClientPreview(q)"
                      class="act-btn act-preview"
                    >
                      <FileText :size="12" /> Ver
                    </button>

                    <!-- Miembros -->
                    <button
                      @click.stop="openCollaboratorsModal(q)"
                      class="act-btn act-collab"
                    >
                      <Users :size="12" /> Miembros
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
                          <span class="vc-exp-label">Inicio evento</span>
                          <span class="vc-exp-val">
                            {{ formatDate(q.operationWindow?.eventStartAt) }}
                            {{ formatTime(q.operationWindow?.eventStartAt) }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Fin evento</span>
                          <span class="vc-exp-val">
                            {{ formatDate(q.operationWindow?.eventEndAt) }}
                            {{ formatTime(q.operationWindow?.eventEndAt) }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Inicio montaje</span>
                          <span class="vc-exp-val">
                            {{ formatDate(q.operationWindow?.setupStartAt) }}
                            {{ formatTime(q.operationWindow?.setupStartAt) }}
                          </span>
                        </div>

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Fin desmontaje</span>
                          <span class="vc-exp-val">
                            {{ formatDate(q.operationWindow?.teardownEndAt) }}
                            {{ formatTime(q.operationWindow?.teardownEndAt) }}
                          </span>
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

                        <div class="vc-exp-field">
                          <span class="vc-exp-label">Invitados</span>
                          <span class="vc-exp-val">
                            <span v-if="q.members && q.members.length > 0">
                              {{ q.members.map(m => m.user?.fullName).join(', ') }}
                            </span>
                            <span v-else>Ninguno</span>
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

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL COLABORADORES                        -->
    <!-- ══════════════════════════════════════════ -->
    <div
      v-if="isCollabModalOpen"
      class="fixed inset-0 bg-[rgba(15,26,46,0.4)] backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-[var(--r-2xl)] shadow-[var(--shadow-modal)] max-w-md w-full p-6 space-y-4 relative">
        <h3 class="text-[16px] font-semibold text-[#0F1A2E] font-['Plus_Jakarta_Sans',sans-serif]">
          Gestionar Colaboradores
        </h3>
        
        <CollaboratorsManager 
          :quotationId="selectedQuotationForCollab?.id" 
          :initialMembers="selectedQuotationForCollab?.members || []"
          :isReadOnly="false"
          @update-members="updateQuotationMembersLocal"
        />

        <div class="flex justify-end pt-2">
          <button
            @click="closeCollabModal"
            class="px-[18px] py-[9px] text-[13px] font-medium bg-[#F1F5F9] text-[#475569] rounded-[8px] hover:bg-[#E2E8F0] transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL VISTA PREVIA PDF                     -->
    <!-- ══════════════════════════════════════════ -->
    <div
      v-if="isClientPreviewOpen && quotationPreview"
      class="fixed inset-0 bg-[rgba(15,26,46,0.6)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-[20px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <!-- Header del modal -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#054EAF] to-[#0A3D8F]">
          <div class="flex items-center gap-3">
            <FileText class="text-white" :size="20" />
            <h3 class="text-[16px] font-semibold text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Cotización #{{ quotationPreview.numero }}-2026
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="downloadPDF"
              class="px-4 py-2 text-[13px] font-medium bg-white/20 text-white rounded-[8px] hover:bg-white/30 transition flex items-center gap-2"
            >
              <Download :size="14" /> Descargar PDF
            </button>
            <button
              @click="closeClientPreview"
              class="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-[8px] transition"
            >
              <X :size="20" />
            </button>
          </div>
        </div>

        <!-- Contenido del PDF (scrollable) -->
        <div class="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div id="client-pdf" class="bg-white shadow-lg rounded-[12px] p-8 max-w-[210mm] mx-auto">
            
            <!-- Header con logo -->
            <div class="pdf-header">
              <div class="flex items-center gap-4">
                <img src="/assets/logo.png" alt="BeOne" class="pdf-logo" />
                <div>
                  <h1 class="pdf-title">BeOne Eventos Corporativos</h1>
                  <p class="pdf-subtitle">Gestión de eventos con precisión</p>
                </div>
              </div>
              <div class="pdf-number">
                <p class="pdf-number-label">Cotización N°</p>
                <p class="pdf-number-val">{{ quotationPreview.numero }}-2026</p>
                <Badge :estado="quotationPreview.quotationStatus?.name" />
              </div>
            </div>

            <!-- Información del cliente -->
            <div class="pdf-section">
              <h2 class="pdf-section-title">
                <Users :size="16" /> Información del Cliente
              </h2>
              <div class="pdf-grid">
                <div class="pdf-field">
                  <p class="pdf-label">Empresa</p>
                  <p class="pdf-value">{{ quotationPreview.empresa || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Cliente</p>
                  <p class="pdf-value">{{ quotationPreview?.cliente?.name || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Contacto</p>
                  <p class="pdf-value">{{ quotationPreview.contacto || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Correo</p>
                  <p class="pdf-value">{{ quotationPreview.correo || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Celular</p>
                  <p class="pdf-value">{{ quotationPreview.celular || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Fecha cotización</p>
                  <p class="pdf-value">{{ formatDate(quotationPreview.fechaCotizacion) }}</p>
                </div>
              </div>
            </div>

            <!-- Información del evento -->
            <div class="pdf-section">
              <h2 class="pdf-section-title">
                <FileText :size="16" /> Detalles del Evento
              </h2>
              <div class="pdf-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="pdf-field">
                  <p class="pdf-label">Ubicación</p>
                  <p class="pdf-value">{{ quotationPreview.ubicacion || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Asistentes</p>
                  <p class="pdf-value">{{ quotationPreview.asistentes || '—' }} personas</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Inicio evento</p>
                  <p class="pdf-value">
                    {{ formatDate(quotationPreview.operationWindow?.eventStartAt) }} 
                    {{ formatTime(quotationPreview.operationWindow?.eventStartAt) }}
                  </p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Fin evento</p>
                  <p class="pdf-value">
                    {{ formatDate(quotationPreview.operationWindow?.eventEndAt) }} 
                    {{ formatTime(quotationPreview.operationWindow?.eventEndAt) }}
                  </p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Inicio montaje</p>
                  <p class="pdf-value">
                    {{ formatDate(quotationPreview.operationWindow?.setupStartAt) }} 
                    {{ formatTime(quotationPreview.operationWindow?.setupStartAt) }}
                  </p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Fin desmontaje</p>
                  <p class="pdf-value">
                    {{ formatDate(quotationPreview.operationWindow?.teardownEndAt) }} 
                    {{ formatTime(quotationPreview.operationWindow?.teardownEndAt) }}
                  </p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Tipo de suelo</p>
                  <p class="pdf-value">{{ quotationPreview.tipoSuelo || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Unidad ejecución</p>
                  <p class="pdf-value">{{ quotationPreview.unidadEjecucion || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Cantidad producto</p>
                  <p class="pdf-value">{{ quotationPreview.cantidadProducto || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Jornadas</p>
                  <p class="pdf-value">{{ quotationPreview.cantidadJornada || '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Productos -->
            <div class="pdf-section">
              <h2 class="pdf-section-title">
                <FileText :size="16" /> Productos Cotizados
              </h2>
              <table class="pdf-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-right">Precio Unit.</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(producto, idx) in (quotationPreview.items || [])" :key="idx">
                    <td>{{ producto.producto?.nombre || producto.producto?.name || 'Producto' }}</td>
                    <td class="text-center">{{ producto.cantidad || 1 }}</td>
                    <td class="text-right">
                      {{ producto.precioUnitario ? `$${producto.precioUnitario.toLocaleString('es-CO')}` : '—' }}
                    </td>
                    <td class="total text-right">
                      {{ producto.precioTotal ? `$${producto.precioTotal.toLocaleString('es-CO')}` : '—' }}
                    </td>
                  </tr>
                  <tr v-if="!quotationPreview.items || quotationPreview.items.length === 0">
                    <td colspan="4" class="text-center" style="padding: 16px; color: #6B7280;">No hay productos registrados</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Información adicional -->
            <div class="pdf-section">
              <h2 class="pdf-section-title">Información Adicional</h2>
              <div class="pdf-grid" style="grid-template-columns: repeat(3, 1fr);">
                <div class="pdf-field">
                  <p class="pdf-label">Agente comercial</p>
                  <p class="pdf-value">{{ quotationPreview.agenteComercial || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Jornadas</p>
                  <p class="pdf-value">{{ quotationPreview.cantidadJornada || '—' }}</p>
                </div>
                <div class="pdf-field">
                  <p class="pdf-label">Vigencia</p>
                  <p class="pdf-value">{{ quotationPreview.vigencia || '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="pdf-footer">
              <p class="pdf-footer-text">Gracias por confiar en BeOne Eventos Corporativos</p>
              <p class="pdf-footer-date">
                Documento generado el {{ new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) }}
              </p>
            </div>

          </div>
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

.act-collab          { background: #E0E7FF; color: #4338CA; }
.act-collab:hover    { background: #C7D2FE; }

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
