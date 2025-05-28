import { createToastInterface as createToast } from 'vue-toastification'

export default defineNuxtPlugin((nuxtApp) => {
  const toast = createToast()
  nuxtApp.provide('toast', toast)  
})

