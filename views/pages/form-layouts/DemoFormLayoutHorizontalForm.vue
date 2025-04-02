<script lang="ts" setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'

const sujet = ref('')
const description = ref('')
const email = ref('')
const imageFile = ref<File | null>(null)

const user = ref({
  email: 'Unknown',
  role: 'User',  
});

const fetchUser = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]; 
      const decodedPayload = JSON.parse(atob(payloadBase64)); 
      
      user.value = {
        email: decodedPayload.sub || 'Unknown', 
        role: decodedPayload.role || 'User', 
      };
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
};

onMounted(() => {
  fetchUser();
});

const submitForm = async () => {
  try {
    const formData = new FormData();
    formData.append('sujet', sujet.value);
    formData.append('description', description.value);
    if (imageFile.value) {
      formData.append('image', imageFile.value);
    }
    formData.append('email', user.value.email);
    
    const response = await axios.post('http://127.0.0.1:8000/ajoutdemande', formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    console.log('Demande ajoutée :', response.data)
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande :", error)
  }
}
</script>

<template>
  <div class="form-container">
    <VForm @submit.prevent="submitForm">
      <VRow>
        <!-- Champ Sujet -->
        <VCol cols="12">
          <VRow no-gutters>
            <VCol cols="12" md="3">
              <label for="sujet">Sujet</label>
            </VCol>
            <VCol cols="12" md="9">
              <VTextField
                id="sujet"
                v-model="sujet"
                placeholder="Entrez le sujet"
                persistent-placeholder
              />
            </VCol>
          </VRow>
        </VCol>

        <!-- Champ Description -->
        <VCol cols="12">
          <VRow no-gutters>
            <VCol cols="12" md="3">
              <label for="description">Description</label>
            </VCol>
            <VCol cols="12" md="9">
              <VTextarea
                id="description"
                v-model="description"
                placeholder="Entrez la description"
                persistent-placeholder
              />
            </VCol>
          </VRow>
        </VCol>

        <!-- Champ Image -->
        <VCol cols="12">
          <VRow no-gutters>
            <VCol cols="12" md="3">
              <label for="image">Image</label>
            </VCol>
            <VCol cols="12" md="9">
              <VFileInput 
                id="image"
                label="Choisissez une image"
                v-model="imageFile"
                accept="image/*"
                placeholder="Aucune image sélectionnée"
              />
            </VCol>
          </VRow>
        </VCol>
        
        <VCol cols="12">
          <VRow no-gutters>
            <VCol cols="12" md="3" />
            <VCol cols="12" md="9">
              <VBtn type="submit" class="me-4">
                Submit
              </VBtn>
              <VBtn color="secondary" variant="outlined" type="reset">
                Reset
              </VBtn>
            </VCol>
          </VRow>
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

/* Exemples d'améliorations globales sur les composants Vuetify */
label {
  font-weight: 600;
  color: #424242;
}
</style>
