<script setup lang="ts">
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { onMounted, ref } from 'vue';

// Enregistrer les composants nécessaires pour un line chart
Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;
const mediaData = ref<any[]>([]);

const fetchMedia = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/media');
    const data = await response.json();
    mediaData.value = data;
    updateChart();
  } catch (error) {
    console.error('Erreur lors de la récupération des médias :', error);
  }
};

const updateChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Agréger les médias par nom de catégorie (champ "categorie_nom")
  const counts: Record<string, number> = {};
  mediaData.value.forEach(media => {
    const cat = media.categorie_nom || 'Non défini';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  // Préparer les labels et les données
  // On trie par ordre alphabétique pour un affichage cohérent
  const sortedCategories = Object.keys(counts).sort();
  const labels = sortedCategories; // Utilise directement le nom de la catégorie
  const datasetData = sortedCategories.map(cat => counts[cat]);

  if (chartRef.value) {
    const ctx = chartRef.value.getContext('2d');
    if (!ctx) return;

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Nombre de médias',
            data: datasetData,
            fill: false,
            borderColor: '#3498db',
            backgroundColor: '#3498db',
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: '#3498db'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Nombre de médias par catégorie',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 14 }
            }
          },
          x: {
            ticks: {
              font: { size: 14 }
            }
          }
        }
      }
    });
  }
};

onMounted(() => {
  fetchMedia();
});
</script>

<template>
  <!-- Card contenant le line chart -->
  <div class="card">
    <div class="card-header">
      <h3>Médias par catégorie</h3>
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
  max-width: 600px;
  margin: 20px auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  text-align: center;
}

.card-header {
  background-color: #fff;
  color: #fff;
  padding: 1rem;
  font-size: 20px;
  font-weight: bold;
}

.card-body {
  padding: 1.5rem;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 400px;
}
</style>
