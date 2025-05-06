<template>
  <VCard class="data-card">
    <VCardTitle>
      <span class="text-h6">Grilles de diffusion</span>
      <VSpacer />
      <VSelect
        v-model="selectedPlaylist"
        :items="playlists"
        item-title="libelle"
        item-value="id"
        label="Sélectionner une playlist"
        dense
        outlined
        class="playlist-select"
      />
    </VCardTitle>

    <VDataTable
      :headers="headers"
      :items="records"
      item-value="id"
      class="text-no-wrap"
      :items-per-page="5"
      :loading="loading"
      loading-text="Chargement des grilles..."
    >
      <template #item.interval_status="{ item }">
        <VChip
          :color="getIntervalColor(item)"
          size="small"
          class="text-capitalize"
        >
          {{ getIntervalStatus(item) }}
        </VChip>
      </template>

      <template #item.start_date="{ item }">
        <span>{{ formatDate(item.start_date, item.hour_start) }}</span>
      </template>
      <template #item.end_date="{ item }">
        <span>{{ formatDate(item.end_date, item.hour_end) }}</span>
      </template>

      <template #item.day_of_week="{ item }">
        <span>{{ formatDays(item.day_of_week) }}</span>
      </template>

      <template #no-data>
        <VAlert type="info" border="start" colored-border>
          Aucune grille disponible pour cette playlist.
        </VAlert>
      </template>
    </VDataTable>
  </VCard>
</template>

<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref, watch } from 'vue'


interface Playlist {
  id: number
  libelle: string
  description: string
  status: boolean
  proprietaire: number
  mode: string
}
interface GrilleRecord {
  id: number
  playlist_id: number
  start_date: string
  hour_start: string
  end_date: string
  hour_end: string
  day_of_week: number[]
  start_to_end: boolean
}


const playlists = ref<Playlist[]>([])
const selectedPlaylist = ref<number | null>(null)
const records = ref<GrilleRecord[]>([])
const loading = ref(false)


const headers = [
  { title: 'Statut', key: 'interval_status' },
  { title: 'Date de début', key: 'start_date' },
  { title: 'Date de fin', key: 'end_date' },
  { title: 'Jours', key: 'day_of_week' }
]


const fetchPlaylists = async () => {
  try {
    const resp = await axios.get<Playlist[]>('http://127.0.0.1:8000/playlist/list')
    playlists.value = resp.data
    if (playlists.value.length > 0) {
      selectedPlaylist.value = playlists.value[0].id
    }
  } catch (err) {
    console.error('Erreur chargement playlists :', err)
  }
}



const fetchGrilles = async (playlistId: number) => {
  loading.value = true
  try {
    const resp = await axios.get<GrilleRecord[]>(`http://127.0.0.1:8000/playlist/listgrille/${playlistId}`)
    records.value = resp.data
  } catch (err) {
    console.error('Erreur chargement grilles :', err)
    records.value = []
  } finally {
    loading.value = false
  }
}


watch(selectedPlaylist, (newId) => {
  if (newId !== null) fetchGrilles(newId)
})


const formatDate = (date: string, hour: string) => {
  const iso = `${date}T${hour}`
  return new Date(iso).toLocaleString('fr-FR', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}


const getIntervalStatus = (item: GrilleRecord): string => {
  const now = Date.now()
  const start = new Date(`${item.start_date}T${item.hour_start}`).getTime()
  const end = new Date(`${item.end_date}T${item.hour_end}`).getTime()
  if (now < start) return 'À venir'
  if (now <= end) return 'En cours'
  return 'Terminé'
}
const getIntervalColor = (item: GrilleRecord): string => {
  const status = getIntervalStatus(item)
  switch (status) {
    case 'À venir': return 'info'
    case 'En cours': return 'success'
    case 'Terminé': return 'warning'
    default: return 'grey'
  }
}


const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const formatDays = (days: number[]) => {
  if (!days || days.length === 0) return 'Tous'
  return days.map(d => dayLabels[d] || d).join(', ')
}


onMounted(() => {
  fetchPlaylists()
})
</script>

<style scoped>
.data-card {
  margin: 20px auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}
.text-no-wrap :deep(.v-data-table__wrapper td) {
  white-space: nowrap;
}
.playlist-select {
  max-width: 300px;
}
</style>
