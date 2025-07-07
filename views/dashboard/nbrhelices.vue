<script setup>
import { ArcElement, Chart, DoughnutController, Tooltip } from 'chart.js'
import { onBeforeUnmount, onMounted, ref } from 'vue'

Chart.register(DoughnutController, ArcElement, Tooltip)

const chartUsersRef = ref(null)
const chartHelicesRef = ref(null)
let usersChartInstance = null
let helicesChartInstance = null

const totalUsers = ref(0)
const totalHelices = ref(0)

const user = ref({
  email: 'Unknown',
  role: 'User',
  client_id: null
})

const fetchUser = () => {
  const token = localStorage.getItem('authToken')
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]
      const decoded = JSON.parse(atob(payloadBase64))
      user.value = {
        email: decoded.sub || 'Unknown',
        role: decoded.role || 'User',
        client_id: decoded.client_id || null
      }
    } catch (e) {
      console.error(e)
    }
  }
}

const fetchUsersCount = async () => {
  try {
    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/count_media_by_id_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.value.email })
    })
    const data = await resp.json()
    totalUsers.value = data.total_media
    updateUsersChart()
  } catch (e) {
    console.error(e)
  }
}

const fetchMaterielsBySite = async () => {
  try {
    const sitesUrl =
      user.value.role === 'admin'
        ? `${import.meta.env.VITE_API_BASE_URL}/sites`
        : `${import.meta.env.VITE_API_BASE_URL}/site/list/byclient/${user.value.client_id}`

    const sites = await $fetch(sitesUrl)
    const siteIds = [...new Set(sites.map(s => s.id).filter(Boolean))]
    const pdvArrays = await Promise.all(
      siteIds.map(id =>
        $fetch(`${import.meta.env.VITE_API_BASE_URL}/pdv/list/bysite/${id}`).catch(() => [])
      )
    )
    totalHelices.value = pdvArrays.flat().length
    updateHelicesChart()
  } catch (e) {
    console.error(e)
  }
}

const updateUsersChart = () => {
  if (usersChartInstance) usersChartInstance.destroy()
  usersChartInstance = new Chart(chartUsersRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Hélices'],
      datasets: [{
        data: [totalUsers.value, Math.max(100 - totalUsers.value, 0)],
        backgroundColor: ['#30A14E', '#E0E0E0'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      cutout: '75%',
      plugins: { tooltip: { enabled: false } }
    }
  })
}

const updateHelicesChart = () => {
  if (helicesChartInstance) helicesChartInstance.destroy()
  helicesChartInstance = new Chart(chartHelicesRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Total Hélices'],
      datasets: [{
        data: [totalHelices.value, Math.max(100 - totalHelices.value, 0)],
        backgroundColor: ['#30A14E', '#E0E0E0'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      cutout: '75%',
      plugins: { tooltip: { enabled: false } }
    }
  })
}

onMounted(() => {
  fetchUser()
  fetchUsersCount()
  fetchMaterielsBySite()
})

onBeforeUnmount(() => {
  if (usersChartInstance) usersChartInstance.destroy()
  if (helicesChartInstance) helicesChartInstance.destroy()
})
</script>

<template>
  <div>
 
    <div class="card">
      <div class="card-header">
        <h4>Nombre total de mes hélices opérationnelles</h4>
      </div>
      <div class="card-body">
        <div class="chart-container">
          <canvas ref="chartHelicesRef"></canvas>
          <div class="chart-text">
            <span class="chart-number">{{ totalHelices }}</span>
            <span class="chart-label">hélices</span>
          </div>
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
.grid {
  display: grid;
}
.md\:grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.gap-6 {
  gap: 1.5rem;
}
</style>
