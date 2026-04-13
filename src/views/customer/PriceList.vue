<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBox } from '../../services/suppliers.service'
import ModalReutilizable from '../../components/modal/ModalReutilizable.vue'
import { Tag, Inbox } from 'lucide-vue-next'

const clients       = ref([])
const loading       = ref(true)
const searchQuery   = ref('')

const showModal     = ref(false)
const selectedClient = ref(null)
const price         = ref(null)

/* ─── filter ────────────────────────────────────────────── */
const filteredClients = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return clients.value
  return clients.value.filter(c =>
    (c.name  || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (c.phone || '').toLowerCase().includes(q)
  )
})

/* ─── fetch ─────────────────────────────────────────────── */
const fetchClients = async () => {
  loading.value = true
  try {
    const response = await getBox()
    const primerGrupo = (response.data || [])[1] || []
    clients.value = primerGrupo.map(box => ({
      id:    box.id,
      name:  box.boxName,
      email: box.boxEmail,
      phone: box.boxPhone,
    }))
  } catch (e) {
    console.error('Error loading clients:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchClients)

/* ─── modal ─────────────────────────────────────────────── */
const openAssignPrice = (client) => {
  selectedClient.value = client
  price.value = null
  showModal.value = true
}

const savePrice = async () => {
  try {
    console.log('Guardar precio:', {
      clientId: selectedClient.value.id,
      price: parseFloat(price.value),
    })
    closeModal()
  } catch (e) {
    console.error('Error saving price:', e)
  }
}

const closeModal = () => {
  showModal.value      = false
  selectedClient.value = null
  price.value          = null
}
</script>

<template>
  <div class="pl-page">

    <!-- ══════════════════════════════════════════ -->
    <!-- HEADER                                     -->
    <!-- ══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="pl-title">Clientes directos</h2>
        <p class="pl-subtitle">{{ filteredClients.length }} clientes encontrados</p>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- FILTROS                                    -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[14px] p-4 mb-5 shadow-[0_1px_4px_rgba(5,78,175,.06)] grid grid-cols-1 gap-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nombre, correo o teléfono…"
        class="pl-input"
      />
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA                                      -->
    <!-- ══════════════════════════════════════════ -->
    <div class="bg-white rounded-[18px] shadow-[0_1px_4px_rgba(5,78,175,.06),_0_4px_16px_rgba(5,78,175,.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="pl-table">

          <!-- HEAD -->
          <thead>
            <tr class="pl-head-row">
              <th class="pl-th pl-th-center" style="width:44px">#</th>
              <th class="pl-th">Nombre</th>
              <th class="pl-th">Correo</th>
              <th class="pl-th">Teléfono</th>
              <th class="pl-th" style="width:140px">Acciones</th>
            </tr>
          </thead>

          <!-- BODY -->
          <tbody>

            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="n in 5" :key="`sk-${n}`" class="pl-row">
                <td class="pl-td"><div class="sk-box" style="width:28px"></div></td>
                <td class="pl-td"><div class="sk-box" style="width:160px"></div></td>
                <td class="pl-td"><div class="sk-box" style="width:200px"></div></td>
                <td class="pl-td"><div class="sk-box" style="width:110px"></div></td>
                <td class="pl-td"><div class="sk-box" style="width:100px"></div></td>
              </tr>
            </template>

            <!-- Filas reales -->
            <template v-else>
              <tr v-for="(client, index) in filteredClients" :key="client.id" class="pl-row">

                <td class="pl-td pl-td-center pl-idx">{{ index + 1 }}</td>

                <td class="pl-td">
                  <span class="pl-name">{{ client.name || '—' }}</span>
                </td>

                <td class="pl-td">{{ client.email || '—' }}</td>

                <td class="pl-td">{{ client.phone || '—' }}</td>

                <td class="pl-td" @click.stop>
                  <button class="act-btn act-price" @click="openAssignPrice(client)">
                    <Tag :size="12" /> Asignar precio
                  </button>
                </td>
              </tr>
            </template>

          </tbody>
        </table>
      </div>

      <!-- Estado vacío -->
      <div
        v-if="!loading && filteredClients.length === 0"
        class="py-16 flex flex-col items-center gap-3 text-text-3"
      >
        <Inbox class="w-10 h-10 opacity-40" />
        <p class="text-[14px]">No se encontraron clientes directos</p>
      </div>

    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- MODAL: Asignar precio                      -->
    <!-- ══════════════════════════════════════════ -->
    <ModalReutilizable :show="showModal" @close="closeModal">
      <div>
        <h2 class="modal-title">Asignar precio</h2>
        <p class="text-[13px] text-[#64748B] mb-4">
          Cliente: <strong class="text-[#0F1A2E]">{{ selectedClient?.name }}</strong>
        </p>

        <div class="mb-4">
          <label class="block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8] mb-2">
            Precio
          </label>
          <input
            v-model="price"
            type="number"
            placeholder="Ingresa el precio…"
            class="pl-input"
          />
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            @click="closeModal"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2EBF6] rounded-[8px] hover:bg-[#E2EBF6] transition"
          >Cancelar</button>
          <button
            @click="savePrice"
            :disabled="!price"
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#054EAF] text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-[#03368A] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >Guardar precio</button>
        </div>
      </div>
    </ModalReutilizable>

  </div>
</template>

<style scoped>
/* ─── Page ──────────────────────────────────────────────── */
.pl-page { width: 100%; }

/* ─── Header ────────────────────────────────────────────── */
.pl-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 0 0 4px;
  line-height: 1.2;
}
.pl-subtitle {
  font-size: 13px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* ─── Input ─────────────────────────────────────────────── */
.pl-input {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.pl-input:focus {
  border-color: var(--primary, #054EAF);
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.1);
}
.pl-input::placeholder { color: var(--text-3, #94A3B8); }

/* ─── Tabla ─────────────────────────────────────────────── */
.pl-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Inter', sans-serif;
}

/* ─── Head ──────────────────────────────────────────────── */
.pl-head-row { background: #EBF3FC; }

.pl-th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2, #64748B);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #E2EBF6;
}
.pl-th-center { text-align: center; }

/* ─── Filas ─────────────────────────────────────────────── */
.pl-row {
  background: #FFFFFF;
  transition: background 0.15s ease;
}
.pl-row:hover { background: #F0F7FF; }

.pl-td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  border-bottom: 1px solid #EBF3FC;
  vertical-align: middle;
  white-space: nowrap;
}
.pl-td-center { text-align: center; }

.pl-idx  { font-size: 12px; color: var(--text-3, #94A3B8); font-weight: 500; }
.pl-name { font-weight: 600; }

/* ─── Botón de acción ───────────────────────────────────── */
.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
  line-height: 1;
}
.act-price       { background: #EDE9FE; color: #7C3AED; }
.act-price:hover { background: #DDD6FE; }

/* ─── Skeleton ──────────────────────────────────────────── */
.sk-box {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Modal ─────────────────────────────────────────────── */
.modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0 0 8px;
}
</style>
