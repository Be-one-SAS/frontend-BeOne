<script setup>
import { ref, onMounted, computed } from "vue";
import { getQuotations } from "../../services/quotation.service";
import Badge from "../../components/badge/Badge.vue";
import { useRouter } from "vue-router";
import { cancelReservation, confirmReservation } from "../../services/reservation.service";
import BaseTable from "../../components/ui/BaseTable.vue";

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
</script>

<template>
  <div class=" w-full">

    <!-- Título -->
    <div>
      <h2 class="text-2xl font-bold text-blue-700">Cotizaciones</h2>
    </div>

    <!-- ======================= -->
    <!-- FILTROS -->
    <!-- ======================= -->
    <div class="mt-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
        <input v-model="search" type="text" placeholder="Número, empresa o cliente..."
          class="w-full border rounded-lg px-3 py-2" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select v-model="estadoFiltro" class="w-full border rounded-lg px-3 py-2">
          <option value="">Todos</option>
          <option v-for="e in estados" :key="e.value" :value="e.value">
            {{ e.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
        <input v-model="fechaInicioFiltro" type="date" class="w-full border rounded-lg px-3 py-2" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
        <input v-model="fechaFinFiltro" type="date" class="w-full border rounded-lg px-3 py-2" />
      </div>

    </div>

    <!-- ======================= -->
    <!-- TABLA -->
    <!-- ======================= -->
    <div class=" w-[1200px] border border-gray-200 rounded-lg">
      <table class=" table-auto text-sm">
        <thead class="bg-gray-100 text-gray-700">
          <tr>
            <th class="px-1 py-1 border">#</th>
            <th class="px-4 py-2 border">ID</th>
            <th class="px-4 py-2 border">Acciones</th>
            <th class="px-4 py-2 border">Número</th>
            <th class="px-4 py-2 border">Estado</th>
            <th class="px-4 py-2 border">Agente Comercial</th>
            <th class="px-4 py-2 border">Empresa</th>
            <th class="px-4 py-2 border">Cliente</th>
            <th class="px-4 py-2 border">Asistentes</th>
            <th class="px-4 py-2 border">Cantidad Jornada</th>
            <th class="px-4 py-2 border">Cantidad Producto</th>
            <th class="px-4 py-2 border">Ubicación</th>
            <th class="px-4 py-2 border">Tipo de Suelo</th>
            <th class="px-4 py-2 border">Unidad de Ejecución</th>
            <th class="px-4 py-2 border">Link de Mapa</th>
            <th class="px-4 py-2 border">Fecha Cotización</th>
            <th class="px-4 py-2 border">Inicio Evento</th>
            <th class="px-4 py-2 border">Fin Evento</th>
            <th class="px-4 py-2 border">Horario Inicio</th>
            <th class="px-4 py-2 border">Horario Fin</th>
            <th class="px-4 py-2 border">Celular</th>
            <th class="px-4 py-2 border">Correo</th>
            <th class="px-4 py-2 border">Contacto</th>
            <th class="px-4 py-2 border">Vigencia</th>

            <th class="px-4 py-2 border">Publicado</th>
            <th class="px-4 py-2 border">Creado</th>
            <th class="px-4 py-2 border">Actualizado</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(q, index) in quotations" :key="q.id" class="border-b hover:bg-gray-50">
            <td class="px-1 py-2 border h-1 border-gray-100">{{ index + 1 }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.id }}</td>

            <td class="px-1 py-2 border h-1 border-gray-100 min-w-[320px]">
              <div class="flex items-center gap-2">
                <button @click.stop="seeTheQuote(q.id)"
                  class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                  Ver
                </button>

                <button :disabled="q?.isPublished" @click.stop="confirmQuotation(q)"
                  :class="[q?.isPublished ? 'px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-900' : 'px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600']">
                  Confirmar
                </button>

                <button :disabled="!q?.isPublished" @click.stop="cancelQuotation(q)"
                  :class="[!q?.isPublished ? 'px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-900' : 'px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600']">

                  Cancelar
                </button>
                <button @click.stop="openClientPreview(q)" class="px-2 py-1 bg-purple-600 text-white rounded">
                  Vista cliente
                </button>
              </div>
            </td>

            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.numero }}-2026</td>

            <td class="px-1 py-2 border h-1 border-gray-100">
              <Badge :estado="q.quotationStatus?.name" />
            </td>

            <td class="px-1 py-2 border h-1 border-gray-100 min-w-[320px]">{{ q.agenteComercial }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100 min-w-[320px]">{{ q.empresa }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100 min-w-[320px]">{{ q?.cliente?.name }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.asistentes }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.cantidadJornada }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.cantidadProducto }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.ubicacion }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.tipoSuelo }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.unidadEjecucion }}</td>

            <td class="px-1 py-2 border h-1 border-gray-100">
              <a v-if="q.linkMaps" :href="q.linkMaps" target="_blank" class="text-blue-600 underline">
                Mapa
              </a>
            </td>

            <td class="px-1 py-2 border h-1 border-gray-100">
              {{ new Date(q.fechaCotizacion).toLocaleDateString() }}
            </td>
            <td class="px-1 py-2 border h-1 border-gray-100">
              {{ new Date(q.fechaInicioEvento).toLocaleDateString() }}
            </td>
            <td class="px-1 py-2 border h-1 border-gray-100">
              {{ new Date(q.fechaFinEvento).toLocaleDateString() }}
            </td>

            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.horarioInicio }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.horarioFin }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.celular }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.correo }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.contacto }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.vigencia }}</td>

            <td class="px-1 py-2 border h-1 border-gray-100">{{ q.isPublished ? "Sí" : "No" }}</td>
            <td class="px-1 py-2 border h-1 border-gray-100">
              {{ new Date(q.createdAt).toLocaleString() }}
            </td>
            <td class="px-1 py-2 border h-1 border-gray-100">
              {{ new Date(q.updatedAt).toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ======================= -->
    <!-- MODAL CONFIRMACIÓN ÉXITO -->
    <!-- ======================= -->
    <div v-if="isSuccessModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
        <h3 class="text-lg font-semibold text-green-600">
          Cotización confirmada con éxito
        </h3>

        <p class="text-sm text-gray-700">
          Los productos agregados en esta cotización no estarán disponibles
          en las fechas establecidas.
        </p>

        <div class="flex justify-end">
          <button @click="closeSuccessModal" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Entendido
          </button>
        </div>
      </div>
    </div>


    <!-- MODAL ÉXITO -->
    <div v-if="isSuccessModalOpen" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div class="bg-white p-6 rounded-xl max-w-md w-full">
        <h3 class="text-green-600 font-semibold text-lg">
          Cotización confirmada con éxito
        </h3>
        <p class="mt-2 text-sm">
          Los productos no estarán disponibles en las fechas seleccionadas.
        </p>
        <div class="flex justify-end mt-4">
          <button @click="closeSuccessModal" class="px-4 py-2 bg-blue-600 text-white rounded">
            Entendido
          </button>
        </div>
      </div>
    </div>
  </div>
</template>