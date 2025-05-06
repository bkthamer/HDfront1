<script lang="ts" setup>
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue';
import VerticalNavGroup from '@layouts/components/VerticalNavGroup.vue';
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue';
import { onMounted, ref } from 'vue';


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


onMounted(() => {
  fetchUser();
});
</script>

<template>
  <!-- 👉 Dashboards -->
 
  <VerticalNavGroup
    :item="{
      title: 'Dashboards',
      badgeContent: '5',
      badgeClass: 'bg-error',
      icon: 'ri-home-smile-line',
    }"
  >
    <VerticalNavLink
      :item="{
        title: 'Analytics',
        to: '/dashboard',
      }"
    />

    






  </VerticalNavGroup>

  <!-- 👉 Front Pages -->
  <!-- ... -->

  <VerticalNavSectionTitle
    :item="{
      heading: 'Playlist Management',
    }"
  />

  <VerticalNavLink
   v-if="user.role === 'admin'"
      :item="{
        title: 'Add playlist',
        icon:'ri-play-list-add-line',
        to: '/ajoutplaylist',
      }"
/>

<VerticalNavLink
      :item="{
        title: 'Gestion playlist',
        icon:'ri-list-settings-line',
        to: '/gestionplaylist',
      }"
/>

<VerticalNavLink
      :item="{
        title: 'Get playlist',
        icon:'ri-play-list-2-fill',
        to: '/playlist',
      }"
/>

<VerticalNavLink
 v-if="user.role === 'admin'"
      :item="{
        title: 'Suivi tache playlist',
        icon:'ri-survey-line',
        to: '/suiviplaylist',
      }"
/>




  <VerticalNavSectionTitle
    :item="{
      heading: 'Remote',
    }"
  />
  <VerticalNavLink
  
  :item="{
    title: 'Telé',
    icon: 'ri-remote-control-line',
    to: '/telecommande',
  }"
/>

<VerticalNavLink
 v-if="user.role === 'admin'"
      :item="{
        title: 'Suivi taches helice',
        icon:'ri-survey-line',
        to: '/suivihelice',
      }"
/>





  <VerticalNavSectionTitle
    :item="{
      heading: 'Mediatheque',
    }"
  />

  <VerticalNavLink
      :item="{
        title: 'Media',
        icon:'ri-multi-image-fill',
        to: '/media',
      }"
    />

    <VerticalNavLink
    v-if="user.role === 'admin'" 
      :item="{
        title: 'Ajout media',
        icon:'ri-gallery-upload-fill',
        to: '/ajoutmedia',
      }"
    />

    <VerticalNavLink
    v-if="user.role === 'admin'" 
      :item="{
        title: 'Suivi tache media',
        icon:'ri-survey-line',
        to: '/suivimedia',
      }"
    />

    <VerticalNavSectionTitle
    :item="{
      heading: 'Demandes',
    }"
  />

  <VerticalNavLink
  v-if="user.role === 'admin'"
  :item="{
    
    title: 'Lister demandes',
    icon: 'ri-inbox-unarchive-line',
    to: '/listedemandes',
  }"
/>

<VerticalNavLink
  
  :item="{
    title: 'Demande media',
    icon: 'ri-mail-send-line',
    to: '/demande',
  }"
/>



  <!-- 👉 Apps & Pages -->
  <VerticalNavSectionTitle
    :item="{
      heading: 'User management',
    }"
  />

  <VerticalNavLink
    :item="{
      title: 'Account Settings',
      icon: 'ri-user-settings-line',
      to: '/account-settings',
    }"
  />


  <!-- ... -->
  <VerticalNavLink
    v-if="user.role === 'admin'" 
    :item="{
      title: 'List Users',
      icon: 'ri-user-search-fill',
      to: '/users',
    }"
  />

 
  <VerticalNavLink
  v-if="user.role === 'admin'"
    :item="{
      title: 'Ajouter user',
      icon: 'ri-user-add-line',
      to: '/register',
    }"
  />






  <VerticalNavSectionTitle
    :item="{
      heading: 'User Interface',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Typography',
      icon: 'ri-text',
      to: '/typography',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Icons',
      icon: 'ri-remixicon-line',
      to: '/icons',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Cards',
      icon: 'ri-bar-chart-box-line',
      to: '/cards',
    }"
  />

  
  <VerticalNavSectionTitle
    :item="{
      heading: 'Forms & Tables',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Form Layouts',
      icon: 'ri-layout-4-line',
      to: '/form-layouts',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Tables',
      icon: 'ri-table-alt-line',
      to: '/tables',
    }"
  />

  
  <VerticalNavSectionTitle
    :item="{
      heading: 'Others',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Documentation',
      icon: 'ri-article-line',
      href: 'https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/documentation/',
      target: '_blank',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Raise Support',
      href: 'https://github.com/themeselection/materio-vuetify-nuxtjs-admin-template-free/issues',
      icon: 'ri-lifebuoy-line',
      target: '_blank',
    }"
  />
</template>
