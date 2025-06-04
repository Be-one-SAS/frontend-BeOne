<template>
  <div class="w-full">

    <div class="bg-white shadow-md rounded-xl p-6 mx-auto space-y-8 mb-10">
      <!-- Título -->
      <div>
        <h2 class="text-2xl font-bold text-blue-700">Cotización No. {{ cotizacion.numero }}</h2>
      </div>

      <!-- Datos Generales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputLabel label="Fecha de Cotización" v-model="cotizacion.fechaCotizacion" type="date" />
        <InputLabel label="Agente Comercial" v-model="cotizacion.agenteComercial" />

        <div>
          <label class="block text-gray-800 font-medium mb-1">Cliente</label>
          <select v-model="cotizacion.cliente" class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800">
            <option>Cliente directo</option>
            <option>Compensar</option>
            <option>Colsubsidio</option>
            <option>Cafam</option>
            <option>Comfama</option>
            <option>Comfenalco</option>
            <option>Comfachocó</option>
          </select>
        </div>

        <div>
          <label class="block text-gray-800 font-medium mb-1">Cliente final</label>
          <select v-model="cotizacion.empresa" class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800">
            <option>Cliente directo</option>
            <option>Compensar</option>
            <option>Colsubsidio</option>
            <option>Cafam</option>
            <option>Comfama</option>
            <option>Comfenalco</option>
            <option>Comfachocó</option>
          </select>
        </div>

        <InputLabel label="Contacto" v-model="cotizacion.contacto" />
        <InputLabel label="Correo" v-model="cotizacion.correo" type="email" />
        <InputLabel label="Celular" v-model="cotizacion.celular" />
      </div>

      <!-- Detalles del Evento -->
      <div class="border-t pt-6 space-y-4">
        <h3 class="text-xl font-semibold text-gray-800">Detalles del Evento</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputLabel label="Fecha Inicio Evento" v-model="cotizacion.fechaInicioEvento" type="date" />
          <InputLabel label="Fecha Fin Evento" v-model="cotizacion.fechaFinEvento" type="date" />
          <InputLabel label="Ubicación del Evento" v-model="cotizacion.ubicacion" />
          <InputLabel label="Link en Maps" v-model="cotizacion.linkMaps" />
          <InputLabel label="Horario de Inicio" v-model="cotizacion.horarioInicio" type="time" />
          <InputLabel label="Horario de Finalización" v-model="cotizacion.horarioFin" type="time" />
          <InputLabel label="Número de Asistentes" v-model="cotizacion.asistentes" />
          <InputLabel label="Vigencia de Cotización" v-model="cotizacion.vigencia" />

          <div>
            <label class="block text-gray-800 font-medium mb-1">Unidad de Ejecución</label>
            <select v-model="cotizacion.unidadEjecucion"
              class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800">
              <option>Nivel Nacional</option>
              <option>Nivel Regional</option>
              <option>Local</option>
            </select>
          </div>

          <InputLabel label="Tipo de Suelo" v-model="cotizacion.tipoSuelo" />
        </div>
      </div>

      <!-- Nota -->
      <div class="pt-6 text-gray-700 text-sm space-y-2">
        <p class="font-semibold">Nota:</p>
        <p>Esta cotización no implica la confirmación del servicio solicitado, ya que está sujeta a disponibilidad.</p>
        <ol class="list-decimal pl-6 space-y-1">
          <li>El cliente debe enviar comentarios y observaciones en el tiempo de vigencia de la cotización.</li>
          <li>Be One SAS analizará la disponibilidad del lugar y servicios ofrecidos.</li>
          <li>Se enviará una respuesta de confirmación, cancelación o fechas disponibles.</li>
        </ol>
      </div>

      <!-- Búsqueda y cantidad -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        <!-- Buscar Producto -->
        <div>
          <label class="block text-gray-800 font-medium mb-1">Buscar Producto</label>
          <input type="text" v-model="searchProducto" @focus="mostrarLista = true" @blur="ocultarListaConRetraso"
            @input="filtrarProductos" placeholder="Buscar producto por nombre..."
            class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800" />

          <ul v-if="mostrarLista && productosFiltrados.length"
            class="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-60 overflow-auto">
            <li v-for="producto in productosFiltrados" :key="producto.id"
              @mousedown.prevent="seleccionarProducto(producto)" class="px-4 py-2 hover:bg-gray-100 cursor-pointer">
              {{ producto.dispositivo }} /
              <span class="text-gray-400 text-[12px]">{{ producto.descripcion }}</span>
            </li>
          </ul>
        </div>

        <!-- Buscar Categoría -->
        <div class="relative">
          <label class="block text-gray-800 font-medium mb-1">Filtrar por categoría</label>
          <input type="text" v-model="searchCategoria" @input="filtrarCategorias" @focus="mostrarListaFilter = true"
            placeholder="Buscar categoría..." class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800" />

          <ul v-if="mostrarListaFilter && categoriasFiltradas.length"
            class="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-60 overflow-auto">
            <li v-for="categoria in categoriasFiltradas" :key="categoria"
              @mousedown.prevent="seleccionarCategoria(categoria)" class="px-4 py-2 hover:bg-gray-100 cursor-pointer">
              {{ categoria }}
            </li>
          </ul>

        </div>
      </div>

      <div class="flex gap-4 w-full align-center justify-center">
        <div class="w-full">
          <label class="block text-gray-800 font-medium mb-1">Q Jornada</label>
          <input v-model="cotizacion.cantidadJornada" type="number" min="0"
            class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800" />
        </div>
        <div class="w-full">
          <label class="block text-gray-800 font-medium mb-1">Cantidad</label>
          <input v-model="cotizacion.cantidadProducto" type="number" min="0"
            class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800" />
        </div>

        <div class="flex flex-col w-full justify-center mt-4">
          <p class="text-black text-md">SubTotal: {{ productosTotal }}</p>
          <p class="text-black text-2xl">Total: {{ productosTotal }}</p>
        </div>
        <div>
          <button @click="abrirModal"
            class="bg-[#dbeafe] w-full min-w-[220px] hover:bg-blue-200 text-blue-600 font-semibold py-2 px-6 rounded-lg shadow flex items-center justify-center gap-2 mt-3">
            Agregar nuevo
          </button>
        </div>
        <div>
          <button
            class="bg-blue-600 w-full min-w-[220px] hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow flex items-center justify-center gap-2 mt-3">
            Agregar
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla de tareas urgentes -->
    <div class="bg-white rounded-2xl shadow-lg p-6">
      <h2 class="text-2xl font-semibold text-gray-800 ">Lista agregada</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full table-auto border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-sm text-gray-600">
              <th class="px-4 py-2">Tarea</th>
              <th class="px-4 py-2">Responsable</th>
              <th class="px-4 py-2">Vencimiento</th>
              <th class="px-4 py-2">Estado</th>
              <th class="px-4 py-2">Urgencia</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pendientes" :key="item.id" class="bg-gray-50 rounded-lg shadow-sm">
              <td class="px-4 py-3 text-gray-800 font-medium">{{ item.tarea }}</td>
              <td class="px-4 py-3 text-gray-700">{{ item.responsable }}</td>
              <td class="px-4 py-3 text-gray-600">{{ item.vencimiento }}</td>
              <td class="px-4 py-3">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold" :class="{
                  'bg-yellow-100 text-yellow-800': item.estado === 'Pendiente',
                  'bg-blue-100 text-blue-800': item.estado === 'En curso',
                  'bg-green-100 text-green-800': item.estado === 'Completado'
                }">
                  {{ item.estado }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold" :class="{
                  'bg-red-100 text-red-800': item.urgencia === 'Alta',
                  'bg-orange-100 text-orange-800': item.urgencia === 'Media',
                  'bg-green-100 text-green-800': item.urgencia === 'Baja'
                }">
                  {{ item.urgencia }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModalReutilizable :show="modalNuevoProducto" @close="cerrarModal">
      <h2 class="text-xl font-bold text-blue-800 mb-4">Crear nuevo producto</h2>
      <!-- Aquí va tu formulario o contenido -->
      <form>
        <div class="mb-4">
          <label class="block text-gray-700 mb-1">Nombre del producto</label>
          <input type="text" class="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <!-- Agrega más campos si es necesario -->

        <div class="flex justify-end mt-4">
          <button type="button" class="mr-2 px-4 py-2 bg-gray-200 rounded" @click="cerrarModal">Cancelar</button>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
        </div>
      </form>
    </ModalReutilizable>
  </div>
</template>



<script setup>
import InputLabel from '@/components/input/InputLabel.vue';
import { ref, reactive, onMounted, watch } from 'vue';
import { getProducts } from '../../services/products.service';
import { getCustomer } from '../../services/customer.service';
import ModalReutilizable from '../../components/modal/ModalReutilizable.vue';

const productos = ref([]);
const productosFiltrados = ref([]);
const categoria = ref([]);
const categoriasFiltradas = ref([]);
const searchProducto = ref('');
const searchCategoria = ref('');
const productosTotal = ref(0);
const mostrarLista = ref(false);
const mostrarListaFilter = ref(false);

const cotizacion = reactive({
  numero: 115,
  fechaCotizacion: '2025-04-14',
  agenteComercial: '',
  cliente: '',
  empresa: '',
  contacto: '',
  correo: '',
  celular: '',
  fechaInicioEvento: '',
  fechaFinEvento: '',
  ubicacion: '',
  linkMaps: '',
  horarioInicio: '',
  horarioFin: '',
  asistentes: '',
  vigencia: '15 días',
  unidadEjecucion: 'Nivel Nacional',
  tipoSuelo: '',
  cantidadJornada: 0,
  cantidadProducto: 0
});

const modalNuevoProducto = ref(false);

function abrirModal() {
  modalNuevoProducto.value = true;
}

function cerrarModal() {
  modalNuevoProducto.value = false;
}

onMounted(async () => {
  try {
    const response = await getProducts();
    productos.value = response.data;
    productosFiltrados.value = response.data;

    // Extraer categorías únicas
    const categoriasUnicas = [
      ...new Set(productos.value.map((p) => p.categoria).filter(Boolean)),
    ];
    categoria.value = categoriasUnicas;
    categoriasFiltradas.value = categoriasUnicas;
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }

  try {
    const customer = await getCustomer();
    console.log('Clientes cargados:', customer.data);
  } catch (error) {
    console.error('Error al cargar clientes:', error);
  }
});

const filtrarProductos = () => {
  const termProducto = searchProducto.value.toLowerCase().trim();
  const termCategoria = searchCategoria.value.toLowerCase().trim();

  productosFiltrados.value = productos.value.filter(p => {
    const coincideProducto = p.nombre?.toLowerCase().includes(termProducto);
    const coincideCategoria = p.categoria?.toLowerCase().includes(termCategoria);
    return coincideProducto && coincideCategoria;
  });
};

const filtrarCategorias = () => {
  const term = searchCategoria.value.toLowerCase().trim();
  categoriasFiltradas.value = categoria.value.filter((c) =>
    c.toLowerCase().includes(term)
  );
};

const seleccionarProducto = (producto) => {
  searchProducto.value = producto.nombre;
  productosTotal.value = producto.total
  mostrarLista.value = false;
};

const seleccionarCategoria = (cat) => {
  searchCategoria.value = cat;
  mostrarListaFilter.value = false;
  filtrarProductos();
};

const ocultarListaConRetraso = () => {
  setTimeout(() => {
    mostrarLista.value = false;
    mostrarListaFilter.value = false;
  }, 200);
};

watch(searchCategoria, filtrarProductos, filtrarCategorias);

const pendientes = [
  {
    id: 1,
    tarea: 'Enviar cotización 115',
    responsable: 'Laura',
    vencimiento: '2025-05-30',
    estado: 'Pendiente',
    urgencia: 'Alta'
  },
  {
    id: 2,
    tarea: 'Confirmar lugar del evento',
    responsable: 'Carlos',
    vencimiento: '2025-05-29',
    estado: 'En curso',
    urgencia: 'Alta'
  }
]
</script>
