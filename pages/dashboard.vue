<script setup lang="ts">
import AnalyticsAward from '@/views/dashboard/AnalyticsAward.vue';
import AnalyticsTotalEarning from '@/views/dashboard/AnalyticsTotalEarning.vue';
import AnalyticsTransactions from '@/views/dashboard/AnalyticsTransactions.vue';
import AnalyticsWeeklyOverview from '@/views/dashboard/AnalyticsWeeklyOverview.vue';
import Demandebyuser from '@/views/dashboard/demandebyuser.vue';
import NbrAdmin from '@/views/dashboard/nbrAdmin.vue';
import Nbrmediauser from '@/views/dashboard/nbrmediauser.vue';
import Pdv from '@/views/dashboard/pdv.vue';



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
  <h1 class="text-center mb-4"> Tableau de bord État des équipements & activité des utilisateurs</h1>
  <VContainer fluid>
    <VRow class="match-height" no-gutters>
     
      <VCol cols="12" sm="6" md="4" lg="4">
        <AnalyticsAward  v-if="user.role === 'admin'" />
      </VCol>

      <VCol cols="12" sm="6" md="4" lg="4">
        <AnalyticsTransactions v-if="user.role === 'admin'" />
      </VCol>

      <VCol cols="12" sm="6" md="4" lg="4">
        <Pdv v-if="user.role === 'admin'" />
      </VCol>

      
      <VCol cols="12" sm="6" md="6" lg="4">
        
        <NbrAdmin  v-if="user.role === 'admin'" />
      </VCol>
<VCol cols="12" sm="12" md="6" lg="4">
         
          <AnalyticsTotalEarning  v-if="user.role === 'admin'" />
      </VCol>

      <VCol cols="12" sm="6" md="6" lg="4">
       <AnalyticsWeeklyOverview  v-if="user.role === 'admin'" />
      </VCol>


      <VCol cols="12" sm="6" md="6" lg="12">
       
      </VCol>
    </VRow>


    <VRow>
    <VCol >
        <Demandebyuser  v-if="user.role === 'user'"/>
      </VCol>
      <VCol >
        <Nbrmediauser  v-if="user.role === 'user'"/>
      </VCol>
    </VRow>

  </VContainer>
</template>
