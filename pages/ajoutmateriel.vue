<script setup lang="ts">
import { useNuxtApp, useRuntimeConfig } from '#imports';
import { computed, reactive, ref, watch } from 'vue';

type FormError = { path: string; message: string }

const toast = (useNuxtApp().$toast as any)
const config = useRuntimeConfig()

const { data: matDecouvert } = useAsyncData<any[]>(
  'matdecouvert',
  () => $fetch(`${import.meta.env.VITE_API_BASE_URL}/decouverte/list`)
)

const { data: typeMaterielList } = useAsyncData<any[]>(
  'typemateriel_list',
  () => $fetch(`${import.meta.env.VITE_API_BASE_URL}/typemateriel/list`)
)

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Mac adresse', key: 'macadresse' },
  { title: 'Numéro de série', key: 'serialnumber' },
  { title: 'IP temporaire', key: 'iptemp' },
  { title: 'Clé wifi', key: 'wifi' },
  { title: 'Notified', key: 'notified' }
]

const materiel = reactive({
  hdref: '',
  macadresse: '',
  serialnumber: '',
  wifi: '',
  iptemp: '',
  typemateriel: ''
})

const retourApi = ref({ etat: '', message: '' })
const showErrors = ref(false)

const typeOptions = computed(() => {
  return (typeMaterielList.value || []).map(item => ({
    title: item.libelle,
    value: item.libelle
  }))
})

const validate = (state: typeof materiel): FormError[] => {
  const errors: FormError[] = []
  if (!state.hdref) errors.push({ path: 'hdref', message: 'Requis.' })
  if (!state.macadresse) errors.push({ path: 'macadresse', message: 'Requis.' })
  if (!state.serialnumber) errors.push({ path: 'serialnumber', message: 'Requis.' })
  if (!state.typemateriel) errors.push({ path: 'typemateriel', message: 'Requis.' })
  return errors
}

async function createMateriel(data: typeof materiel) {
  try {
    // Convert empty strings to null for optional fields
    const payload = {
      macadresse: data.macadresse,
      serialnumber: data.serialnumber,
      hdref: data.hdref,
      status: 'en_stock',
      typemateriel: data.typemateriel,
      wifi: data.wifi || null,
      iptemp: data.iptemp || null
    }
    const res = await $fetch(`${import.meta.env.VITE_API_BASE_URL}/materiel/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    })
    retourApi.value = res as { etat: string; message: string }
  } catch (error: any) {
    retourApi.value = { etat: 'error', message: error.message || 'Erreur serveur' }
  }
}

async function onSubmit() {
  showErrors.value = true
  if (validate(materiel).length > 0) return
  await createMateriel(materiel)
}

watch(retourApi, newVal => {
  if (newVal.etat === 'success') {
    toast.success(newVal.message, { timeout: 5000 })
    materiel.hdref = ''
    materiel.macadresse = ''
    materiel.serialnumber = ''
    materiel.typemateriel = ''
    materiel.wifi = ''
    materiel.iptemp = ''
    showErrors.value = false
  } else if (newVal.etat === 'error') {
    toast.error(newVal.message, { timeout: 10000 })
  } else if (newVal.etat === 'info') {
    toast.info(newVal.message, { timeout: false })
  }
})

function dragStart(item: any, event: DragEvent) {
  event.dataTransfer?.setData('application/json', JSON.stringify(item))
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const json = event.dataTransfer?.getData('application/json')
  if (!json) return
  const row = JSON.parse(json)
  materiel.macadresse = row.macadresse || ''
  materiel.serialnumber = row.serialnumber || ''
  materiel.wifi = row.wifi || ''
  materiel.iptemp = row.iptemp || ''
  if (!materiel.hdref && row.serialnumber) {
    materiel.hdref = `HD-${row.serialnumber.slice(-6)}`
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}
</script>

<template>
  <div class="mb-6">
    <div class="flex items-center mb-4">
      <VIcon class="mr-2">mdi-laptop</VIcon>
      <h2 class="text-2xl font-bold">Ajouter un matériel depuis la découverte</h2>
    </div>

    <VCard class="mb-6">
      <VCardTitle>Tableau des matériels découverts</VCardTitle>
      <VDataTable :headers="headers" :items="matDecouvert ?? []" item-value="id" class="elevation-1">
        <template #item="{ item }">
          <tr
            draggable="true"
            @dragstart="event => dragStart(item, event)"
            class="cursor-move hover:bg-gray-100"
          >
            <td>{{ item.id }}</td>
            <td>{{ item.macadresse }}</td>
            <td>{{ item.serialnumber }}</td>
            <td>{{ item.iptemp }}</td>
            <td>{{ item.wifi }}</td>
            <td>{{ item.notified }}</td>
          </tr>
        </template>
      </VDataTable>
    </VCard>

    <VCard>
      <VCardTitle>Formulaire d'ajout en stock <span class="text-sm font-normal ml-2">(Glissez-déposez une ligne ci-dessous)</span></VCardTitle>
      <div
        @dragover="onDragOver"
        @drop="onDrop"
        class=""
      >
        <VForm @submit.prevent="onSubmit">
          <VRow class="px-4 pb-4">
            <VCol cols="12" md="6">
              <VTextField
                label="Référence Hélice Diffusion"
                v-model="materiel.hdref"
                :error-messages="showErrors ? validate(materiel).filter(e => e.path === 'hdref').map(e => e.message) : []"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                label="Adresse Mac"
                v-model="materiel.macadresse"
                :error-messages="showErrors ? validate(materiel).filter(e => e.path === 'macadresse').map(e => e.message) : []"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                label="Numéro de série"
                v-model="materiel.serialnumber"
                :error-messages="showErrors ? validate(materiel).filter(e => e.path === 'serialnumber').map(e => e.message) : []"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect
                label="Type de matériel"
                v-model="materiel.typemateriel"
                :items="typeOptions"
                :error-messages="showErrors ? validate(materiel).filter(e => e.path === 'typemateriel').map(e => e.message) : []"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                label="Clé Wi-Fi (optionnel)"
                v-model="materiel.wifi"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                label="IP temporaire (optionnel)"
                v-model="materiel.iptemp"
              />
            </VCol>
            <VCol cols="12" class="text-right">
              <VBtn
                type="submit"
                color="primary"
                :disabled="validate(materiel).length > 0 && showErrors"
              >
                Enregistrer en stock
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </div>
    </VCard>
  </div>
</template>

<style scoped>
.cursor-move {
  cursor: move;
}
</style>
