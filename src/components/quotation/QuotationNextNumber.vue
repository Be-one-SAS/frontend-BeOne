<template>
  <div
    class="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-600 w-fit"
  >
    <!-- Loader -->
    <span v-if="loading" class="text-sm text-white animate-pulse">
      Generando número de cotización...
    </span>

    <!-- Error -->
    <span v-else-if="error" class="text-sm text-red-500">
      Error al obtener número
    </span>

    <!-- Success -->
    <span v-else class="text-sm text-white">
      Cotización No.
      <strong class="font-semibold text-white">
        {{ quotationNumber }}
      </strong>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { nextQuotationNumber } from "../../services/quotation.service"

const quotationNumber = ref<string>("")
const loading = ref(true)
const error = ref(false)

const fetchNextQuotationNumber = async () => {
  try {
    loading.value = true
    error.value = false


   const res = await  nextQuotationNumber()

     if (!res) {
       throw new Error("Error fetching quotation number")
     }
     
    quotationNumber.value = res.data.numero
  } catch (err) {
    console.error(err)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchNextQuotationNumber()
})
</script>