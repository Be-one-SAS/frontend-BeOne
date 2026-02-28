<template>
  <div
    class="bg-white rounded-[18px] overflow-hidden
           shadow-[0_1px_4px_rgba(5,78,175,.06),_0_4px_16px_rgba(5,78,175,.08)]"
  >
    <table class="w-full table-auto">

      <!-- ── HEADER ────────────────────────────────── -->
      <thead>
        <tr class="bg-[#EBF3FC] border-b border-[#E2EBF6]">
          <th
            v-for="col in columns"
            :key="col.field"
            class="px-4 py-3 text-left text-[11px] font-semibold
                   text-text-2 uppercase tracking-wider font-['Inter',sans-serif]
                   whitespace-nowrap"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>

      <!-- ── BODY ──────────────────────────────────── -->
      <tbody>
        <tr
          v-for="(row, index) in data"
          :key="index"
          class="border-b border-[#EBF3FC] hover:bg-[#F0F7FF] transition-colors duration-150"
        >
          <td
            v-for="col in columns"
            :key="col.field"
            class="px-4 py-3.5 text-[13px] text-text-1 font-['Inter',sans-serif]
                   whitespace-nowrap"
          >
            <!-- Slot personalizado si existe (nombrado por field) -->
            <slot
              v-if="$slots[col.field]"
              :name="col.field"
              :value="row[col.field]"
              :row="row"
            />

            <!-- ID: monospace gris -->
            <span
              v-else-if="col.field === 'id'"
              class="text-[12px] text-text-3 font-mono"
            >
              #{{ row[col.field] }}
            </span>

            <!-- Teléfonos: ícono + valor -->
            <span
              v-else-if="col.field === 'phoneOne' || col.field === 'phoneTwo'"
              class="flex items-center gap-1.5 text-text-2"
            >
              <Phone class="w-3 h-3 text-text-3 shrink-0" />
              {{ row[col.field] || '—' }}
            </span>

            <!-- Email: enlace con ícono -->
            <a
              v-else-if="col.field === 'email'"
              :href="`mailto:${row[col.field]}`"
              class="flex items-center gap-1.5 text-[#054EAF] hover:underline"
            >
              <Mail class="w-3 h-3 shrink-0" />
              {{ row[col.field] || '—' }}
            </a>

            <!-- Zona de operación: pill badge -->
            <span
              v-else-if="col.field === 'zoneOperation'"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full
                     text-[11px] font-medium bg-[#EBF3FC] text-[#054EAF]"
            >
              {{ row[col.field] || '—' }}
            </span>

            <!-- Nombre: bold -->
            <span
              v-else-if="col.field === 'name'"
              class="font-semibold text-text-1"
            >
              {{ row[col.field] || '—' }}
            </span>

            <!-- NIT: monospace -->
            <span
              v-else-if="col.field === 'nit'"
              class="font-mono text-[12px] text-text-2"
            >
              {{ row[col.field] || '—' }}
            </span>

            <!-- formatFn: soporte legado -->
            <span v-else-if="col.formatFn">
              {{ col.formatFn(row[col.field]) }}
            </span>

            <!-- Default -->
            <span v-else class="text-text-1">
              {{ row[col.field] ?? '—' }}
            </span>

          </td>
        </tr>

        <!-- ── ESTADO VACÍO ───────────────────────── -->
        <tr v-if="data.length === 0">
          <td :colspan="columns.length" class="py-16 text-center">
            <div class="flex flex-col items-center gap-3 text-text-3">
              <Inbox class="w-10 h-10 opacity-40" />
              <p class="text-[14px] font-['Inter',sans-serif]">No se encontraron registros</p>
            </div>
          </td>
        </tr>

      </tbody>
    </table>

    <!-- ── FOOTER: contador ───────────────────────── -->
    <div
      class="px-4 py-3 border-t border-[#EBF3FC] bg-[#FAFCFF]
             flex items-center justify-between"
    >
      <span class="text-[12px] text-text-3 font-['Inter',sans-serif]">
        {{ data.length }} registro{{ data.length !== 1 ? 's' : '' }}
      </span>
    </div>

  </div>
</template>

<script setup>
import { Phone, Mail, Inbox } from 'lucide-vue-next'

defineProps({
  data:    { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
})

const emit = defineEmits(['row-click'])
</script>

<style scoped>
table { border-collapse: collapse; }
</style>
