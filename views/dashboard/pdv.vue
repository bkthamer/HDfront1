<script setup>
import { ArcElement, Chart, DoughnutController, Tooltip } from 'chart.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';

Chart.register(DoughnutController, ArcElement, Tooltip);

const chartRef = ref(null);
let chartInstance = null;
const totalUsers = ref(0);

const fetchUsersCount = async () => {
  try {
    const response = await fetch("http://127.0.0.1:8000/helices/count");
    const data = await response.json();
    totalUsers.value = data.total_helices;
    updateChart();
  } catch (error) {
    console.error("Erreur lors de la récupération du nombre d'hélices:", error);
  }
};

const updateChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
  }

  if (chartRef.value) {
    chartInstance = new Chart(chartRef.value, {
      type: "doughnut",
      data: {
        labels: ["Hélices"],
        datasets: [
          {
            data: [totalUsers.value, Math.max(100 - totalUsers.value, 0)], 
            backgroundColor: ["#30A14E", "#E0E0E0"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "75%", 
        plugins: {
          tooltip: { enabled: false }, 
        },
      },
    });
  }
};

onMounted(fetchUsersCount);

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<template>
  <div class="card">
    <div class="card-header">
      <h3>Nombre total des hélices</h3>
    </div>
    <div class="card-body">
      <div class="chart-container">
        <canvas ref="chartRef"></canvas>
        <div class="chart-text">
          <span class="chart-number">{{ totalUsers }}</span>
          <span class="chart-label">Hélices</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  max-width: 380px;
  margin: 20px auto;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  text-align: center;
  overflow: hidden;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
}

.card-header {
  background-color: #007bff;
  padding: 1.2rem;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  border-radius: 16px 16px 0 0;
}

.card-body {
  padding: 2rem;
}

.chart-container {
  position: relative;
  width: 220px;
  height: 220px;
  margin: auto;
}

.chart-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.chart-number {
  font-size: 32px;
  font-weight: bold;
  color: #30A14E;
}

.chart-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
</style>
