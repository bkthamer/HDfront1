<script setup lang="ts">
import { useLazyAsyncData, useNuxtApp, useRuntimeConfig } from '#imports';
import { computed, reactive, ref, watch } from 'vue';

type FormError = { path: string; message: string };

interface SiteItem {
  id: number;
  nomsite: string;
}

interface LecteurItem {
  hdref: string;
}

interface PDV {
  pdv_hdref: string;
  materiel_hdref: string;
  emplacement: string;
  site_id: number | null;
}

const toast = (useNuxtApp().$toast as any);
const config = useRuntimeConfig();

const { data: site_list } = await useLazyAsyncData<SiteItem[]>(
  'site_list',
  () => $fetch(`${import.meta.env.VITE_API_BASE_URL}/site/list`)
);

const { data: lecteur_list_stock, refresh } = await useLazyAsyncData<LecteurItem[]>(
  'lecteur_list_stock',
  () => $fetch(`${import.meta.env.VITE_API_BASE_URL}/lecteurstock/list`)
);

const siteOptions = computed(() => {
  return (site_list.value || []).map((s) => ({
    value: s.id,
    title: s.nomsite,
  }));
});

const lecteurOptions = computed(() => {
  return (lecteur_list_stock.value || []).map((l) => ({
    value: l.hdref,
    title: l.hdref,
  }));
});

const pdv = reactive<PDV>({
  pdv_hdref: '',
  materiel_hdref: '',
  emplacement: '',
  site_id: null,
});

const retourapi = ref<{ etat: string; message: string }>({ etat: '', message: '' });
const showErrors = ref(false);

const validate = (state: PDV): FormError[] => {
  const errors: FormError[] = [];
  if (!state.pdv_hdref) errors.push({ path: 'pdv_hdref', message: 'Requis.' });
  if (!state.site_id) errors.push({ path: 'site_id', message: 'Requis.' });
  if (!state.materiel_hdref) errors.push({ path: 'materiel_hdref', message: 'Requis.' });
  return errors;
};

async function createPDV(data: PDV) {
  try {
    const payload = {
      pdv_hdref: data.pdv_hdref,
      materiel_hdref: data.materiel_hdref,
      emplacement: data.emplacement ?? '',
      site_id: data.site_id,
    };
    const res = await $fetch(`${import.meta.env.VITE_API_BASE_URL}/pdv/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    retourapi.value = res as { etat: string; message: string };
  } catch (err: any) {
    retourapi.value = { etat: 'error', message: err.message || 'Erreur serveur' };
  }
}

async function miseEnProd(terminalHdref: string) {
  try {
    const res = await $fetch(`${import.meta.env.VITE_API_BASE_URL}/materiel/lecteur/miseenprod`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terminal_hdref: terminalHdref }),
    });
    retourapi.value = res as { etat: string; message: string };
  } catch (err: any) {
    retourapi.value = { etat: 'error', message: err.message || 'Erreur serveur' };
  }
}

async function setupHelice(data: PDV) {
  try {
    const res = await $fetch(`${import.meta.env.VITE_API_BASE_URL}/pdv/setuphelice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdv_hdref: data.pdv_hdref,
        materiel_hdref: data.materiel_hdref,
        emplacement: data.emplacement,
        site_id: data.site_id,
      }),
    });
    retourapi.value = res as { etat: string; message: string };
  } catch (err: any) {
    retourapi.value = { etat: 'error', message: err.message || 'Erreur serveur' };
  }
}



async function onSubmit(event: SubmitEvent) {
  event.preventDefault();
  
  await setupHelice(pdv);
  if (retourapi.value.etat === 'success') {
    await miseEnProd(pdv.materiel_hdref);
    await createPDV(pdv);
    toast.success(retourapi.value.message, { timeout: 5000 });
    pdv.pdv_hdref = '';
    pdv.site_id = null;
    pdv.materiel_hdref = '';
    pdv.emplacement = '';
  } else {
    toast.error(retourapi.value.message, { timeout: 10000 });
  }
}


watch(retourapi, (newVal) => {
  if (newVal.etat === 'error') {
    toast.error(newVal.message, { timeout: 10000 });
  }
});
</script>

<template>
  <div class="flex items-center mb-6">
    
    <h2 class="text-2xl font-bold">Ajouter un point de diffusion à un site</h2>
  </div>

  <div class="form-container">
    <VForm @submit.prevent="onSubmit">
      <VRow>
        <VCol cols="12">
          <VTextField
            label="Nom unique du point de diffusion (hdref)"
            v-model="pdv.pdv_hdref"
            :error-messages="showErrors ? validate(pdv).filter(e => e.path === 'pdv_hdref').map(e => e.message) : []"
          />
        </VCol>

        <VCol cols="12" md="6">
          <VSelect
            label="Site d'accueil"
            v-model="pdv.site_id"
            :items="siteOptions"
            :error-messages="showErrors ? validate(pdv).filter(e => e.path === 'site_id').map(e => e.message) : []"
          />
        </VCol>

        <VCol cols="12" md="6">
          <VSelect
            label="Sélectionner le lecteur installé (hdref)"
            v-model="pdv.materiel_hdref"
            :items="lecteurOptions"
            @click="refresh"
            :error-messages="showErrors ? validate(pdv).filter(e => e.path === 'materiel_hdref').map(e => e.message) : []"
          />
        </VCol>

        <VCol cols="12">
          <VTextField
            label="Emplacement du matériel"
            v-model="pdv.emplacement"
          />
        </VCol>

        <VCol cols="12">
          <VBtn
            type="submit"
            color="primary"
            :disabled="validate(pdv).length > 0 && showErrors"
          >
            Enregistrer ce nouveau point de diffusion
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
