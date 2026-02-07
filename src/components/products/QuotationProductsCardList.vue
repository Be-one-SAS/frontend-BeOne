<template>
  <div class="flex flex-col p-0 w-full h-auto">

    <h2 class="text-2xl font-semibold text-gray-800">
      Lista de Productos
    </h2>

    <!-- Estado vacío -->
    <div v-if="!items || items.length === 0" class="text-center py-12 text-gray-500 text-sm font-medium m-auto">
      Aún no tiene productos agregados
    </div>

    <!-- Grid Cards -->
    <div v-else class="grid grid-cols-1 gap-6 w-full mt-10">
      <div v-for="(item, index) in items" :key="index"
        class="relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition w-full">
        <!-- Header -->
        <div class="p-4 border-b bg-gray-50 rounded-t-xl">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500 font-semibold">
              #{{ index + 1 }}
            </span>

            <div class="flex gap-3">
              <Badge :estado="item.estado" />

              <span :class="[
                'px-2 py-1 rounded-full text-xs font-semibold',
                item.isCurrentVersion
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
              ]">
                v{{ item.version }}
              </span>
            </div>

          </div>
        </div>

        <!-- BODY 3 COLUMNAS -->
        <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- ===================== -->
          <!-- COLUMNA 1 INFO BASE -->
          <!-- ===================== -->
          <div @click="emitEdit(item)" class="cursor-pointer space-y-3 bg-[#f3f4f6] rounded-xl p-4">
            <h3 class="font-semibold text-gray-800 text-sm">
              {{ item.dispositivo }}
            </h3>

            <p class="text-xs text-gray-500">
              {{ item.descripcion }}
            </p>

            <div class="text-xs text-gray-600 space-y-1">
              <p><strong>Categoría:</strong> {{ item.category }}</p>
              <p><strong>Medidas:</strong> {{ item.medidas }}</p>
              <p>
                <strong>Transporte:</strong>
                {{ item.incluyeTransporte ? 'Sí' : 'No' }}
              </p>
            </div>

            <div class="flex justify-between items-center mt-3">
              <!-- <span class="font-semibold text-gray-800 text-sm">
                {{ format(item.unitPrice) }}
              </span> -->
            </div>
          </div>

          <!-- ===================== -->
          <!-- COLUMNA 2 FINANCIERO -->
          <!-- ===================== -->
          <div class="bg-[#f3f4f6] rounded-xl p-4 text-xs space-y-2">
            <h4 class="font-semibold text-gray-800 text-sm">
              Detalle Financiero
            </h4>

            <div class="grid grid-cols-2 gap-y-1">
              <span>Q Jornada:</span>
              <span class="text-right">{{ 0 }}</span>

              <span>Q Producto:</span>
              <span class="text-right">{{ 0 }}</span>

              <span>Costo Unit.</span>
              <span class="text-right">{{ format(item.costoUnitario) }}</span>

              <span>Precio Unit.</span>
              <span class="text-right">{{ format(item.precioUnitario) }}</span>

              <span>Costo Total:</span>
              <span class="text-right">{{ format(item.costoTotal) }}</span>

              <span>Porcentaje adicional:</span>
              <span class="text-right">%0</span>

              <span>Porcentaje de descuento:</span>
              <span class="text-right">%0</span>

            </div>
          </div>

          <!-- ===================== -->
          <!-- COLUMNA 3 IMAGEN -->
          <!-- ===================== -->
          <div class="flex flex-col items-center justify-center">
            <img :src="linkFoto" alt="Producto" class="rounded-xl object-cover w-full h-auto shadow" />

            <!-- <a
              :href="item.linkFoto"
              target="_blank"
              class="mt-4 text-blue-600 hover:text-blue-800 underline text-xs"
            >
              Ver Foto
            </a> -->
          </div>

        </div>

        <!-- FOOTER TOTAL -->
        <div class="border-t p-4 flex justify-between items-center bg-gray-50 rounded-b-xl">
          <span class="text-sm font-semibold text-gray-700">
            Precio Venta Total
          </span>

          <span class="text-lg font-bold text-blue-700">
            {{ format(item.precioVenta) }}
          </span>

          <button @click.stop="emitDelete(item)" class="text-red-600 hover:text-red-800 text-sm font-semibold">
            Eliminar
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import Badge from '@/components/badge/Badge.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  linkFoto: {
    type: String,
    required: false,
    default: ''
  }
})

const emit = defineEmits(['edit', 'delete'])

const emitEdit = (item) => {
  emit('edit', item)
}

const emitDelete = (item) => {
  emit('delete', item)
}

const format = (value) => {
  if (!value) return "$0"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value)
}
</script>