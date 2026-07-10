<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { getQuotations, getQuotationById, getCommissionsReport } from "../../services/quotation.service";
import Badge from "../../components/badge/Badge.vue";
import { useRouter, useRoute } from "vue-router";
import { cancelReservation, confirmReservation } from "../../services/reservation.service";
import BaseTable from "../../components/ui/BaseTable.vue";
import SelectLabel from "../../components/input/SelectLabel.vue";
import CollaboratorsManager from "./components/CollaboratorsManager.vue";
import QuotationPDF from "../../components/quotation/QuotationPDF.vue";
import { ChevronDown, Eye, CheckCircle, XCircle, FileText, Inbox, Users, Download, X, Printer, StickyNote, Plus, Trash2, Clock, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-vue-next';
import ThumbHoverPreview from '@/components/shared/ThumbHoverPreview.vue';
import { useThumbHoverPreview } from '@/composables/useThumbHoverPreview';
import { useAuth } from "../../composables/useAuth";
import { useActionAccess } from "../../composables/useActionAccess";
import { getSedes } from "../../services/sedes.service";
import { formatCOP } from "../../utils/currency.js";
import {
  AREAS_NOTA,
  createNotaCotizacion,
  getNotasByCotizacion,
  deleteNotaCotizacion,
} from "../../services/nota-cotizacion.service";

const { push } = useRouter();
const route    = useRoute();

// ── Preview ampliado al hover sobre el NOMBRE del producto (sin miniatura visible) ──
const { preview: thumbPreview, showPreview: showThumbPreview, hidePreview: hideThumbPreview } = useThumbHoverPreview()

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
  { label: "Vencida",   value: "Vencida"   },
];

// ----------------------
// TABS
// ----------------------
const activeTab = ref('listado'); // 'listado' | 'comisiones'

// ----------------------
// COMISIONES
// ----------------------
const { user } = useAuth();
const userRoles = computed(() => user.value?.roles ?? []);
const { canDo } = useActionAccess();
const mostrarFiltroSedeComisiones = computed(() =>
  !user.value?.sedeId && userRoles.value.some(r => ['ADMIN', 'ADMINISTRADOR', 'DIRECCION'].includes(r))
);

const comisionesFiltros = ref({ fechaDesde: '', fechaHasta: '', estado: '', search: '', sedeId: '', vendedor: '' });
const comisionesRowsRaw = ref([]);
const loadingComisiones = ref(false);
const sedeOptionsComisiones = ref([]);

// Paginación por COTIZACIÓN (no por fila): una cotización con varios ítems
// aporta varias filas, así que el backend pagina antes de explotar por producto.
const COMISIONES_PAGE_LIMIT = 30;
const comisionesPage = ref(1);
const comisionesTotalPages = ref(1);
const comisionesTotalQuotations = ref(0);
const comisionesVisiblePages = computed(() => {
  const total = comisionesTotalPages.value;
  const current = comisionesPage.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
});

// Vista simplificada de vendedor, una fila por producto (propio o de
// tercero). El desglose completo (utilidad, margen equivalente, comisión
// estructural, reserva) vive en /configuracion/comisiones.
const comisionesColumns = [
  { key: 'numero', label: 'Cotización', width: '90px' },
  { key: 'producto', label: 'Producto' },
  { key: 'tipo', label: 'Tipo', width: '90px' },
  { key: 'empresa', label: 'Cliente' },
  { key: 'vendedorNombre', label: 'Vendedor' },
  { key: 'cantidad', label: 'Cant.', width: '70px' },
  { key: 'costo', label: 'Costo' },
  { key: 'venta', label: 'Venta' },
  { key: 'comisionVisiblePct', label: '% Comisión' },
  { key: 'comisionVisibleMonto', label: 'Comisión $' },
];

const comisionesRows = computed(() => comisionesRowsRaw.value);

const cargarSedesComisiones = async () => {
  if (!mostrarFiltroSedeComisiones.value) return;
  try {
    const { data } = await getSedes();
    sedeOptionsComisiones.value = (Array.isArray(data) ? data : []).map(s => ({ value: s.id, label: s.nombre }));
  } catch (error) {
    console.error("Error cargando sedes:", error);
  }
};

const cargarComisiones = async () => {
  loadingComisiones.value = true;
  try {
    const isAdmin = userRoles.value.some(r => ['ADMINISTRADOR', 'ADMIN', 'DIRECCION', 'LIDER', 'SUPERVISOR'].includes(r));
    const { data } = await getCommissionsReport({
      ...comisionesFiltros.value,
      allSedes: isAdmin,
      page: comisionesPage.value,
      pageLimit: COMISIONES_PAGE_LIMIT,
    });
    comisionesRowsRaw.value = data.data;
    comisionesTotalPages.value = data.totalPages;
    comisionesTotalQuotations.value = data.totalQuotations;
  } catch (error) {
    console.error("Error cargando comisiones:", error);
    alert('Error al cargar las comisiones. Verifica los filtros e intenta de nuevo.');
  } finally {
    loadingComisiones.value = false;
  }
};

const aplicarFiltrosComisiones = () => {
  comisionesPage.value = 1;
  cargarComisiones();
};

const cambiarPaginaComisiones = (p) => {
  if (p < 1 || p > comisionesTotalPages.value || p === comisionesPage.value) return;
  comisionesPage.value = p;
  cargarComisiones();
};

// Carga perezosa: solo la primera vez que se entra a la pestaña
watch(activeTab, (tab) => {
  if (tab === 'comisiones' && !comisionesRowsRaw.value.length) {
    cargarSedesComisiones();
    cargarComisiones();
  }
});

// ── Soft-lock countdown ──────────────────────────────────
const LOCK_DAYS  = 7
const LOCK_HOURS = LOCK_DAYS * 24  // 168 h total

const pendingLockInfo = (q) => {
  if (q.quotationStatus?.name !== 'Pendiente' || !q.createdAt) return null
  const deadline  = new Date(q.createdAt).getTime() + LOCK_HOURS * 60 * 60 * 1000
  const msLeft    = deadline - Date.now()
  if (msLeft <= 0) return { expired: true, hoursLeft: 0, hoursElapsed: LOCK_HOURS }
  const hoursLeft    = Math.ceil(msLeft / (1000 * 60 * 60))
  const hoursElapsed = LOCK_HOURS - hoursLeft
  return { expired: false, hoursLeft, hoursElapsed }
}
const lockColor = (hoursLeft) => {
  if (hoursLeft > 96) return { text: '#27C8D8', track: '#CCEFF2', fill: '#27C8D8' }
  if (hoursLeft > 48) return { text: '#92400E', track: '#FEF3C7', fill: '#F59E0B' }
  return              { text: '#B91C1C', track: '#FEE2E2', fill: '#EF4444' }
}

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

// ── Paginación ────────────────────────────────────────
const currentPage  = ref(1)
const pageSize     = ref(25)

const pagedQuotations = computed(() => {
  const start = (currentPage.value - 1) * Number(pageSize.value)
  return filteredQuotations.value.slice(start, start + Number(pageSize.value))
})
const totalPages = computed(() => Math.ceil(filteredQuotations.value.length / Number(pageSize.value)))
const visiblePages = computed(() => {
  const total = totalPages.value, cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)          return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3)  return [1, '...', total-4, total-3, total-2, total-1, total]
  return [1, '...', cur-1, cur, cur+1, '...', total]
})
watch([search, estadoFiltro, fechaInicioFiltro, fechaFinFiltro], () => { currentPage.value = 1 })

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

onMounted(async () => {
  await loadQuotations();
  const targetId = route.query.id;
  if (targetId) {
    expandedRow.value = targetId;
    await nextTick();
    document.getElementById(`row-${targetId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
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
const showPDFFullscreen = ref(false);

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
  showPDFFullscreen.value = false;
};

const openPDFFullscreen = async (quotation) => {
  isLoadingPreview.value = true;
  try {
    const response = await getQuotationById(quotation.id);
    quotationPreview.value = response.data;
    showPDFFullscreen.value = true;
  } catch (error) {
    console.error("Error cargando cotización para PDF:", error);
  } finally {
    isLoadingPreview.value = false;
  }
};

const downloadPDF = async () => {
  if (!quotationPreview.value) return;
  
  await nextTick();
  
  // Verificar si html2pdf está disponible
  if (typeof window.html2pdf === 'undefined') {
    // Fallback: imprimir
    const printWindow = window.open('', '_blank');
    const element = document.getElementById('quotation-pdf-content');
    if (element) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cotización ${quotationPreview.value.numero}</title>
            <style>
              @media print {
                @page { margin: 10mm; size: A4; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>${element.outerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    return;
  }
  
  const element = document.getElementById('quotation-pdf-content');
  const filename = `Cotizacion_${quotationPreview.value.numero}_${(quotationPreview.value.empresa || 'Cliente').replace(/[^a-z0-9]/gi, '_')}.pdf`;
  
  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true,
    },
    // 'avoid-all' empuja bloques grandes completos a la siguiente página
    // cuando no caben enteros, dejando huecos en blanco — con 'css' basta:
    // respeta los break-inside/break-before que ya definimos en elementos
    // puntuales (filas, tarjetas, notas) sin forzar el salto de secciones
    // completas.
    pagebreak: { mode: ['css', 'legacy'] },
  };
  
  try {
    await window.html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar el PDF. Por favor intenta nuevamente.');
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

// ----------------------
// MODAL NOTAS
// ----------------------
const isNotasModalOpen = ref(false);
const selectedQuotationForNotas = ref(null);
const notasDeCotizacion = ref([]);
const notaCargando = ref(false);
const notaGuardando = ref(false);
const notaNueva = ref({ contenido: '', area: '' });

const openNotasModal = async (quotation) => {
  selectedQuotationForNotas.value = quotation;
  notaNueva.value = { contenido: '', area: '' };
  notaCargando.value = true;
  isNotasModalOpen.value = true;
  try {
    notasDeCotizacion.value = await getNotasByCotizacion(quotation.id);
  } catch (e) {
    console.error('[VerCotizaciones] Error cargando notas:', e);
  } finally {
    notaCargando.value = false;
  }
};

const closeNotasModal = () => {
  isNotasModalOpen.value = false;
  selectedQuotationForNotas.value = null;
  notasDeCotizacion.value = [];
};

const agregarNota = async () => {
  if (!notaNueva.value.contenido.trim() || !notaNueva.value.area) return;
  notaGuardando.value = true;
  try {
    const creada = await createNotaCotizacion({
      contenido: notaNueva.value.contenido.trim(),
      area: notaNueva.value.area,
      cotizacionId: selectedQuotationForNotas.value.id,
    });
    notasDeCotizacion.value.unshift(creada);
    notaNueva.value = { contenido: '', area: '' };
  } catch (e) {
    console.error('[VerCotizaciones] Error al agregar nota:', e);
  } finally {
    notaGuardando.value = false;
  }
};

const eliminarNota = async (notaId) => {
  if (!confirm('¿Eliminar esta nota?')) return;
  try {
    await deleteNotaCotizacion(notaId);
    notasDeCotizacion.value = notasDeCotizacion.value.filter((n) => n.id !== notaId);
  } catch (e) {
    console.error('[VerCotizaciones] Error al eliminar nota:', e);
  }
};

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
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
    <!-- TABS                                       -->
    <!-- ══════════════════════════════════════════ -->
    <div class="vc-tabs">
      <button
        type="button"
        class="vc-tab"
        :class="{ 'vc-tab--active': activeTab === 'listado' }"
        @click="activeTab = 'listado'"
      >
        Listado
      </button>
      <button
        type="button"
        class="vc-tab"
        :class="{ 'vc-tab--active': activeTab === 'comisiones' }"
        @click="activeTab = 'comisiones'"
      >
        Comisiones
      </button>
    </div>

    <template v-if="activeTab === 'listado'">

    <!-- ══════════════════════════════════════════ -->
    <!-- FILTROS                                    -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(39,200,216,.06)] grid grid-cols-1 md:grid-cols-4 gap-4">

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
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(39,200,216,.06),_0_4px_16px_rgba(39,200,216,.08)] overflow-hidden">
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
              <th class="vc-th" style="width:110px">Unidad</th>
              <th class="vc-th vc-th-center" style="width:100px">Asistentes</th>
              <th class="vc-th">Acciones</th>
            </tr>
          </thead>

          <!-- BODY -->
          <tbody>
            <template v-for="(q, index) in pagedQuotations" :key="q.id">

              <!-- ── Fila principal ── -->
              <tr :id="`row-${q.id}`" class="vc-row" @click="toggleRow(q.id)">

                <!-- Toggle chevron -->
                <td class="vc-td vc-td-center">
                  <ChevronDown
                    :size="14"
                    class="vc-chevron"
                    :class="{ 'vc-chevron-open': expandedRow === q.id }"
                  />
                </td>

                <!-- # -->
                <td class="vc-td vc-td-center vc-idx">{{ index + 1 + (currentPage - 1) * Number(pageSize) }}</td>

                <!-- Cotización: número + badge estado -->
                <td class="vc-td">
                  <div class="vc-quot-cell">
                    <span class="vc-num">{{ q.numero }}-2026</span>
                    <Badge :estado="q.quotationStatus?.name" />
                    <!-- Barra de progreso de bloqueo temporal -->
                    <template v-if="pendingLockInfo(q)">
                      <div style="width:100%;display:flex;flex-direction:column;gap:3px;margin-top:4px">
                        <!-- Label -->
                        <div
                          style="display:flex;align-items:center;gap:3px;font-size:10px;font-weight:600"
                          :style="{ color: pendingLockInfo(q).expired ? '#94A3B8' : lockColor(pendingLockInfo(q).hoursLeft).text }"
                        >
                          <Clock :size="9" />
                          <span v-if="!pendingLockInfo(q).expired">{{ pendingLockInfo(q).hoursLeft }}h restantes de 168h</span>
                          <span v-else>Productos liberados</span>
                        </div>
                        <!-- Track -->
                        <div
                          style="width:100%;height:8px;border-radius:99px;overflow:hidden"
                          :style="{ background: pendingLockInfo(q).expired ? '#F1F5F9' : lockColor(pendingLockInfo(q).hoursLeft).track }"
                        >
                          <!-- Fill -->
                          <div
                            style="height:100%;border-radius:99px;transition:width 0.4s ease"
                            :style="{
                              width: ((pendingLockInfo(q).hoursElapsed / LOCK_HOURS) * 100).toFixed(1) + '%',
                              background: pendingLockInfo(q).expired ? '#CBD5E1' : lockColor(pendingLockInfo(q).hoursLeft).fill
                            }"
                          />
                        </div>
                      </div>
                    </template>
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

                <!-- Unidad ejecución -->
                <td class="vc-td">
                  <span v-if="q.unidadEjecucion" class="vc-unidad-badge">{{ q.unidadEjecucion }}</span>
                  <span v-else class="vc-unidad-empty">—</span>
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
                      v-if="canDo('ReservationConfirm', ['ADMINISTRADOR', 'LIDER', 'SUPERVISOR'])"
                      :disabled="q?.isPublished"
                      @click.stop="confirmQuotation(q)"
                      :class="q?.isPublished ? 'act-btn act-disabled' : 'act-btn act-confirm'"
                    >
                      <CheckCircle :size="12" /> Confirmar
                    </button>

                    <!-- Cancelar (lógica original exacta) -->
                    <button
                      v-if="canDo('ReservationCancel', ['ADMINISTRADOR', 'LIDER', 'SUPERVISOR'])"
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

                    <!-- Notas -->
                    <button
                      @click.stop="openNotasModal(q)"
                      class="act-btn act-notas"
                    >
                      <StickyNote :size="12" /> Notas
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

                      <!-- ── Productos ── -->
                      <div v-if="(q.items?.length || q.thirdPartyItems?.length)" class="vc-products-section">
                        <div class="vc-products-title">Productos</div>
                        <div class="vc-products-list">
                          <div
                            v-for="item in q.items"
                            :key="'p' + item.id"
                            class="vc-product-row"
                          >
                            <span class="vc-product-badge vc-badge-own">Propio</span>
                            <span
                              class="vc-product-name"
                              @mouseenter="showThumbPreview($event, item.product?.linkFotoDispositivo)"
                              @mouseleave="hideThumbPreview"
                            >{{ item.product?.nombre || item.product?.dispositivo }}</span>
                            <span class="vc-product-qty">× {{ item.cantidadProducto ?? item.quantity ?? 1 }}</span>
                            <span v-if="item.product?.categoria" class="vc-product-cat">{{ item.product.categoria }}</span>
                          </div>
                          <div
                            v-for="item in q.thirdPartyItems"
                            :key="'tp' + item.id"
                            class="vc-product-row"
                          >
                            <span class="vc-product-badge vc-badge-tp">Tercero</span>
                            <span
                              class="vc-product-name"
                              @mouseenter="showThumbPreview($event, item.catalogProduct?.linkFotoDispositivo)"
                              @mouseleave="hideThumbPreview"
                            >{{ item.catalogProduct?.nombre || item.catalogProduct?.dispositivo || item.catalogProduct?.descripcion }}</span>
                            <span class="vc-product-qty">× {{ item.cantidad ?? 1 }}</span>
                            <span v-if="item.catalogProduct?.categoria" class="vc-product-cat">{{ item.catalogProduct.categoria }}</span>
                          </div>
                        </div>
                      </div>
                      <div v-else class="vc-products-section">
                        <div class="vc-products-title">Productos</div>
                        <span class="vc-exp-val" style="font-size:12px;color:#94A3B8">Sin productos agregados</span>
                      </div>

                    </div>
                  </div>
                </td>
              </tr>

            </template>
          </tbody>

        </table>
      </div>

      <!-- Paginación -->
      <div class="pp-pagination">
        <span class="pg-info">
          {{ (currentPage - 1) * Number(pageSize) + 1 }}–{{ Math.min(currentPage * Number(pageSize), filteredQuotations.length) }}
          de {{ filteredQuotations.length }}
        </span>
        <div class="pg-pages">
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage = 1"><ChevronsLeft :size="14" /></button>
          <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft :size="14" /></button>
          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="pg-ellipsis">…</span>
            <button v-else class="pg-btn pg-num" :class="{ 'pg-active': p === currentPage }" @click="currentPage = p">{{ p }}</button>
          </template>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight :size="14" /></button>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages"><ChevronsRight :size="14" /></button>
        </div>
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

    </template>

    <template v-else-if="activeTab === 'comisiones'">

    <!-- ══════════════════════════════════════════ -->
    <!-- FILTROS — COMISIONES                       -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(39,200,216,.06)] grid grid-cols-1 md:grid-cols-5 gap-4">

      <input v-model="comisionesFiltros.fechaDesde" type="date" class="vc-input" title="Desde" />
      <input v-model="comisionesFiltros.fechaHasta" type="date" class="vc-input" title="Hasta" />

      <SelectLabel
        v-model="comisionesFiltros.estado"
        :options="estados"
        placeholder="Todos los estados"
      />

      <input
        v-model="comisionesFiltros.search"
        type="text"
        placeholder="Número, empresa o vendedor…"
        class="vc-input"
      />

      <SelectLabel
        v-if="mostrarFiltroSedeComisiones"
        v-model="comisionesFiltros.sedeId"
        :options="sedeOptionsComisiones"
        placeholder="Todas las unidades"
      />

      <button
        type="button"
        class="vc-btn-apply"
        :disabled="loadingComisiones"
        @click="aplicarFiltrosComisiones"
      >
        {{ loadingComisiones ? 'Cargando…' : 'Aplicar filtros' }}
      </button>

    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA — COMISIONES                         -->
    <!-- ══════════════════════════════════════════ -->
    <BaseTable
      :columns="comisionesColumns"
      :rows="comisionesRows"
      :loading="loadingComisiones"
      empty-text="No hay cotizaciones con comisión en este período"
      :page-size="500"
    >
      <template #cell-tipo="{ value }">{{ value === 'PROPIO' ? 'Propio' : 'Tercero' }}</template>
      <template #cell-costo="{ value }">{{ formatCOP(value) }}</template>
      <template #cell-venta="{ value }">{{ formatCOP(value) }}</template>
      <template #cell-comisionVisiblePct="{ value }">{{ value }}%</template>
      <template #cell-comisionVisibleMonto="{ value }">{{ formatCOP(value) }}</template>
    </BaseTable>

    <!-- Paginación por cotización (no por fila) -->
    <div class="vc-pagination">
      <span class="vc-pag-info">
        Página {{ comisionesPage }} de {{ comisionesTotalPages }} · {{ comisionesTotalQuotations }} cotizaciones
      </span>
      <div class="vc-pag-btns">
        <button class="vc-pag-btn" :disabled="comisionesPage <= 1" @click="cambiarPaginaComisiones(comisionesPage - 1)">‹</button>
        <button
          v-for="p in comisionesVisiblePages"
          :key="p"
          class="vc-pag-btn"
          :class="{ 'vc-pag-btn--active': p === comisionesPage }"
          @click="cambiarPaginaComisiones(p)"
        >{{ p }}</button>
        <button class="vc-pag-btn" :disabled="comisionesPage >= comisionesTotalPages" @click="cambiarPaginaComisiones(comisionesPage + 1)">›</button>
      </div>
    </div>

    </template>

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
      <div class="bg-white rounded-[20px] shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <!-- Header del modal -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#27C8D8] to-[#1BAEBB]">
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
          <div id="quotation-pdf-content" class="max-w-[210mm] mx-auto">
            <QuotationPDF :quotation="quotationPreview" />
          </div>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL PDF FULLSCREEN (alternative view)    -->
    <!-- ══════════════════════════════════════════ -->
    <div
      v-if="showPDFFullscreen && quotationPreview"
      class="fixed inset-0 bg-white z-[60] overflow-auto"
    >
      <div class="sticky top-0 bg-gradient-to-r from-[#27C8D8] to-[#1BAEBB] px-6 py-4 flex items-center justify-between shadow-lg">
        <div class="flex items-center gap-3">
          <FileText class="text-white" :size="20" />
          <h3 class="text-[16px] font-semibold text-white">
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
            <X :size="20" /> Cerrar
          </button>
        </div>
      </div>
      
      <div class="p-8 bg-gray-50 min-h-screen">
        <div id="quotation-pdf-content" class="max-w-[210mm] mx-auto bg-white shadow-xl">
          <QuotationPDF :quotation="quotationPreview" />
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL NOTAS                                -->
    <!-- ══════════════════════════════════════════ -->
    <div
      v-if="isNotasModalOpen"
      class="fixed inset-0 bg-[rgba(15,26,46,0.4)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div class="vc-notas-modal">

        <!-- Header -->
        <div class="vc-notas-header">
          <div class="flex items-center gap-2">
            <StickyNote :size="18" class="text-[#27C8D8]" />
            <div>
              <h3 class="vc-notas-title">Notas de cotización</h3>
              <p class="vc-notas-sub">#{{ selectedQuotationForNotas?.numero }}-2026 · {{ selectedQuotationForNotas?.empresa || '—' }}</p>
            </div>
          </div>
          <button class="vc-notas-close" @click="closeNotasModal">
            <X :size="18" />
          </button>
        </div>

        <!-- Lista de notas -->
        <div class="vc-notas-list-wrap">
          <div v-if="notaCargando" class="vc-notas-empty">Cargando notas…</div>
          <div v-else-if="!notasDeCotizacion.length" class="vc-notas-empty">
            <StickyNote :size="32" class="vc-notas-empty-ico" />
            <p>Sin notas registradas</p>
          </div>
          <div v-else class="vc-notas-list">
            <div v-for="nota in notasDeCotizacion" :key="nota.id" class="vc-nota-row">
              <div class="nota-area-badge" :data-area="nota.area">{{ nota.area }}</div>
              <p class="vc-nota-contenido">{{ nota.contenido }}</p>
              <div class="vc-nota-meta">
                <span class="vc-nota-fecha">{{ formatDateTime(nota.createdAt) }}</span>
                <button class="vc-nota-del" @click="eliminarNota(nota.id)" title="Eliminar">
                  <Trash2 :size="13" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulario -->
        <div class="vc-notas-form">
          <div class="vc-notas-form-row">
            <div class="vc-field-wrap">
              <label class="vc-field-lbl">Área</label>
              <select v-model="notaNueva.area" class="vc-field-sel">
                <option value="" disabled>Seleccionar área…</option>
                <option v-for="area in AREAS_NOTA" :key="area" :value="area">{{ area }}</option>
              </select>
            </div>
          </div>
          <div class="vc-field-wrap">
            <label class="vc-field-lbl">Nota</label>
            <textarea
              v-model="notaNueva.contenido"
              class="vc-nota-textarea"
              placeholder="Escribe una nota…"
              rows="3"
            />
          </div>
          <div class="flex justify-end">
            <button
              class="vc-nota-add-btn"
              @click="agregarNota"
              :disabled="!notaNueva.contenido.trim() || !notaNueva.area || notaGuardando"
            >
              <Plus :size="14" />
              {{ notaGuardando ? 'Guardando…' : 'Agregar nota' }}
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>

  <ThumbHoverPreview :preview="thumbPreview" />
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
  border-color: var(--primary, #27C8D8);
  box-shadow: 0 0 0 3px rgba(39,200,216, 0.1);
}

.vc-input::placeholder { color: var(--text-3, #94A3B8); }

/* ─── Tabs ──────────────────────────────────────────── */
.vc-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid #E5EAF0;
}

.vc-tab {
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: var(--text-3, #94A3B8);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.vc-tab:hover { color: var(--text-1, #0F1A2E); }

.vc-tab--active {
  color: var(--primary, #27C8D8);
  border-bottom-color: var(--primary, #27C8D8);
}

/* ─── Botón "Aplicar filtros" ─────────────────────────── */
.vc-btn-apply {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--primary, #27C8D8);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.vc-btn-apply:disabled { opacity: 0.6; cursor: not-allowed; }
.vc-btn-apply:hover:not(:disabled) { opacity: 0.9; }

/* ─── Paginación ───────────────────────────────────────── */
.vc-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.vc-pag-info {
  font-size: 12px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
}

.vc-pag-btns { display: flex; gap: 4px; }

.vc-pag-btn {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: #fff;
  color: var(--text-1, #0F1A2E);
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.vc-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.vc-pag-btn:hover:not(:disabled) { background: #F8FAFC; }

.vc-pag-btn--active {
  background: var(--primary, #27C8D8);
  border-color: var(--primary, #27C8D8);
  color: #fff;
}

/* ─── Paginación (estilo Products) ───────────────────── */
.pp-pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #F0FAFB; flex-wrap: wrap; gap: 8px; }
.pg-info { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; }
.pg-pages { display: flex; align-items: center; gap: 4px; }
.pg-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #E2EBF6; background: #FFFFFF; color: #64748B; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
.pg-btn:hover:not(:disabled) { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-active { background: #27C8D8 !important; color: #FFFFFF !important; border-color: #27C8D8 !important; font-weight: 600; }
.pg-ellipsis { color: #94A3B8; font-size: 13px; padding: 0 4px; }

/* ─── Tabla ─────────────────────────────────────────── */
.vc-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

/* ─── Head ──────────────────────────────────────────── */
.vc-head-row { background: #F0FAFB; }

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
  border-bottom: 1px solid #F0FAFB;
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
  color: #27C8D8;
}

/* ─── Cell: cotización ──────────────────────────────── */
.vc-quot-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vc-num {
  font-weight: 700;
  font-size: 13px;
  color: #27C8D8;
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
  flex-wrap: wrap;
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

.act-view            { background: #CCEFF2; color: #27C8D8; }
.act-view:hover      { background: #A7EEF5; }

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
  border-bottom: 1px solid #F0FAFB;
}

/* El div interno hace la transición — el <tr> siempre está en el DOM */
.vc-exp-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}

.vc-exp-open { max-height: 1200px; }

.vc-exp-inner {
  background: #F8FBFF;
  border-left: 3px solid #27C8D8;
  padding: 16px 24px;
}

.vc-exp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
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

/* ─── Productos en panel expandido ─────────────────── */
.vc-products-section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #E2EDF8;
}
.vc-products-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #94A3B8; margin-bottom: 8px;
}
.vc-products-list { display: flex; flex-direction: column; gap: 5px; }
.vc-product-row {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #E2E8F0; border-radius: 7px;
  padding: 6px 10px;
}
.vc-product-name {
  flex: 1; font-size: 13px; font-weight: 500; color: #0F172A;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  cursor: default;
}
.vc-product-name:hover { text-decoration: underline; text-decoration-color: #CBD5E1; text-underline-offset: 2px; }
.vc-product-qty {
  font-size: 12px; color: #64748B; font-weight: 600; white-space: nowrap;
}
.vc-product-cat {
  font-size: 11px; color: #64748B; background: #F1F5F9;
  padding: 1px 7px; border-radius: 99px; white-space: nowrap;
}
.vc-product-badge {
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 5px; white-space: nowrap;
}
.vc-badge-own { background: #E0F9FA; color: #27C8D8; }
.vc-badge-tp  { background: #FFF7ED; color: #C2410C; }

.vc-link {
  color: #27C8D8;
  text-decoration: underline;
  font-size: 13px;
  font-weight: 500;
}

.vc-link:hover { color: #1BAEBB; }

/* ─── Botón Notas ───────────────────────────────────── */
.act-notas          { background: #FEF9C3; color: #854D0E; }
.act-notas:hover    { background: #FEF08A; }

/* ─── Modal Notas ───────────────────────────────────── */
.vc-notas-modal {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(15, 26, 46, 0.18);
  width: 100%;
  max-width: 520px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vc-notas-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #EEF1F7;
}

.vc-notas-title {
  font-size: 15px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin: 0;
  line-height: 1.3;
}

.vc-notas-sub {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 2px 0 0;
}

.vc-notas-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #94A3B8;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.vc-notas-close:hover { color: #0F1A2E; background: #F1F5F9; }

.vc-notas-list-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vc-notas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
  color: #94A3B8;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}
.vc-notas-empty-ico { color: #CBD5E1; }

.vc-notas-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vc-nota-row {
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nota-area-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 10px;
  border-radius: 99px;
  width: fit-content;
  font-family: 'Inter', sans-serif;
}
.nota-area-badge[data-area="Comercial"]       { background: #CCEFF2; color: #27C8D8; }
.nota-area-badge[data-area="Operativo"]       { background: #D1FAE5; color: #065F46; }
.nota-area-badge[data-area="Administrativo"]  { background: #FEF3C7; color: #92400E; }
.nota-area-badge[data-area="Logístico"]       { background: #EDE9FE; color: #5B21B6; }

.vc-nota-contenido {
  font-size: 13px;
  color: #374151;
  font-family: 'Inter', sans-serif;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.vc-nota-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vc-nota-fecha {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

.vc-nota-del {
  background: none;
  border: none;
  cursor: pointer;
  color: #CBD5E1;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.vc-nota-del:hover { color: #B91C1C; background: #FEE2E2; }

.vc-notas-form {
  border-top: 1px solid #EEF1F7;
  padding: 16px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #FAFBFD;
}

.vc-notas-form-row {
  display: flex;
  gap: 10px;
}

.vc-field-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.vc-field-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  font-family: 'Inter', sans-serif;
}

.vc-field-sel {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 99px;
  padding: 8px 14px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.vc-field-sel:focus { border-color: #27C8D8; box-shadow: 0 0 0 2px rgba(39,200,216,.12); }

.vc-nota-textarea {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
  line-height: 1.5;
  box-sizing: border-box;
}
.vc-nota-textarea:focus { border-color: #27C8D8; box-shadow: 0 0 0 2px rgba(39,200,216,.12); }
.vc-nota-textarea::placeholder { color: #94A3B8; }

.vc-nota-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  background: #27C8D8;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.vc-nota-add-btn:hover:not(:disabled) { background: #1BAEBB; }
.vc-nota-add-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.vc-unidad-badge {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  background: #E0F9FA; color: #27C8D8;
  padding: 2px 8px; border-radius: 99px;
  white-space: nowrap;
}
.vc-unidad-empty { color: #CBD5E1; font-size: 13px; }

/* Lock bar — todo inline, este bloque está vacío intencionalmente */

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════════════════ */

/* 1200px — small desktops */
@media (max-width: 1200px) {
  .vc-exp-grid { grid-template-columns: repeat(3, 1fr); }
}

/* 1024px — tablets portrait */
@media (max-width: 1024px) {
  .vc-title { font-size: 22px; }
  .vc-exp-grid { grid-template-columns: repeat(2, 1fr); }
}

/* 768px — mobile large */
@media (max-width: 768px) {
  .vc-exp-grid { grid-template-columns: repeat(2, 1fr); }

  .vc-actions { flex-wrap: wrap; gap: 4px; }
  .act-btn { padding: 5px 8px; font-size: 10px; gap: 3px; }
  .act-btn span { display: none; }

  .vc-th,
  .vc-td { padding: 10px 10px; font-size: 12px; }
  .vc-th { font-size: 10px; }
  .vc-num { font-size: 12px; }

  .vc-exp-inner { padding: 12px 16px; }

  .vc-notas-modal { max-width: 100%; margin: 0 12px; max-height: 90vh; }
  .vc-notas-header { padding: 16px 18px 12px; }
  .vc-notas-list-wrap { padding: 12px 18px; }
  .vc-notas-form { padding: 12px 18px 16px; }
  .vc-notas-form-row { flex-direction: column; gap: 8px; }
  .vc-nota-add-btn { width: 100%; justify-content: center; }
}

/* 640px — mobile medium */
@media (max-width: 640px) {
  .vc-page { gap: 14px; }
  .vc-title { font-size: 20px; }
  .vc-subtitle { font-size: 12px; }

  .vc-input { padding: 7px 12px; font-size: 12px; }

  .vc-th,
  .vc-td { padding: 8px 8px; font-size: 11px; }

  .vc-exp-grid { grid-template-columns: 1fr; gap: 10px 16px; }
  .vc-exp-inner { padding: 10px 14px; }
  .vc-exp-label { font-size: 10px; }
  .vc-exp-val { font-size: 12px; }

  .vc-empresa { font-size: 12px; }
  .vc-client-name { font-size: 10px; }
  .vc-ubicacion { font-size: 12px; }
  .vc-fecha-ev { font-size: 10px; }

  .vc-product-row { flex-wrap: wrap; gap: 4px; padding: 5px 8px; }
  .vc-product-name { font-size: 11px; }
  .vc-product-qty { font-size: 10px; }
  .vc-product-cat { font-size: 10px; }

  .vc-idx { font-size: 10px; }
  .vc-unidad-badge { font-size: 10px; padding: 1px 6px; }
  .vc-chevron { width: 12px; height: 12px; }
}

/* 480px — mobile small */
@media (max-width: 480px) {
  .vc-page { gap: 12px; }
  .vc-title { font-size: 18px; }
  .flex.items-center.justify-between.mb-6 { flex-direction: column; align-items: flex-start; gap: 8px; }

  .vc-th:nth-child(5),
  .vc-td:nth-child(5) { display: none; }
  .vc-th:nth-child(7),
  .vc-td:nth-child(7) { display: none; }
  .vc-th:nth-child(8),
  .vc-td:nth-child(8) { display: none; }

  .vc-th,
  .vc-td { padding: 6px 6px; font-size: 10px; }
  .vc-num { font-size: 11px; }

  .act-btn { padding: 4px 6px; font-size: 9px; }
  .act-btn svg { width: 10px; height: 10px; }

  .vc-input { padding: 6px 10px; font-size: 11px; }

  .vc-client-cell { gap: 1px; }
  .vc-event-cell { gap: 1px; }
  .vc-quot-cell { gap: 2px; }

  .vc-notas-header { flex-direction: column; gap: 8px; }
  .vc-notas-title { font-size: 14px; }
  .vc-notas-close { align-self: flex-end; }
  .vc-nota-row { padding: 10px 12px; }

  /* Ocultar Asistentes en mobile pequeño */
  .vc-td.vc-td-center:last-of-type { display: none; }
  .vc-th.vc-th-center:last-of-type { display: none; }
}

/* 360px — muy pequeño */
@media (max-width: 360px) {
  .vc-title { font-size: 16px; }
  .vc-th:nth-child(4),
  .vc-td:nth-child(4) { display: none; }

  .vc-th,
  .vc-td { padding: 4px 4px; font-size: 9px; }
  .vc-unidad-badge { font-size: 8px; padding: 1px 4px; }
  .vc-exp-inner { padding: 8px 10px; }
  .vc-exp-grid { gap: 6px 10px; }
  .vc-input { padding: 5px 8px; font-size: 10px; }
}
</style>
