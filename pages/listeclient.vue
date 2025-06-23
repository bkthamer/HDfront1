<script setup lang="ts">
import { useNuxtApp } from '#imports'
import axios from 'axios'
import { onMounted, reactive, ref, watch } from 'vue'

interface Client {
  id: number
  societe: string
  enseigne: string
  nomcontact: string
  prenomcontact: string
  emailcontact: string
  telephonecontact: string
  adresse: string
  ville: string
  codepostal: number
}

const clients = ref<Client[]>([])
const dialog = ref(false)
const editedClient = reactive<Client>({
  id: 0,
  societe: '',
  enseigne: '',
  nomcontact: '',
  prenomcontact: '',
  emailcontact: '',
  telephonecontact: '',
  adresse: '',
  ville: '',
  codepostal: 0
})
const retourapi = ref<{ etat: string; message: string; detail: any[] | null }>({
  etat: '',
  message: '',
  detail: null
})
const toast = (useNuxtApp().$toast as any)

const headers = [
  { title: 'Société', key: 'societe', align: 'start' as const },
  { title: 'Enseigne', key: 'enseigne' },
  { title: 'Nom', key: 'nomcontact' },
  { title: 'Prénom', key: 'prenomcontact' },
  { title: 'Email', key: 'emailcontact' },
  { title: 'Téléphone', key: 'telephonecontact' },
  { title: 'Adresse', key: 'adresse' },
  { title: 'Ville', key: 'ville' },
  { title: 'Code postal', key: 'codepostal' },
  { title: 'Actions', key: 'actions', align: 'end' as const }
]

const fetchClients = async () => {
  try {
    const resp = await axios.get<Client[]>(`${import.meta.env.VITE_API_BASE_URL}/client/list`)
    clients.value = resp.data
  } catch (e: any) {
    console.error('Erreur API list:', e)
    toast.error('Impossible de charger la liste des clients')
  }
}

const openEdit = (c: Client) => {
  Object.assign(editedClient, c)
  retourapi.value = { etat: '', message: '', detail: null }
  dialog.value = true
}

const saveEdit = async () => {
  try {
    const payload = {
      id: editedClient.id,
      societe: editedClient.societe,
      enseigne: editedClient.enseigne,
      nomcontact: editedClient.nomcontact,
      prenomcontact: editedClient.prenomcontact,
      emailcontact: editedClient.emailcontact,
      telephonecontact: editedClient.telephonecontact,
      adresse: editedClient.adresse,
      ville: editedClient.ville,
      codepostal: Number(editedClient.codepostal)
    }

    const res = await axios.patch(
      `${import.meta.env.VITE_API_BASE_URL}/client/modif`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    )
    retourapi.value = { etat: res.data.etat, message: res.data.message, detail: null }
  } catch (e: any) {
    console.error('Erreur API modif:', e.response?.data ?? e)
    const detail = Array.isArray(e.response?.data?.detail)
      ? e.response.data.detail
      : [{ msg: e.response?.data?.message || e.message }]
    retourapi.value = { etat: 'error', message: 'Erreur de validation', detail }
  }
}

watch(retourapi, v => {
  if (v.etat === 'success') {
    toast.success(v.message)
    dialog.value = false
    fetchClients()
  } else if (v.etat === 'error') {
    toast.error(v.message)
  }
})

onMounted(fetchClients)
</script>

<template>
    <div class="header">
   
    <h2 class="text-3xl font-semibold ml-6 mt-4 mb-6 text-gray-800">Liste des clients</h2>
  </div>
  <VCard class="">
    <VDataTable
      :headers="headers"
      :items="clients"
      item-value="id"
      :items-per-page="5"
    >
      <template #item.actions="{ item }">
        <VBtn color="primary" @click="openEdit(item)">
          Modifier
        </VBtn>
        
      </template>
    
    </VDataTable>
  </VCard>

  <VDialog v-model="dialog" max-width="600px">
    <VCard>
      <VCardTitle>Modifier le client</VCardTitle>
      <VCardText>
        
        <VAlert
          v-if="retourapi.detail && retourapi.detail.length"
          type="error"
          dense
          
          colored-border
          class="mb-4"
        >
          <div v-for="err in retourapi.detail" :key="err.loc?.join('.') || err.msg">
            • {{ err.msg }}
          </div>
        </VAlert>

        <VForm>
          <VRow>
            <VCol cols="12">
              <VTextField v-model="editedClient.societe" label="Société" />
            </VCol>
            <VCol cols="12">
              <VTextField v-model="editedClient.enseigne" label="Enseigne" />
            </VCol>
            <VCol cols="6">
              <VTextField v-model="editedClient.nomcontact" label="Nom" />
            </VCol>
            <VCol cols="6">
              <VTextField v-model="editedClient.prenomcontact" label="Prénom" />
            </VCol>
            <VCol cols="6">
              <VTextField v-model="editedClient.emailcontact" label="Email" />
            </VCol>
            <VCol cols="6">
              <VTextField v-model="editedClient.telephonecontact" label="Téléphone" />
            </VCol>
            <VCol cols="12">
              <VTextField v-model="editedClient.adresse" label="Adresse" />
            </VCol>
            <VCol cols="6">
              <VTextField v-model="editedClient.ville" label="Ville" />
            </VCol>
            <VCol cols="6">
              <VTextField
                v-model.number="editedClient.codepostal"
                label="Code postal"
                type="number"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn  @click="dialog = false">Annuler</VBtn>
        <VBtn color="primary" @click="saveEdit">Enregistrer</VBtn>
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
  padding: 16px;
}
</style>
