<template>
    <VCard class="data-card">
      <VDataTable
        :headers="headers"
        :items="records"
        item-value="id"
        class="text-no-wrap"
        :items-per-page="5"
      >
    
        <template #item.helice_hdref="{ item }">
          <span class="text-caption font-weight-medium">{{ item.helice_hdref }}</span>
        </template>
  
       
        <template #item.list_media="{ item }">
          <div class="d-flex flex-column">
            <span v-for="m in item.list_media" :key="m" class="text-body-2">• {{ m }}</span>
          </div>
        </template>
  
       
        <template #item.soumis_par="{ item }">
          <span class="text-caption">{{ item.soumis_par }}</span>
        </template>
  
       
        <template #item.date_soumission="{ item }">
          <div class="d-flex flex-column gap-1">
            <VChip :color="getStatusColor(item)" size="small" class="text-capitalize">
              {{ formatDate(item.date_soumission) }}
            </VChip>
            <span class="text-caption text-medium-emphasis">{{ item.status }}</span>
          </div>
        </template>
  
       
        <template #item.tentatives="{ item }">
          {{ item.tentatives }}
        </template>

        <template #item.action="{ item }">
          {{ item.action }}
        </template>


      </VDataTable>
    </VCard>
  </template>
  
  <script setup lang="ts">
  import axios from 'axios'
import { onMounted, ref } from 'vue'
  
  interface Record {
    id: string
    helice_hdref: string
    list_media: string[]
    soumis_par: string
    date_soumission: string
    last_info: string
    tentatives: number
    status: string
    action: string
  }
  
  const records = ref<Record[]>([])
  
  const headers = [
    { title: 'Hélice', key: 'helice_hdref', align: 'start' as const },
    { title: 'Médias (Playlist)', key: 'list_media' },
    { title: 'Soumis par', key: 'soumis_par' },
    { title: 'Date / Statut', key: 'date_soumission' },
    { title: 'Tentatives', key: 'tentatives', align: 'end' as const },
    { title: 'Action', key: 'action', align: 'end' as const }
  ]
  
 
  const getStatusColor = (item: Record) => {
    const daysOld = (Date.now() - new Date(item.date_soumission).getTime()) / (1000 * 3600 * 24)
    if (item.status.toLowerCase() === 'echec') return 'error'
    if (daysOld > 7) return 'success'
    return 'success'
  }
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const fetchRecords = async () => {
    try {
      const resp = await axios.get<Record[]>('http://127.0.0.1:8000/suivimajhelice')
      records.value = resp.data
    } catch (err) {
      console.error('Erreur chargement suivi MAJ hélice :', err)
    }
  }
  
  onMounted(fetchRecords)
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
  </style>
  