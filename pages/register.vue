<template>
  <div class="auth-wrapper">
    <!-- Conteneur principal animé -->
    <transition name="fade-slide" appear>
      <div class="auth-container">
        <!-- En-tête avec logo et titre -->
        <div class="auth-header">
          <NuxtLink to="/" class="brand-logo">
           
            <h2 class="brand-name">Helice Diffusion</h2>
          </NuxtLink>
          <h1 class="page-title">Create User Account</h1>
          <p class="page-subtitle">Adventure starts here 🚀</p>
        </div>

        <!-- Carte d'authentification -->
        <VCard class="auth-card" max-width="480">
          <VCardText>
            <VForm @submit.prevent="handleSubmit">
              <VRow>
                <!-- Champ Email -->
                <VCol cols="12">
                  <VTextField
                    v-model="form.email"
                    label="Email"
                    placeholder="johndoe@email.com"
                    type="email"
                    required
                    :disabled="isSubmitting"
                  />
                </VCol>

                <!-- Champ Password -->
                <VCol cols="12">
                  <VTextField
                    v-model="form.password"
                    label="Password"
                    placeholder="··········"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                    @click:append-inner="isPasswordVisible = !isPasswordVisible"
                    required
                    :disabled="isSubmitting"
                  />
                </VCol>

                <!-- Checkbox des conditions -->
                <VCol cols="12" class="terms-container">
                  <VCheckbox
                    v-model="form.privacyPolicies"
                    inline
                    required
                    :disabled="isSubmitting"
                  />
                  <span class="terms-text">
                    I agree to <a href="javascript:void(0)" class="link">privacy policy & terms</a>
                  </span>
                </VCol>

                <!-- Message d'erreur -->
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

                <!-- Bouton de soumission -->
                <VCol cols="12">
                  <VBtn
                    block
                    type="submit"
                    :loading="isSubmitting"
                    :disabled="isSubmitting"
                    class="submit-btn"
                  >
                    Sign Up
                  </VBtn>
                </VCol>

                <!-- Lien vers la connexion -->
                <VCol cols="12" class="text-center">
                  <span class="switch-text">Already have an account?</span>
                  <NuxtLink to="login" class="switch-link">Sign in instead</NuxtLink>
                </VCol>

                <!-- Séparation -->
                <VCol cols="12" class="divider-container">
                  <VDivider />
                  <span class="divider-text">or</span>
                  <VDivider />
                </VCol>

                <!-- Fournisseur d'authentification -->
                <VCol cols="12" class="provider-container">
                  <AuthProvider />
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>
      </div>
    </transition>

    <!-- Images décoratives -->
    <VImg class="footer-img tree-start" :src="authV1Tree" width="250" />
    <VImg class="footer-img tree-end" :src="authV1Tree2" width="350" />
    <VImg class="footer-img mask" :src="authThemeMask" />
  </div>
</template>

<script setup lang="ts">
import { useFetch } from '#app'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

const router = useRouter()
const vuetifyTheme = useTheme()

// Assets
const logo = '@images/logo.svg?raw'
const authV1MaskDark = '@images/pages/auth-v1-mask-dark.png'
const authV1MaskLight = '@images/pages/auth-v1-mask-light.png'
const authV1Tree2 = '@images/pages/auth-v1-tree-2.png'
const authV1Tree = '@images/pages/auth-v1-tree.png'

// Réactifs
const form = ref({
  email: '',
  password: '',
  privacyPolicies: false,
})
const isPasswordVisible = ref(false)
const errorMessage = ref<string | null>(null)
const isSubmitting = ref(false)

// Calculé pour le thème
const authThemeMask = computed(() => {
  return vuetifyTheme.global.name.value === 'light'
    ? authV1MaskLight
    : authV1MaskDark
})

// Handler de soumission
async function handleSubmit() {
  if (!form.value.privacyPolicies) {
    errorMessage.value = "Vous devez accepter les conditions d'utilisation"
    return
  }
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const { data, error } = await useFetch('http://127.0.0.1:8000/creer_compte', {
      method: 'POST',
      body: JSON.stringify({
        email: form.value.email,
        password: form.value.password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (error.value) {
      const errorDetail = error.value.data?.detail || 'Erreur inconnue'
      throw new Error(
        typeof errorDetail === 'string' 
          ? errorDetail 
          : 'Erreur lors de la création du compte'
      )
    }

    alert('Compte créé avec succès')
    // Optionnel : rediriger vers la page de connexion
    // router.push('/login')
  } catch (err: any) {
    errorMessage.value = err.message || 'Une erreur est survenue'
  } finally {
    isSubmitting.value = false
  }
}

definePageMeta({ layout: 'blank' })
</script>

<style lang="scss" scoped>


// Container principal avec fond dégradé et ombres élégantes
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  position: relative;
  
  overflow: hidden;
  padding: 20px;
}

// Conteneur principal de la carte d'authentification
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

@keyframes containerRise {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

// En-tête
.auth-header {
  margin-bottom: 20px;
  animation: fadeInDown 1s ease-out;
}

@keyframes fadeInDown {
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-decoration: none;
  margin-bottom: 10px;
}

.brand-logo .logo {
  width: 40px;
  height: 40px;
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

// Carte d'authentification
.auth-card {
  border-radius: 12px;
  overflow: hidden;
}

// Formulaire et champs
.terms-container {
  display: flex;
  align-items: center;
  margin-top: 15px;
}

.terms-text {
  margin-left: 8px;
  font-size: 0.9rem;
  color: #555;
}

.terms-text .link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}

.error-alert {
  margin-top: 1rem;
}

.submit-btn {
  margin-top: 20px;
  font-size: 1rem;
  font-weight: bold;
  text-transform: none;
}

// Lien de redirection
.switch-text {
  font-size: 0.95rem;
  color: #555;
}
.switch-link {
  color: #1976d2;
  margin-left: 5px;
  text-decoration: none;
  font-weight: 600;
}

// Séparateur et fournisseur d'authentification
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

// Images décoratives
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

/* Transitions */
.fade-slide-enter-active {
  transition: all 0.8s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
