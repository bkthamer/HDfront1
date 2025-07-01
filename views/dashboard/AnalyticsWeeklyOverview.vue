<script setup lang="ts">
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js'
import { onMounted, ref } from 'vue'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
)

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const fetchHeliceStatusCounts = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/materiels`)
  const data = await response.json()

  const statusCounts: Record<string, number> = {}
  data
    .filter((m: any) => m.typemateriel === 'HeliceZH3')
    .forEach((m: any) => {
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1
    })

  const labels = Object.keys(statusCounts)
  const counts = labels.map(label => statusCounts[label])

  if (chartInstance) chartInstance.destroy()

  if (chartRef.value) {
    const ctx = chartRef.value.getContext('2d')
    if (!ctx) return

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Nombre d’HéliceZH3', data: counts, backgroundColor: 'rgba(75, 192, 192, 0.7)', borderColor: 'rgb(75, 192, 192)', borderWidth: 1 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Répartition HéliceZH3 par statut', font: { size: 16, weight: 'bold' } },
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 12 } } },
          x: { ticks: { font: { size: 18 } } }
        }
      }
    })
  }
}

onMounted(fetchHeliceStatusCounts)
</script>

<template>
  <div class="card">
    <h3 class="card-title">Distribution des Helices ZH3 par statut</h3>
    <div class="chart-wrapper">
      <canvas ref="chartRef"></canvas>
    </div>
  </div>
</template>

<style scoped>
.card {
  max-width: 450px;
  margin: 20px auto;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-title {
  margin: 0.5rem 0;
  font-size: 1.25rem;
  text-align: center;
  color: #333;
}

.chart-wrapper {
  width: 100%;
  height: 300px;
  position: relative;
}

.chart-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
