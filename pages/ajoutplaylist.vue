<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'

const playlistForm = ref({
  pl_libelle: '',
  pl_description: '',
  pl_proprietaire: null as number | null, 
})

const list_users = ref<any[]>([])
const Useroptions = computed(() =>
  list_users.value.map(u => ({ text: u.email, value: u.id_user }))
)

async function refresh_users() {
  try {
    const response = await axios.get('http://127.0.0.1:8000/users')
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
const onSubmit = async () => {
  const errors = validateForm()
  if (errors.length > 0) {
   
    return
  }
  
 
  const proprietaireValue = playlistForm.value.pl_proprietaire === null ? 0 : playlistForm.value.pl_proprietaire
  
  try {
    
    const resp = await $fetch('http://127.0.0.1:8000/playlist/add', {
      method: "POST",
      body: {
        pl_libelle: playlistForm.value.pl_libelle,
        pl_description: playlistForm.value.pl_description,
        pl_proprietaire: proprietaireValue,
        pl_status: false
      }
    })
    retourapi.value = resp as { etat: string; message: string }
  } catch (error) {
    console.error('Erreur soumission:', error)
  }
}

onMounted(() => {
  refresh_users()
})
</script>

<template>
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
