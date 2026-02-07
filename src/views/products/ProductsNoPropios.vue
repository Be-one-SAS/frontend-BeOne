<template>
    <div class="p-4">
        <h1 class="text-xl font-semibold mb-4">Productos</h1>

        <!-- FILTROS -->
        <div class="flex gap-4 mb-4">
            <input v-model="search" type="text" placeholder="Buscar producto..."
                class="border px-3 py-2 rounded w-64" />

            <select v-model="selectedBox" class="border px-3 py-2 rounded" @change="handleBoxFilter">
                <option value="">Filtrar por Box</option>
                <option v-for="box in boxOptions" :key="box.id" :value="box.name">
                    {{ box.name }}
                </option>
            </select>

            <div class="flex gap-3">
                <button @click="resetTables"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    Recargar
                </button>

                <button v-if="isFiltering" @click="saveFilteredPrices"
                    class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Guardar cambios
                </button>
            </div>
        </div>

        <!-- ======================================================== -->
        <!--                    TABLA PRINCIPAL                       -->
        <!-- ======================================================== -->
        <div v-if="!isFiltering" class="overflow-x-auto border border-gray-200 rounded-lg">
            <table class="min-w-max table-auto text-sm">
                <thead class="bg-gray-100 text-gray-700">
                    <tr>
                        <th v-for="header in headers" :key="header" class="px-4 py-2 border">
                            {{ header }}
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in filteredProducts" :key="item.id" class="border-b hover:bg-gray-50">

                        <td class="px-3 py-2 border max-w-[400px]">{{ item.dispositivo }}</td>

                        <!-- BOTÓN PARA VER PRECIOS -->
                        <td class="px-3 py-2 border text-blue-600 underline cursor-pointer" @click="openModal(item)">
                            Ver
                        </td>

                        <td class="px-3 py-2 border">{{ item.valorCuadroCotizador }}</td>
                        <td class="px-3 py-2 border">{{ item.estado }}</td>
                        <td class="px-3 py-2 border">{{ item.bodega }}</td>
                        <td class="px-3 py-2 border">
                            <a v-if="item.linkFotoDispositivo" :href="item.linkFotoDispositivo" target="_blank"
                                class="text-blue-600 underline">
                                Foto del producto
                            </a>

                            <span v-else class="text-gray-400">Sin imagen</span>
                        </td>

                        <td class="px-3 py-2 border">
                            <a v-if="item.linkFichaTecnicaDispositivo" :href="item.linkFichaTecnicaDispositivo"
                                target="_blank" class="text-blue-600 underline">
                                Ficha técnica
                            </a>

                            <span v-else class="text-gray-400">Sin ficha técnica</span>
                        </td>
                        <td class="px-3 py-2 border">{{ item.amperios }}</td>
                        <td class="px-3 py-2 border">{{ item.categoria }}</td>
                        <td class="px-3 py-2 border max-w-[400px]">{{ item.descripcion }}</td>
                        <td class="px-3 py-2 border">{{ item.incluyeTransporteBogMde }}</td>
                        <td class="px-3 py-2 border">{{ item.medidas }}</td>
                        <td class="px-3 py-2 border">{{ item.qMotores }}</td>
                        <td class="px-3 py-2 border">{{ item.qOperarios }}</td>
                        <td class="px-3 py-2 border">{{ item.qMetrosExtensiones }}</td>
                        <td class="px-3 py-2 border">{{ item.m2Dispositivo }}</td>
                        <td class="px-3 py-2 border">{{ item.qPesosEstacas }}</td>
                        <td class="px-3 py-2 border">{{ item.qExtintores }}</td>
                        <td class="px-3 py-2 border">{{ item.anioDispositivo }}</td>
                        <td class="px-3 py-2 border">{{ item.porcentajeAmortizacion }}</td>
                        <td class="px-3 py-2 border">{{ item.m3Transporte }}</td>
                        <td class="px-3 py-2 border">{{ item.pesoAproxDisp }}</td>
                        <td class="px-3 py-2 border">{{ item.qHorasOperacion }}</td>
                        <td class="px-3 py-2 border">{{ item.qHorasMontaje }}</td>
                        <td class="px-3 py-2 border">{{ item.qPersonalMontaje }}</td>
                        <td class="px-3 py-2 border">{{ item.montacarga }}</td>
                        <td class="px-3 py-2 border">{{ item.notas }}</td>
                        <td class="px-3 py-2 border">{{ item.conditionStatus }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- ======================================================== -->
        <!--                    TABLA FILTRADA                        -->
        <!-- ======================================================== -->
        <div v-if="isFiltering" class="overflow-x-auto border border-blue-300 rounded-lg mt-6">
            <table class="min-w-max table-auto text-sm">
                <thead class="bg-blue-100 text-blue-800">
                    <tr>
                        <th v-for="header in filterHeaders" :key="header" class="px-4 py-2 border">
                            {{ header }}
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in filteredByName" :key="item.id" class="border-b hover:bg-blue-50">
                        <td class="px-3 py-2 border">{{ item.id }}</td>
                        <td class="px-3 py-2 border">{{ item.boxName }}</td>

                        <td class="px-3 py-2 border">
                            <input type="number" v-model.number="item.price" class="border px-2 py-1 rounded w-32" />
                        </td>

                        <td class="px-3 py-2 border">{{ item.product.dispositivo }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- ======================================================== -->
        <!--                       MODAL PRECIOS                      -->
        <!-- ======================================================== -->
        <div v-if="isModalOpen" class="fixed inset-0 bg-white/80 bg-opacity-40 flex justify-center items-center z-50">

            <div class="bg-white w-[700px] rounded-lg shadow-lg p-6">

                <h2 class="text-xl font-semibold mb-4">
                    Precios para: {{ selectedProduct?.dispositivo }}
                </h2>

                <table class="w-full text-sm border">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="border px-2 py-2">Caja</th>
                            <th class="border px-2 py-2">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="box in modalPrices" :key="box.id" class="border-b">
                            <td class="border px-2 py-2">{{ box.boxName }}</td>
                            <td class="border px-2 py-2">
                                <input type="number" v-model.number="box.price"
                                    class="border px-2 py-1 rounded w-full" />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="flex justify-end gap-3 mt-6">
                    <button @click="isModalOpen = false"
                        class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                        Cerrar
                    </button>

                    <button @click="saveModalPrices"
                        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        Guardar cambios
                    </button>
                </div>
            </div>

        </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { getThirdPartyCatalog, getByName } from "@/services/products.service"
import { getBox } from "@/services/suppliers.service"

/* STATE */
const products = ref([])
const boxOptions = ref([])
const search = ref("")
const selectedBox = ref("")

const isFiltering = ref(false)
const filteredByName = ref([])

/* MODAL STATE */
const isModalOpen = ref(false)
const selectedProduct = ref(null)
const modalPrices = ref([])

/* HEADERS */
const headers = [
    "Dispositivo", "Precios", "Cliente BeOne", "Estado", "Bodega", "Foto",
    "Ficha Técnica", "Amperios", "Categoría", "Descripción", "IncluyeTransporte",
    "Medidas", "Motores", "Operarios", "Metros Ext.", "m2Disp", "PesosEstacas",
    "Extintores", "Año", "Amortización", "m3Transporte", "Peso", "Horas Operación",
    "Horas Montaje", "Personal Montaje", "Montacarga", "Notas", "Condición"
]

const filterHeaders = ["ID", "Cliente", "Precio", "Producto"]


/* =============  UTILS: ACORTAR URL PARA MOSTRAR UN NOMBRE CORTO  ============= */
function shortName(url) {
    if (!url) return "Sin imagen"

    return url
}



/* ========================= LOAD PRODUCTS ========================= */
async function fetchProducts() {
    const res = await getThirdPartyCatalog()
    products.value = res.data || []

    const resBoxes = await getBox()
    boxOptions.value = resBoxes.data[1].map(b => ({
        id: b.id,
        name: b.boxName
    }))
}

/* ========================= FILTER MAIN TABLE ========================= */
const filteredProducts = computed(() => {
    return products.value.filter(p =>
        p.dispositivo?.toLowerCase().includes(search.value.toLowerCase()) ||
        p.idCatalogo?.toString().includes(search.value)
    )
})

/* ========================= FILTER BY BOX ========================= */
async function handleBoxFilter() {
    if (!selectedBox.value) {
        isFiltering.value = false
        return
    }

    const res = await getByName(selectedBox.value)

    filteredByName.value = res.data || []
    isFiltering.value = true
}

/* ========================= RESET TABLES ========================= */
function resetTables() {
    selectedBox.value = ""
    isFiltering.value = false
    fetchProducts()
}

/* ========================= SAVE FILTERED ========================= */
async function saveFilteredPrices() {
    alert("Precios filtrados actualizados (simulación)")
}

/* ========================= OPEN MODAL ========================= */
async function openModal(product) {
    selectedProduct.value = product

    modalPrices.value = product.productBoxes.map(b => ({
        id: b.id,
        boxName: b.boxName,
        price: b.price
    }))

    isModalOpen.value = true
}

/* ========================= SAVE MODAL PRICES ========================= */
async function saveModalPrices() {
    const payload = modalPrices.value.map(item => ({
        boxId: item.id,
        productId: selectedProduct.value.id,
        price: item.price
    }))

    alert("Precios actualizados correctamente (modal)")
    isModalOpen.value = false
}

/* ========================= MOUNT ========================= */
onMounted(fetchProducts)
</script>

<style scoped>
table th {
    font-weight: 600;
    white-space: nowrap;
}

table td {
    white-space: nowrap;
}
</style>