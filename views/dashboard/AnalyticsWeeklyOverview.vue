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

/**
 * Récupère les demandes via l'API et met à jour le bar chart
 */
const fetchDemandes = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/demandes')
    const data = await response.json()

    // Tableau de 12 positions (0 = Janvier, 11 = Décembre)
    const monthlyCounts = Array(12).fill(0)

    data.forEach((demande: any) => {
      const date = new Date(demande.date)
      monthlyCounts[date.getMonth()]++
    })

    // Si un chart existe déjà, on le détruit pour éviter des doublons
    if (chartInstance) {
      chartInstance.destroy()
    }

    if (chartRef.value) {
      // Création du contexte 2D pour le canvas
      const ctx = chartRef.value.getContext('2d')
      if (!ctx) return

      // Création d'un dégradé vertical pour les barres
      const gradient = ctx.createLinearGradient(0, 0, 0, 400)
      gradient.addColorStop(0, 'rgba(75, 192, 192, 0.7)')
      gradient.addColorStop(1, 'rgba(75, 192, 192, 0.1)')

      // Création du bar chart
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ],
          datasets: [
            {
              label: 'Number of Demandes',
              data: monthlyCounts,
              backgroundColor: gradient,   // On utilise le dégradé
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // Laisse le container gérer la taille
          plugins: {
            title: {
              display: true,
              text: 'Monthly Demandes', // Titre du graphique
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
      <!-- Le canvas qui contiendra notre bar chart -->
      <canvas ref="chartRef"></canvas>
    </div>
  </div>
</template>

<style scoped>
/* Style global de la « carte » */
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

/* Titre de la carte */
.card-title {
  margin: 0.5rem 0;
  font-size: 1.5rem;
  text-align: center;
  color: #333;
}

/* Le wrapper pour gérer la taille du canvas */
.chart-wrapper {
  width: 100%;
  height: 400px; /* Fixe une hauteur pour l'effet maintainAspectRatio: false */
  position: relative;
}

/* Ajuste le canvas pour qu'il prenne toute la place disponible */
.chart-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
