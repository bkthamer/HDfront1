<script setup lang="ts">
import { useNuxtApp } from '#imports';
import axios from 'axios';
import { reactive, ref, watch } from 'vue';

type FormError = { path: string; message: string }

interface Client {
  societe: string | undefined
  enseigne: string | undefined
  nomcontact: string | undefined
  prenomcontact: string | undefined
  emailcontact: string | undefined
  telephonecontact: string | undefined
  adresse: string | undefined
  ville: string | undefined
  codepostal: string | undefined
}

interface Proposition {
  adresse: string
  ville: string
  codepostal: string
}

const client = reactive<Client>({
  societe: undefined,
  enseigne: undefined,
  nomcontact: undefined,
  prenomcontact: undefined,
  emailcontact: undefined,
  telephonecontact: undefined,
  adresse: undefined,
  ville: undefined,
  codepostal: undefined,
})

const retourapi = ref({ etat: '', message: '' })
const showErrors = ref(false)
const toast = (useNuxtApp().$toast as any)

const search = ref<string>('')
const propositions = ref<Proposition[]>([])

const validate = (state: Client): FormError[] => {
  const errors: FormError[] = []
  if (!state.societe)      errors.push({ path: 'societe',    message: 'Requis.' })
  if (!state.nomcontact)   errors.push({ path: 'nomcontact', message: 'Requis.' })
  if (!state.prenomcontact)errors.push({ path: 'prenomcontact', message: 'Requis.' })
  if (!state.emailcontact) errors.push({ path: 'emailcontact', message: 'Requis.' })
  return errors
}

const onselect = (item: Proposition) => {
  client.adresse = item.adresse
  client.ville = item.ville
  client.codepostal = item.codepostal
  propositions.value = []
  search.value = ''
}

const onInputChange = async () => {
  if (search.value.length >= 10) {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/autocomplete/?query=${encodeURIComponent(search.value)}`
      )
      propositions.value = res.data.propositions
    } catch {
      propositions.value = []
    }
  } else {
    propositions.value = []
  }
}

async function createClient(data: Client) {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/client/add`,
      {
        societe: data.societe,
        enseigne: data.enseigne,
        nomcontact: data.nomcontact,
        prenomcontact: data.prenomcontact,
        emailcontact: data.emailcontact,
        telephonecontact: data.telephonecontact,
        adresse: data.adresse,
        ville: data.ville,
        codepostal: data.codepostal,
      },
      { headers: { 'Content-Type': 'application/json' } }
    )
    retourapi.value = res.data
  } catch (error: any) {
    retourapi.value = { etat: 'error', message: error.message || 'Erreur serveur' }
  }
}

async function onSubmit() {
  showErrors.value = true
  if (validate(client).length > 0) return
  await createClient(client)
}

watch(retourapi, newVal => {
  if (newVal.etat === 'success') {
    toast.success(newVal.message, { timeout: 5000 })
    Object.keys(client).forEach(k => (client[k as keyof Client] = undefined))
    propositions.value = []
    search.value = ''
    showErrors.value = false
  } else if (newVal.etat === 'error') {
    toast.error(newVal.message, { timeout: 10000 })
  }
})
</script>

<template>
  <div class="flex items-center mb-6">
   
    <h2 class="text-2xl font-bold">Création d'un nouveau client</h2>
  </div>

  <div class="form-container">
    <VForm @submit.prevent="onSubmit">
      <VRow>

        <VCol cols="12">
          <VTextField
            label="Nom de la Société"
            v-model="client.societe"
            :error-messages="showErrors ? validate(client).filter(e => e.path === 'societe').map(e => e.message) : []"
          />
        </VCol>

        <VCol cols="12">
          <VTextField
            label="Enseigne"
            v-model="client.enseigne"
          />
        </VCol>

        <VCol cols="12" md="6">
          <VTextField
            label="Nom du contact"
            v-model="client.nomcontact"
            :error-messages="showErrors ? validate(client).filter(e => e.path === 'nomcontact').map(e => e.message) : []"
          />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField
            label="Prénom du contact"
            v-model="client.prenomcontact"
            :error-messages="showErrors ? validate(client).filter(e => e.path === 'prenomcontact').map(e => e.message) : []"
          />
        </VCol>

        <VCol cols="12" md="6">
          <VTextField
            label="Email du contact"
            v-model="client.emailcontact"
            :error-messages="showErrors ? validate(client).filter(e => e.path === 'emailcontact').map(e => e.message) : []"
          />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField
            label="Téléphone du contact"
            v-model="client.telephonecontact"
          />
        </VCol>

        <VCol cols="12">
          <VTextField
            label="Rechercher une adresse"
            v-model="search"
            @input="onInputChange"
            placeholder="(10 caractères minimum)"
          />
          <VList
            v-if="propositions.length"
            class="border rounded mt-2 max-h-56 overflow-auto"
          >
            <VListItem
              v-for="(item, index) in propositions"
              :key="index"
              @click="onselect(item)"
              class="cursor-pointer"
            >
              <VListItemTitle>
                {{ item.adresse }}, {{ item.ville }} {{ item.codepostal }}
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCol>

        <VCol cols="12" md="6">
          <VTextField
            label="Adresse"
            v-model="client.adresse"
          />
        </VCol>
        <VCol cols="6" md="3">
          <VTextField
            label="Ville"
            v-model="client.ville"
          />
        </VCol>
        <VCol cols="6" md="3">
          <VTextField
            label="Code postal"
            v-model="client.codepostal"
          />
        </VCol>

        <VCol cols="12">
          <VBtn
            type="submit"
            color="primary"
            :disabled="validate(client).length > 0 && showErrors"
          >
            Enregistrer ce nouveau client
          </VBtn>
        </VCol>

      </VRow>
    </VForm>
  </div>
</template>

<style scoped>
.form-container {
  margin: 20px auto;
  max-width: 700px;
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
