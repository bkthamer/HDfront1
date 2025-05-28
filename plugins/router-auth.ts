import { defineNuxtPlugin } from '#app';
import AuthProvider from "@/views/pages/authentication/AuthProvider.vue";

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


export default defineNuxtPlugin((nuxtApp) => {
  
  nuxtApp.vueApp.component('AuthProvider', AuthProvider)

  
  if (process.client && typeof window !== 'undefined') {
    const router = useRouter()
    fetchUser();
    router.beforeEach((to, from, next) => {
      
      const token = localStorage.getItem('authToken')
      const protectedRoutes = ['/dashboard', '/users','/telecommande','/suiviplaylist','/gestionplaylist','/playlist','/media','/demande','/account-settings','//ajoutplaylist','/ajoutmedia','/listedemandes','/users','/register']

     
      if ((protectedRoutes.includes(to.name) || protectedRoutes.includes(to.path)) && !token) {
        next('/login')
      } else if (to.path === '/suiviplaylist' && user.value.role === 'user') {
        next('/dashboard') 

      }
      else if (to.path === '/telecommande' && user.value.role === 'user') {
        next('/dashboard')
      }
      else {
        next()
      }
    })
  }
})

