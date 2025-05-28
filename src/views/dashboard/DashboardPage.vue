<template>
  <div class="flex">
    <!-- Contenido principal -->
    <div class="flex-1 flex flex-col p-8 space-y-10 gap-3 overflow-y-auto h-screen pr-[22rem]">
      <!-- Resumen general -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Cotizaciones en Curso" :value="stats.cotizaciones" icon="🧾" />
        <Card title="Eventos Próximos" :value="stats.eventos" icon="📅" />
        <Card title="Pendientes Urgentes" :value="stats.urgentes" icon="⏰" />
        <Card title="Tareas Asignadas" :value="stats.tareas" icon="🛠️" />
      </div>

      <!-- Tabla de tareas urgentes -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">Pendientes Urgentes</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto border-separate border-spacing-y-3">
            <thead>
              <tr class="text-left text-sm text-gray-600">
                <th class="px-4 py-2">Tarea</th>
                <th class="px-4 py-2">Responsable</th>
                <th class="px-4 py-2">Vencimiento</th>
                <th class="px-4 py-2">Estado</th>
                <th class="px-4 py-2">Urgencia</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in pendientes"
                :key="item.id"
                class="bg-gray-50 rounded-lg shadow-sm"
              >
                <td class="px-4 py-3 text-gray-800 font-medium">{{ item.tarea }}</td>
                <td class="px-4 py-3 text-gray-700">{{ item.responsable }}</td>
                <td class="px-4 py-3 text-gray-600">{{ item.vencimiento }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                    :class="{
                      'bg-yellow-100 text-yellow-800': item.estado === 'Pendiente',
                      'bg-blue-100 text-blue-800': item.estado === 'En curso',
                      'bg-green-100 text-green-800': item.estado === 'Completado'
                    }"
                  >
                    {{ item.estado }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                    :class="{
                      'bg-red-100 text-red-800': item.urgencia === 'Alta',
                      'bg-orange-100 text-orange-800': item.urgencia === 'Media',
                      'bg-green-100 text-green-800': item.urgencia === 'Baja'
                    }"
                  >
                    {{ item.urgencia }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Barra lateral de mensajes -->
    <aside class="fixed top-0 right-0 w-[20rem] h-screen bg-white border-l shadow-lg p-4 flex flex-col">
      <h2 class="text-xl font-bold text-gray-800 mb-4">Mensajes</h2>
      <div class="flex flex-1 overflow-y-auto space-y-4 pr-2  flex-col gap-3">
        <div
          v-for="msg in mensajes"
          :key="msg.id"
          class="flex  gap-3 flex items-start space-x-3"
        >
          <div
            class="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold"
          >
            {{ msg.usuario[0] }}
          </div>
          <div class="bg-gray-100 rounded-xl px-3 py-2 flex-1">
            <div class="text-sm font-medium text-gray-800">{{ msg.usuario }}</div>
            <div class="text-sm text-gray-600">{{ msg.texto }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ msg.fecha }}</div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import Card from '@/components/dashboard/Card.vue'
import CotizacionesChart from '@/components/dashboard/CotizacionesChart.vue'

const stats = {
  cotizaciones: 5,
  eventos: 3,
  urgentes: 4,
  tareas: 7
}

const chartData = {
  labels: ['Aprobadas', 'Pendientes', 'Canceladas'],
  datasets: [
    {
      label: 'Cotizaciones',
      backgroundColor: ['#0ea5e9', '#fbbf24', '#ef4444'],
      data: [10, 7, 2]
    }
  ]
}

const mensajes = [
  { id: 1, usuario: 'Laura', texto: 'Actualicé la cotización 114.', fecha: '2025-05-28' },
  { id: 2, usuario: 'Carlos', texto: 'Evento confirmado para Medellín.', fecha: '2025-05-27' },
  { id: 3, usuario: 'Ana', texto: 'Falta definir equipo para evento de Cali.', fecha: '2025-05-26' }
]

const pendientes = [
  {
    id: 1,
    tarea: 'Enviar cotización 115',
    responsable: 'Laura',
    vencimiento: '2025-05-30',
    estado: 'Pendiente',
    urgencia: 'Alta'
  },
  {
    id: 2,
    tarea: 'Confirmar lugar del evento',
    responsable: 'Carlos',
    vencimiento: '2025-05-29',
    estado: 'En curso',
    urgencia: 'Alta'
  }
]
</script>