<template>
  <div class="flex w-full gap-5 ">
    <div class=" w-full">
      <div class=" w-full mx-auto space-y-8 mb-10">

        <div class="flex justify-between items-center mb-4">
          <QuotationNextNumber />

          <!-- Botones y versión solo si hay ID en la URL -->
          <div v-if="id" class="flex items-center gap-4">
            <!-- Botones -->
            <div class="flex gap-2">
              <button :class="[
                'px-3 py-1 text-white rounded transition',
                modoEdicion
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-yellow-500 hover:bg-yellow-600'
              ]" @click="modoEdicion = !modoEdicion">
                {{ modoEdicion ? "Cancelar edición" : "Editar" }}
              </button>
              <button class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" @click="guardarEdicion"
                :disabled="!modoEdicion">
                Guardar edición
              </button>
              <button :class="[
                'px-3 py-1 text-white rounded transition',
                modoEdicion
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              ]" @click="guardarNuevaVersion">
                Generar nueva versión de cotización
              </button>
            </div>

            <!-- Versión actual -->
            <span class="text-sm text-gray-600">
              Versión actual: <strong>{{ cotizacion.version }}</strong>
            </span>
          </div>
        </div>

        <div class="border-t border-gray-100  pt-6 space-y-4">
          <h3 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <User class="w-5 h-5 text-blue-600" />
            Datos del Cliente
          </h3>
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2  xl:grid-cols-3 gap-4 border p-3 border-gray-200 rounded-lg">
            <InputLabel label="Fecha de Cotización" v-model="cotizacion.fechaCotizacion" type="text" />
            <ClientsSelector v-model="cotizacion.cliente" v-model:dataClient="myClienteSeleccionado" />
            <ClienteFinalSelector v-model="cotizacion.empresa" v-model:dataClient="clienteSeleccionado" />
            <InputLabel label="Contacto" v-model="cotizacion.contacto" />
            <InputLabel label="Correo" v-model="cotizacion.correo" type="email" />
            <InputLabel label="Celular" v-model="cotizacion.celular" />
          </div>
        </div>

        <!-- Datos Generales -->
        <div class="border-t border-gray-100  pt-6 space-y-4">
          <h3 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Briefcase class="w-5 h-5 text-blue-600" />
            Datos del Comercial
          </h3>
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-4 border p-3 border-gray-200 rounded-lg">
            <InputLabel label="Agente Comercial" v-model="cotizacion.agenteComercial" />
            <div>
              <label class="block text-gray-800 font-sm text-sm mb-1">Unidad de Ejecución</label>
              <select v-model="cotizacion.unidadEjecucion"
                class="w-full border border-gray-300 rounded-full px-3 py-2 text-gray-800">
                <option>Antioquia</option>
                <option>Cundinamarca</option>
                <option>Colombia</option>
                <option>Israel</option>
              </select>
            </div>
            <InputLabel label="Vigencia de Cotización" v-model="cotizacion.vigencia" />
          </div>
        </div>


        <!-- Detalles del Evento -->
        <div class="border-t border-gray-100  pt-6 space-y-4">
          <h3 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MapPin class="w-5 h-5 text-blue-600" />
            Detalles del Evento
          </h3>

          <div
            class="grid grid-cols-1   md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-4 border p-3 border-gray-200 rounded-lg">
            <InputLabel label="Nombre descriptivo del evento" v-model="cotizacion.description" />
            <InputLabel label="Ubicación del Evento" v-model="cotizacion.ubicacion" />
            <MapSelector v-model="cotizacion.linkMaps" />
            <InputLabel label="Número de Asistentes" v-model="cotizacion.asistentes" type="number" />

            <div>
              <label class="block text-gray-800 font-sm text-sm mb-1">Tipo de Suelo</label>
              <select v-model="cotizacion.tipoSuelo"
                class="w-full border border-gray-300  rounded-full px-3 py-2 text-gray-800">
                <option>Zona Cesped</option>
                <option>Zona Dura</option>
              </select>
            </div>

          </div>

          <div class="border-t border-gray-100  pt-6 space-y-4">
            <h3 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Calendar class="w-5 h-5 text-blue-600" />
              Calendario del Evento
            </h3>

            <div
              class="grid grid-cols-1   md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-4 border p-3 border-gray-200 rounded-lg">
              <InputLabel label="Fecha Inicio Evento" v-model="cotizacion.fechaInicioEvento" type="date" />
              <InputLabel label="Horario de Inicio" v-model="cotizacion.horarioInicio" type="time" />
              <InputLabel label="Fecha Fin Evento" v-model="cotizacion.fechaFinEvento" type="date" />
              <InputLabel label="Horario de Finalización" v-model="cotizacion.horarioFin" type="time" />
            </div>
          </div>

          <div class="border-t border-gray-100  pt-6 space-y-4">
            <h3 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Settings class="w-5 h-5 text-blue-600" />
              Calendario de Operación
            </h3>
            <div
              class="grid grid-cols-1   md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-4 border p-3 border-gray-200 rounded-lg">
              <InputLabel label="Fecha Inicio Montaje" v-model="cotizacion.fechaInicioMontaje" type="date" />
              <InputLabel label="Hora de Nontaje" v-model="cotizacion.horarioInicioMontaje" type="time" />
              <InputLabel label="Fecha Inicio Desmontaje" v-model="cotizacion.fechaFinMontaje" type="date" />
              <InputLabel label="Horario de Desmontaje" v-model="cotizacion.horarioFinMontaje" type="time" />
            </div>
          </div>
        </div>


        <!-- Búsqueda y cantidad -->
        <div class="flex flex-col w-full bg-gray-100 gap-5 rounded-xl p-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            <!-- Buscar Producto -->
            <div class="mt-5" @click="cargarProductos">
              <label class="block text-gray-800 font-sm text-sm mb-1">Buscar Producto</label>
              <input type="text" v-model="searchProducto" @focus="mostrarLista = true" @blur="ocultarListas"
                @input="filtrarProductos" placeholder="Buscar producto por nombre..."
                class="w-full border border-gray-300  rounded-full px-3 py-2 text-gray-800" />

              <ProductPickerModal :show="mostrarLista" :productos="productosFiltrados" @close="mostrarLista = false"
                @select="seleccionarProducto" />

            </div>

            <!-- Buscar Categoría -->
            <div class="relative mt-5">
              <label class="block text-gray-800 font-sm text-sm mb-1">Filtrar por categoría</label>
              <input type="text" v-model="searchCategoria" @input="filtrarCategorias" @focus="mostrarListaFilter = true"
                placeholder="Buscar categoría..."
                class="w-full border border-gray-300  rounded-full px-3 py-2 text-gray-800" />

              <ul v-if="mostrarListaFilter && categoriasFiltradas.length"
                class="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-60 overflow-auto">
                <li v-for="categoria in categoriasFiltradas" :key="categoria"
                  @mousedown.prevent="seleccionarCategoria(categoria)"
                  class="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  {{ categoria }}
                </li>
              </ul>

            </div>
          </div>

          <BarraInfo :motores="selectedProduct.qMotores" :amperios="selectedProduct.amperios" :precio="productPrice" />

          <div class="flex gap-4 w-full align-center justify-end ">
            <div class="w-full">
              <label class="block text-gray-800 font-sm text-sm mb-1">Q de Jornada</label>
              <input v-model="cotizacion.cantidadJornada" type="number" min="0"
                class="w-full border border-gray-300  rounded-full px-3 py-2 text-gray-800" />
            </div>
            <div class="w-full">
              <label class="block text-gray-800 font-sm text-sm mb-1">Q de producto</label>
              <input v-model="cotizacion.cantidadProducto" type="number" min="0"
                class="w-full border border-gray-300  rounded-full px-3 py-2 text-gray-800" />
            </div>


            <button @click="abrirModal"
              class="bg-gray-300 text-gray-800 w-full min-w-[220px] hover:bg-gray-400 font-semibold py-2 px-6 rounded-lg shadow flex items-center justify-center gap-2 cursor-pointer">
              Agregar producto de tercero
            </button>


            <button @click="addProduct" :class="[
              'w-full min-w-[220px] font-semibold py-2 px-6 rounded-lg shadow flex items-center justify-center gap-2 cursor-pointer',
              modoEdicion
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : ' bg-cyan-300 text-cyan-800 hover:bg-cyan-400'
            ]">
              Agregar
            </button>

          </div>
        </div>
      </div>

      <QuotationProductsCardList :items="items" @edit="abrirModalEdicion" linkFoto="https://placehold.co/600x400/f3f4f6/1f2937?text=Imagen+del+Producto" @delete="eliminarItem" />

      <div class=" w-full mb-10 ">

        <div class="mt-10 mb-3">
          <button @click="saveQuotation" :class="[
            'w-full min-w-[220px] font-semibold py-2 px-6 rounded-lg shadow flex items-center justify-center gap-2',
            modoEdicion
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          ]">
            Generar la cotización
          </button>
        </div>
        <ResumenCotizacion :subtotal="totalSummary.valorTotal" :iva="19000" :valorTotal="totalSummary.valorTotal"
          :subtotalDescuento="90000" :ivaDescuento="17100" :valorTotalDescuento="107100" :subtotalFinal="95000"
          :ivaFinal="18050" :valorTotalFinal="totalSummary.valorTotal" />


      </div>
    </div>

    <EditProductModal :show="modalEditarProducto" :producto="productoEditado" @close="cerrarModalEdicion"
      @save="guardarEdicionProducto" />


    <ThirdPartyProductModal :show="modalNuevoProducto" :producto="productoTercero" @close="cerrarModal"
      @save="guardarProducto" />


    <!-- Modal validación calendario -->
    <ModalReutilizable :show="modalCalendarioIncompleto" @close="modalCalendarioIncompleto = false">
      <div class="text-center p-4">
        <h2 class="text-xl font-bold text-blue-700 mb-3">
          Fechas y horarios incompletos
        </h2>

        <p class="text-gray-600 mb-6">
          Para ver la disponibilidad de los productos, debes definir
          <strong>todas las fechas y horarios del evento y la operación</strong>.
        </p>

        <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow"
          @click="modalCalendarioIncompleto = false">
          Entendido
        </button>
      </div>
    </ModalReutilizable>

    <!-- Modal éxito cotización -->
<ModalReutilizable
  :show="modalCotizacionExitosa"
  @close="modalCotizacionExitosa = false"
>
  <div class="text-center p-6">
    <h2 class="text-2xl font-bold text-green-600 mb-4">
      Cotización creada exitosamente
    </h2>

    <p class="text-gray-600 mb-6">
      La cotización se creó de manera exitosa.
    </p>

    <div class="flex justify-center gap-4">
      <button
        class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg"
        @click="modalCotizacionExitosa = false"
      >
        Cerrar
      </button>

      <button
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow"
       
      >
        Ver cotizaciones
      </button>
    </div>
  </div>
</ModalReutilizable>

  </div>
</template>


<script setup>
import InputLabel from '@/components/input/InputLabel.vue';
import { ref, onMounted, watch } from 'vue';
import { getQuotationById } from '../../services/quotation.service';



import ModalReutilizable from '../../components/modal/ModalReutilizable.vue';
import ResumenCotizacion from '../../components/panels/ResumenCotizacion.vue';
import ClienteFinalSelector from '../suppliers/ClienteFinalSelector.vue';
import BarraInfo from '../../components/panels/BarraInfo.vue';
import { useAuth } from '../../composables/useAuth';
import { formatDateTime, getCurrentISODate } from '../../utils/date';
import MapSelector from '../../components/map/MapSelector.vue';

import { useRoute} from 'vue-router';

import ClientsSelector from '../suppliers/ClientsSelector.vue';
import ProductPickerModal from '../../components/products/ProductPickerModal.vue';

import { useQuotationProducts } from '@/composables/useQuotationProducts'
import { useQuotationCalendar } from '@/composables/useQuotationCalendar'
import { useEditQuotationItem } from '@/composables/useEditQuotationItem';
import EditProductModal from '../../components/quotation/EditProductModal.vue';
import { useThirdPartyProduct } from '../../composables/useThirdPartyProduct';
import ThirdPartyProductModal from '../../components/quotation/ThirdPartyProductModal.vue';
import { useQuotation } from '../../composables/quotation/useQuotation';
import QuotationNextNumber from '../../components/quotation/QuotationNextNumber.vue';
import QuotationProductsCardList from '../../components/products/QuotationProductsCardList.vue';

import {
  User,
  Briefcase,
  Calendar,
  CalendarDays,
  Settings,
  MapPin
} from 'lucide-vue-next'
const route = useRoute();

const id = route.params.id || null;
const isEditMode = ref(!!id);
const modoEdicion = ref(false)

const { user } = useAuth();
const clienteSeleccionado = ref({})
const myClienteSeleccionado = ref({})
const modalCalendarioIncompleto = ref(false);

const {
  cotizacion,
  items,
  subtotal,
  total,
  loading,
  modalCotizacionExitosa,
  saveQuotation
} = useQuotation()

const {
  modalEditarProducto,
  productoEditado,
  abrirModalEdicion,
  cerrarModalEdicion,
  guardarEdicionProducto
} = useEditQuotationItem(items)

const {
  calendarioCompleto,
  validarCalendario
} = useQuotationCalendar(cotizacion, items, modalCalendarioIncompleto)

const {
  productosFiltrados,
  categoriasFiltradas,
  selectedProduct,
  productPrice,
  searchProducto,
  searchCategoria,
  mostrarLista,
  mostrarListaFilter,
  totalSummary,
  cargarProductos,
  seleccionarProducto,
  seleccionarCategoria,
  filtrarCategorias,
  ocultarListas,
  addProduct,
  filtrarProductos,

} = useQuotationProducts({
  cotizacion,
  items,
  myClienteSeleccionado,
  validarCalendario
})

const {
  modalNuevoProducto,
  productoTercero,
  abrirModal,
  cerrarModal,
  guardarProducto
} = useThirdPartyProduct(items, cotizacion)


const buildThirdPartyPayload = () => ({
  dispositivo: productoTercero.dispositivo,
  descripcion: productoTercero.descripcion,
  valorBase: Number(productoTercero.precios) || 0,

  bodega: productoTercero.bodega,
  categoria: productoTercero.categoria,
  amperios: Number(productoTercero.amperios) || null,
  medidas: productoTercero.medidas,
  qMotores: Number(productoTercero.motores) || null,
  qOperarios: Number(productoTercero.operarios) || null,
  qMetrosExtensiones: Number(productoTercero.metrosExt) || null,
  m2Dispositivo: Number(productoTercero.m2Disp) || null,
  qPesosEstacas: Number(productoTercero.pesosEstacas) || null,
  qExtintores: Number(productoTercero.extintores) || null,
  anioDispositivo: Number(productoTercero.anio) || null,
  porcentajeAmortizacion: Number(productoTercero.amortizacion) || null,
  m3Transporte: Number(productoTercero.m3Transporte) || null,
  pesoAproxDisp: Number(productoTercero.peso) || null,
  qHorasOperacion: Number(productoTercero.horasOperacion) || null,
  qHorasMontaje: Number(productoTercero.horasMontaje) || null,
  qPersonalMontaje: Number(productoTercero.personalMontaje) || null,
  montacarga: productoTercero.montacarga ? 'SI' : 'NO',
  incluyeTransporteBogMde: productoTercero.incluyeTransporte ? 'SI' : 'NO',
  notas: productoTercero.notas,
})


//Auto completa el campo Agente comercial
onMounted(async () => {
  cotizacion.fechaCotizacion = formatDateTime(getCurrentISODate())
  cotizacion.agenteComercial = user.value.fullName
})


/**
 * !Corregir reference, es un numero de celular
 * !Coregir la variable de mail 
 */
watch(clienteSeleccionado, (nuevoCliente) => {
  cotizacion.contacto = nuevoCliente.phone
  cotizacion.correo = nuevoCliente.email
  cotizacion.celular = nuevoCliente.reference
})



//Obtiene el precio segun el cliente seleccionado
function getPrecioSeleccionado(producto) {
  productPrice.value = producto?.productBoxes?.[myClienteSeleccionado.value.id - 1]?.price ?? 0
}


const producto = ref({
  idCatalogo: null,
  nombre: '',
  valorCuadroCotizador: null,
  cop: null,
  linkFotoDispositivo: '',
  dispositivo: '',
  descripcion: '',
  incluyeTransporteBogMde: '',
  valorListaCAFAM: null,
  valorListaColsubsidio: null,
  valorListaComfama: null,
  valorListaCompensar: null,
  valorListaConfenalco: null,
  valorCuadroCotizador1: null,
  verificarPrestacionProvExterno: ''
})

const campos = [
  { id: 'verificarPrestacionProvExterno', label: 'Proveedor', model: 'verificarPrestacionProvExterno', type: 'text' },
  { id: 'nombre', label: 'Descripción producto', model: 'nombre', type: 'text' },

  { id: 'Cotización del proveedor', label: 'Cotización del proveedor', model: 'Cotización del proveedor', type: 'file' },
  { id: 'Imagen del producto', label: 'Imagen del producto', model: 'Cotización del proveedor', type: 'file' },

  { id: 'cop', label: 'Costo del producto', model: 'cop', type: 'number' },
  { id: 'dispositivo', label: 'Categoria', model: 'dispositivo', type: 'text' },
  { id: 'incluyeTransporteBogMde', label: 'Incluye Transporte Bog-Mde', model: 'incluyeTransporteBogMde', type: 'text' },
  { id: 'Fecha de carga', label: 'Fecha de carga', model: 'Fecha de carga', type: 'text' },
]

//=============== Actualiza, generar una nueva version =================//
const getCotizacion = async () => {
  if (!isEditMode.value) return;

  try {
    const response = await getQuotationById(id);
    const data = response.data;

    cotizacion.cliente = data.cliente;
    cotizacion.celular = data.celular;
    cotizacion.empresa = data.empresa;
    cotizacion.cliente = data.cliente ? data?.cliente.name : '';
    cotizacion.contacto = data.contacto;
    cotizacion.correo = data.correo;
    cotizacion.fechaInicioEvento = data.fechaInicioEvento;
    cotizacion.fechaFinEvento = data.fechaFinEvento;
    cotizacion.ubicacion = data.ubicacion;
    cotizacion.linkMaps = data.linkMaps;
    cotizacion.horarioInicio = data.horarioInicio;
    cotizacion.horarioFin = data.horarioFin;
    cotizacion.asistentes = data.asistentes;
    cotizacion.vigencia = data.vigencia;
    cotizacion.unidadEjecucion = data.unidadEjecucion;
    cotizacion.tipoSuelo = data.tipoSuelo;
    cotizacion.quotationStatusId = data.quotationStatusId;

    items.value = data.items.map(it => {
      return {
        category: it.product.categoria,
        dispositivo: it.product.dispositivo,
        descripcion: it.product.descripcion,
        estado: it.product.conditionStatus,
        incluyeTransporte: it.product.incluyeTransporteBogMde,
        medidas: it.product.medidas,
        unitPrice: it.unitPrice,
        linkFoto: it.product.linkFotoDispositivo,
        cantidadJornada: it.cantidadJornada,
        cantidadProducto: it.cantidadProducto,
      }
    })

    console.log("Cotización cargada para edición:", data);
  } catch (error) {
    console.error("Error al cargar cotización", error);
  }
}

onMounted(getCotizacion)


const eliminarItem = (item) => {
  if (confirm(`¿Seguro que deseas eliminar el producto "${item.descripcion}"?`)) {
    items.value = items.value.filter((i) => i.id !== item.id)
    // Si también lo eliminas del backend:
    // await api.delete(`/productos/${item.id}`)
    console.log('Eliminado:', item)
  }
}
</script>
