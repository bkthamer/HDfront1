<template>
    <VCard class="data-card">
      <VDataTable
        :headers="headers"
        :items="tasks"
        item-value="id"
        class="text-no-wrap"
        :items-per-page="5"
      >
        
        <template #item.titre="{ item }">
          <span class="text-caption font-weight-medium">{{ item.titre }}</span>
        </template>
  
        
        <template #item.sourcename="{ item }">
          <span class="text-body-2">{{ item.sourcename }}</span>
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
  
        
        <template #item.type_tache="{ item }">
          <span class="text-body-2">{{ item.type_tache }}</span>
        </template>
  
       
        <template #item.last_info="{ item }">
          <span class="text-caption">{{ formatDate(item.last_info) }}</span>
        </template>
  
      </VDataTable>
    </VCard>
  </template>
  
  <script setup lang="ts">
  import axios from 'axios'
import { onMounted, ref } from 'vue'
  
  interface Task {
    id: string
    soumis_par: string
    titre: string
    last_info: string
    owner_id: number | null
    date_soumission: string
    type_tache: string
    sourcename: string
    status: string
  }
  
  const tasks = ref<Task[]>([])
  
  const headers = [
    { title: 'Titre', key: 'titre', align: 'start' as const },
    { title: 'Fichier source', key: 'sourcename' },
    { title: 'Soumis par', key: 'soumis_par' },
    { title: 'Date / Statut', key: 'date_soumission' },
    { title: 'Type de tâche', key: 'type_tache' },
    { title: 'Dernière info', key: 'last_info' }
  ]
  
  const getStatusColor = (item: Task) => {
    if (item.status.toLowerCase() === 'echec') return 'error'
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
  
  const fetchTasks = async () => {
    try {
      const resp = await axios.get<Task[]>('http://127.0.0.1:8000/media/taches/list')
      tasks.value = resp.data
    } catch (err) {
      console.error('Erreur chargement des tâches :', err)
    }
  }
  
  onMounted(fetchTasks)
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
  