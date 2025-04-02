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

const saveChanges = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('No auth token found');
    return;
  }

  try {
    // On vérifie si le mot de passe a été modifié, sinon on ne l'envoie pas
    const updatedData: any = {};
    if (user.value.password !== 'password') {
      updatedData.password = user.value.password;
    }

    const response = await axios.put(
      'http://127.0.0.1:8000/update_user', 
      updatedData, // On envoie uniquement le mot de passe si il a été modifié
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Changes saved', response.data);
    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile');
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
      <VCard title="Account Details">
        <VCardText class="d-flex">
          <!-- 👉 Avatar -->
          <VAvatar
            rounded="lg"
            size="100"
            class="me-6"
          />

          <!-- 👉 Upload Photo -->
          <form class="d-flex flex-column justify-center gap-5">
            <div class="d-flex flex-wrap gap-2">
              <VBtn color="primary">
                <VIcon icon="ri-upload-cloud-line" class="d-sm-none" />
                <span class="d-none d-sm-block">Upload new photo</span>
              </VBtn>

              <input
                ref="refInputEl"
                type="file"
                name="file"
                accept=".jpeg,.png,.jpg,GIF"
                hidden
              />

              <VBtn
                type="reset"
                color="error"
                variant="outlined"
              >
                <span class="d-none d-sm-block">Reset</span>
                <VIcon icon="ri-refresh-line" class="d-sm-none" />
              </VBtn>
            </div>

            <p class="text-body-1 mb-0">
              Allowed JPG, GIF or PNG. Max size of 800K
            </p>
          </form>
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
      <VCard title="Deactivate Account">
        <VCardText>
          <div>
            <VCheckbox
              :id="useId()"
              v-model="isAccountDeactivated"
              label="I confirm my account deactivation"
            />
          </div>

          <VBtn
            :disabled="!isAccountDeactivated"
            color="error"
            class="mt-3"
            @click="deactivateAccount"
          >
            Deactivate Account
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
