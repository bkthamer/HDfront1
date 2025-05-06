import type { RouterConfig } from '@nuxt/schema';

export default <RouterConfig>{
  routes: (scannedRoutes) => [
    ...scannedRoutes,
    {
      path: '/',
      name: 'index',
      redirect: '/login',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/dashboard.vue'),
      beforeEnter: (to, from, next) => {
        let token = null;
       
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            token = window.localStorage.getItem('authToken');
          } catch (e) {
            token = null;
          }
        }
       
        token ? next() : next('/login');
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/register.vue'),
      beforeEnter: (to, from, next) => {
        let token = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            token = window.localStorage.getItem('authToken');
          } catch (e) {
            token = null;
          }
        }
        token ? next() : next('/login');
      },
    },
  ],
  
  
  async beforeEach(to, from, next) {
    let token = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        token = window.localStorage.getItem('authToken');
      } catch (e) {
        token = null;
      }
    }
    if ((to.name === 'dashboard' || to.name === 'register') && !token) {
      next('/login');
    } else {
      next();
    }
  },
}
