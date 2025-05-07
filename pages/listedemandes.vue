<template>
  <VCard class="data-card">
    <VDataTable
      :headers="headers"
      :items="demandes"
      item-value="id"
      class="text-no-wrap"
      :items-per-page="5"
    >
      <!-- Formulaire debut -->
      <template #item.email="{ item }">
        <div class="d-flex align-center gap-x-2">
         
          <span class="text-caption font-weight-medium">{{ item.email }}</span>
        </div>
      </template>

   
      <template #item.sujet="{ item }">
        <div class="d-flex align-center gap-x-4">

          <div class="d-flex flex-column">
            <h6 class="text-h6 font-weight-medium">{{ item.sujet }}</h6>
           
          </div>
        </div>
      </template>

      
      <template #item.description="{ item }">
        <div class="text-body-2 text-truncate" style="max-width: 300px;">
          {{ item.description }}
        </div>
      </template>

     
      <template #item.date="{ item }">
        <div class="d-flex flex-column gap-1">
          <VChip :color="getStatusColor(item)" size="small" class="text-capitalize">
            {{ formatDate(item.date) }}
          </VChip>
          <span class="text-caption text-medium-emphasis">
            {{ getStatusText(item) }}
          </span>
        </div>
      </template>

      
      <template #item.image="{ item }">
        <div class="d-flex align-center gap-4">
          <VImg
            :src="getImageUrl(item.image)"
            max-width="80"
            height="60"
            class="clickable rounded-lg"
            @click="item.image && openImage(item.image)"
            contain
          />
          <VBtn
            icon
            variant="text"
            color="primary"
            @click="openDetails(item)"
          >
            <VIcon>mdi-eye-outline</VIcon>
          </VBtn>
        </div>
      </template>
    </VDataTable>

    
    <VDialog v-model="dialog" max-width="600px">
      <VCard class="dialog-card">
        <VImg :src="selectedImage" aspect-ratio="1.5" contain />
        <VCardActions class="dialog-actions">
          <VSpacer />
          <VBtn
            color="primary"
            variant="elevated"
            @click="dialog = false"
          >
            Fermer
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'

interface Demande {
  id: number
  email: string
  sujet: string
  description: string
  image: string | null
  date: string
  status?: string
}

const demandes = ref<Demande[]>([])

const headers = [
  { title: 'Email', key: 'email', align: 'start' as const },
  { title: 'Sujet', key: 'sujet' },
  { title: 'Description', key: 'description' },
  { title: 'Date/Statut', key: 'date' },
  { title: 'Actions', key: 'image', align: 'end' as const }
]

const dialog = ref(false)
const selectedImage = ref('')


const getStatusColor = (item: Demande) => {
  const daysOld = (Date.now() - new Date(item.date).getTime()) / (1000 * 3600 * 24)
  if (daysOld > 7) return 'error'
  if (daysOld > 3) return 'warning'
  return 'success'
}


const getStatusText = (item: Demande) => {
  const daysOld = (Date.now() - new Date(item.date).getTime()) / (1000 * 3600 * 24)
  if (daysOld > 7) return 'En retard'
  if (daysOld > 3) return 'En cours'
  return 'Nouveau'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getImageUrl = (path: string | null) => {
  if (!path) return ''
  const filename = path.split(/\\|\//).pop()
  return `http://127.0.0.1:8000/images/${filename}`
}

const openImage = (img: string) => {
  selectedImage.value = getImageUrl(img)
  dialog.value = true
}

const openDetails = (item: Demande) => {
 
  console.log('Détails de la demande:', item)
}

const fetchDemandes = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/demandes')
    demandes.value = response.data.map((d: any) => ({
      ...d,
      id: d.id || Math.random(),
      status: getStatusText(d)
    }))
  } catch (error) {
    console.error("Erreur lors du chargement :", error)
  }
}

onMounted(fetchDemandes)
</script>

<style scoped>
.data-card {
  margin: 20px auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.dialog-card {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-actions {
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.clickable {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.clickable:hover {
  transform: scale(1.05);
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v-avatar {
  flex-shrink: 0;
}
</style>
