<script setup>
import ModalReutilizable from '@/components/modal/ModalReutilizable.vue'
import {
  Cpu,
  DollarSign,
  CheckSquare,
  MapPin,
  Image,
  FileText,
  Zap,
  Tag,
  Info,
  Truck,
  Ruler,
  Settings,
  Users,
  Maximize,
  Box,
  Weight,
  Shield,
  Calendar,
  Clock,
  Wrench,
  HardDrive,
  TrendingUp,
  Calculator,
  Landmark,
  Hash
} from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  producto: { type: Object, required: true },
})

const emit = defineEmits(['close', 'save'])

/* ================================
   CAMPOS (SOLO SE AGREGA CANTIDAD)
================================ */

const camposProducts = [
  { id: 'cantidad', label: 'Cantidad', model: 'cantidad', type: 'number', icon: Hash }, // ✅ NUEVO
  { id: 'precios', label: 'Precios', model: 'precios', type: 'number', icon: DollarSign },

  { id: 'porcentajeAumento', label: 'Margen %', model: 'porcentajeAumento', type: 'number', icon: TrendingUp },
  { id: 'porcentajeComision', label: 'Comisión %', model: 'porcentajeComision', type: 'number', icon: DollarSign },
  { id: 'porcentajeRenta', label: 'Renta %', model: 'porcentajeRenta', type: 'number', icon: Landmark },
  { id: 'porcentajeGastosFinancieros', label: 'Gastos Financieros %', model: 'porcentajeGastosFinancieros', type: 'number', icon: DollarSign },
  { id: 'porcentajeGastosAdministrativos', label: 'Gastos Administrativos %', model: 'porcentajeGastosAdministrativos', type: 'number', icon: Landmark },

  { id: 'costo', label: 'Costo Unitario', model: 'costo', type: 'number', icon: Landmark },

  { id: 'dispositivo', label: 'Dispositivo', model: 'dispositivo', type: 'text', icon: Cpu },
  { id: 'clienteBeOne', label: 'Cliente BeOne', model: 'clienteBeOne', type: 'checkbox', icon: CheckSquare },
  { id: 'estado', label: 'Estado', model: 'estado', type: 'text', icon: Shield },
  { id: 'bodega', label: 'Bodega', model: 'bodega', type: 'text', icon: MapPin },
  { id: 'foto', label: 'Foto (URL)', model: 'foto', type: 'text', icon: Image },
  { id: 'fichaTecnica', label: 'Ficha Técnica', model: 'fichaTecnica', type: 'text', icon: FileText },
  { id: 'amperios', label: 'Amperios', model: 'amperios', type: 'number', icon: Zap },
  { id: 'categoria', label: 'Categoría', model: 'categoria', type: 'text', icon: Tag },
  { id: 'descripcion', label: 'Descripción', model: 'descripcion', type: 'text', icon: Info },
  { id: 'incluyeTransporte', label: 'Incluye Transporte', model: 'incluyeTransporte', type: 'checkbox', icon: Truck },
  { id: 'medidas', label: 'Medidas', model: 'medidas', type: 'text', icon: Ruler },
  { id: 'motores', label: 'Motores', model: 'motores', type: 'number', icon: Settings },
  { id: 'operarios', label: 'Operarios', model: 'operarios', type: 'number', icon: Users },
  { id: 'metrosExt', label: 'Metros Ext.', model: 'metrosExt', type: 'number', icon: Maximize },
  { id: 'm2Disp', label: 'm² Disponible', model: 'm2Disp', type: 'number', icon: Box },
  { id: 'pesosEstacas', label: 'Pesos Estacas', model: 'pesosEstacas', type: 'number', icon: Weight },
  { id: 'extintores', label: 'Extintores', model: 'extintores', type: 'number', icon: Shield },
  { id: 'anio', label: 'Año', model: 'anio', type: 'number', icon: Calendar },
  { id: 'amortizacion', label: 'Amortización', model: 'amortizacion', type: 'number', icon: DollarSign },
  { id: 'm3Transporte', label: 'm³ Transporte', model: 'm3Transporte', type: 'number', icon: Truck },
  { id: 'peso', label: 'Peso', model: 'peso', type: 'number', icon: HardDrive },
  { id: 'horasOperacion', label: 'Horas Operación', model: 'horasOperacion', type: 'number', icon: Clock },
  { id: 'horasMontaje', label: 'Horas Montaje', model: 'horasMontaje', type: 'number', icon: Wrench },
  { id: 'personalMontaje', label: 'Personal Montaje', model: 'personalMontaje', type: 'number', icon: Users },
  { id: 'montacarga', label: 'Montacarga', model: 'montacarga', type: 'checkbox', icon: Truck },
  { id: 'notas', label: 'Notas', model: 'notas', type: 'text', icon: FileText },
  { id: 'condicion', label: 'Condición', model: 'condicion', type: 'text', icon: Info },
]

/* ================================
   CÁLCULO REACTIVO DESDE PRECIO
================================ */

const cotizacion = computed(() => {
  const cantidad = Number(props.producto.cantidad || 0)
  const precioVenta = Number(props.producto.precios || 0)
  const costo = Number(props.producto.costo || 0)

  if (!cantidad || !precioVenta) return null

  const IVA = 0.19
  const CUATRO_X_MIL = 0.004

  const costoTotal = cantidad * costo
  const iva = precioVenta * IVA
  const cuatroXmil = precioVenta * CUATRO_X_MIL
  const comision = precioVenta * (Number(props.producto.porcentajeComision || 0) / 100)
  const renta = precioVenta * (Number(props.producto.porcentajeRenta || 0) / 100)
  const gastosFinancieros = precioVenta * (Number(props.producto.porcentajeGastosFinancieros || 0) / 100)
  const gastosAdministrativos = precioVenta * (Number(props.producto.porcentajeGastosAdministrativos || 0) / 100)

  const utilidadFinal =
    precioVenta -
    costoTotal -
    (iva +
     cuatroXmil +
     comision +
     renta +
     gastosFinancieros +
     gastosAdministrativos)

  return {
    precioVenta,
    costoTotal,
    iva,
    cuatroXmil,
    comision,
    renta,
    gastosFinancieros,
    gastosAdministrativos,
    utilidadFinal
  }
})

const formatMoney = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0)
}
</script>
<template>
  <ModalReutilizable :show="show" @close="emit('close')">
    <div class="h-[85vh] flex flex-col">

      <!-- HEADER -->
      <h2 class="text-xl font-bold text-blue-800 mb-6 shrink-0">
        Ingreso de producto de tercero
      </h2>

      <!-- ===================== RESUMEN FIJO ===================== -->
  <div class="shrink-0 border rounded-2xl p-6 mb-6 bg-gray-50 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
    <Calculator class="w-5 h-5 text-blue-600" />
    Resumen Financiero
  </h3>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

    <!-- INGRESOS -->
    <div class="bg-white rounded-2xl border shadow p-6">
      <div class="flex items-center gap-2 mb-4">
        <DollarSign class="w-5 h-5 text-green-600" />
        <h4 class="font-semibold text-gray-700">Ingresos</h4>
      </div>

      <p class="text-sm text-gray-500">Precio Venta</p>
      <p class="text-xl font-bold text-green-600">
        {{ formatMoney(cotizacion?.precioVenta) }}
      </p>

      <p class="text-sm text-gray-500 mt-4">IVA</p>
      <p class="text-lg font-semibold text-yellow-600">
        {{ formatMoney(cotizacion?.iva) }}
      </p>
    </div>

    <!-- COSTOS -->
    <div class="bg-white rounded-2xl border shadow p-6">
      <div class="flex items-center gap-2 mb-4">
        <Landmark class="w-5 h-5 text-indigo-600" />
        <h4 class="font-semibold text-gray-700">Costos</h4>
      </div>

      <p class="text-sm text-gray-500">Costo Total</p>
      <p class="text-xl font-bold text-indigo-600">
        {{ formatMoney(cotizacion?.costoTotal) }}
      </p>

      <p class="text-sm text-gray-500 mt-4">Gastos Administrativos</p>
      <p class="text-lg font-semibold text-gray-700">
        {{ formatMoney(cotizacion?.gastosAdministrativos) }}
      </p>
    </div>

    <!-- RENTABILIDAD -->
    <div class="bg-white rounded-2xl border shadow p-6">
      <div class="flex items-center gap-2 mb-4">
        <TrendingUp class="w-5 h-5 text-purple-600" />
        <h4 class="font-semibold text-gray-700">Rentabilidad</h4>
      </div>

      <p class="text-sm text-gray-500">Utilidad Final</p>
      <p
        class="text-xl font-bold"
        :class="cotizacion?.utilidadFinal >= 0 ? 'text-green-600' : 'text-red-600'"
      >
        {{ formatMoney(cotizacion?.utilidadFinal) }}
      </p>
    </div>

  </div>
</div>
      <!-- ===================== FIN RESUMEN ===================== -->


      <!-- ===================== FORMULARIO SCROLL ===================== -->
      <div class="flex-1 overflow-y-auto pr-2">
        <form @submit.prevent="emit('save')">

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(field, index) in camposProducts" :key="index">
              
              <label class="block text-gray-700 mb-1 flex items-center gap-2">
                <component :is="field.icon" class="w-4 h-4 text-blue-600" />
                {{ field.label }}
              </label>

              <div v-if="field.type !== 'checkbox'">
                <input
                  :type="field.type"
                  v-model="producto[field.model]"
                  class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div v-else class="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  v-model="producto[field.model]"
                  class="h-4 w-4"
                />
              </div>

            </div>
          </div>

          <div class="flex justify-end mt-8 pb-4">
            <button
              type="button"
              class="mr-2 px-4 py-2 bg-gray-200 rounded"
              @click="emit('close')"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>

        </form>
      </div>
      <!-- ===================== FIN FORMULARIO ===================== -->

    </div>
  </ModalReutilizable>
</template>