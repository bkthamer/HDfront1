<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'

const mediaform = ref({
  libelle: '',
  description: '',
 
  categorie_id: '' as string | number,
  souscategorie_id: null as number | null,
  owner_id: null as number | null, 
  new_upload_file: null as File | null,
})

const list_cat_media = ref<any[]>([])
const list_souscat_media = ref<any[]>([])
const list_users = ref<any[]>([])  

const Catoptions = computed(() =>
  list_cat_media.value.map(cat => ({ text: cat.nom, value: cat.id }))
)

const Suboptions = computed(() =>
  list_souscat_media.value.map(m => ({ text: m.nom, value: m.id }))
)

const Useroptions = computed(() =>
  list_users.value.map(u => ({ text: u.email, value: u.id_user }))
)

const isExistingCategory = computed(() => {
  if (typeof mediaform.value.categorie_id === 'number') return true;
  return list_cat_media.value.some(cat => cat.nom === mediaform.value.categorie_id);
})

async function refresh_cat() {
  try {
    const response = await axios.get('http://127.0.0.1:8000/media/cat/list')
    list_cat_media.value = response.data
  } catch (error) {
    console.error('Erreur catégories:', error)
  }
}

async function refresh_subcat() {
  let catId: number | undefined;
  if (typeof mediaform.value.categorie_id === 'number') {
    catId = mediaform.value.categorie_id;
  } else {
    const cat = list_cat_media.value.find(cat => cat.nom === mediaform.value.categorie_id);
    catId = cat ? cat.id : undefined;
  }
  if (!catId) return;
  try {
    list_souscat_media.value = await $fetch('http://127.0.0.1:8000/media/subcat/listbycat', {
      method: 'POST',
      body: { id: catId }
    })
  } catch (error) {
    console.error('Erreur sous-catégories:', error)
  }
}

async function refresh_users() {
  try {
    const response = await axios.get('http://127.0.0.1:8000/users')
    list_users.value = response.data
  } catch (error) {
    console.error('Erreur utilisateurs:', error)
  }
}

const onselectmedia = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    mediaform.value.new_upload_file = target.files[0]
  }
}

async function onCloseCat() {
  if (!mediaform.value.categorie_id) return;
  
  if (typeof mediaform.value.categorie_id === 'string' && !list_cat_media.value.some(cat => cat.nom === mediaform.value.categorie_id)) {
    try {
      await $fetch('http://127.0.0.1:8000/media/cat/add', {
        method: 'POST',
        body: { nom: mediaform.value.categorie_id }
      })
      await refresh_cat()
      const cat = list_cat_media.value.find(cat => cat.nom === mediaform.value.categorie_id);
      if (cat) {
         mediaform.value.categorie_id = cat.id;
      }
    } catch (error) {
      console.error('Erreur création catégorie:', error)
    }
  } else if (typeof mediaform.value.categorie_id === 'string') {
      const cat = list_cat_media.value.find(cat => cat.nom === mediaform.value.categorie_id);
      if (cat) {
         mediaform.value.categorie_id = cat.id;
      }
      await refresh_subcat();
  } else {
      await refresh_subcat();
  }
}

async function onCloseSubcat() {
  const inputValue = mediaform.value.souscategorie_id
  if (typeof inputValue === 'number') return
  if (inputValue && (inputValue as string).trim()) {
    try {
      let catId: number | undefined;
      if (typeof mediaform.value.categorie_id === 'number') {
         catId = mediaform.value.categorie_id;
      } else {
         const cat = list_cat_media.value.find(cat => cat.nom === mediaform.value.categorie_id)
         catId = cat ? cat.id : undefined;
      }
      if (!catId) return;
      
      await $fetch('http://127.0.0.1:8000/media/subcat/add', {
        method: 'POST',
        body: {
          nom: inputValue,
          id_cat: catId
        }
      })
      
      await refresh_subcat()
      const newSub = list_souscat_media.value.find(sub => sub.nom === inputValue)
      if (newSub) {
        mediaform.value.souscategorie_id = newSub.id
      }
    } catch (error) {
      console.error('Erreur création sous-catégorie:', error)
    }
  }
}

const validateForm = () => {
  const errors = []
  if (!mediaform.value.libelle) errors.push('Libellé requis.')
  if (!mediaform.value.categorie_id) errors.push('Catégorie requise.')
  if (isExistingCategory.value && !mediaform.value.souscategorie_id) errors.push('Sous-catégorie requise.')
  if (!mediaform.value.new_upload_file) errors.push('Fichier vidéo requis.')
  return errors
}

const retourapi = ref({ etat: '', message: '' })
const onSubmit = async () => {
  const errors = validateForm()
  if (errors.length > 0) return

  const form = new FormData()
  if (mediaform.value.new_upload_file) {
    form.append("new_upload_file", mediaform.value.new_upload_file)
  }
  
  try {
    const resp = await $fetch(
      `http://127.0.0.1:8000/mediatheque/media/add?libelle=${mediaform.value.libelle}&description=${mediaform.value.description}&categorie_id=${mediaform.value.categorie_id}&souscategorie_id=${mediaform.value.souscategorie_id}&owner_id=${mediaform.value.owner_id}`,
      {
        method: "POST",
        body: form
      }
    )
    retourapi.value = resp as { etat: string; message: string }
  } catch (error) {
    console.error('Erreur soumission:', error)
  }
}

onMounted(() => {
  refresh_cat()
  refresh_users()
})
</script>

<template>
  <div class="form-container">
    <VForm @submit.prevent="onSubmit">
      <VRow>
        <VCol cols="12">
          <VTextField
            label="Libellé du média"
            v-model="mediaform.libelle"
            placeholder="Exemple: LotoJeudi24fevrier"
          />
        </VCol>

        <VCol cols="12">
          <VTextField
            label="Description"
            v-model="mediaform.description"
            placeholder="Exemple: Tirage du loto classique"
          />
        </VCol>

        <VCol cols="12">
          <VSelect
            label="Catégorie"
            v-model="mediaform.categorie_id"
            :items="Catoptions"
            item-title="text"
            item-value="value"
            combobox
            @blur="onCloseCat"
            placeholder="Choisir ou créer une catégorie"
          />
        </VCol>

        <VCol v-if="isExistingCategory" cols="12">
          <VSelect
            label="Sous-catégorie"
            v-model="mediaform.souscategorie_id"
            :items="Suboptions"
            item-title="text"
            item-value="value"
            combobox
            clearable
            @blur="onCloseSubcat"
            placeholder="Choisir ou créer une sous-catégorie"
          />
        </VCol>

        <VCol cols="12">
          <VSelect
            label="Propriétaire"
            v-model="mediaform.owner_id"
            :items="Useroptions"
            item-title="text"
            item-value="value"
            placeholder="Sélectionner un utilisateur"
            clearable
          />
        </VCol>

        <VCol cols="12">
          <VFileInput
            label="Fichier vidéo"
            v-model="mediaform.new_upload_file"
            accept="video/*"
            placeholder="Choisissez un fichier vidéo"
          />
        </VCol>

        <VCol cols="12">
          <VBtn type="submit" color="primary">
            Ajouter ce média à la médiathèque
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}


label {
  font-weight: 600;
  color: #424242;
}
</style>
