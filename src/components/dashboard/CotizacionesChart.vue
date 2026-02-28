<template>
    <div class="bg-card rounded-[var(--r-xl)] shadow-[var(--shadow-card)] p-5">
      <h3 class="text-[16px] font-semibold text-text-1 mb-4 font-['Plus_Jakarta_Sans',sans-serif]">Cotizaciones por Mes</h3>
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
          backgroundColor: '#6EE7A0'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#94A3B8', font: { size: 11 } },
            grid: { color: '#F1F5FA' }
          },
          y: {
            ticks: { color: '#94A3B8', font: { size: 11 } },
            grid: { color: '#F1F5FA' }
          }
        }
      }
    })
  })
  </script>