<template>
  <div class="bg-white shadow-md rounded-xl p-6 mx-auto space-y-8">
    <!-- Título -->
    <div>
      <h2 class="text-2xl font-bold text-blue-700">Cotización No. {{ cotizacion.numero }}</h2>
    </div>

    <!-- Datos Generales -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputLabel label="Fecha de Cotización" v-model="cotizacion.fechaCotizacion" type="date" />
      <InputLabel label="Agente Comercial" v-model="cotizacion.agenteComercial" />


      <div>
        <label class="block text-gray-800 font-medium mb-1">Cliente</label>
        <select v-model="cotizacion.unidadEjecucion"
          class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800">
          <option>Cliente directo</option>
          <option>Compensar</option>
          <option>Colsubsidio</option>
          <option>Cafam</option>
          <option>Comfama</option>
          <option>Comfenalco</option>
          <option>Comfachocó</option>
        </select>
      </div>
      <div>
        <label class="block text-gray-800 font-medium mb-1">Cliente final</label>
        <select v-model="cotizacion.unidadEjecucion"
          class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800">
          <option>Cliente directo</option>
          <option>Compensar</option>
          <option>Colsubsidio</option>
          <option>Cafam</option>
          <option>Comfama</option>
          <option>Comfenalco</option>
          <option>Comfachocó</option>
        </select>
      </div>

      <InputLabel label="Contacto" v-model="cotizacion.contacto" />
      <InputLabel label="Correo" v-model="cotizacion.correo" type="email" />

      <InputLabel label="Celular" v-model="cotizacion.celular" />
    </div>

    <!-- Detalles del Evento -->
    <div class="border-t pt-6 space-y-4">
      <h3 class="text-xl font-semibold text-gray-800">Detalles del Evento</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputLabel label="Fecha Inicio Evento" v-model="cotizacion.fechaInicioEvento" type="date" />
        <InputLabel label="Fecha Fin Evento" v-model="cotizacion.fechaFinEvento" type="date" />

        <InputLabel label="Ubicación del Evento" v-model="cotizacion.ubicacion" />
        <InputLabel label="Link en Maps" v-model="cotizacion.linkMaps" />

        <InputLabel label="Horario de Inicio" v-model="cotizacion.horarioInicio" type="time" />
        <InputLabel label="Horario de Finalización" v-model="cotizacion.horarioFin" type="time" />

        <InputLabel label="Número de Asistentes" v-model="cotizacion.asistentes" />
        <InputLabel label="Vigencia de Cotización" v-model="cotizacion.vigencia" />

        <div>
          <label class="block text-gray-800 font-medium mb-1">Unidad de Ejecución</label>
          <select v-model="cotizacion.unidadEjecucion"
            class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800">
            <option>Nivel Nacional</option>
            <option>Nivel Regional</option>
            <option>Local</option>
          </select>
        </div>

        <InputLabel label="Tipo de Suelo" v-model="cotizacion.tipoSuelo" />
      </div>
    </div>

    <!-- Nota -->
    <div class=" pt-6 text-gray-700 text-sm space-y-2">
      <p class="font-semibold">Nota:</p>
      <p>Esta cotización no implica la confirmación del servicio solicitado, ya que está sujeta a disponibilidad.</p>
      <ol class="list-decimal pl-6 space-y-1">
        <li>El cliente debe enviar comentarios y observaciones en el tiempo de vigencia de la cotización.</li>
        <li>Be One SAS analizará la disponibilidad del lugar y servicios ofrecidos.</li>
        <li>Se enviará una respuesta de confirmación, cancelación o fechas disponibles.</li>
      </ol>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputLabel label="Buscar" v-model="cotizacion.asistentes" />

      <div>
        <label class="block text-gray-800 font-medium mb-1">Cliente</label>
        <select v-model="cotizacion.unidadEjecucion"
          class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800">
          <option>Cliente directo</option>
          <option>Compensar</option>
          <option>Colsubsidio</option>
          <option>Cafam</option>
          <option>Comfama</option>
          <option>Comfenalco</option>
          <option>Comfachocó</option>
        </select>
      </div>
      <div>
        <label class="block text-gray-800 font-medium mb-1">Cliente final</label>
        <select v-model="cotizacion.unidadEjecucion"
          class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800">
          <option>Cliente directo</option>
          <option>Compensar</option>
          <option>Colsubsidio</option>
          <option>Cafam</option>
          <option>Comfama</option>
          <option>Comfenalco</option>
          <option>Comfachocó</option>
        </select>
      </div>
    </div>
  </div>

</template>

<script setup>
import InputLabel from '@/components/input/InputLabel.vue';
import { reactive } from 'vue'

const cotizacion = reactive({
  numero: 115,
  fechaCotizacion: '2025-04-14',
  agenteComercial: '',
  cliente: '',
  empresa: '',
  contacto: '',
  correo: '',
  celular: '',
  fechaInicioEvento: '',
  fechaFinEvento: '',
  ubicacion: '',
  linkMaps: '',
  horarioInicio: '',
  horarioFin: '',
  asistentes: '',
  vigencia: '15 días',
  unidadEjecucion: 'Nivel Nacional',
  tipoSuelo: ''
})
</script>