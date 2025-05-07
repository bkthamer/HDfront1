<script setup lang="ts">
import AnalyticsAward from '@/views/dashboard/AnalyticsAward.vue';
import AnalyticsTotalEarning from '@/views/dashboard/AnalyticsTotalEarning.vue';
import AnalyticsTransactions from '@/views/dashboard/AnalyticsTransactions.vue';
import AnalyticsWeeklyOverview from '@/views/dashboard/AnalyticsWeeklyOverview.vue';
import Demandebyuser from '@/views/dashboard/demandebyuser.vue';
import NbrAdmin from '@/views/dashboard/nbrAdmin.vue';
import Nbrmediauser from '@/views/dashboard/nbrmediauser.vue';
import Pdv from '@/views/dashboard/pdv.vue';

const totalProfit = {
  title: 'Total Profit',
  color: 'secondary',
  icon: 'ri-pie-chart-2-line',
  stats: '$25.6k',
  change: 42,
  subtitle: 'Weekly Project',
}

const newProject = {
  title: 'New Project',
  color: 'primary',
  icon: 'ri-file-word-2-line',
  stats: '862',
  change: -18,
  subtitle: 'Yearly Project',
}

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
  <VContainer fluid>
    <VRow class="match-height" no-gutters>
     <!-- debut dash board -->
      <VCol cols="12" sm="6" md="4" lg="4">
        <AnalyticsAward  v-if="user.role === 'admin'" />
      </VCol>

      <VCol cols="12" sm="6" md="4" lg="4">
        <AnalyticsTransactions v-if="user.role === 'admin'" />
      </VCol>

      <VCol cols="12" sm="6" md="4" lg="4">
        <Pdv v-if="user.role === 'admin'" />
      </VCol>


      <VCol cols="12" sm="6" md="6" lg="6">
        <AnalyticsWeeklyOverview  v-if="user.role === 'admin'" />
      </VCol>


      <VCol cols="12" sm="6" md="6" lg="6">
        <AnalyticsTotalEarning  v-if="user.role === 'admin'" />
      </VCol>


      <VCol cols="12" sm="6" md="6" lg="6">
        <NbrAdmin  v-if="user.role === 'admin'" />
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
