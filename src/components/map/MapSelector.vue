<template>
  <div>
    <label class="block mb-1 text-sm font-sm text-sm text-gray-700">Ubicación en Maps</label>

    <input
      type="text"
      :value="modelValue"
      readonly
      class="w-full border px-3 py-2  rounded-full cursor-pointer bg-gray-50"
      @click="openModal = true"
      placeholder="Haz clic para seleccionar ubicación"
    />

    <div v-if="modelValue" class="mt-2">
      <a :href="modelValue" target="_blank" class="text-blue-600 underline text-sm">Ver en Google Maps</a>
    </div>

    <!-- Modal -->
    <ModalReutilizable :show="openModal" @close="openModal = false">
      <template #default>
        <div class="space-y-4">
          <!-- Buscador -->
          <input
            type="text"
            v-model="search"
            @keydown.enter.prevent="searchLocation"
            placeholder="Buscar dirección"
            class="border px-3 py-2 w-full  rounded-full "
          />

          <!-- Mapa -->
          <div ref="mapContainer" class="h-96 w-full  rounded-full overflow-hidden" />

          <!-- Confirmar -->
          <div class="text-right">
            <button
              class="bg-blue-600 text-white px-4 py-2  rounded-full"
              :disabled="!selectedLatLng"
              @click="confirmLocation"
            >
              Confirmar ubicación
            </button>
          </div>
        </div>
      </template>
    </ModalReutilizable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import ModalReutilizable from '../modal/ModalReutilizable.vue';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits(['update:modelValue']);

const openModal = ref(false);
const search = ref('');
const mapContainer = ref<HTMLElement | null>(null);
const map = ref<google.maps.Map | null>(null);
const marker = ref<google.maps.Marker | null>(null);
const selectedLatLng = ref<{ lat: number; lng: number } | null>(null);

watch(openModal, async (val) => {
  if (val) {
    await nextTick(); // Esperar a que se renderice el modal
    initMap();
  }
});

function initMap() {
  if (!mapContainer.value) return;

  const center = { lat: 6.2442, lng: -75.5812 };

  map.value = new google.maps.Map(mapContainer.value, {
    center,
    zoom: 13,
  });

  map.value.addListener('click', (e: google.maps.MapMouseEvent) => {
    if (e.latLng) placeMarker(e.latLng);
  });
}

function placeMarker(latLng: google.maps.LatLng) {
  if (marker.value) {
    marker.value.setMap(null);
  }
  marker.value = new google.maps.Marker({
    position: latLng,
    map: map.value!,
  });
  selectedLatLng.value = {
    lat: latLng.lat(),
    lng: latLng.lng(),
  };
}

function confirmLocation() {
  if (!selectedLatLng.value) return;
  const { lat, lng } = selectedLatLng.value;
  const url = `https://maps.google.com/?q=${lat},${lng}`;
  emit('update:modelValue', url);
  openModal.value = false;
}

function searchLocation() {
  if (!search.value || !map.value) return;

  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: search.value }, (results, status) => {
    if (status === 'OK' && results && results[0]) {
      const location = results[0].geometry.location;
      map.value!.setCenter(location);
      placeMarker(location);
    } else {
      alert('Dirección no encontrada');
    }
  });
}
</script>

<style scoped>
input:focus {
  outline: none;
  border-color: #2563eb;
}
</style>