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


const fetchDemandes = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/demandes`)
    const data = await response.json()

    
    const monthlyCounts = Array(12).fill(0)

    data.forEach((demande: any) => {
      const date = new Date(demande.date)
      monthlyCounts[date.getMonth()]++
    })

   
    if (chartInstance) {
      chartInstance.destroy()
    }

    if (chartRef.value) {
  
      const ctx = chartRef.value.getContext('2d')
      if (!ctx) return

      
      const gradient = ctx.createLinearGradient(0, 0, 0, 400)
      gradient.addColorStop(0, 'rgba(75, 192, 192, 0.7)')
      gradient.addColorStop(1, 'rgba(75, 192, 192, 0.1)')


      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ],
          datasets: [
            {
              label: 'nombre de demandes',
              data: monthlyCounts,
              backgroundColor: gradient,   
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, 
          plugins: {
            title: {
              display: true,
              text: 'nombre totale des demandes medias des utilisateurs par mois', 
              font: {
                size: 18,
                weight: 'bold'
              }
            },
            legend: {
              display: true,
              labels: {
                font: {
                  size: 14
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: {
                  size: 13
                }
              }
            },
            x: {
              ticks: {
                font: {
                  size: 13
                }
              }
            }
          }
        }
      })
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes :', error)
  }
}

onMounted(() => {
  fetchDemandes()
})
</script>

<template>
  <div class="card">
    <h2 class="card-title">Demandes par mois</h2>
    <div class="chart-wrapper">
      
      <canvas ref="chartRef"></canvas>
    </div>
  </div>
</template>

<style scoped>

.card {
  max-width: 700px;
  margin: 20px auto;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}


.card-title {
  margin: 0.5rem 0;
  font-size: 1.5rem;
  text-align: center;
  color: #333;
}


.chart-wrapper {
  width: 100%;
  height: 400px; 
  position: relative;
}


.chart-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
