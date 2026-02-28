<template>
    <div class="p-4">
        <h1 class="text-[22px] font-bold text-text-1 mb-4 font-['Plus_Jakarta_Sans',sans-serif]">Productos</h1>

        <!-- FILTROS -->
        <div class="flex gap-4 mb-4">
            <input v-model="search" type="text" placeholder="Buscar producto..."
                class="bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />

            <select v-model="selectedBox" class="bg-[#F8FAFC] border border-border rounded-full px-4 py-2 text-[13px] text-text-1 focus:outline-none focus:ring-2 focus:ring-primary" @change="handleBoxFilter">
                <option value="">Filtrar por Box</option>
                <option v-for="box in boxOptions" :key="box.id" :value="box.name">
                    {{ box.name }}
                </option>
            </select>

            <div class="flex gap-3">
                <button @click="resetTables"
                    class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary-light text-primary border border-[#BFDBFE] rounded-[8px] hover:bg-[#DBEAFE] transition">
                    Recargar
                </button>

                <button v-if="isFiltering" @click="saveFilteredPrices"
                    class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-primary-dark transition">
                    Guardar cambios
                </button>
            </div>
        </div>

        <!-- ======================================================== -->
        <!--                    TABLA PRINCIPAL                       -->
        <!-- ======================================================== -->
        <div v-if="!isFiltering" class="overflow-x-auto border border-border rounded-[var(--r-xl)] shadow-[var(--shadow-card)]">
            <table class="min-w-max table-auto text-sm">
                <thead class="bg-[#F8FAFC] text-text-3 text-[11px] font-medium uppercase tracking-wider">
                    <tr>
                        <th v-for="header in headers" :key="header" class="px-4 py-2 border">
                            {{ header }}
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in filteredProducts" :key="item.id" class="border-b border-border-light hover:bg-[#F8FAFC]">

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
        <div v-if="isFiltering" class="overflow-x-auto border border-border rounded-[var(--r-xl)] shadow-[var(--shadow-card)] mt-6">
            <table class="min-w-max table-auto text-sm">
                <thead class="bg-[#F8FAFC] text-text-3 text-[11px] font-medium uppercase tracking-wider">
                    <tr>
                        <th v-for="header in filterHeaders" :key="header" class="px-4 py-2 border">
                            {{ header }}
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in filteredByName" :key="item.id" class="border-b border-border-light hover:bg-[#F8FAFC]">
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
        <div v-if="isModalOpen" class="fixed inset-0 bg-[rgba(15,26,46,0.5)] flex justify-center items-center z-50">

            <div class="bg-card w-[700px] rounded-[var(--r-2xl)] shadow-[var(--shadow-modal)] p-6">

                <h2 class="text-[16px] font-semibold text-text-1 mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
                    Precios para: {{ selectedProduct?.dispositivo }}
                </h2>

                <table class="w-full text-sm border border-border rounded-[var(--r-lg)] overflow-hidden">
                    <thead class="bg-[#F8FAFC]">
                        <tr>
                            <th class="border border-border px-3 py-2 text-[11px] font-medium text-text-3 uppercase">Caja</th>
                            <th class="border border-border px-3 py-2 text-[11px] font-medium text-text-3 uppercase">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="box in modalPrices" :key="box.id" class="border-b border-border-light hover:bg-[#F8FAFC]">
                            <td class="border border-border-light px-3 py-2 text-[13px] text-text-2">{{ box.boxName }}</td>
                            <td class="border border-border-light px-3 py-2">
                                <input type="number" v-model.number="box.price"
                                    class="bg-[#F8FAFC] border border-border rounded-full px-3 py-1 text-[13px] text-text-1 w-full focus:outline-none focus:ring-2 focus:ring-primary" />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="flex justify-end gap-3 mt-6">
                    <button @click="isModalOpen = false"
                        class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary-light text-primary border border-[#BFDBFE] rounded-[8px] hover:bg-[#DBEAFE] transition">
                        Cerrar
                    </button>

                    <button @click="saveModalPrices"
                        class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-primary-dark transition">
                        Guardar cambios
                    </button>
                </div>
            </div>

        </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { getProducts, getByName } from "@/services/products.service"
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
    const res = await getProducts()
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