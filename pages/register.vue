<template>
  <div class="auth-wrapper">
   

      <div class="auth-container">
        
        <div class="auth-header">
          <NuxtLink to="/" class="brand-logo">
           
          </NuxtLink>
          <h1 class="page-title">Create User Account</h1>
          
        </div>

       
        <VCard class="auth-card" max-width="480">
          <VCardText>
            <VForm @submit.prevent="handleSubmit">
              <VRow>
                <!-- debut form -->
                <VCol cols="12">
                  <VRow no-gutters>
                    <VCol cols="12" md="3">
                      <label for="firstNameHorizontalIcons">First Name</label>
                    </VCol>
                    <VCol cols="12" md="9">
                      <VTextField
                        id="firstNameHorizontalIcons"
                        v-model="firstName"
                        prepend-inner-icon="ri-user-line"
                        placeholder="John"
                        persistent-placeholder
                        :disabled="isSubmitting"
                      />
                    </VCol>
                  </VRow>
                </VCol>

               
                <VCol cols="12">
                  <VRow no-gutters>
                    <VCol cols="12" md="3">
                      <label for="emailHorizontalIcons">Email</label>
                    </VCol>
                    <VCol cols="12" md="9">
                      <VTextField
                        id="emailHorizontalIcons"
                        v-model="email"
                        prepend-inner-icon="ri-mail-line"
                        placeholder="johndoe@email.com"
                        persistent-placeholder
                        type="email"
                        required
                        :disabled="isSubmitting"
                      />
                    </VCol>
                  </VRow>
                </VCol>

               
                <VCol cols="12">
                  <VRow no-gutters>
                    <VCol cols="12" md="3">
                      <label for="mobileHorizontalIcons">Mobile</label>
                    </VCol>
                    <VCol cols="12" md="9">
                      <VTextField
                        id="mobileHorizontalIcons"
                        v-model="mobile"
                        type="tel"
                        prepend-inner-icon="ri-smartphone-line"
                        placeholder="+1 123 456 7890"
                        persistent-placeholder
                        :disabled="isSubmitting"
                      />
                    </VCol>
                  </VRow>
                </VCol>

                
                <VCol cols="12">
                  <VRow no-gutters>
                    <VCol cols="12" md="3">
                      <label for="passwordHorizontalIcons">Password</label>
                    </VCol>
                    <VCol cols="12" md="9">
                      <VTextField
                        id="passwordHorizontalIcons"
                        v-model="password"
                        prepend-inner-icon="ri-lock-line"
                        autocomplete="on"
                        type="password"
                        placeholder="············"
                        persistent-placeholder
                        required
                        :disabled="isSubmitting"
                      />
                    </VCol>
                  </VRow>
                </VCol>

               
                <VCol cols="12">
                  <VRow no-gutters>
                    <VCol cols="12" md="3" />
                    <VCol cols="12" md="9">
                      <VCheckbox
                        :id="useId()"
                        v-model="rememberMe"
                        label="Remember me"
                        :disabled="isSubmitting"
                      />
                    </VCol>
                  </VRow>
                </VCol>

                
                <VCol cols="12">
                  <VAlert
                    v-if="errorMessage"
                    type="error"
                    density="compact"
                    class="error-alert"
                  >
                    {{ errorMessage }}
                  </VAlert>
                </VCol>

                
                <VCol cols="12">
                  <VRow no-gutters>
                    <VCol cols="12" md="3" />
                    <VCol cols="12" md="9">
                      <VBtn
                        type="submit"
                        class="me-4"
                        :loading="isSubmitting"
                        :disabled="isSubmitting"
                      >
                        Submit
                      </VBtn>
                      <VBtn
                        color="secondary"
                        variant="outlined"
                        type="reset"
                        @click="resetForm()"
                        :disabled="isSubmitting"
                      >
                        Reset
                      </VBtn>
                    </VCol>
                  </VRow>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>
      </div>



    <VImg class="footer-img tree-start" :src="authV1Tree" width="250" />
    <VImg class="footer-img tree-end" :src="authV1Tree2" width="350" />
    <VImg class="footer-img mask" :src="authThemeMask" />
  </div>
</template>

<script setup lang="ts">
import { useFetch } from '#app'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

const router = useRouter()
const vuetifyTheme = useTheme()


const firstName = ref('')
const email = ref('')
const mobile = ref<string>()
const password = ref<string>()
const rememberMe = ref(false)


const errorMessage = ref<string | null>(null)
const isSubmitting = ref(false)

const authV1MaskDark = '@images/pages/auth-v1-mask-dark.png'
const authV1MaskLight = '@images/pages/auth-v1-mask-light.png'
const authV1Tree2 = '@images/pages/auth-v1-tree-2.png'
const authV1Tree = '@images/pages/auth-v1-tree.png'

const authThemeMask = computed(() =>
  vuetifyTheme.global.name.value === 'light'
    ? authV1MaskLight
    : authV1MaskDark
)


async function handleSubmit() {
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const { error } = await useFetch('http://127.0.0.1:8000/creer_compte', {
      method: 'POST',
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (error.value) {
      const detail = error.value.data?.detail || 'Erreur inconnue'
      throw new Error(typeof detail === 'string' ? detail : 'Échec création compte')
    }

    alert('Compte créé avec succès')
  
  } catch (err: any) {
    errorMessage.value = err.message || 'Une erreur est survenue'
  } finally {
    isSubmitting.value = false
  }
}


function resetForm() {
  firstName.value = ''
  email.value = ''
  mobile.value = undefined
  password.value = ''
  rememberMe.value = false
  errorMessage.value = null
}

definePageMeta({ layout: 'blank' })
</script>

<style lang="scss" scoped>
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  position: relative;
  overflow: hidden;
  padding: 0px;
}

.auth-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px 30px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  z-index: 2;
  max-width: 500px;
  width: 100%;
  text-align: center;
  animation: containerRise 1s ease-out;
}



.auth-header {
  margin-bottom: 20px;
  animation: fadeInDown 1s ease-out;
}


.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-decoration: none;
  margin-bottom: 10px;
}

.brand-name {
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 10px 0;
  color: #222;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 20px;
}

.auth-card {
  border-radius: 12px;
  overflow: hidden;
}

.error-alert {
  margin-top: 1rem;
}

.divider-container {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.divider-text {
  margin: 0 10px;
  color: #888;
  font-weight: 500;
}

.footer-img {
  position: absolute;
  z-index: 1;
  opacity: 0.8;
}

.tree-start {
  bottom: 0;
  left: 0;
  transform: translate(-20%, 20%);
}

.tree-end {
  top: 0;
  right: 0;
  transform: translate(20%, -20%);
}

.mask {
  bottom: 0;
  right: 0;
  opacity: 0.6;
}


</style>
