<script setup lang="ts">
import avatar1 from '@images/avatars/avatar-1.png';
import { onMounted, ref } from 'vue';


interface User {
  email: string;
  role: string;  
}


const user = ref<User>({
  email: 'Unknown',
  role: 'User',  
})


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

const logout = () => {
  localStorage.removeItem('authToken'); 
  user.value = { email: 'Unknown', role: 'User' }; 
  window.location.href = '/login'; 
};


onMounted(fetchUser);
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    color="success"
    bordered
  >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <VImg :src="avatar1" />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="230"
        location="bottom end"
        offset="14px"
      >
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VImg :src="avatar1" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ user.email }} ({{ user.role }})  <!-- Affichage de l'email et du rôle -->
            </VListItemTitle>
            <VListItemSubtitle>{{ user.role }}</VListItemSubtitle>
          </VListItem>
          <VDivider class="my-2" />

          <!-- 👉 Profile -->
          <VListItem to="/account-settings">
            <template #prepend>
              <VIcon
                class="me-2"
                icon="ri-user-line"
                size="22"
              />
            </template>

            <VListItemTitle>Gérer Profile</VListItemTitle>
          </VListItem>

          <!-- 👉 Settings -->


          <!-- 👉 Pricing -->


         



          <!-- Divider -->
          <VDivider class="my-2" />

          <!-- 👉 Logout -->
          <VListItem @click="logout">
  <template #prepend>
    <VIcon
      class="me-2"
      icon="ri-logout-box-r-line"
      size="22"
    />
  </template>

  <VListItemTitle>Logout</VListItemTitle>
</VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
