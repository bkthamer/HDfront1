<script setup lang="ts">
import type { Plugin } from 'chart.js'
import { ArcElement, Chart, DoughnutController, Legend, Tooltip } from 'chart.js'
import { onBeforeUnmount, onMounted, ref } from 'vue'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

// Plugin to display total in center
const centerTextPlugin: Plugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, data } = chart
    const total = data.datasets![0].data!.reduce((sum, val) => {
      const sumNum = typeof sum === 'number' ? sum : 0
      const valNum = typeof val === 'number' ? val : 0
      return sumNum + valNum
    }, 0)
    const x = chart.getDatasetMeta(0).data![0].x
    const y = chart.getDatasetMeta(0).data![0].y
    ctx.save()
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#333'
    ctx.fillText((total ?? 0).toString(), x, y)
    ctx.restore()
  }
}

const fetchData = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/demandes`)
  const data: any[] = await res.json()
  const counts: Record<string, number> = {}
  data.forEach(d => { counts[d.email || 'Unknown'] = (counts[d.email || 'Unknown'] || 0) + 1 })
  const labels = Object.keys(counts)
  const values = Object.values(counts)

  if (chartInstance) chartInstance.destroy()
  const ctx = chartRef.value?.getContext('2d')
  if (!ctx) return

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => `hsl(${i * 360 / labels.length}, 65%, 55%)`),
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, boxWidth: 12 } },
        tooltip: { callbacks: { label(context) {
          const value = context.raw as number
          const percent = ((value / values.reduce((a,b) => a + b, 0)) * 100).toFixed(1)
          return `${context.label}: ${value} (${percent}%)`
        } } }
      }
    },
    plugins: [centerTextPlugin]
  })
}

onMounted(fetchData)
onBeforeUnmount(() => { chartInstance?.destroy() })
</script>

<template>
  <div class="card">
    <h5 class="card-title">Répartition des demandes médias par utilisateur</h5>
    <div class="chart-container">
      <canvas ref="chartRef"></canvas>
    </div>
  </div>
</template>

<style scoped>
.card {
  max-width: 400px;
  margin: 20px auto;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  padding: 1rem;
}
.card-title {
  font-size: 1.25rem;
  text-align: center;
  color: #333;
  margin-bottom: 0.5rem;
}
.chart-container {
  width: 100%;
  height: 300px;
  position: relative;
}
.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
