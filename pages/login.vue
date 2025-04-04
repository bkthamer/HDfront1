<script setup lang="ts">
import logo from '@images/logo.svg?raw';
import authV1MaskDark from '@images/pages/auth-v1-mask-dark.png';
import authV1MaskLight from '@images/pages/auth-v1-mask-light.png';
import authV1Tree2 from '@images/pages/auth-v1-tree-2.png';
import authV1Tree from '@images/pages/auth-v1-tree.png';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';

const form = ref({
  email: '',
  password: '',
  remember: false,
});

const isPasswordVisible = ref(false);
const vuetifyTheme = useTheme();
const router = useRouter();

const authThemeMask = computed(() => {
  return vuetifyTheme.global.name.value === 'light' ? authV1MaskLight : authV1MaskDark;
});

// Fonction pour effectuer la connexion
const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, { // Remplacez par l'URL de votre API
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Vérification si la réponse est valide
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    console.log('API response:', data); // Pour vérifier la réponse de l'API

    if (data.access_token) {
      // Stocke le token dans localStorage
      localStorage.setItem('authToken', data.access_token);
      return data.access_token;
    } else {
      throw new Error('No token returned from the API');
    }
  } catch (error) {
    console.error('Error during login:', error);
    throw new Error(error instanceof Error ? error.message : 'Login failed');
  }
};

// Fonction pour gérer la soumission du formulaire de login
const handleLogin = async () => {
  try {
    const { email, password } = form.value;
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const token = await login(email, password);

    // Redirige l'utilisateur vers le dashboard après la connexion réussie
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    // Vous pouvez afficher une alerte ou un message d'erreur ici
    alert('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

definePageMeta({ layout: 'blank' });
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <VCard class="auth-card pa-4 pt-7" max-width="448">
      <VCardItem class="justify-center">
        <NuxtLink to="/" class="d-flex align-center gap-3">
          <div class="d-flex" v-html="logo" style="width: 80px; height: 80px" />
          <h2 class="font-weight-medium text-2xl text-uppercase">
            Helice Diffusion
          </h2>
        </NuxtLink>
      </VCardItem>

      <VCardText class="pt-2">
        <h4 class="text-h4 mb-1">Welcome to Helice Diffusion 👋🏻</h4>
        <p class="mb-0">Please sign-in to your account </p>
      </VCardText>

      <VCardText>
        <VForm @submit.prevent="handleLogin">
          <VRow>
            <!-- email -->
            <VCol cols="12">
              <VTextField
                :id="useId()"
                v-model="form.email"
                label="Email"
                type="email"
              />
            </VCol>

            <!-- password -->
            <VCol cols="12">
              <VTextField
                :id="useId()"
                v-model="form.password"
                label="Password"
                placeholder="············"
                :type="isPasswordVisible ? 'text' : 'password'"
                autocomplete="password"
                :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />

              <!-- remember me checkbox -->
              <div class="d-flex align-center justify-space-between flex-wrap my-6">
                <VCheckbox
                  :id="useId()"
                  v-model="form.remember"
                  label="Remember me"
                />

                <NuxtLink class="text-primary" to="/forgotpassword">Forgot Password?</NuxtLink>
                <NuxtLink class="text-primary" to="/reset-password">Forgot Password?</NuxtLink>


              </div>

              <!-- login button -->
              <VBtn block type="submit">
                Login
              </VBtn>
            </VCol>

            <!-- create account -->
            <VCol cols="12" class="text-center text-base">
              <span>New on our platform?</span>
              <NuxtLink class="text-primary ms-2" to="/register">
                Create an account
              </NuxtLink>
            </VCol>

            <VCol cols="12" class="d-flex align-center">
              <VDivider />
              <span class="mx-4">or</span>
              <VDivider />
            </VCol>

            <!-- auth providers -->
            <VCol cols="12" class="text-center">
              <AuthProvider />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>

    <VImg class="auth-footer-start-tree d-none d-md-block" :src="authV1Tree" :width="250" />
    <VImg :src="authV1Tree2" class="auth-footer-end-tree d-none d-md-block" :width="350" />
    <VImg class="auth-footer-mask d-none d-md-block" :src="authThemeMask" />
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
