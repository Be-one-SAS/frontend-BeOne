<template>
    <div class="bg-white rounded-xl shadow p-4">
      <h3 class="text-lg font-semibold mb-4">Cotizaciones por Mes</h3>
      <canvas ref="chartRef"></canvas>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue'
  import { Chart, registerables } from 'chart.js'
  
  Chart.register(...registerables)
  
  const chartRef = ref(null)
  
  onMounted(() => {
    new Chart(chartRef.value, {
      type: 'bar',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
          label: 'Cotizaciones',
          data: [5, 8, 6, 10, 7, 12],
          backgroundColor: 'rgba(59, 130, 246, 0.6)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    })
  })
  </script>