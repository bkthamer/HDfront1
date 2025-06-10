<script setup lang="ts">
import { useNuxtApp } from '#imports'
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'

interface RouterItem {
  hdref: string
  status: string
  nomsite: string
  societe: string
  enseigne: string
  wifi: string
  serialnumber: string
  typemateriel: string
  simref: string
  macadresse: string
  iptemp: string
  id: number
  site_id: number
  client_id: number
}

interface Sim {
  simref: string
}

interface ApiResponse {
  etat: string
  message: string
}

const { $toast } = useNuxtApp()
const routers = ref<RouterItem[]>([])
const search = ref('')
const retourapi = ref<ApiResponse>({ etat: '', message: '' })

const dialog = ref(false)
const currentRouter = reactive<Partial<RouterItem>>({})
const simList = ref<Sim[]>([])
const selectedSim = ref<string>('')

const headers = [
  { title: 'Référence', key: 'hdref', align: 'start' as const, sortable: true },
  { title: 'Modèle', key: 'typemateriel', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Enseigne', key: 'enseigne', sortable: true },
  { title: 'Société', key: 'societe', sortable: true },
  { title: 'Site', key: 'nomsite', sortable: true },
  { title: 'Actions', key: 'actions', align: 'end' as const }
]

const fetchRouters = async () => {
  try {
    const resp = await axios.get<RouterItem[]>(
      `${import.meta.env.VITE_API_BASE_URL}/materiel/globalinfo/routeur`
    )
    routers.value = resp.data
  } catch {
    retourapi.value = { etat: 'error', message: 'Impossible de charger la liste des routeurs' }
  }
}

const toast = (useNuxtApp().$toast as any)

const deleteRouter = async (id: number) => {
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

const openSimDialog = async (item: RouterItem) => {
  Object.assign(currentRouter, item)
  selectedSim.value = item.simref || ''

  try {
    const resp = await axios.get<Sim[]>(
      `${import.meta.env.VITE_API_BASE_URL}/materiel/sim/dispo`
    )
    simList.value = resp.data
  } catch {
    simList.value = []
  }

  dialog.value = true
}

const modifSimRef = async (simref: string) => {
  if (!simref || !currentRouter.id) return

  try {
    const res = await axios.patch<ApiResponse>(
      `${import.meta.env.VITE_API_BASE_URL}/simref/modif`,
      {
        id: currentRouter.id,
        simref: simref
      },
      { headers: { 'Content-Type': 'application/json' } }
    )
    retourapi.value = { etat: res.data.etat, message: res.data.message }
  } catch (e: any) {
    retourapi.value = {
      etat: 'error',
      message: e.response?.data?.message || 'Erreur lors de la mise à jour'
    }
  }
}

watch(retourapi, (v) => {
  if (v.etat === 'success') {
    toast.success(v.message, { timeout: 5000 })
    fetchRouters()
    dialog.value = false
  } else if (v.etat === 'error') {
    toast.error(v.message, { timeout: 10000 })
  } else if (v.etat === 'info') {
    toast.info(v.message, { timeout: 5000 })
  }
})

const filteredRouters = computed(() => {
  if (!search.value) {
    return routers.value
  }
  return routers.value.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(search.value.toLowerCase())
    )
  )
})

onMounted(fetchRouters)
</script>

<template>
    <div class="header">
   
    <h2 class="text-3xl font-semibold ml-6 mt-4 mb-6 text-gray-800">Liste de routeurs</h2>
  </div>
  <VCard class="data-card">
    <div class="flex items-center mb-4 px-4 pt-4">
     
      <h2 class="text-lg font-bold">Gestion et Infos routeurs</h2>
    </div>

    <div class="px-4 pb-4">
      <VTextField
        v-model="search"
        label="Filtrer routeurs..."
        clearable
        dense
        hide-details
      />
    </div>

    <VDataTable
      :headers="headers"
      :items="filteredRouters"
      item-value="id"
      class="px-4 pb-4"
      :items-per-page="10"
    >
      <template #item.actions="{ item }">
        <VBtn
          color="primary"
          variant="text"
          size="small"
          class="mr-2"
          @click="openSimDialog(item)"
        >
          Associer SIM
        </VBtn>
        <VBtn
          color="error"
          variant="text"
          size="small"
          @click="() => deleteRouter(item.id)"
        >
          Supprimer
        </VBtn>
      </template>
    </VDataTable>
  </VCard>

  <VDialog v-model="dialog" max-width="400px">
    <VCard>
      <VCardTitle>Associer carte SIM</VCardTitle>
      <VCardText>
        <div class="mb-4">
          <p class="font-semibold">Référence routeur : {{ currentRouter.hdref }}</p>
          <p class="text-sm">Modèle : {{ currentRouter.typemateriel }}</p>
          <p class="text-sm">SN : {{ currentRouter.serialnumber }}</p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <VBtn
            v-for="sim in simList"
            :key="sim.simref"
            variant="outlined"
            class="w-full"
            @click="() => modifSimRef(sim.simref)"
          >
            {{ sim.simref }}
          </VBtn>
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn @click="dialog = false">Annuler</VBtn>
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
