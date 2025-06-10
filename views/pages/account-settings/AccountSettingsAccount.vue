<script setup lang="ts">
import axios from 'axios';
import { onMounted, ref } from 'vue';


interface User {
  email: string;
  role: string; 
  password : string;
}

const user = ref<User>({
  email: 'Unknown',
  role: 'User',
  password : 'password'
});

const isAccountDeactivated = ref(false);

const fetchUser = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]; 
      const decodedPayload = JSON.parse(atob(payloadBase64)); 

      
      user.value = {
        email: decodedPayload.sub || 'Unknown',
        role: decodedPayload.role || 'User',
        password : 'password'
      };
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
};

onMounted(fetchUser);

const toast = (useNuxtApp().$toast as any)

const saveChanges = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('No auth token found');
    return;
  }

  try {
    
    const updatedData: any = {};
    if (user.value.password !== 'password') {
      updatedData.password = user.value.password;
    }

    const response = await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/update_user`, 
      updatedData, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    toast.success('mot de passe updated successfully!');

    console.log('Changes saved', response.data);
    
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Error updating profile');
  }
};

const deactivateAccount = () => {
  console.log('Account deactivated');
 
};

const resetForm = () => {
  user.value = {
    email: 'Unknown',
    role: 'User',
    password: 'password'
  };
  console.log('Form reset');
};
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Changer mot de passe">
        <VCardText class="d-flex">
          <!-- 👉 Avatar -->
          <VAvatar
            rounded="lg"
            size="100"
            class="me-6"
          />


        </VCardText>

        <VDivider />

        <VCardText>
          <!-- 👉 Form -->
          <VForm class="mt-6">
            <VRow>
              <!-- 👉 Email -->
              <VCol cols="12" md="6">
                <VTextField
                  :id="useId()"
                  v-model="user.email"
                  label="E-mail"
                  type="email"
                  :readonly="true"
                />
              </VCol>

              <!-- 👉 Password -->
              <VCol cols="12" md="6">
                <VTextField
                  :id="useId()"
                  v-model="user.password"
                  label="Password"
                  placeholder="Enter new password"
                  type="password"
                />
              </VCol>

              <!-- 👉 Form Actions -->
              <VCol cols="12" class="d-flex flex-wrap gap-4">
                <VBtn @click="saveChanges" color="primary">
                  Save changes
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="outlined"
                  type="reset"
                  @click.prevent="resetForm"
                >
                  Reset
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12">
      <!-- 👉 Deactivate Account -->

    </VCol>
  </VRow>
</template>
