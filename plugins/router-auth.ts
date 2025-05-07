import { defineNuxtPlugin } from '#app'
import AuthProvider from "@/views/pages/authentication/AuthProvider.vue"

export default defineNuxtPlugin((nuxtApp) => {
  
  nuxtApp.vueApp.component('AuthProvider', AuthProvider)

  
  if (process.client && typeof window !== 'undefined') {
    const router = useRouter()

    router.beforeEach((to, from, next) => {
      
      const token = localStorage.getItem('authToken')
      /* route protected */
      const protectedRoutes = ['/dashboard', '/users','/telecommande','/suiviplaylist','/gestionplaylist','/playlist','/media','/demande','/account-settings','//ajoutplaylist','/ajoutmedia','/listedemandes','/users','/register']

     
      if ((protectedRoutes.includes(to.name as string) || protectedRoutes.includes(to.path)) && !token) {
        next('/login')
      } else {
        next()
      }
    })
  }
})
