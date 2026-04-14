import { ref, watch, reactive } from 'vue'

import { calcularCotizacionDesdeCosto } from '../utils/calcularCotizacionDesdeCosto'
import { getProductsEndReservation } from '../services/reservation.service'

export function useQuotationProducts({
    cotizacion,
    items,
    myClienteSeleccionado,
    validarCalendario,
}: any) {
    const productos = ref([])
    const productosFiltrados = ref([])
    const categorias = ref<any>([])
    const categoriasFiltradas = ref([])

    const totalSummary = reactive({
        subtotal: 0,
        iva: 0,
        valorTotal: 0,
        subtotalDescuento: 0,
        ivaDescuento: 0,
        valorTotalDescuento: 0,
        subtotalFinal: 0,
        ivaFinal: 0,
        valorTotalFinal: 0
    });

    const emptyProduct = {
        id: null,
        nombre: '',
        categoria: '',
        dispositivo: '',
        descripcion: '',
        incluyeTransporteBogMde: false,
        medidas: '',
        linkFotoDispositivo: '',
        qMotores: 0,
        amperios: 0,
    }

    const selectedProduct = ref({ ...emptyProduct })
    const productPrice = ref(0)

    const searchProducto = ref('')
    const searchCategoria = ref('')

    const mostrarLista = ref(false)
    const mostrarListaFilter = ref(false)

    // ========================
    // Obtener productos
    // ========================
    const cargarProductos = async () => {
        if (!validarCalendario()) return

        const response = await getProductsEndReservation({
            setupStartAt: cotizacion.fechaInicioMontaje,
            teardownEndAt: cotizacion.fechaFinMontaje,
            isSameCity: true
        })

        productos.value = response.data
        productosFiltrados.value = response.data

        categorias.value = [
            ...new Set(response.data.map((p: any) => p.categoria).filter(Boolean))
        ]
        categoriasFiltradas.value = categorias.value
    }

    // ========================
    // Filtros
    // ========================
    const filtrarProductos = () => {
        const termProducto = searchProducto.value.toLowerCase().trim()
        const termCategoria = searchCategoria.value.toLowerCase().trim()

        productosFiltrados.value = productos.value.filter((p: any) => {
            const matchProducto = p.nombre?.toLowerCase().includes(termProducto)
            const matchCategoria = p.categoria?.toLowerCase().includes(termCategoria)
            return matchProducto && matchCategoria
        })
    }

    const filtrarCategorias = () => {
        const term = searchCategoria.value.toLowerCase().trim()
        categoriasFiltradas.value = categorias.value.filter((c: any) =>
            c.toLowerCase().includes(term)
        )
    }

    // ========================
    // Precio según cliente
    // ========================
    const calcularPrecioCliente = (producto: any) => {
        const selectedBoxName = myClienteSeleccionado.value?.name?.toString().trim().toLowerCase()
        const boxes = producto?.productBoxes || []

        console.log(`[Pricing] Buscando caja: "${selectedBoxName}" en producto:`, producto.dispositivo)

        if (selectedBoxName && boxes.length > 0) {
            // Buscamos coincidencia exacta (ignoring case/spaces)
            const boxEntry = boxes.find((b: any) => 
                b.boxName?.toString().trim().toLowerCase() === selectedBoxName
            )
            
            if (boxEntry) {
                console.log(`[Pricing] Match encontrado! Caja: ${boxEntry.boxName}, Precio: ${boxEntry.price}`)
                productPrice.value = boxEntry.price
                return
            }
        }

        // Fallback: Si no hay match o no hay selección, buscamos el primer precio > 0 para no dejar en blanco
        console.warn(`[Pricing] No hay match para "${selectedBoxName}". Aplicando fallback...`)
        const fallbackBox = boxes.find((b: any) => b.price > 0)
        productPrice.value = fallbackBox?.price ?? 0
    }

    // ========================
    // Selección
    // ========================
    const seleccionarProducto = (producto: any) => {
        selectedProduct.value = producto
        searchProducto.value = producto.nombre
        mostrarLista.value = false

        calcularPrecioCliente(producto)
    }

    const seleccionarCategoria = (categoria: any) => {
        searchCategoria.value = categoria
        mostrarListaFilter.value = false
        filtrarProductos()
    }

    const ocultarListas = () => {
        setTimeout(() => {
            mostrarLista.value = false
            mostrarListaFilter.value = false
        }, 200)
    }

    // ========================
    // Agregar producto
    // ========================
    const addProduct = () => {
        if (!validarCalendario() || !selectedProduct.value) return

        // ✅ Ajuste: Asegurar que si el usuario dejó en 0 o vacío las cantidades, se asuma 1
        if (!cotizacion.cantidadJornada || cotizacion.cantidadJornada <= 0) {
            cotizacion.cantidadJornada = 1
        }
        if (!cotizacion.cantidadProducto || cotizacion.cantidadProducto <= 0) {
            cotizacion.cantidadProducto = 1
        }

        items.value.push({
            productId: selectedProduct.value.id,
            category: selectedProduct.value.categoria,
            dispositivo: selectedProduct.value.dispositivo,
            descripcion: selectedProduct.value.descripcion,
            incluyeTransporte: selectedProduct.value.incluyeTransporteBogMde,
            medidas: selectedProduct.value.medidas,
            linkFoto: selectedProduct.value.linkFotoDispositivo,
            qMotores: selectedProduct.value.qMotores,
            qOperarios: selectedProduct.value.qOperarios,
            estado: 'PRODUCTO PROPIO',
            cantidadJornada: cotizacion.cantidadJornada,
            cantidadProducto: cotizacion.cantidadProducto,
            unitPrice: productPrice.value
        })

        const total = items.value.reduce((sum: number, it: any) => {
            return sum + (it.unitPrice || 0)
        }, 0)

        searchProducto.value = ''
        selectedProduct.value = { ...emptyProduct }
        totalSummary.valorTotal = total
    }

    watch([searchProducto, searchCategoria], filtrarProductos)

    // Recalcular precio si cambia el cliente seleccionado
    watch(myClienteSeleccionado, () => {
        if (selectedProduct.value) {
            calcularPrecioCliente(selectedProduct.value)
        }
    }, { deep: true })

    return {
        // state
        productosFiltrados,
        categoriasFiltradas,
        selectedProduct,
        productPrice,
        searchProducto,
        searchCategoria,
        mostrarLista,
        mostrarListaFilter,
        totalSummary,
  
        // actions
        cargarProductos,
        seleccionarProducto,
        seleccionarCategoria,
        filtrarCategorias,
        ocultarListas,
        addProduct,
        filtrarProductos
    }
}