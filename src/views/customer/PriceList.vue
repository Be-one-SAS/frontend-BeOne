<template>
  <div class="bg-white p-6 rounded-xl shadow">
    <h2 class="text-xl font-semibold mb-4 text-gray-800">
      Clientes directos
    </h2>

    <!-- Tabla -->
    <div class="overflow-x-auto">
      <table class="min-w-[1800px] table-auto border-separate border-spacing-y-3">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="client in clients" :key="client.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3">{{ client.name }}</td>
            <td class="px-4 py-3">{{ client.email }}</td>
            <td class="px-4 py-3">{{ client.phone }}</td>

            <td class="px-4 py-3 text-center">
              <button @click="openAssignPrice(client)"
                class="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700">
                Assign Price
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div class="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
        <h3 class="text-lg font-semibold mb-4">
          Assign Price to {{ selectedClient?.name }}
        </h3>

        <div class="mb-4">
          <label class="block text-sm text-gray-700 mb-1">Price</label>
          <input v-model="price" type="number" placeholder="Enter price"
            class="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div class="flex justify-end gap-3">
          <button @click="closeModal" class="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>

          <button @click="savePrice" class="px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { getBox } from "../../services/suppliers.service";

const clients = ref([]);
const selectedClient = ref(null);
const price = ref(null);
const showModal = ref(false);


//  GET clients directos
const fetchClients = async () => {
  try {
    const response = await getBox();
    const data = response.data || []

    console.log("Datos recibidos:", data)

    // --- NUEVO: Tomamos solo el primer grupo ---
    const primerGrupo = data[1]

    // --- Transformamos a lista de nombres ---
    clients.value = primerGrupo.map(box => ({
      id: box.id,
      name: box.boxName,   // mostramos CAFAM, COLSUBSIDIO, etc.
      email: box.boxEmail,
      phone: box.boxPhone
    }))

    console.log("Datos crudos:",primerGrupo)

    console.log("Primer grupo:", clientes.value)
    clientesCargados.value = true

  } catch (e) {
    console.error("Error loading clients:", e);
  }
};

onMounted(() => {
  fetchClients();
});

console.log(clients.value);

// Abrir modal
const openAssignPrice = (client) => {
  selectedClient.value = client;
  price.value = null;
  showModal.value = true;
};

// Guardar precio
const savePrice = async () => {
  try {
    await axios.post("/api/customer-prices", {
      clientId: selectedClient.value.id,
      productId: 1, // ⚠ Aquí debes pasar el producto real
      price: parseFloat(price.value),
    });

    closeModal();
  } catch (e) {
    console.error("Error saving price:", e);
  }
};

// Cerrar modal
const closeModal = () => {
  showModal.value = false;
  selectedClient.value = null;
  price.value = null;
};
</script>