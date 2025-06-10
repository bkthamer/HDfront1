<script setup lang="ts">
import { useLazyAsyncData, useNuxtApp, useRuntimeConfig } from '#imports';
import { computed, reactive, ref, watch } from 'vue';

type FormError = { path: string; message: string }

const toast = (useNuxtApp().$toast as any)

interface Site {
  nomsite: string
  adresse: string
  ville: string
  codepostal: number
  client_id: number
  routeur_hdref: string
}

interface ClientItem {
  id: number
  societe: string
}

interface RouterItem {
  hdref: string
}

interface Proposition {
  adresse: string
  ville: string
  codepostal: string
}

const config = useRuntimeConfig()

const { data: client_list } = await useLazyAsyncData<ClientItem[]>(
  'client_list',
  () => $fetch(`${import.meta.env.VITE_API_BASE_URL}/client/list`)
)

const { data: routeur_list_stock, refresh } = await useLazyAsyncData<RouterItem[]>(
  'routeur_list_stock',
  () => $fetch(`${import.meta.env.VITE_API_BASE_URL}/routeurstock/list`)
)

const routerOptions = computed(() => {
  return (routeur_list_stock.value || []).map(r => ({
    value: r.hdref,
    title: r.hdref,
  }))
})

const clientOptions = computed(() => {
  return (client_list.value || []).map(c => ({
    value: c.id,
    title: c.societe,
  }))
})

const site = reactive<Site>({
  nomsite: '',
  adresse: '',
  ville: '',
  codepostal: 0,
  client_id: 0,
  routeur_hdref: '',
})

const retourapi = ref({ etat: '', message: '' })
const showErrors = ref(false)

const search = ref<string>('')
const propositions = ref<Proposition[]>([])

const validate = (state: Site): FormError[] => {
  const errors: FormError[] = []
  if (!state.nomsite.trim())
    errors.push({ path: 'nomsite', message: 'Requis.' })
  if (!state.client_id || state.client_id <= 0)
    errors.push({ path: 'client_id', message: 'Requis.' })
  if (!state.routeur_hdref.trim())
    errors.push({ path: 'routeur_hdref', message: 'Requis.' })
  if (!state.adresse.trim())
    errors.push({ path: 'adresse', message: 'Requis.' })
  if (!state.ville.trim())
    errors.push({ path: 'ville', message: 'Requis.' })
  if (!state.codepostal || state.codepostal <= 0)
    errors.push({ path: 'codepostal', message: 'Requis.' })
  return errors
}

const onselect = (item: Proposition) => {
  site.adresse = item.adresse
  site.ville = item.ville
  site.codepostal = parseInt(item.codepostal, 10) || 0
  propositions.value = []
  search.value = ''
}

const onInputChange = async () => {
  if (search.value.length >= 10) {
    try {
      const data = (await $fetch(
        `${import.meta.env.VITE_API_BASE_URL}/autocomplete/?query=${encodeURIComponent(
          search.value
        )}`
      )) as { propositions: Proposition[] }
      propositions.value = data.propositions
    } catch {
      propositions.value = []
    }
  } else {
    propositions.value = []
  }
}

async function createSite(data: Site) {
  try {
    const payload = {
      nomsite: data.nomsite.trim(),
      adresse: data.adresse.trim(),
      ville: data.ville.trim(),
      codepostal: data.codepostal,
      client_id: data.client_id,
      routeur_hdref: data.routeur_hdref.trim(),
    }

    console.log('Payload envoyé au back:', payload)

    const res = await $fetch(`${import.meta.env.VITE_API_BASE_URL}/site/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    retourapi.value = res as { etat: string; message: string }
  } catch (error: any) {
    if (error?.data?.detail) {
      const details = (error.data.detail as any[])
        .map((d) => `${d.loc.join('.')}: ${d.msg}`)
        .join(' ; ')
      retourapi.value = { etat: 'error', message: 'Validation: ' + details }
    } else {
      retourapi.value = {
        etat: 'error',
        message: error.message || 'Erreur serveur',
      }
    }
  }
}

async function onSubmit() {
  showErrors.value = true
  if (validate(site).length > 0) return
  await createSite(site)
}

watch(retourapi, (newVal) => {
  if (newVal.etat === 'success') {
    toast.success(newVal.message, { timeout: 5000 })
    site.nomsite = ''
    site.adresse = ''
    site.ville = ''
    site.codepostal = 0
    site.client_id = 0
    site.routeur_hdref = ''
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
    <h2 class="text-2xl font-bold">Ajouter un nouveau site</h2>
  </div>

  <div class="form-container">
    <VForm @submit.prevent="onSubmit">
      <VRow>
        <VCol cols="12">
          <VTextField
            label="Nom du site"
            v-model="site.nomsite"
            :error-messages="
              showErrors
                ? validate(site)
                    .filter((e) => e.path === 'nomsite')
                    .map((e) => e.message)
                : []
            "
          />
        </VCol>

        <VCol cols="12" md="6">
          <VSelect
            label="Client"
            v-model="site.client_id"
            :items="clientOptions"
            :error-messages="
              showErrors
                ? validate(site)
                    .filter((e) => e.path === 'client_id')
                    .map((e) => e.message)
                : []
            "
          />
        </VCol>

        <VCol cols="12" md="6">
          <VSelect
            label="Routeur Helice Diffusion"
            v-model="site.routeur_hdref"
            :items="routerOptions"
            @click="refresh"
            :error-messages="
              showErrors
                ? validate(site)
                    .filter((e) => e.path === 'routeur_hdref')
                    .map((e) => e.message)
                : []
            "
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
            v-model="site.adresse"
            :error-messages="
              showErrors
                ? validate(site)
                    .filter((e) => e.path === 'adresse')
                    .map((e) => e.message)
                : []
            "
          />
        </VCol>

        <VCol cols="6" md="3">
          <VTextField
            label="Ville"
            v-model="site.ville"
            :error-messages="
              showErrors
                ? validate(site)
                    .filter((e) => e.path === 'ville')
                    .map((e) => e.message)
                : []
            "
          />
        </VCol>

        <VCol cols="6" md="3">
          <VTextField
            label="Code postal"
            v-model.number="site.codepostal"
            type="number"
            :error-messages="
              showErrors
                ? validate(site)
                    .filter((e) => e.path === 'codepostal')
                    .map((e) => e.message)
                : []
            "
          />
        </VCol>

        <VCol cols="12">
          <VBtn
            type="submit"
            color="primary"
            :disabled="validate(site).length > 0 && showErrors"
          >
            Enregistrer ce nouveau site
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
