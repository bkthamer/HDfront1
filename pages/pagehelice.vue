<script setup lang="ts">
import { useNuxtApp } from '#imports'
import axios from 'axios'
import { computed, onMounted, reactive, ref, watch } from 'vue'

interface HeliceItem {
  hdref: string
  status: string
  pdv_hdref: string
  nomsite: string
  societe: string
  enseigne: string
  wifi: string
  serialnumber: string
  typemateriel: string
  macadresse: string
  iptemp: string
  id: number
  pdv_id: number
  site_id: number
  client_id: number
}

interface ApiResponse {
  etat: string
  message: string
}

const toast = (useNuxtApp().$toast as any)
const helices = ref<HeliceItem[]>([])
const search = ref('')
const retourapi = ref<ApiResponse>({ etat: '', message: '' })

const expanded = ref<string[]>([])
const dialogInfo = ref(false)
const currentHelice = reactive<Partial<HeliceItem>>({})

const headers = [
  { title: 'Référence', key: 'hdref', align: 'start' as const, sortable: true },
  { title: 'Modèle', key: 'typemateriel', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Enseigne', key: 'enseigne', sortable: true },
  { title: 'Société', key: 'societe', sortable: true },
  { title: 'Site', key: 'nomsite', sortable: true },
  { title: 'Pdv', key: 'pdv_hdref', sortable: true },
  { title: 'Actions', key: 'actions', align: 'end' as const }
]

const fetchHelices = async () => {
  try {
    const resp = await axios.get<HeliceItem[]>(
      `${import.meta.env.VITE_API_BASE_URL}/materiel/globalinfo/helice`
    )
    helices.value = resp.data
  } catch {
    retourapi.value = { etat: 'error', message: 'Impossible de charger la liste des hélices' }
  }
}

const deleteHelice = async (id: number) => {
  try {
    const res = await axios.delete<ApiResponse>(
      `${import.meta.env.VITE_API_BASE_URL}/materiel/del`,
      {
        data: { id },
        headers: { 'Content-Type': 'application/json' }
      }
    )
    retourapi.value = { etat: res.data.etat, message: res.data.message }
  } catch (e: any) {
    retourapi.value = {
      etat: 'error',
      message: e.response?.data?.message || 'Erreur lors de la suppression'
    }
  }
}

const downloadConfig = (hdref: string) => {
  window.open(`${import.meta.env.VITE_API_BASE_URL}/setup/charge/${hdref}`)
}

const openInfoDialog = (item: HeliceItem) => {
  Object.assign(currentHelice, item)
  dialogInfo.value = true
}

watch(retourapi, (v) => {
  if (v.etat === 'success') {
    toast.success(v.message, { timeout: 5000 })
    fetchHelices()
  } else if (v.etat === 'error') {
    toast.error(v.message, { timeout: 10000 })
  } else if (v.etat === 'info') {
    toast.info(v.message, { timeout: 5000 })
  }
})

const filteredHelices = computed(() => {
  if (!search.value) {
    return helices.value
  }
  return helices.value.filter((helice) =>
    Object.values(helice).some((val) =>
      String(val).toLowerCase().includes(search.value.toLowerCase())
    )
  )
})

onMounted(fetchHelices)
</script>

<template>
    <div class="header">
   
    <h2 class="text-3xl font-semibold ml-6 mt-4 mb-6 text-gray-800">Liste des helices</h2>
  </div>
  <VCard class="data-card">
    <div class="flex items-center mb-4 px-4 pt-4">
     
      <h2 class="text-lg font-bold">Gestion et Infos hélices</h2>
    </div>
    <div class="px-4 pb-4">
      <VTextField
        v-model="search"
        label="Filtrer matériels..."
        clearable
        dense
        hide-details
      />
    </div>
    <VDataTable
      :headers="headers"
      :items="filteredHelices"
      item-value="hdref"
      class="px-4 pb-4"
      :items-per-page="10"
      
      :expanded.sync="expanded"
    >

      <template #item.actions="{ item }">
        <VMenu>
          <template #activator="{ props }">
            <VBtn v-bind="props" icon>
             
            </VBtn>
          </template>
          <VList>
            <VListItem @click="downloadConfig(item.hdref)">

              <VListItemTitle>Télécharger config</VListItemTitle>
            </VListItem>
            <VListItem @click="deleteHelice(item.id)">

              <VListItemTitle>Supprimer</VListItemTitle>
            </VListItem>
            <VListItem @click="openInfoDialog(item)">

              <VListItemTitle>Info hélice</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>
      </template>
    </VDataTable>
  </VCard>

  <VDialog v-model="dialogInfo" max-width="500px">
    <VCard>
      <VCardTitle>Détails Hélice</VCardTitle>
      <VCardText>
        <p><strong>Référence :</strong> {{ currentHelice.hdref }}</p>
        <p><strong>Modèle :</strong> {{ currentHelice.typemateriel }}</p>
        <p><strong>Status :</strong> {{ currentHelice.status }}</p>
        <p><strong>Enseigne :</strong> {{ currentHelice.enseigne }}</p>
        <p><strong>Société :</strong> {{ currentHelice.societe }}</p>
        <p><strong>Site :</strong> {{ currentHelice.nomsite }}</p>
        <p><strong>Pdv Référence :</strong> {{ currentHelice.pdv_hdref }}</p>
        <p><strong>SN :</strong> {{ currentHelice.serialnumber }}</p>
        <p><strong>MAC :</strong> {{ currentHelice.macadresse }}</p>
        <p><strong>IP temporaire :</strong> {{ currentHelice.iptemp }}</p>
        <p><strong>Id Matériel :</strong> {{ currentHelice.id }}</p>
        <p><strong>Id Pdv :</strong> {{ currentHelice.pdv_id }}</p>
        <p><strong>Id Site :</strong> {{ currentHelice.site_id }}</p>
        <p><strong>Id Client :</strong> {{ currentHelice.client_id }}</p>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn @click="dialogInfo = false">Fermer</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.data-card {
  margin: 20px auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding-bottom: 16px;
}
</style>
