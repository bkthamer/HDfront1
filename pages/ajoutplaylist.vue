<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'

const playlistForm = ref({
  pl_libelle: '',
  pl_description: '',
  pl_proprietaire: null as number | null, 
  pl_mode:        'Auto' as string
})


const toast = (useNuxtApp().$toast as any)

const list_users = ref<any[]>([])
const Useroptions = computed(() =>
  list_users.value.map(u => ({ text: u.email, value: u.id_user }))
)

async function refresh_users() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users`)
    list_users.value = response.data
  } catch (error) {
    console.error('Erreur utilisateurs:', error)
  }
}

const validateForm = () => {
  const errors = []
  if (!playlistForm.value.pl_libelle) errors.push('Libellé requis.')
  if (!playlistForm.value.pl_description) errors.push('Description requise.')
 
  return errors
}

const retourapi = ref({ etat: '', message: '' })

async function onSubmit() {
  const errors = validateForm()
  if (errors.length) {
    errors.forEach(e => toast.error(e))
    return
  }

  const payload = {
    pl_id:           0,
    pl_libelle:      playlistForm.value.pl_libelle,
    pl_description:  playlistForm.value.pl_description,
    pl_proprietaire: playlistForm.value.pl_proprietaire ?? 0,
    pl_status:       0,
    pl_mode:         "Auto",
  }

  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/playlist/add`,
      payload
    )

    if (data.etat === 'success') {
      toast.success('Playlist ajoutée avec succès !')
      
      
      
      
    } else {
      toast.error(`Erreur : ${data.message}`)
    }
  } catch (error: any) {
    console.error('Erreur API playlist/add :', error)
    const msg = error.response?.data?.message
              || 'Erreur lors de l\'ajout de la playlist.'
    toast.error(msg)
  }
}

onMounted(() => {
  refresh_users()
})
</script>

<template>
    <div class="header">
   
    <h2 class="text-3xl font-semibold ml-6 mt-4 mb-6 text-gray-800">Ajout Playlist</h2>
  </div>
  <div class="form-container">
    <VForm @submit.prevent="onSubmit">
      <VRow>
        <VCol cols="12">
          <VTextField
            label="Libellé de la playlist"
            v-model="playlistForm.pl_libelle"
            placeholder="Exemple : Ma playlist préférée"
          />
        </VCol>

        <VCol cols="12">
          <VTextField
            label="Description"
            v-model="playlistForm.pl_description"
            placeholder="Exemple : Playlist regroupant mes titres favoris"
          />
        </VCol>

        <VCol cols="12">
          <VSelect
            label="Propriétaire"
            v-model="playlistForm.pl_proprietaire"
            :items="Useroptions"
            item-title="text"
            item-value="value"
            placeholder="Sélectionner un utilisateur (optionnel)"
            clearable
          />
        </VCol>

        <VCol cols="12">
          <VBtn type="submit" color="primary">
            Ajouter la playlist
          </VBtn>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>

<style scoped>
.form-container {
  margin: 20px auto;
  max-width: 600px;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

label {
  font-weight: 600;
  color: #424242;
}
</style>
