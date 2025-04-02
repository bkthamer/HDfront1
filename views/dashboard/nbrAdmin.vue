<script setup>
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js'
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Enregistrement des composants Chart.js nécessaires
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const chartRef = ref(null)
let chartInstance = null
const demandesData = ref([])

// Fonction de récupération des données depuis l'API
const fetchDemandes = async () => {
  try {
    const res = await fetch('http://127.0.0.1:8000/demandes')
    const data = await res.json()
    demandesData.value = data
    createChart()
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes', error)
  }
}

// Agrégation des données : compte le nombre de demandes par email
const aggregateData = () => {
  const counts = {}
  demandesData.value.forEach(item => {
    const email = item.email || 'Unknown'
    counts[email] = (counts[email] || 0) + 1
  })
  const labels = Object.keys(counts)
  const countsArray = Object.values(counts)
  return { labels, countsArray }
}

// Création du graphique à partir des données agrégées
const createChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const { labels, countsArray } = aggregateData()

  if (chartRef.value) {
    chartInstance = new Chart(chartRef.value, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Nombre de demandes par email',
            data: countsArray,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    })
  }
}

onMounted(() => {
  fetchDemandes()
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<template>
  <div class="card">
    <div class="card-header">
      <h3>Nombre de demandes par user</h3>
    </div>
    <div class="card-body">
      <div class="chart-container">
        <canvas ref="chartRef"></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  max-width: 800px;
  margin: 20px auto;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
}

.card-header {
  background-color: #fff;
  padding: 1.2rem;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 2rem;
}

.chart-container {
  position: relative;
  margin: auto;
  width: 100%;
  height: 400px;
}
</style>
