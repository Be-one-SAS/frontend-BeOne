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

    // Devuelve el precio correspondiente al cliente activo para un producto dado.
    // Si la lista es "Cliente Directo", usa valorCuadroCotizador; si no, busca el box.
    const resolverPrecioParaCliente = (producto: any, cliente: any): number => {
        if (cliente?.id === 'cliente_directo') {
            const vcc = producto?.valorCuadroCotizador ?? producto?._valorCuadroCotizador
            if (vcc && vcc > 0) return vcc
            // fallback a box si no tiene valorCuadroCotizador
        }

        const selectedBoxName = cliente?.name?.toString().trim().toLowerCase()
        const boxes: any[] = producto?.productBoxes ?? producto?._productBoxes ?? []

        if (selectedBoxName && boxes.length > 0) {
            const boxEntry = boxes.find((b: any) =>
                b.boxName?.toString().trim().toLowerCase() === selectedBoxName
            )
            if (boxEntry) return boxEntry.price
        }

        const fallbackBox = boxes.find((b: any) => b.price > 0)
        return fallbackBox?.price ?? 0
    }

    const calcularPrecioCliente = (producto: any) => {
        productPrice.value = resolverPrecioParaCliente(producto, myClienteSeleccionado.value)
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
            unitPrice: productPrice.value,
            descuentoPct: 0,
            // Guardados para recalcular si cambia la lista de precio
            _productBoxes: selectedProduct.value.productBoxes || [],
            _valorCuadroCotizador: selectedProduct.value.valorCuadroCotizador ?? null,
        })

        const total = items.value.reduce((sum: number, it: any) => {
            return sum + (it.unitPrice || 0)
        }, 0)

        searchProducto.value = ''
        selectedProduct.value = { ...emptyProduct }
        totalSummary.valorTotal = total
    }

    watch([searchProducto, searchCategoria], filtrarProductos)

    // Recalcular precio si cambia la lista de precio
    watch(myClienteSeleccionado, (cliente) => {
        // Recalcular preview del producto seleccionado en el picker
        if (selectedProduct.value) {
            calcularPrecioCliente(selectedProduct.value)
        }
        // Recalcular unitPrice de todos los items ya agregados que tengan datos de precio
        items.value.forEach((item: any) => {
            if (!item._productBoxes && item._valorCuadroCotizador == null) return
            item.unitPrice = resolverPrecioParaCliente(item, cliente)
        })
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