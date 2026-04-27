<template>
  <!-- Trigger -->
  <div>
    <label class="block mb-1.5 text-sm font-medium text-text-2">Ubicación en Maps</label>

    <button type="button" class="loc-trigger" @click="openModal = true">
      <MapPin :size="16" class="text-primary shrink-0" />
      <span class="loc-trigger-text" :class="displayLabel ? 'text-text-1' : 'text-text-3'">
        {{ displayLabel || 'Haz clic para seleccionar en el mapa' }}
      </span>
      <span v-if="modelValue" class="loc-trigger-actions" @click.stop>
        <a
          :href="modelValue"
          target="_blank"
          class="loc-icon-btn"
          title="Ver en Google Maps"
        >
          <ExternalLink :size="13" />
        </a>
        <button type="button" class="loc-icon-btn loc-clear" @click="clearLocation" title="Limpiar ubicación">
          <X :size="13" />
        </button>
      </span>
    </button>
  </div>

  <!-- Modal -->
  <ModalReutilizable :show="openModal" @close="closeModal">
    <div class="space-y-4">

      <!-- Título -->
      <div class="flex items-center gap-2 mb-1">
        <MapPin :size="20" class="text-primary" />
        <h3 class="modal-title">Seleccionar ubicación</h3>
      </div>

      <!-- Buscador con autocomplete -->
      <div class="relative z-10">
        <div class="search-box" :class="{ 'search-box--focus': searchFocused }">
          <Search :size="16" class="search-ico" />
          <input
            v-model="searchQuery"
            @input="onSearchInput"
            @focus="onSearchFocus"
            @blur="delayCloseSuggestions"
            type="text"
            placeholder="Buscar dirección o lugar..."
            class="search-input"
            autocomplete="off"
          />
          <Loader2 v-if="isSearching" :size="15" class="text-primary shrink-0 animate-spin" />
          <button
            v-else-if="searchQuery"
            type="button"
            class="search-clear-btn"
            @click="clearSearch"
          >
            <X :size="13" />
          </button>
        </div>

        <!-- Dropdown de sugerencias -->
        <Transition name="dropdown">
          <ul v-if="showSuggestions && suggestions.length" class="suggestions">
            <li
              v-for="s in suggestions"
              :key="s.place_id"
              class="suggestion"
              @mousedown.prevent="selectSuggestion(s)"
            >
              <MapPin :size="13" class="suggestion-pin" />
              <div class="suggestion-body">
                <span class="suggestion-main">{{ s.structured_formatting.main_text }}</span>
                <span class="suggestion-sub">{{ s.structured_formatting.secondary_text }}</span>
              </div>
            </li>
          </ul>
        </Transition>
      </div>

      <!-- Mapa -->
      <div class="map-wrap">
        <div ref="mapContainer" class="map-canvas" />
        <button
          type="button"
          class="geo-btn"
          :disabled="geoLoading"
          @click="useMyLocation"
          title="Usar mi ubicación actual"
        >
          <Navigation :size="14" :class="geoLoading ? 'animate-pulse' : ''" />
          Mi ubicación
        </button>
      </div>

      <!-- Error de geolocalización -->
      <div v-if="geoError" class="geo-error">
        <AlertCircle :size="15" class="shrink-0" />
        {{ geoError }}
      </div>

      <!-- Panel de confirmación / hint -->
      <template v-if="selectedPlace">
        <div class="confirm-panel">
          <div class="confirm-info">
            <MapPin :size="17" class="text-primary mt-0.5 shrink-0" />
            <div class="min-w-0">
              <p class="confirm-address">{{ selectedPlace.address }}</p>
              <p class="confirm-coords">{{ selectedPlace.lat.toFixed(6) }}, {{ selectedPlace.lng.toFixed(6) }}</p>
            </div>
          </div>
          <button type="button" class="confirm-btn" @click="confirmLocation">
            <CheckCircle :size="15" />
            Confirmar ubicación
          </button>
        </div>
      </template>
      <template v-else>
        <p class="map-hint">
          <MapPin :size="13" class="inline mr-1 text-text-3" />
          Busca una dirección o toca el mapa para seleccionar un punto
        </p>
      </template>

    </div>
  </ModalReutilizable>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onUnmounted } from 'vue'
import {
  MapPin, Search, Navigation, Loader2,
  CheckCircle, AlertCircle, ExternalLink, X,
} from 'lucide-vue-next'
import ModalReutilizable from '../modal/ModalReutilizable.vue'

const props = defineProps<{
  modelValue: string
  address?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:address': [value: string]
}>()

const openModal   = ref(false)
const searchQuery = ref('')
const suggestions = ref<google.maps.places.AutocompletePrediction[]>([])
const isSearching = ref(false)
const showSuggestions = ref(false)
const searchFocused   = ref(false)
const geoLoading  = ref(false)
const geoError    = ref('')

const mapContainer = ref<HTMLElement | null>(null)
const map          = ref<google.maps.Map | null>(null)
const marker       = ref<google.maps.Marker | null>(null)
const geocoder     = ref<google.maps.Geocoder | null>(null)
const autoSvc      = ref<google.maps.places.AutocompleteService | null>(null)
const placesSvc    = ref<google.maps.places.PlacesService | null>(null)

const selectedPlace = ref<{ address: string; lat: number; lng: number } | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const displayLabel = computed(() => props.address || (props.modelValue ? 'Ubicación seleccionada' : ''))

function parseLatLng(url: string): { lat: number; lng: number } | null {
  const m = url.match(/\?q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null
}

// ── Modal lifecycle ───────────────────────────────────────────────────────────

watch(openModal, async (val) => {
  if (val) {
    await nextTick()
    initMap()
  } else {
    teardown()
  }
})

function closeModal() {
  openModal.value = false
}

function teardown() {
  if (debounceTimer) clearTimeout(debounceTimer)
  suggestions.value    = []
  showSuggestions.value = false
  searchQuery.value    = ''
  geoError.value       = ''
  geoLoading.value     = false
  isSearching.value    = false
  selectedPlace.value  = null
  marker.value         = null
  map.value            = null
  geocoder.value       = null
  autoSvc.value        = null
  placesSvc.value      = null
}

// ── Map initialisation ────────────────────────────────────────────────────────

function initMap() {
  if (!mapContainer.value) return

  const existing = parseLatLng(props.modelValue)
  const center   = existing ?? { lat: 6.2442, lng: -75.5812 } // Medellín
  const zoom     = existing ? 15 : 13

  map.value = new google.maps.Map(mapContainer.value, {
    center,
    zoom,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  })

  geocoder.value  = new google.maps.Geocoder()
  autoSvc.value   = new google.maps.places.AutocompleteService()
  placesSvc.value = new google.maps.places.PlacesService(map.value)

  if (existing) {
    const latLng = new google.maps.LatLng(existing.lat, existing.lng)
    placeMarker(latLng)
    if (props.address) {
      selectedPlace.value = { address: props.address, ...existing }
      searchQuery.value   = props.address
    } else {
      reverseGeocode(latLng)
    }
  }

  map.value.addListener('click', (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      placeMarker(e.latLng)
      reverseGeocode(e.latLng)
    }
  })
}

// ── Marker ────────────────────────────────────────────────────────────────────

function placeMarker(latLng: google.maps.LatLng) {
  if (marker.value) {
    marker.value.setPosition(latLng)
  } else {
    marker.value = new google.maps.Marker({
      position: latLng,
      map: map.value!,
      draggable: true,
      animation: google.maps.Animation.DROP,
    })
    marker.value.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) reverseGeocode(e.latLng)
    })
  }
  selectedPlace.value = null
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

function reverseGeocode(latLng: google.maps.LatLng) {
  if (!geocoder.value) return
  geocoder.value.geocode({ location: latLng }, (results, status) => {
    const address = status === 'OK' && results?.[0]
      ? results[0].formatted_address
      : `${latLng.lat().toFixed(6)}, ${latLng.lng().toFixed(6)}`
    searchQuery.value   = address
    selectedPlace.value = { address, lat: latLng.lat(), lng: latLng.lng() }
  })
}

// ── Autocomplete search ───────────────────────────────────────────────────────

function onSearchFocus() {
  searchFocused.value   = true
  showSuggestions.value = suggestions.value.length > 0
}

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  const q = searchQuery.value.trim()
  if (!q) {
    suggestions.value    = []
    showSuggestions.value = false
    isSearching.value    = false
    return
  }
  isSearching.value = true
  debounceTimer = setTimeout(() => fetchSuggestions(q), 300)
}

function fetchSuggestions(query: string) {
  if (!autoSvc.value) return
  autoSvc.value.getPlacePredictions({ input: query }, (preds, status) => {
    isSearching.value = false
    if (status === 'OK' && preds) {
      suggestions.value    = preds
      showSuggestions.value = true
    } else {
      suggestions.value    = []
      showSuggestions.value = false
    }
  })
}

function selectSuggestion(pred: google.maps.places.AutocompletePrediction) {
  showSuggestions.value = false
  searchQuery.value     = pred.description
  if (!placesSvc.value) return
  placesSvc.value.getDetails(
    { placeId: pred.place_id, fields: ['geometry', 'formatted_address'] },
    (place, status) => {
      if (status !== 'OK' || !place?.geometry?.location) return
      const latLng = place.geometry.location
      map.value?.setCenter(latLng)
      map.value?.setZoom(15)
      placeMarker(latLng)
      const address = place.formatted_address ?? pred.description
      searchQuery.value   = address
      selectedPlace.value = { address, lat: latLng.lat(), lng: latLng.lng() }
    }
  )
}

function delayCloseSuggestions() {
  searchFocused.value = false
  setTimeout(() => { showSuggestions.value = false }, 200)
}

function clearSearch() {
  searchQuery.value    = ''
  suggestions.value    = []
  showSuggestions.value = false
}

// ── Geolocation ───────────────────────────────────────────────────────────────

function useMyLocation() {
  geoError.value   = ''
  geoLoading.value = true
  if (!navigator.geolocation) {
    geoError.value   = 'Tu navegador no soporta geolocalización.'
    geoLoading.value = false
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoLoading.value = false
      const latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
      map.value?.setCenter(latLng)
      map.value?.setZoom(15)
      placeMarker(latLng)
      reverseGeocode(latLng)
    },
    (err) => {
      geoLoading.value = false
      geoError.value   = err.code === err.PERMISSION_DENIED
        ? 'Permiso de ubicación denegado. Habilítalo en la configuración del navegador.'
        : 'No se pudo obtener tu ubicación. Intenta de nuevo.'
    }
  )
}

// ── Confirm / Clear ───────────────────────────────────────────────────────────

function confirmLocation() {
  if (!selectedPlace.value) return
  const { lat, lng, address } = selectedPlace.value
  emit('update:modelValue', `https://maps.google.com/?q=${lat},${lng}`)
  emit('update:address', address)
  openModal.value = false
}

function clearLocation() {
  emit('update:modelValue', '')
  emit('update:address', '')
}

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
/* ── Trigger ──────────────────────────────────────────────────────────────── */
.loc-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  padding: 9px 12px;
  background: #F8FAFC;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}
.loc-trigger:hover {
  border-color: var(--color-primary);
  background: white;
}
.loc-trigger-text {
  flex: 1;
  font-size: 13.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.loc-trigger-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}
.loc-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 50%;
  color: var(--color-text-3);
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
}
.loc-icon-btn:hover { color: var(--color-primary); background: var(--color-primary-light); }
.loc-clear:hover     { color: #B91C1C !important; background: #FEE2E2 !important; }

/* ── Modal title ─────────────────────────────────────────────────────────── */
.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-1);
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* ── Search ──────────────────────────────────────────────────────────────── */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  padding: 9px 14px;
  background: white;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-box--focus,
.search-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(5, 78, 175, 0.10);
}
.search-ico   { color: var(--color-text-3); flex-shrink: 0; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--color-text-1);
  background: transparent;
}
.search-input::placeholder { color: var(--color-text-3); }
.search-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: var(--color-border-light);
  border-radius: 50%;
  color: var(--color-text-3);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s;
}
.search-clear-btn:hover { background: var(--color-border); }

/* ── Suggestions ─────────────────────────────────────────────────────────── */
.suggestions {
  position: absolute;
  top: calc(100% + 5px);
  left: 0; right: 0;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-card);
  max-height: 230px;
  overflow-y: auto;
  list-style: none;
  padding: 4px;
  margin: 0;
  z-index: 20;
}
.suggestion {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 12px;
  border-radius: var(--r-md);
  cursor: pointer;
  transition: background 0.1s;
}
.suggestion:hover { background: var(--color-primary-light); }
.suggestion-pin  { color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }
.suggestion-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.suggestion-main { font-size: 13px; font-weight: 500; color: var(--color-text-1); }
.suggestion-sub  {
  font-size: 12px;
  color: var(--color-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Map ─────────────────────────────────────────────────────────────────── */
.map-wrap {
  position: relative;
  border-radius: var(--r-xl);
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.map-canvas { height: 360px; width: 100%; }
.geo-btn {
  position: absolute;
  top: 10px; right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  background: white;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-btn);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  z-index: 1;
}
.geo-btn:hover    { background: var(--color-primary-light); border-color: var(--color-primary); }
.geo-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Geo error ───────────────────────────────────────────────────────────── */
.geo-error {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  background: #FEF2F2;
  color: #B91C1C;
  font-size: 13px;
  border-radius: var(--r-md);
  border: 1px solid #FECACA;
}

/* ── Confirmation panel ──────────────────────────────────────────────────── */
.confirm-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: var(--color-primary-light);
  border: 1px solid #BFDBFE;
  border-radius: var(--r-xl);
}
.confirm-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.confirm-address {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-1);
  line-height: 1.4;
}
.confirm-coords {
  font-size: 11px;
  color: var(--color-text-3);
  font-family: 'Courier New', monospace;
  margin-top: 3px;
}
.confirm-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-btn);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s;
}
.confirm-btn:hover { background: var(--color-primary-dark); }

/* ── Hint ────────────────────────────────────────────────────────────────── */
.map-hint {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-3);
  padding: 2px 0;
}

/* ── Dropdown transition ─────────────────────────────────────────────────── */
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.14s, transform 0.14s;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
