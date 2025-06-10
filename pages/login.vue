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

const toast = (useNuxtApp().$toast as any)

const login = async (email: string, password: string) => {
  try {
    
    

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    
    if (!response.ok) {
      
      const rawResponse = await response.text();
      console.log(`${import.meta.env.VITE_API_BASE_URL}/login`);
      console.error('[DEBUG] Raw server response:', rawResponse);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }



    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      console.log(`${import.meta.env.VITE_API_BASE_URL}/login`);
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    console.log('API response:', data); 
    console.log(`${import.meta.env.VITE_API_BASE_URL}/login`);

    if (data.access_token) {
      
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


const handleLogin = async () => {
  try {
    const { email, password } = form.value;
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const token = await login(email, password);

    toast.success('Login successful');
    
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    
    toast.error(error instanceof Error ? error.message : 'Login failed');
  }
};

definePageMeta({ layout: 'blank' });
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <VCard class="auth-card pa-4 pt-7" max-width="448">
      <VCardItem class="justify-center">
        <NuxtLink to="/" class="d-flex align-center gap-3">
         <div
 
  style="width: 70px; height: 70px; border-radius: 30%; overflow: hidden;"
>
  <div v-html="logo"></div>
</div>
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

              


              </div>

              <!-- login button -->
              <VBtn block type="submit">
                Login
              </VBtn>
            </VCol>

            <!-- create account -->
            

            <VCol cols="12" class="d-flex align-center">
              <VDivider />
             
              <VDivider />
            </VCol>

            <!-- auth providers -->
          
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
