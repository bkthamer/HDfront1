<script setup lang="ts">
import { useLazyAsyncData, useNuxtApp, useRuntimeConfig } from '#imports';
import { computed, reactive, ref, watch } from 'vue';
type FormError = { path: string; message: string }

interface SiteItem {
  id: number
  nomsite: string
}

interface LecteurItem {
  hdref: string
}

interface PDV {
  pdv_hdref: string
  materiel_hdref: string
  emplacement: string
  site_id: number | null
  multimig: boolean
}

const config = useRuntimeConfig()
const toast = (useNuxtApp().$toast as any)

const { data: site_list } = await useLazyAsyncData<SiteItem[]>(
  'site_list_mig',
  () => $fetch(`${import.meta.env.VITE_API_BASE_URL}/site/list/migration`)
)

const { data: lecteur_list, refresh } = await useLazyAsyncData<LecteurItem[]>(
  'lecteur_list_mig',
  () => $fetch(`${import.meta.env.VITE_API_BASE_URL}/lecteurmigration/list`)
)

const siteOptions = computed(() => (site_list.value || []).map(s => ({
  value: s.id,
  title: s.nomsite
})))

const lecteurOptions = computed(() => (lecteur_list.value || []).map(l => ({
  value: l.hdref,
  title: l.hdref
})))

const pdv = reactive<PDV>({
  pdv_hdref: '',
  materiel_hdref: '',
  emplacement: '',
  site_id: null,
  multimig: false
})

const retourapi = ref<{ etat: string; message: string }>({ etat: '', message: '' })
const showErrors = ref(false)

const validate = (state: PDV): FormError[] => {
  const errors: FormError[] = []
  if (!state.pdv_hdref)    errors.push({ path: 'pdv_hdref', message: 'Requis.' })
  if (!state.site_id)      errors.push({ path: 'site_id', message: 'Requis.' })
  if (!state.materiel_hdref) errors.push({ path: 'materiel_hdref', message: 'Requis.' })
  return errors
}

async function migration(data: PDV) {
  try {
    const payload = {
      hdref_pdv:       data.pdv_hdref,
      hdref_helice:   data.materiel_hdref,
      emplacement:    data.emplacement,
      id_site:        data.site_id,
      multimig:       data.multimig
    }
    const res = await $fetch(`${import.meta.env.VITE_API_BASE_URL}/pycav/migration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    retourapi.value = res as { etat: string; message: string }
  } catch (err: any) {
    retourapi.value = { etat: 'error', message: err.message || 'Erreur serveur' }
  }
}

async function miseEnProd(terminalHdref: string) {
  try {
    const res = await $fetch(`${import.meta.env.VITE_API_BASE_URL}/materiel/lecteur/miseenprod`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terminal_hdref: terminalHdref })
    })
    retourapi.value = res as { etat: string; message: string }
  } catch (err: any) {
    retourapi.value = { etat: 'error', message: err.message || 'Erreur serveur' }
  }
}

async function createPDV(data: PDV) {
  try {
    const payload = {
      pdv_hdref:      data.pdv_hdref,
      materiel_hdref: data.materiel_hdref,
      emplacement:    data.emplacement,
      site_id:        data.site_id,
      multimig:       data.multimig
    }
    const res = await $fetch(`${import.meta.env.VITE_API_BASE_URL}/pdv/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    retourapi.value = res as { etat: string; message: string }
  } catch (err: any) {
    retourapi.value = { etat: 'error', message: err.message || 'Erreur serveur' }
  }
}

async function onSubmit() {
  showErrors.value = true
  if (validate(pdv).length > 0) return

  await migration(pdv)
  if (retourapi.value.etat === 'success') {
    await miseEnProd(pdv.materiel_hdref)
    await createPDV(pdv)
    toast.success(retourapi.value.message, { timeout: 5000 })
   
    pdv.pdv_hdref = ''
    pdv.site_id = null
    pdv.materiel_hdref = ''
    pdv.emplacement = ''
    pdv.multimig = false
    showErrors.value = false
  } else {
    toast.error(retourapi.value.message, { timeout: 8000 })
  }
}

watch(retourapi, (newVal) => {
  if (newVal.etat === 'error') {
    toast.error(newVal.message, { timeout: 8000 })
  }
})
</script>

<template>
  <div class="flex items-center mb-6">
    <v-icon color="green" class="mr-2">mdi-concourse</v-icon>
    <h2 class="text-2xl font-bold">Migration d'une hélice Pycav vers son site</h2>
  </div>

  <div class="form-container">
    <v-form @submit.prevent="onSubmit">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-select
            label="Site associé au routeur"
            v-model="pdv.site_id"
            :items="siteOptions"
            item-title="title"
            item-value="value"
            :error-messages="showErrors ? validate(pdv).filter(e => e.path === 'site_id').map(e => e.message) : []"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-select
            label="Hélice à migrer"
            v-model="pdv.materiel_hdref"
            :items="lecteurOptions"
            item-title="title"
            item-value="value"
            @click="refresh"
            :error-messages="showErrors ? validate(pdv).filter(e => e.path === 'materiel_hdref').map(e => e.message) : []"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            label="Nom unique du PDV (hdref)"
            v-model="pdv.pdv_hdref"
            :error-messages="showErrors ? validate(pdv).filter(e => e.path === 'pdv_hdref').map(e => e.message) : []"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            label="Emplacement de l'équipement"
            v-model="pdv.emplacement"
          />
        </v-col>

        <v-col cols="12">
          <v-checkbox
            v-model="pdv.multimig"
            label="Case à cocher si dernière hélice sur le site"
          />
        </v-col>

        <v-col cols="12" class="text-right">
          <v-btn type="submit" color="primary">
            Migrer ce point de visualisation
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<style scoped>
.form-container {
  margin: 20px auto;
  max-width: 800px;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
